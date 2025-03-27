import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Auth', () => {
  let app: INestApplication;
  let dbConnection: Connection;

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
  });

  afterAll(async () => {
    await dbConnection.dropDatabase();
    await dbConnection.close();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    const testUser = {
      username: 'testuser',
      password: 'Test123!',
    };

    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(typeof res.body.token).toBe('string');
          expect(res.body.token.length).toBeGreaterThan(0);
        });
    });

    it('should not register a user with existing username', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Username already exists');
        });
    });

    it('should validate registration data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'te',
          password: 'weak',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual([
            'username must be longer than or equal to 3 characters',
            'password must be longer than or equal to 6 characters',
          ]);
        });
    });
  });

  describe('/auth/login (POST)', () => {
    const testUser = {
      username: 'testuser',
      password: 'Test123!',
    };

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('token');
          expect(typeof res.body.token).toBe('string');
          expect(res.body.token.length).toBeGreaterThan(0);
        });
    });

    it('should not login with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should not login with non-existent username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: testUser.password,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('should validate login data', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: '',
          password: '',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual([
            'username should not be empty',
            'password should not be empty',
          ]);
        });
    });
  });
});
