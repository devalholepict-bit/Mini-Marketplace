# MeuLink — Early-Stage Venture & Investor Marketplace

MeuLink is a modern MERN stack marketplace application where early-stage founders seeking capital publish company profiles and accredited investors discover, evaluate, save, and express direct investment interest.

---

## 1. Project Overview & Description

MeuLink bridges the funding access gap between venture founders and capital allocators through a secure, role-delineated ecosystem:
- **Business (Founders)**: Create and maintain detailed venture profiles (pitch deck links, target funding, traction stage, revenue range, and location), toggle public marketplace visibility, and review inbound expressions of interest with one-click acceptance or decline.
- **Investors**: Discover verified ventures across industries with real-time text search and structured filters (stage, funding goal, geography), maintain a private saved watchlist, submit expressions of investment interest with introductory notes, and track the status of their outreach pipeline.

---

## 2. Key Features

- **Role-Based Authentication & Guardrails**:
  - Secure registration and login for `business` and `investor` roles.
  - Salted and hashed passwords using Bcrypt (cost factor 10), hidden by default (`select: false`).
  - Cryptographic JSON Web Tokens (HMAC SHA-256) with role claims.
  - Safe session management with `sessionStorage` token isolation in React to prevent credential leakage.
  - Centralized middleware (`authenticate`, `authorize`) protecting private endpoints.

- **Founder Venture Management**:
  - Full CRUD lifecycle for business profiles via `GET /api/businesses/me` and `PUT /api/businesses/me`.
  - Identity locked strictly to verified JWT identity (`req.user._id`), preventing ID spoofing.
  - Dedicated publication controller (`PATCH /api/businesses/me/publish`) ensuring unlisted draft states until explicitly released.
  - Privacy gating: sensitive contact email and private data-room pitch links are locked from public eyes.

- **Investor Discovery & Due Diligence**:
  - Server-side full-text search (`q`) across business name, tagline, and description with regex escaping against ReDoS.
  - Multi-attribute filtering (industry, stage, country, funding range) with deterministic sorting and pagination metadata.
  - Private watchlist: idempotent bookmarking (`POST /api/investor/saved/:id` using atomic `$addToSet` and removal via `$pull`).

- **Interest Pipeline & Terminal Lock State Machine**:
  - Structured investor outreach submission (`POST /api/interests`) protected by a database-level compound unique index `{ investor: 1, business: 1 }` to prevent duplicate submissions.
  - Atomic conditional status updates (`findOneAndUpdate`) allowing founders to `accept` or `decline` pending inquiries.
  - Strict terminal locking: once resolved, states cannot be mutated or reset, rejecting concurrent race conditions with HTTP 409 Conflict.
  - Privacy elevation: approved interest status unlocks founder contact information and private pitch deck links for that specific investor.

- **Role-Specific Dashboard Analytics**:
  - Fast, database-level Mongoose aggregation pipelines (`$match` ➔ `$group` by status with `$sum: 1`).
  - Real-time conversion metrics (total, pending, accepted, and declined outreach) zero-normalized for clean UI rendering.

- **Fintech Monochrome Design System**:
  - Understated monochrome and silver aesthetic (Near-black `#0A0A0A`, Pure black `#000000`, Off-white `#F5F5F3`, and Silver `#C0C0C0`).
  - Georgia serif typography paired with clean sans-serif UI elements, responsive grid layouts, and empty/error states.

---

## 3. Technologies Used

- **Frontend**:
  - **Core**: React 18, Vite
  - **Routing**: React Router v6
  - **HTTP Client**: Axios with centralized interceptors
  - **Styling**: Vanilla CSS with customized design tokens and zero heavy dependencies
- **Backend**:
  - **Runtime & Framework**: Node.js, Express.js (CommonJS: `require` / `module.exports`)
  - **Architecture**: Decoupled `app.js` and `server.js` for isolated, zero-collision testing
  - **Database & ODM**: MongoDB Atlas, Mongoose v8
  - **Data Validation**: Zod schema validation layer
  - **Security**: Bcrypt, JSON Web Tokens (`jsonwebtoken`), Helmet, CORS, Morgan
