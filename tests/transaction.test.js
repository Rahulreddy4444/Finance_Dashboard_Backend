import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Transaction from '../src/models/Transaction.js';
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

// ─── Helpers ─────────────────────────────────────────────────
const createAdminUser = async () => {
  // Register a user and then manually promote to admin
  const res = await request(app).post('/api/auth/register').send({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'admin123',
  });

  await User.findByIdAndUpdate(res.body.data.user._id, { role: 'admin' });

  // Re-login to get token with updated role
  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'admin@test.com',
    password: 'admin123',
  });

  return loginRes.body.data;
};

const createAnalystUser = async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Analyst User',
    email: 'analyst@test.com',
    password: 'analyst123',
  });

  await User.findByIdAndUpdate(res.body.data.user._id, { role: 'analyst' });

  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'analyst@test.com',
    password: 'analyst123',
  });

  return loginRes.body.data;
};

const createViewerUser = async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Viewer User',
    email: 'viewer@test.com',
    password: 'viewer123',
  });

  return res.body.data;
};

const sampleTransaction = {
  amount: 5000,
  type: 'income',
  category: 'salary',
  description: 'Monthly salary',
  date: '2026-04-01',
};

// ─── Tests ───────────────────────────────────────────────────

describe('POST /api/transactions', () => {
  it('should create a transaction as admin', async () => {
    const admin = await createAdminUser();

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(sampleTransaction);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(5000);
    expect(res.body.data.type).toBe('income');
    expect(res.body.data.category).toBe('salary');
    expect(res.body.data.isDeleted).toBe(false);
  });

  it('should return 403 for analyst trying to create', async () => {
    const analyst = await createAnalystUser();

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${analyst.accessToken}`)
      .send(sampleTransaction);

    expect(res.status).toBe(403);
  });

  it('should return 403 for viewer trying to create', async () => {
    const viewer = await createViewerUser();

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send(sampleTransaction);

    expect(res.status).toBe(403);
  });

  it('should return 400 for missing required fields', async () => {
    const admin = await createAdminUser();

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('should return 400 for invalid category', async () => {
    const admin = await createAdminUser();

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ ...sampleTransaction, category: 'invalid-category' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/transactions', () => {
  let admin;

  beforeEach(async () => {
    admin = await createAdminUser();

    // Create several transactions
    for (let i = 0; i < 15; i++) {
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          amount: (i + 1) * 100,
          type: i % 2 === 0 ? 'income' : 'expense',
          category: i % 2 === 0 ? 'salary' : 'food',
          description: `Transaction ${i + 1}`,
          date: '2026-04-01',
        });
    }
  });

  it('should list transactions with pagination', async () => {
    const res = await request(app)
      .get('/api/transactions?page=1&limit=5')
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions.length).toBe(5);
    expect(res.body.data.pagination.total).toBe(15);
    expect(res.body.data.pagination.totalPages).toBe(3);
    expect(res.body.data.pagination.hasNextPage).toBe(true);
  });

  it('should filter by type', async () => {
    const res = await request(app)
      .get('/api/transactions?type=income')
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    res.body.data.transactions.forEach((t) => {
      expect(t.type).toBe('income');
    });
  });

  it('should filter by category', async () => {
    const res = await request(app)
      .get('/api/transactions?category=food')
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    res.body.data.transactions.forEach((t) => {
      expect(t.category).toBe('food');
    });
  });

  it('should allow analyst to read transactions', async () => {
    const analyst = await createAnalystUser();

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${analyst.accessToken}`);

    expect(res.status).toBe(200);
  });

  it('should deny viewer from reading transactions', async () => {
    const viewer = await createViewerUser();

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${viewer.accessToken}`);

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/transactions/:id', () => {
  it('should update a transaction as admin', async () => {
    const admin = await createAdminUser();

    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(sampleTransaction);

    const id = createRes.body.data._id;

    const res = await request(app)
      .put(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ amount: 9999, description: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(9999);
    expect(res.body.data.description).toBe('Updated');
  });

  it('should return 404 for non-existent transaction', async () => {
    const admin = await createAdminUser();

    const res = await request(app)
      .put('/api/transactions/660f1a2b3c4d5e6f7a8b9c0d')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ amount: 100 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE & RESTORE /api/transactions/:id', () => {
  it('should soft delete and restore a transaction', async () => {
    const admin = await createAdminUser();

    // Create
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(sampleTransaction);

    const id = createRes.body.data._id;

    // Soft delete
    const deleteRes = await request(app)
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(deleteRes.status).toBe(200);

    // Verify it's hidden from GET
    const getRes = await request(app)
      .get(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(getRes.status).toBe(404);

    // Restore
    const restoreRes = await request(app)
      .patch(`/api/transactions/${id}/restore`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.isDeleted).toBe(false);

    // Verify it's visible again
    const getRes2 = await request(app)
      .get(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(getRes2.status).toBe(200);
  });
});

describe('Dashboard Endpoints', () => {
  let admin;

  beforeEach(async () => {
    admin = await createAdminUser();

    // Create mixed transactions
    const transactions = [
      { amount: 5000, type: 'income', category: 'salary', date: '2026-03-01' },
      { amount: 3000, type: 'income', category: 'freelance', date: '2026-03-15' },
      { amount: 1200, type: 'expense', category: 'rent', date: '2026-03-01' },
      { amount: 350, type: 'expense', category: 'food', date: '2026-03-10' },
      { amount: 5000, type: 'income', category: 'salary', date: '2026-04-01' },
    ];

    for (const t of transactions) {
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send(t);
    }
  });

  it('GET /dashboard/summary — should return correct totals', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBe(13000);
    expect(res.body.data.totalExpenses).toBe(1550);
    expect(res.body.data.netBalance).toBe(11450);
    expect(res.body.data.totalTransactions).toBe(5);
    expect(res.body.data.incomeCount).toBe(3);
    expect(res.body.data.expenseCount).toBe(2);
  });

  it('GET /dashboard/category-summary — should return category breakdown', async () => {
    const res = await request(app)
      .get('/api/dashboard/category-summary')
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);

    const salaryCategory = res.body.data.find((c) => c.category === 'salary');
    expect(salaryCategory).toBeDefined();
    expect(salaryCategory.grandTotal).toBe(10000);
  });

  it('GET /dashboard/trends — should return monthly data', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends')
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('year');
    expect(res.body.data[0]).toHaveProperty('month');
    expect(res.body.data[0]).toHaveProperty('income');
    expect(res.body.data[0]).toHaveProperty('expenses');
  });

  it('GET /dashboard/recent — should return recent transactions', async () => {
    const res = await request(app)
      .get('/api/dashboard/recent?limit=3')
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  it('viewer should access summary but not category-summary', async () => {
    const viewer = await createViewerUser();

    const summaryRes = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewer.accessToken}`);

    expect(summaryRes.status).toBe(200);

    const categoryRes = await request(app)
      .get('/api/dashboard/category-summary')
      .set('Authorization', `Bearer ${viewer.accessToken}`);

    expect(categoryRes.status).toBe(403);
  });
});
