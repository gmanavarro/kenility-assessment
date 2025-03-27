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
      password: 'Test1234',
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
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe('Username already exists');
        });
    });

    it('should validate registration data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'usr',
          password: 'weak',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual([
            'username must be longer than or equal to 4 characters',
            'password must be longer than or equal to 8 characters',
          ]);
        });
    });

    it('should validate username format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'user@123',
          password: 'Test1234',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual([
            'username must contain only letters and numbers',
          ]);
        });
    });

    it('should validate password format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'Test@123!',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toEqual([
            'password must contain only letters and numbers',
          ]);
        });
    });

    it('should validate username max length', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'verylongusername',
          password: 'Test1234',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'username must be shorter than or equal to 10 characters',
          );
        });
    });

    it('should validate password max length', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          password: 'ThisPasswordIsVeryLong1234',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'password must be shorter than or equal to 16 characters',
          );
        });
    });
  });

  describe('/auth/login (POST)', () => {
    const testUser = {
      username: 'testuser',
      password: 'Test1234',
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
          username: 'noexist',
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
            'username must contain only letters and numbers',
            'username must be longer than or equal to 4 characters',
            'password must contain only letters and numbers',
            'password must be longer than or equal to 8 characters',
          ]);
        });
    });
  });
});