- **Testing & Tooling**:
  - **Testing**: Jest, Supertest (143 offline tests across 11 suites)
  - **AI Collaboration**: Code0

---

## 4. Prerequisites and Installation Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Access to a MongoDB Atlas cluster or a local MongoDB instance

### Installation
Clone the repository and install root and workspace dependencies:

```bash
# Clone the repository
git clone https://github.com/devalholepict-bit/Mini-Marketplace.git
cd Mini-Marketplace

# Install root dependencies
npm install

# Install server dependencies
npm --prefix server install

# Install client dependencies
npm --prefix client install
```

---

## 5. Environment Variable Setup

> [!IMPORTANT]
> **Security Rule**: Never commit real database connection strings, passwords, or JWT secrets to Git. All `.env` files are ignored via `.gitignore`. Template examples are provided in `server/.env.example` and `client/.env.example`.

### Server Configuration (`server/.env`)
Create a file at `server/.env` based on `server/.env.example`:

```env
# Server Port
PORT=5000

# Client Application URL (for CORS validation)
CLIENT_URL=http://localhost:5173

# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@<cluster_host>.mongodb.net/<database_name>?retryWrites=true&w=majority

# Cryptographic JWT Secret & Lifetime
JWT_SECRET=your_long_random_and_secure_jwt_secret_key_here
JWT_EXPIRES_IN=1d

# Demo Seeding Password (required to run npm run seed in development)
SEED_DEMO_PASSWORD=your_demo_seed_password_here
```

### Client Configuration (`client/.env`)
Create a file at `client/.env` based on `client/.env.example`:

```env
# Base API URL pointing to the backend
VITE_API_URL=http://localhost:5000/api
```

---

## 6. Instructions to Run Frontend and Backend

The project provides unified root scripts for running development, test, and production routines:

### 1. Run Both Frontend and Backend Concurrently
From the project root:
```bash
npm run dev
```
- **Backend API**: Running at `http://localhost:5000`
- **Frontend Client**: Running at `http://localhost:5173`

### 2. Run Backend Only
```bash
npm run dev:server
```

### 3. Run Frontend Only
```bash
npm run dev:client
```

### 4. Run the Idempotent Demo Seed Script
A non-destructive demo seed script populates sample founders, businesses, and investors for demonstration purposes:
```bash
npm run seed
```
*(Requires `SEED_DEMO_PASSWORD` in `server/.env`; strictly blocked in production).*

---

## 7. API Overview

All API endpoints are prefixed with `/api` and return standardized JSON responses.

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (`business` or `investor`) |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive Bearer JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile (sanitized) |

### Business Profiles & Marketplace (`/api/businesses`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/businesses/me` | Business Owner | Retrieve owner's profile (including private links) |
| `PUT` | `/api/businesses/me` | Business Owner | Upsert profile (name, pitch, metrics, contact) |
| `PATCH` | `/api/businesses/me/publish` | Business Owner | Toggle marketplace publication visibility |
| `GET` | `/api/businesses` | Investor | Browse published ventures with search, filters, pagination |
| `GET` | `/api/businesses/:id` | Authenticated | View venture details (private fields gated by ownership/approval) |

### Saved Watchlist (`/api/investor/saved`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/investor/saved/:businessId` | Investor | Add venture to private watchlist (`$addToSet`) |
| `GET` | `/api/investor/saved` | Investor | Retrieve saved ventures list |
| `DELETE`| `/api/investor/saved/:businessId`| Investor | Remove venture from watchlist (`$pull`) |

### Expressions of Interest (`/api/interests`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/interests` | Investor | Submit expression of interest (compound unique locked) |
| `GET` | `/api/interests/sent` | Investor | View sent interests and response statuses |
| `GET` | `/api/interests/received` | Business Owner | View inbound interests from verified investors |
| `PATCH` | `/api/interests/:id/status` | Business Owner | Accept or decline interest (atomic terminal lock) |

### Dashboard Statistics (`/api/dashboard`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Authenticated | Role-tailored aggregated metrics (`$match` ➔ `$group`) |

### Health Check (`/api/health`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Uptime status and real-time MongoDB connection state |

---

## 8. Testing Instructions

