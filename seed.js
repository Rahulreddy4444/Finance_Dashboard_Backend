import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Transaction from './src/models/Transaction.js';

/**
 * Database Seeder
 * Creates sample users (admin, analyst, viewer) and 30+ transactions
 * Run: npm run seed
 */

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    status: 'active',
  },
  {
    name: 'Analyst User',
    email: 'analyst@example.com',
    password: 'analyst123',
    role: 'analyst',
    status: 'active',
  },
  {
    name: 'Viewer User',
    email: 'viewer@example.com',
    password: 'viewer123',
    role: 'viewer',
    status: 'active',
  },
];

// Helper to create random date within the last N months
const randomDate = (monthsBack) => {
  const date = new Date();
  date.setMonth(date.getMonth() - Math.floor(Math.random() * monthsBack));
  date.setDate(Math.floor(Math.random() * 28) + 1);
  return date;
};

const transactions = [
  // Income records
  { amount: 5000, type: 'income', category: 'salary', description: 'Monthly salary - January', date: randomDate(1) },
  { amount: 5000, type: 'income', category: 'salary', description: 'Monthly salary - February', date: randomDate(2) },
  { amount: 5000, type: 'income', category: 'salary', description: 'Monthly salary - March', date: randomDate(3) },
  { amount: 1200, type: 'income', category: 'freelance', description: 'Website development project', date: randomDate(2) },
  { amount: 800, type: 'income', category: 'freelance', description: 'Logo design project', date: randomDate(4) },
  { amount: 3500, type: 'income', category: 'investment', description: 'Stock dividends Q1', date: randomDate(3) },
  { amount: 2000, type: 'income', category: 'investment', description: 'Mutual fund returns', date: randomDate(5) },
  { amount: 1500, type: 'income', category: 'business', description: 'Online store revenue', date: randomDate(1) },
  { amount: 750, type: 'income', category: 'freelance', description: 'Content writing gig', date: randomDate(6) },
  { amount: 5000, type: 'income', category: 'salary', description: 'Monthly salary - April', date: randomDate(4) },

  // Expense records
  { amount: 1200, type: 'expense', category: 'rent', description: 'Monthly apartment rent', date: randomDate(1) },
  { amount: 1200, type: 'expense', category: 'rent', description: 'Monthly apartment rent', date: randomDate(2) },
  { amount: 1200, type: 'expense', category: 'rent', description: 'Monthly apartment rent', date: randomDate(3) },
  { amount: 350, type: 'expense', category: 'food', description: 'Weekly groceries', date: randomDate(1) },
  { amount: 280, type: 'expense', category: 'food', description: 'Restaurant dinner with friends', date: randomDate(2) },
  { amount: 150, type: 'expense', category: 'food', description: 'Coffee and snacks', date: randomDate(3) },
  { amount: 85, type: 'expense', category: 'transport', description: 'Monthly bus pass', date: randomDate(1) },
  { amount: 120, type: 'expense', category: 'transport', description: 'Uber rides', date: randomDate(2) },
  { amount: 45, type: 'expense', category: 'transport', description: 'Fuel for car', date: randomDate(4) },
  { amount: 200, type: 'expense', category: 'utilities', description: 'Electricity bill', date: randomDate(1) },
  { amount: 75, type: 'expense', category: 'utilities', description: 'Internet bill', date: randomDate(2) },
  { amount: 50, type: 'expense', category: 'utilities', description: 'Water bill', date: randomDate(3) },
  { amount: 500, type: 'expense', category: 'entertainment', description: 'Concert tickets', date: randomDate(4) },
  { amount: 15, type: 'expense', category: 'entertainment', description: 'Netflix subscription', date: randomDate(1) },
  { amount: 30, type: 'expense', category: 'entertainment', description: 'Gaming subscription', date: randomDate(2) },
  { amount: 300, type: 'expense', category: 'health', description: 'Gym membership', date: randomDate(1) },
  { amount: 150, type: 'expense', category: 'health', description: 'Doctor visit', date: randomDate(5) },
  { amount: 250, type: 'expense', category: 'education', description: 'Online course - React', date: randomDate(3) },
  { amount: 180, type: 'expense', category: 'shopping', description: 'New headphones', date: randomDate(2) },
  { amount: 450, type: 'expense', category: 'shopping', description: 'Winter jacket', date: randomDate(6) },
  { amount: 120, type: 'expense', category: 'insurance', description: 'Health insurance premium', date: randomDate(1) },
  { amount: 95, type: 'expense', category: 'other', description: 'Gift for birthday party', date: randomDate(4) },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('  Clearing existing data...');
    await User.deleteMany({});
    await Transaction.deleteMany({});

    // Create users
    console.log(' Creating users...');
    const createdUsers = await User.create(users);
    const adminUser = createdUsers.find((u) => u.role === 'admin');

    console.log('    Admin:   admin@example.com   / admin123');
    console.log('    Analyst: analyst@example.com / analyst123');
    console.log('    Viewer:  viewer@example.com  / viewer123');

    // Create transactions (all created by admin)
    console.log(' Creating transactions...');
    const transactionsWithUser = transactions.map((t) => ({
      ...t,
      createdBy: adminUser._id,
    }));
    await Transaction.create(transactionsWithUser);
    console.log(`    ${transactions.length} transactions created`);

    // Summary
    const incomeTotal = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenseTotal = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    console.log(`\n Seed Summary:`);
    console.log(`   Users:        ${createdUsers.length}`);
    console.log(`   Transactions: ${transactions.length}`);
    console.log(`   Total Income:   ₹${incomeTotal.toLocaleString()}`);
    console.log(`   Total Expenses: ₹${expenseTotal.toLocaleString()}`);
    console.log(`   Net Balance:    ₹${(incomeTotal - expenseTotal).toLocaleString()}`);

    console.log('\n Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(' Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();

