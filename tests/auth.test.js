import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';

// ─── Setup & Teardown ────────────────────────────────────────
beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

// ─── Helper ──────────────────────────────────────────────────
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
};

const registerUser = () =>
  request(app).post('/api/auth/register').send(testUser);

const loginUser = (email = testUser.email, password = testUser.password) =>
  request(app).post('/api/auth/login').send({ email, password });

// ─── Tests ───────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe(testUser.name);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.role).toBe('viewer'); // default role
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // Password should not be returned
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should return 409 for duplicate email', async () => {
    await registerUser();
    const res = await registerUser();

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
  });

  it('should return 400 for short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'test@example.com',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await registerUser();
  });

  it('should login with valid credentials', async () => {
    const res = await loginUser();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    const res = await loginUser(testUser.email, 'wrongpassword');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await loginUser('nonexistent@example.com', 'password123');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 403 for inactive user', async () => {
    // Deactivate user directly in DB
    await User.findOneAndUpdate(
      { email: testUser.email },
      { status: 'inactive' }
    );

    const res = await loginUser();

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });
});

describe('POST /api/auth/refresh-token', () => {
  it('should refresh access token with valid refresh token', async () => {
    const loginRes = await registerUser();
    const { refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should return 401 for invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
  });

  it('should return 400 for missing refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user profile', async () => {
    const loginRes = await registerUser();
    const { accessToken } = loginRes.body.data;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('should logout successfully', async () => {
    const loginRes = await registerUser();
    const { accessToken } = loginRes.body.data;

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
