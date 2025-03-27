import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import * as path from 'path';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Products', () => {
  let app: INestApplication;
  let dbConnection: Connection;
  let authToken: string;

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
  });

  afterAll(async () => {
    await dbConnection.dropDatabase();
    await dbConnection.close();
    await app.close();
  });

  describe('/products (POST)', () => {
    const testProduct = {
      name: 'Test Product',
      sku: 'TEST-123',
      price: 99.99,
    };

    const testImagePath = path.join(__dirname, 'metalpipe.jpeg');

    it('should create a new product', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', testProduct.name)
        .field('sku', testProduct.sku)
        .field('price', testProduct.price)
        .attach('image', testImagePath)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe(testProduct.name);
          expect(res.body.sku).toBe(testProduct.sku);
          expect(res.body.price).toBe(testProduct.price);
          expect(res.body).toHaveProperty('imageUrl');
          expect(res.body).toHaveProperty('createdBy');
        });
    });

    it('should not create a product without authentication', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send(testProduct)
        .expect(401);
    });

    it('should validate product data', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', '')
        .field('sku', '')
        .field('price', -1)
        .attach('image', testImagePath)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual([
            'name should not be empty',
            'sku should not be empty',
            'price must not be less than 0',
          ]);
        });
    });

    it('should not create a product without image', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', testProduct.name)
        .field('sku', testProduct.sku)
        .field('price', testProduct.price)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('No file uploaded');
        });
    });

    it('should not create a product with invalid image type', () => {
      const invalidImagePath = path.join(__dirname, '../setup.ts');

      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', testProduct.name)
        .field('sku', testProduct.sku)
        .field('price', testProduct.price)
        .attach('image', invalidImagePath)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe(
            'Invalid file type. Allowed types: image/jpg, image/jpeg, image/png, image/webp',
          );
        });
    });

    it('should not create a product with duplicate SKU', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', testProduct.name)
        .field('sku', testProduct.sku)
        .field('price', testProduct.price)
        .attach('image', testImagePath)
        .expect(201);

      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Another Product')
        .field('sku', testProduct.sku)
        .field('price', 199.99)
        .attach('image', testImagePath)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('SKU already exists');
        });
    });
  });

  describe('/products/:id (GET)', () => {
    it('should return a product by id', async () => {
      const testProduct = {
        name: 'Test Product',
        sku: 'TEST-123',
        price: 99.99,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', testProduct.name)
        .field('sku', testProduct.sku)
        .field('price', testProduct.price)
        .attach('image', path.join(__dirname, 'metalpipe.jpeg'));

      return request(app.getHttpServer())
        .get(`/products/${createResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(createResponse.body._id);
          expect(res.body.name).toBe(testProduct.name);
          expect(res.body.sku).toBe(testProduct.sku);
          expect(res.body.price).toBe(testProduct.price);
          expect(res.body).toHaveProperty('imageUrl');
          expect(res.body).toHaveProperty('createdBy');
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/products/nonexistentid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
