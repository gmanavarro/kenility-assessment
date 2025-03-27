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
  let productId1: string;
  let productId2: string;

  const testProduct1 = {
    name: 'Test Product 1',
    sku: 'TEST-123',
    price: 99.99,
  };

  const testProduct2 = {
    name: 'Test Product 2',
    sku: 'TEST-456',
    price: 149.99,
  };

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

    const testUser = {
      username: 'testuser',
      password: 'Test1234',
    };

    await request(app.getHttpServer()).post('/auth/register').send(testUser);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(testUser);

    authToken = loginResponse.body.token;

    const createProduct1Response = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', testProduct1.name)
      .field('sku', testProduct1.sku)
      .field('price', testProduct1.price)
      .attach('image', 'test/products/metalpipe.jpeg');

    productId1 = createProduct1Response.body._id;

    const createProduct2Response = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .field('name', testProduct2.name)
      .field('sku', testProduct2.sku)
      .field('price', testProduct2.price)
      .attach('image', 'test/products/metalpipe.jpeg');

    productId2 = createProduct2Response.body._id;
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

    beforeEach(async () => {
      testOrder.items[0].productId = productId1;
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
          expect(res.body.items[0].productId).toBe(productId1);
          expect(res.body.items[0].quantity).toBe(testOrder.items[0].quantity);
          expect(res.body.items[0]).toHaveProperty('name');
          expect(res.body.items[0]).toHaveProperty('sku');
          expect(res.body.items[0]).toHaveProperty('price');
          expect(res.body.items[0]).toHaveProperty('imageUrl');
          expect(res.body).toHaveProperty('total');
          expect(res.body.total).toBe(testProduct1.price * 2);
          expect(res.body).toHaveProperty('createdBy');
        });
    });

    it('should create an order with multiple items', () => {
      const orderWithMultipleItems = {
        clientName: 'John Doe',
        items: [
          {
            productId: productId1,
            quantity: 2,
          },
          {
            productId: productId2,
            quantity: 3,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderWithMultipleItems)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.clientName).toBe(orderWithMultipleItems.clientName);
          expect(res.body.items).toHaveLength(2);
          expect(res.body.items[0].productId).toBe(productId1);
          expect(res.body.items[0].quantity).toBe(
            orderWithMultipleItems.items[0].quantity,
          );
          expect(res.body.items[0].name).toBe(testProduct1.name);
          expect(res.body.items[0].sku).toBe(testProduct1.sku);
          expect(res.body.items[0].price).toBe(testProduct1.price);
          expect(res.body.items[1].productId).toBe(productId2);
          expect(res.body.items[1].quantity).toBe(
            orderWithMultipleItems.items[1].quantity,
          );
          expect(res.body.items[1].name).toBe(testProduct2.name);
          expect(res.body.items[1].sku).toBe(testProduct2.sku);
          expect(res.body.items[1].price).toBe(testProduct2.price);
          const expectedTotal = testProduct1.price * 2 + testProduct2.price * 3;
          expect(res.body.total).toBe(expectedTotal);
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
            productId: new Types.ObjectId().toString(),
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
            productId: productId1,
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
            productId: productId1,
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
          expect(res.body.items[0].productId).toBe(productId1);
          expect(res.body.items[0].quantity).toBe(testOrder.items[0].quantity);
          expect(res.body).toHaveProperty('total');
          expect(res.body.total).toBe(testProduct1.price * 2);
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
            productId: productId1,
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
            productId: productId1,
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
          expect(res.body.items[0].productId).toBe(productId1);
          expect(res.body.items[0].quantity).toBe(updateData.items[0].quantity);
          expect(res.body).toHaveProperty('total');
          expect(res.body.total).toBe(testProduct1.price * 3);
        });
    });

    it('should update an order by adding multiple items', () => {
      const updateData = {
        clientName: 'Jane Doe',
        items: [
          {
            productId: productId1,
            quantity: 2,
          },
          {
            productId: productId2,
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
          expect(res.body.items).toHaveLength(2);
          expect(res.body.items[0].productId).toBe(productId1);
          expect(res.body.items[0].quantity).toBe(updateData.items[0].quantity);
          expect(res.body.items[0].name).toBe(testProduct1.name);
          expect(res.body.items[0].sku).toBe(testProduct1.sku);
          expect(res.body.items[0].price).toBe(testProduct1.price);
          expect(res.body.items[1].productId).toBe(productId2);
          expect(res.body.items[1].quantity).toBe(updateData.items[1].quantity);
          expect(res.body.items[1].name).toBe(testProduct2.name);
          expect(res.body.items[1].sku).toBe(testProduct2.sku);
          expect(res.body.items[1].price).toBe(testProduct2.price);
          const expectedTotal = testProduct1.price * 2 + testProduct2.price * 3;
          expect(res.body.total).toBe(expectedTotal);
        });
    });

    it('should update an order by removing items', () => {
      const initialOrder = {
        clientName: 'John Doe',
        items: [
          {
            productId: productId1,
            quantity: 2,
          },
          {
            productId: productId2,
            quantity: 3,
          },
        ],
      };

      const updateData = {
        items: [
          {
            productId: productId1,
            quantity: 1,
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
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].productId).toBe(productId1);
          expect(res.body.items[0].quantity).toBe(updateData.items[0].quantity);
          const expectedTotal = testProduct1.price * 1;
          expect(res.body.total).toBe(expectedTotal);
        });
    });

    it('should not update an order with non-existent product', () => {
      const updateData = {
        items: [
          {
            productId: new Types.ObjectId().toString(),
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

  describe('/orders (GET)', () => {
    beforeEach(async () => {
      const testOrders = [
        {
          clientName: 'John Doe',
          items: [{ productId: productId1, quantity: 2 }],
        },
        {
          clientName: 'Jane Doe',
          items: [{ productId: productId1, quantity: 1 }],
        },
      ];

      for (const order of testOrders) {
        await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send(order);
      }
    });

    it('should return all orders', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0]).toHaveProperty('_id');
          expect(res.body[0]).toHaveProperty('clientName');
          expect(res.body[0]).toHaveProperty('items');
          expect(res.body[0]).toHaveProperty('total');
          expect(res.body[0]).toHaveProperty('createdBy');
        });
    });

    it('should not allow access without authentication', () => {
      return request(app.getHttpServer()).get('/orders').expect(401);
    });
  });
});
