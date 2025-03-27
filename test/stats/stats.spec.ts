import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Types } from 'mongoose';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Stats', () => {
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

    const testUser = {
      username: 'testuser',
      password: 'Test1234',
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

  describe('/stats/last-month-total (GET)', () => {
    it('should return 0 when there are no orders', () => {
      return request(app.getHttpServer())
        .get('/stats/last-month-total')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(0);
        });
    });

    it('should return total of orders from last month', async () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 15);

      await dbConnection.collection('orders').insertMany([
        {
          _id: new Types.ObjectId(),
          createdBy: 'testuser',
          clientName: 'Test Client',
          total: 100,
          items: [],
          createdAt: lastMonth,
          updatedAt: lastMonth,
        },
        {
          _id: new Types.ObjectId(),
          createdBy: 'testuser',
          clientName: 'Test Client',
          total: 200,
          items: [],
          createdAt: lastMonth,
          updatedAt: lastMonth,
        },
        {
          _id: new Types.ObjectId(),
          createdBy: 'testuser',
          clientName: 'Test Client',
          total: 300,
          items: [],
          createdAt: twoMonthsAgo,
          updatedAt: twoMonthsAgo,
        },
      ]);

      return request(app.getHttpServer())
        .get('/stats/last-month-total')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(300);
        });
    });

    it('should not allow access without authentication', () => {
      return request(app.getHttpServer())
        .get('/stats/last-month-total')
        .expect(401);
    });
  });

  describe('/stats/highest-order (GET)', () => {
    it('should return 404 when there are no orders', () => {
      return request(app.getHttpServer())
        .get('/stats/highest-order')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return the order with highest total', async () => {
      const orders = await dbConnection.collection('orders').insertMany([
        {
          _id: new Types.ObjectId(),
          createdBy: 'testuser',
          total: 100,
          items: [],
        },
        {
          _id: new Types.ObjectId(),
          createdBy: 'testuser',
          total: 300,
          items: [],
        },
        {
          _id: new Types.ObjectId(),
          createdBy: 'testuser',
          total: 200,
          items: [],
        },
      ]);

      return request(app.getHttpServer())
        .get('/stats/highest-order')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(300);
          expect(res.body._id).toBe(orders.insertedIds[1].toString());
        });
    });

    it('should not allow access without authentication', () => {
      return request(app.getHttpServer())
        .get('/stats/highest-order')
        .expect(401);
    });
  });
});