All unit and integration tests execute completely offline without connecting to or mutating remote databases.

### Run All Backend Tests
From the root repository directory:
```bash
npm test
```

### Test Coverage Summary
- **Test Suites**: 11 passed, 11 total
- **Tests**: 143 passed, 143 total
- **Snapshots**: 0
- **Suites Breakdown**:
  - `tests/dashboard.routes.test.js`: Aggregation pipelines, role isolation, and missing status normalization.
  - `tests/seed.test.js`: Fail-safe environment guards and idempotent record creation.
  - `tests/interest.routes.test.js`: Authorization, unique compound index conflict translation (`E11000` ➔ 409), atomic conditional updates, terminal status locking, and private field unlocking.
  - `tests/saved.routes.test.js`: Atomic `$addToSet` and `$pull`, idempotency, published-only validation.
  - `tests/business.discovery.test.js`: Search regex escaping, multi-field filtering, pagination bounds, and private field gating.
  - `tests/business.routes.test.js`: Upsert lifecycle, ownership locking, and publication controls.
  - `tests/auth.routes.test.js`: Registration, login, password hashing, and user sanitization.
  - `tests/auth.middleware.test.js`: Unit tests for `authenticate` and `authorize` middleware.
  - `tests/jwt.test.js`: Cryptographic signing and expiration verification.
  - `tests/models.test.js`: Schema validation rules and compound indexes.
  - `tests/health.test.js`: Health endpoint response formatting and readyState detection.

### Production Build Validation
To verify the client production bundle:
```bash
npm run build
```
Generates an optimized Vite production distribution in `client/dist/` without errors or warnings.

---

## 9. Confirmation of Code0 Usage

> **Official Confirmation**: **Code0** was utilized as the primary AI coding assistant throughout the architectural design, implementation, debugging, refactoring, and quality assurance phases of the MeuLink marketplace project.

---

## 10. AI Development Experience with Code0

Collaborating with **Code0** significantly accelerated engineering velocity while enforcing high code quality, security rigor, and architectural consistency throughout the 10-stage internship development lifecycle:

- **End-to-End Architectural Continuity**: Code0 maintained persistent awareness across the entire codebase—from Mongoose schema definitions and Zod validation middleware to React context state management and Vite bundle configuration. This prevented regressions and ensured strict alignment with RESTful and security best practices.
- **Defensive Engineering & Security-First Patterns**: Rather than proposing generic boilerplate, Code0 actively implemented defensive coding practices. Examples include pre-save Bcrypt hashing guards against double-hashing, strict JWT claim minimization, regex special character escaping for ReDoS protection, MongoDB operator injection prevention, and `sessionStorage` token isolation.
- **Rapid Test Suite Creation**: Code0 generated 143 robust offline unit and integration tests using Jest and Supertest, systematically covering happy paths, edge cases, concurrent race conditions, and role authorization guardrails.
- **Refinement of UX & Design Systems**: Code0 assisted in styling an understated, professional monochrome and silver aesthetic tailored for institutional investors and founders, avoiding flashy frameworks and delivering crisp, responsive UI components in pure Vanilla CSS.

---

## 11. Specific Tasks Where Code0 Was Used

Below are five specific, verified engineering tasks where Code0 was directly employed:

