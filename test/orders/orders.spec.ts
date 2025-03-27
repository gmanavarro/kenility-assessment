import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Types } from 'mongoose';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Orders', () => {
  let app: INestApplication;
  let dbConnection: Connection;
  let authToken: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dbConnection = moduleFixture.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    await dbConnection.dropDatabase();

    // Register and login a test user to get the auth token
    const testUser = {
      username: 'testuser',
      password: 'Test123!',
    };

    await request(app.getHttpServer()).post('/auth/register').send(testUser);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUser);

    authToken = loginResponse.body.token;

    // Create a test product to use in orders
    const testProduct = {
      name: 'Test Product',
      sku: 'TEST-123',
      price: 99.99,
    };

    const createProductResponse = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', testProduct.name)
      .field('sku', testProduct.sku)
      .field('price', testProduct.price)
      .attach('image', 'test/products/metalpipe.jpeg');

    productId = createProductResponse.body._id;
  });

  afterAll(async () => {
    await dbConnection.dropDatabase();
    await dbConnection.close();
    await app.close();
  });

  describe('/orders (POST)', () => {
    const testOrder = {
      clientName: 'John Doe',
      items: [
        {
          productId: 'will_be_replaced',
          quantity: 2,
        },
      ],
    };

    beforeEach(() => {
      testOrder.items[0].productId = productId;
    });

    it('should create a new order', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testOrder)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.clientName).toBe(testOrder.clientName);
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].productId).toBe(productId);
          expect(res.body.items[0].quantity).toBe(testOrder.items[0].quantity);
          expect(res.body.items[0]).toHaveProperty('name');
          expect(res.body.items[0]).toHaveProperty('sku');
          expect(res.body.items[0]).toHaveProperty('price');
          expect(res.body.items[0]).toHaveProperty('imageUrl');
          expect(res.body).toHaveProperty('total');
          expect(res.body.total).toBe(99.99 * 2); // price * quantity
          expect(res.body).toHaveProperty('createdBy');
        });
    });

    it('should not create an order without authentication', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send(testOrder)
        .expect(401);
    });

    it('should validate order data', () => {
      const invalidOrder = {
        clientName: '',
        items: [],
      };

      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOrder)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual([
            'clientName should not be empty',
            'items should not be empty',
          ]);
        });
    });

    it('should not create an order with non-existent product', () => {
      const orderWithInvalidProduct = {
        ...testOrder,
        items: [
          {
            productId: new Types.ObjectId().toString(), // Valid MongoDB ID that doesn't exist
            quantity: 1,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderWithInvalidProduct)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(
            `Product with ID ${orderWithInvalidProduct.items[0].productId} not found`,
          );
        });
    });

    it('should not create an order with invalid quantity', () => {
      const orderWithInvalidQuantity = {
        ...testOrder,
        items: [
          {
            productId: productId,
            quantity: 0,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderWithInvalidQuantity)
        .expect(400);
    });
  });

  describe('/orders/:id (GET)', () => {
    it('should return an order by id', async () => {
      const testOrder = {
        clientName: 'John Doe',
        items: [
          {
            productId: productId,
            quantity: 2,
          },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testOrder);

      return request(app.getHttpServer())
        .get(`/orders/${createResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(createResponse.body._id);
          expect(res.body.clientName).toBe(testOrder.clientName);
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].productId).toBe(productId);
          expect(res.body.items[0].quantity).toBe(testOrder.items[0].quantity);
          expect(res.body).toHaveProperty('total');
          expect(res.body.total).toBe(99.99 * 2); // price * quantity
        });
    });

    it('should return 404 for non-existent order', () => {
      const nonExistentId = new Types.ObjectId().toString();
      return request(app.getHttpServer())
        .get(`/orders/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/orders/:id (PATCH)', () => {
    let orderId: string;

    beforeEach(async () => {
      const testOrder = {
        clientName: 'John Doe',
        items: [
          {
            productId: productId,
            quantity: 2,
          },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testOrder);

      orderId = createResponse.body._id;
    });

    it('should update an order', () => {
      const updateData = {
        clientName: 'Jane Doe',
        items: [
          {
            productId: productId,
            quantity: 3,
          },
        ],
      };

      return request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(orderId);
          expect(res.body.clientName).toBe(updateData.clientName);
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].productId).toBe(productId);
          expect(res.body.items[0].quantity).toBe(updateData.items[0].quantity);
          expect(res.body).toHaveProperty('total');
          expect(res.body.total).toBe(99.99 * 3); // price * new quantity
        });
    });

    it('should not update an order with non-existent product', () => {
      const updateData = {
        items: [
          {
            productId: new Types.ObjectId().toString(), // Valid MongoDB ID that doesn't exist
            quantity: 1,
          },
        ],
      };

      return request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(
            `Product with ID ${updateData.items[0].productId} not found`,
          );
        });
    });

    it('should validate update data', () => {
      const invalidUpdateData = {
        clientName: '',
        items: [],
      };

      return request(app.getHttpServer())
        .patch(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400);
    });
  });
});
