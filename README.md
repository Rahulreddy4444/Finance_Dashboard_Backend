# Finance Data Processing & Access Control Backend

A RESTful backend API for a finance dashboard system built with **Node.js**, **Express**, and **MongoDB**. Features user authentication, role-based access control (RBAC), financial record management, and dashboard analytics.

##  Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [API Reference](#api-reference)
- [Role Permissions](#role-permissions)
- [Assumptions & Design Decisions](#assumptions--design-decisions)

##  Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express 5** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM (Object Data Modeling) |
| **JWT** | Authentication (Access + Refresh tokens) |
| **bcryptjs** | Password hashing |
| **express-validator** | Input validation |
| **helmet** | HTTP security headers |
| **cors** | Cross-Origin Resource Sharing |
| **morgan** | HTTP request logging |

##  Architecture

```
finance-backend/
├── src/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   ├── rateLimit.js           # Rate limiting configuration
│   │   └── swagger.js             # Swagger/OpenAPI spec
│   ├── models/
│   │   ├── User.js                # User schema (roles, status, bcrypt)
│   │   └── Transaction.js         # Financial record schema
│   ├── middleware/
│   │   ├── auth.js                # JWT verification
│   │   ├── rbac.js                # Role-based access control
│   │   ├── validate.js            # Request validation
│   │   └── errorHandler.js        # Global error handler
│   ├── routes/
│   │   ├── auth.routes.js         # Authentication endpoints
│   │   ├── user.routes.js         # User management (Admin)
│   │   ├── transaction.routes.js  # Financial record CRUD
│   │   └── dashboard.routes.js    # Analytics endpoints
│   ├── controllers/               # HTTP request handlers
│   ├── services/                  # Business logic layer
│   ├── utils/
│   │   ├── ApiError.js            # Custom error class
│   │   ├── ApiResponse.js         # Standardized responses
│   │   └── constants.js           # Enums & config
│   └── app.js                     # Express app setup
├── tests/
│   ├── setup.js                   # Test DB helper (in-memory MongoDB)
│   ├── auth.test.js               # Auth integration tests
│   └── transaction.test.js        # Transaction & dashboard tests
├── server.js                      # Entry point
├── seed.js                        # Database seeder
├── .env.example                   # Environment template
└── package.json
```

**Design Pattern**: Controller → Service → Model (3-layer architecture)

- **Controllers**: Thin HTTP layer — parses requests, calls services, sends responses
- **Services**: Business logic — validation rules, data transformations, DB queries
- **Models**: Data schemas with Mongoose — validation, hooks, indexing

##  Setup & Installation

### Prerequisites

- **Node.js** v18+ installed
- **MongoDB** running locally (or MongoDB Atlas URI)

### Steps

1. **Clone and install dependencies**
```bash
cd finance-backend
npm install
```

2. **Configure environment**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values (defaults work for local MongoDB)
```

3. **Seed the database** (creates sample users + transactions)
```bash
npm run seed
```

4. **Start the server**
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

5. **Test the API**
```
Health check:     GET http://localhost:5000/api/health
API Docs (Swagger): http://localhost:5000/api/docs
```

6. **Run tests**
```bash
npm test
```

### Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Analyst | analyst@example.com | analyst123 |
| Viewer | viewer@example.com | viewer123 |

## API Reference

### Base URL: `http://localhost:5000/api`

All authenticated endpoints require: `Authorization: Bearer <access_token>`

---

###  Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login | No |
| POST | `/auth/refresh-token` | Refresh access token | No |
| POST | `/auth/logout` | Logout | Yes |
| GET | `/auth/me` | Get current profile | Yes |

**Register** — `POST /api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login** — `POST /api/auth/login`
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response** (register & login):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1..."
  }
}
```

**Refresh Token** — `POST /api/auth/refresh-token`
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1..."
}
```

---

###  User Management (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users (pagination, search) |
| GET | `/users/:id` | Get user by ID |
| PUT | `/users/:id` | Update user (name, email) |
| PATCH | `/users/:id/role` | Change user role |
| PATCH | `/users/:id/status` | Activate/deactivate user |
| DELETE | `/users/:id` | Delete user |

**Query Parameters** (GET /users):
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 10, max: 100)
- `search` — Search by name or email
- `role` — Filter by role (viewer, analyst, admin)
- `status` — Filter by status (active, inactive)

**Update Role** — `PATCH /api/users/:id/role`
```json
{ "role": "analyst" }
```

**Update Status** — `PATCH /api/users/:id/status`
```json
{ "status": "inactive" }
```

---

###  Financial Records

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/transactions` | Admin | Create record |
| GET | `/transactions` | Analyst, Admin | List with filters |
| GET | `/transactions/:id` | Analyst, Admin | Get single record |
| PUT | `/transactions/:id` | Admin | Update record |
| DELETE | `/transactions/:id` | Admin | Soft delete |
| PATCH | `/transactions/:id/restore` | Admin | Restore deleted |

**Create Transaction** — `POST /api/transactions`
```json
{
  "amount": 5000,
  "type": "income",
  "category": "salary",
  "description": "Monthly salary",
  "date": "2026-04-01"
}
```

**Query Parameters** (GET /transactions):
- `page`, `limit` — Pagination
- `type` — Filter: `income` or `expense`
- `category` — Filter: salary, food, transport, etc.
- `startDate` — Filter from date (ISO 8601)
- `endDate` — Filter to date (ISO 8601)
- `sort` — Sort field (default: date)
- `order` — Sort order: `asc` or `desc`

**Valid Categories**: salary, freelance, investment, business, food, transport, utilities, entertainment, health, education, shopping, rent, insurance, other

---

###  Dashboard Analytics

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard/summary` | All roles | Overall totals |
| GET | `/dashboard/category-summary` | Analyst, Admin | Category breakdown |
| GET | `/dashboard/trends` | Analyst, Admin | Monthly trends (12 months) |
| GET | `/dashboard/recent` | All roles | Recent transactions |

**Summary Response Example**:
```json
{
  "totalIncome": 29750,
  "totalExpenses": 6545,
  "netBalance": 23205,
  "totalTransactions": 32,
  "incomeCount": 10,
  "expenseCount": 22
}
```

**Category Summary Response Example**:
```json
[
  {
    "category": "salary",
    "grandTotal": 20000,
    "totalCount": 4,
    "breakdown": [
      { "type": "income", "total": 20000, "count": 4 }
    ]
  }
]
```

**Monthly Trends Response Example**:
```json
[
  { "year": 2026, "month": 1, "income": 6200, "expenses": 2100, "net": 4100, "count": 8 },
  { "year": 2026, "month": 2, "income": 5800, "expenses": 1885, "net": 3915, "count": 7 }
]
```

---

###  Error Response Format

All errors follow a consistent format:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email",
      "value": "invalid-email"
    }
  ]
}
```

HTTP status codes used:
- `200` — Success
- `201` — Created
- `400` — Bad Request / Validation error
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (insufficient role)
- `404` — Not Found
- `409` — Conflict (duplicate entry)
- `500` — Internal Server Error

##  Role Permissions

| Action | Viewer | Analyst | Admin |
|--------|:------:|:-------:|:-----:|
| View dashboard summary | ✅ | ✅ | ✅ |
| View category/trends analytics | ❌ | ✅ | ✅ |
| View recent activity | ✅ | ✅ | ✅ |
| List/view transactions | ❌ | ✅ | ✅ |
| Create transactions | ❌ | ❌ | ✅ |
| Update transactions | ❌ | ❌ | ✅ |
| Delete/restore transactions | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View own profile | ✅ | ✅ | ✅ |

##  Assumptions & Design Decisions

### Authentication
- **JWT dual-token strategy**: Access tokens (1 day) for API access, refresh tokens (7 days) for seamless re-authentication
- New users register with the **viewer** role by default — an admin must upgrade their role
- Inactive users are blocked at the auth middleware level

### Data Model
- **Soft delete** for transactions: Records are marked `isDeleted: true` instead of being permanently removed, allowing recovery
- Transactions are associated with the user who created them via `createdBy` field
- Compound indexes on `{type, category, date}` for efficient filtering queries

### Access Control
- RBAC is implemented as Express middleware using a factory pattern (`authorize('admin', 'analyst')`)
- Permission checks happen **after** authentication — both layers are clearly separated
- Admin cannot delete their own account (self-deletion protection)

### Validation
- Two layers of validation: express-validator at the route level + Mongoose schema validation at the model level
- All error types (Mongoose, JWT, custom) are normalized through the global error handler

### API Design
- RESTful conventions with consistent response format (`{ success, message, data }`)
- Pagination on list endpoints with metadata (`totalPages`, `hasNextPage`, etc.)
- Query parameter-based filtering rather than POST body for GET requests

##  Security Features

### Rate Limiting
- **General API**: 100 requests per 15-minute window per IP
- **Auth endpoints**: Stricter limit of 20 requests per 15-minute window (protects against brute-force login attempts)
- Returns `429 Too Many Requests` with descriptive message when limit is exceeded
- Configured via `express-rate-limit` with standard `RateLimit-*` response headers

### NoSQL Injection Protection
- Request body, params, and query are sanitized via `express-mongo-sanitize`
- Strips `$` and `.` operators from user input to prevent MongoDB operator injection

### Other Security Measures
- `helmet` — sets secure HTTP headers
- `cors` — configures Cross-Origin Resource Sharing
- `express.json({ limit: '10kb' })` — prevents large payload attacks
- Password hashing — bcrypt with 12 salt rounds
- JWT secret rotation via separate access/refresh token secrets

##  API Documentation (Swagger)

Interactive API documentation is available at:
```
http://localhost:5000/api/docs
```

- Auto-generated from JSDoc annotations in route files
- Try out endpoints directly in the browser
- Includes request/response schemas, examples, and authentication
- Built with `swagger-jsdoc` + `swagger-ui-express`

##  Testing

The project uses **Jest** + **Supertest** with **mongodb-memory-server** for isolated integration tests.

```bash
npm test
```

### Test Coverage

| Suite | Tests | What's covered |
|-------|-------|----------------|
| Auth | 14 | Register (success, duplicate, validation), Login (success, wrong password, inactive), Refresh token, Profile, Logout |
| Transactions | 12 | CRUD operations, RBAC enforcement (admin/analyst/viewer), Pagination, Filtering, Soft delete + restore |
| Dashboard | 5 | Summary totals, Category breakdown, Monthly trends, Recent activity, Role-based access |

### Test Architecture
- **In-memory MongoDB**: Tests run against `mongodb-memory-server` — no real database needed
- **Isolated**: Each test suite connects/disconnects independently, data is cleared between tests
- **Integration-level**: Tests hit actual Express routes via Supertest, validating the full middleware chain

##  Future Enhancements

- File upload for receipt attachments
- Budget tracking and alerts
- Export data to CSV/PDF