### Task 1: Database Schema Architecture & Compound Unique Indexing
- **Area**: Database Integration & Data Modeling
- **File(s)**: [`server/src/models/Business.js`](file:///server/src/models/Business.js), [`server/src/models/Interest.js`](file:///server/src/models/Interest.js), [`server/src/models/User.js`](file:///server/src/models/User.js)
- **Contribution**: Code0 architected production-ready Mongoose schemas with strict data constraints. Specifically, Code0 designed the compound unique index `{ investor: 1, business: 1 }` on the `Interest` collection to enforce database-level duplicate prevention, and implemented `select: false` on `User.password` to prevent accidental credential leakage in queries.

### Task 2: Robust API Validation Layer & Role Authorization Middleware
- **Area**: API Creation & Security Engineering
- **File(s)**: [`server/src/validators/auth.validator.js`](file:///server/src/validators/auth.validator.js), [`server/src/validators/business.validator.js`](file:///server/src/validators/business.validator.js), [`server/src/middleware/authorize.middleware.js`](file:///server/src/middleware/authorize.middleware.js)
- **Contribution**: Code0 implemented Zod schema validators that strip unknown fields and validate data types before requests touch controllers. Code0 also built the reusable `authorize(...allowedRoles)` middleware, correctly distinguishing between HTTP 401 (unauthenticated) and HTTP 403 (unauthorized role) scenarios across all routes.

### Task 3: Atomic Interest State Machine & Terminal Concurrency Locking
- **Area**: Backend Logic & Concurrency Control
- **File(s)**: [`server/src/controllers/interest.controller.js`](file:///server/src/controllers/interest.controller.js)
- **Contribution**: Code0 designed the atomic status transition logic for expressions of interest. Using a conditional MongoDB `findOneAndUpdate` query scoped to `status: 'pending'`, Code0 ensured that once an interest transitions to `accepted` or `declined`, it reaches an immutable terminal state. Any concurrent attempt to alter the status is cleanly translated into an HTTP 409 Conflict response.

### Task 4: Role-Based Routing & Session Storage Security Refactoring
- **Area**: Frontend Architecture & Refactoring
- **File(s)**: [`client/src/contexts/AuthContext.jsx`](file:///client/src/contexts/AuthContext.jsx), [`client/src/components/ProtectedRoute.jsx`](file:///client/src/components/ProtectedRoute.jsx)
- **Contribution**: Code0 implemented the React `AuthContext` and `ProtectedRoute` components with role whitelisting and return-path preservation. During final QA, Code0 refactored client token persistence from `localStorage` to `sessionStorage`, guaranteeing that browser tab isolation is maintained and tokens are automatically purged upon tab closure.

### Task 5: Comprehensive Jest & Supertest Integration Test Suite
- **Area**: Automated Testing & Quality Assurance
- **File(s)**: [`server/tests/interest.routes.test.js`](file:///server/tests/interest.routes.test.js), [`server/tests/dashboard.routes.test.js`](file:///server/tests/dashboard.routes.test.js), [`server/tests/business.discovery.test.js`](file:///server/tests/business.discovery.test.js)
- **Contribution**: Code0 authored 11 comprehensive test suites comprising 143 test cases. The suites mock Mongoose methods to enable 100% offline testing execution without external network dependencies, verifying status codes, payload shapes, error serialization, and aggregation pipeline outputs.

---

## Project Structure

```text
MeuLink/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── apiClient.js
│   │   ├── components/
│   │   │   ├── ApiStatus.jsx
│   │   │   ├── AppLayout.jsx
│   │   │   ├── BusinessCard.jsx
│   │   │   ├── BusinessFilters.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── RoleCard.jsx
│   │   │   ├── RolesSection.jsx
│   │   │   └── StatusLabel.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── BusinessDetailPage.jsx
│   │   │   ├── BusinessProfilePage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── MarketplacePage.jsx
│   │   │   ├── ReceivedInterestsPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── SavedBusinessesPage.jsx
│   │   │   └── SentInterestsPage.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── business.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── health.controller.js
│   │   │   ├── interest.controller.js
│   │   │   └── saved.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── authorize.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── validate.middleware.js
│   │   ├── models/
│   │   │   ├── Business.js
│   │   │   ├── Interest.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── business.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   ├── health.routes.js
│   │   │   ├── interest.routes.js
│   │   │   └── saved.routes.js
│   │   ├── seed/
│   │   │   └── seed.js
│   │   ├── utils/
│   │   │   └── jwt.js
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   ├── business.validator.js
│   │   │   ├── interest.validator.js
│   │   │   └── saved.validator.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── auth.middleware.test.js
│   │   ├── auth.routes.test.js
│   │   ├── business.discovery.test.js
│   │   ├── business.routes.test.js
│   │   ├── dashboard.routes.test.js
│   │   ├── health.test.js
│   │   ├── interest.routes.test.js
│   │   ├── jwt.test.js
│   │   ├── models.test.js
│   │   ├── saved.routes.test.js
│   │   └── seed.test.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

---

## License

This project is licensed under the MIT License.
