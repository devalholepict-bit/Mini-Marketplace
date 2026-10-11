# MeuLink

MeuLink is a modern marketplace application where businesses seeking growth funding can publish profiles and investors can discover, evaluate, and connect with them.

---

## Overview & Roles

MeuLink bridges the gap between early-stage companies and capital providers:
- **Business (Founder)**: Founders seeking growth capital who can publish venture profiles, funding targets, and traction milestones, and receive investment expressions of interest.
- **Investor**: Angels, syndicates, and funds who can browse marketplace opportunities, evaluate company metrics, save profiles, and express direct investment interest.

---

## Technology Stack

- **Frontend**: React 18 (Vite, JSX), React Router v6, Axios, Vanilla CSS
- **Backend**: Node.js, Express.js (CommonJS: `require` / `module.exports`)
- **Database**: MongoDB Atlas with Mongoose (v8)
- **Security & Utilities**: Helmet, CORS, Morgan, Dotenv, Zod, Bcrypt, JSON Web Tokens
- **Testing**: Jest, Supertest

---

## Completed Stages

### Stage 1: Project Scaffold & Health Endpoint
- Monorepo scaffold with decoupled `client/` and `server/` environments
- Modular Express API with centralized error handling, 404 handler, Helmet, CORS, and Morgan logging
- Decoupled `app.js` and `server.js` architecture for isolated testing without port collisions
- Starter page with responsive design and live backend connectivity status card

### Stage 2: MongoDB Atlas Connection & Mongoose Models
- Asynchronous database connection utility (`server/src/config/db.js`) reading `MONGODB_URI` safely
- Strict credential safety: no secrets or URIs logged or exposed in errors
- `server.js` orchestrates connecting to MongoDB prior to binding the HTTP listener, terminating cleanly with non-zero exit code if connection fails
- Health endpoint (`GET /api/health`) dynamically reflects actual Mongoose connection readyState (`connected` or `disconnected`)
- Production-ready Mongoose schemas with indexes, references, and validation constraints:
  - `User`: Unique email, hidden password (`select: false`), role enum (`business`, `investor`), and `savedBusinesses` references
  - `Business`: 1-to-1 owner uniqueness constraint, positive funding goal validation, flexible industry/stage definitions, unpublished default
  - `Interest`: Compound unique index on `{ investor: 1, business: 1 }` preventing duplicate submissions, plus query indexes for investor history and business status lookups

### Stage 3: JWT Authentication & Role-Based Authorization
- **Zod Validation Layer**: Dedicated schemas for registration and login payloads, rejecting malformed inputs with HTTP 400 before reaching business logic.
- **Bcrypt Password Security**: Automatic pre-save hashing with salt rounds of 10, guarded by `this.isModified('password')` to prevent accidental double-hashing. Plaintext passwords are never persisted.
- **Credential Protection**: User model enforces `select: false` on the password field; login explicitly requests `.select('+password')` for verification. All responses return sanitized user representations via `user.toSafeObject()`.
- **Duplicate Email Handling**: Returns generic HTTP 409 Conflict without revealing database specifics.
- **Cryptographic JWT Utility**: Signs minimum claims (`sub` = user ID, `role`) using HMAC SHA-256 with environment-configured secret (`JWT_SECRET`) and expiration (`JWT_EXPIRES_IN`). Verified via `jwt.verify()`.
- **Reusable `authenticate` Middleware**: Enforces `Bearer <token>` HTTP Authorization header, verifies signature and expiration, retrieves active user, and attaches sanitized entity to `req.user`.
- **Reusable `authorize(...allowedRoles)` Middleware**: Enforces role access control across endpoints (`business`, `investor`).

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
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── RoleCard.jsx
│   │   │   └── RolesSection.jsx
│   │   ├── pages/
│   │   │   └── HomePage.jsx
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
│   │   │   └── health.controller.js
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
│   │   │   └── health.routes.js
│   │   ├── seed/
│   │   ├── utils/
│   │   │   └── jwt.js
│   │   ├── validators/
│   │   │   └── auth.validator.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── auth.middleware.test.js
│   │   ├── auth.routes.test.js
│   │   ├── health.test.js
│   │   ├── jwt.test.js
│   │   └── models.test.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

---

## Authentication & Authorization API Reference

Base URL: `/api/auth`

### 1. Register User
`POST /api/auth/register`

Creates a new user account, hashes password with bcrypt, and returns a signed JWT along with the sanitized user profile.

**Request Body Example:**
```json
{
  "name": "Jane Founder",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "role": "business"
}
```

**Response (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "67a7f4e902b4d91234567890",
    "name": "Jane Founder",
    "email": "jane@example.com",
    "role": "business",
    "createdAt": "2026-10-11T12:00:00.000Z",
    "updatedAt": "2026-10-11T12:00:00.000Z"
  }
}
```

*Errors*:
- `HTTP 400 Bad Request`: Validation failure (e.g. password < 8 characters, invalid email, or invalid role).
- `HTTP 409 Conflict`: Email address is already registered.

---

### 2. Login User
`POST /api/auth/login`

Validates user credentials against stored bcrypt hash and returns a fresh JWT.

**Request Body Example:**
```json
{
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "67a7f4e902b4d91234567890",
    "name": "Jane Founder",
    "email": "jane@example.com",
    "role": "business"
  }
}
```

*Errors*:
- `HTTP 401 Unauthorized`: Generic error message (`"Invalid email or password"`) prevents email enumeration.

---

### 3. Get Current User Profile
`GET /api/auth/me`

Retrieves the currently authenticated user profile using the Bearer JWT.

**Request Headers:**
```http
Authorization: Bearer <your_jwt_token_here>
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "67a7f4e902b4d91234567890",
    "name": "Jane Founder",
    "email": "jane@example.com",
    "role": "business",
    "createdAt": "2026-10-11T12:00:00.000Z",
    "updatedAt": "2026-10-11T12:00:00.000Z"
  }
}
```

---

## Authentication vs. Authorization (HTTP 401 vs. HTTP 403)

- **HTTP 401 Unauthorized ("Who are you?")**:
  - Returned when authentication is missing, incomplete, expired, or invalid.
  - Examples: No `Authorization` header provided, header not in `Bearer <token>` format, expired token signature, or invalid login credentials.
- **HTTP 403 Forbidden ("You are not allowed here")**:
  - Returned when the user is authenticated and their identity is verified, but their assigned role does not have permission to access the endpoint.
  - Examples: An `investor` attempting to call a business owner modification endpoint guarded by `authorize('business')`.

---

## Environment Variables & Configuration

> [!IMPORTANT]
> **Security Reminder**: Never commit real database connection strings, passwords, or JWT secrets to Git. The `.gitignore` file is configured to exclude all `.env` files while tracking `.env.example` templates.

### Configuring Backend in `server/.env`

Create a `server/.env` file in the `server/` directory:
```bash
cp server/.env.example server/.env
```
Template configuration:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/meulink?retryWrites=true&w=majority
JWT_SECRET=your_secure_256_bit_secret_key_here
JWT_EXPIRES_IN=1d
```

### Configuring Frontend in `client/.env`
```bash
cp client/.env.example client/.env
```
Default values:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running the Application

From the project root:

- **Start both backend and frontend concurrently:**
  ```bash
  npm run dev
  ```
- **Start only the backend API server (`http://localhost:5000`):**
  ```bash
  npm run dev:server
  ```
- **Start only the frontend client (`http://localhost:5173`):**
  ```bash
  npm run dev:client
  ```

---

## Testing & Production Build

All unit and integration tests execute completely offline and do **not** mutate production or remote Atlas databases:

- **Run all backend tests:**
  ```bash
  npm test
  ```
  Included test suites:
  - `tests/auth.routes.test.js`: Supertest integration tests for `register`, `login`, `me`, password hashing, duplicate detection, and sanitization.
  - `tests/auth.middleware.test.js`: Unit tests for `authenticate` and `authorize` middleware covering 401/403 scenarios.
  - `tests/jwt.test.js`: Cryptographic signing, expiration, and verification verification.
  - `tests/models.test.js`: Schema validation, index declaration, and database error handling.
  - `tests/health.test.js`: Verifies `GET /api/health` status 200, ISO timestamp, and database state.
- **Build frontend for production:**
  ```bash
  npm run build
  ```

---

## Ten-Stage Roadmap

1. **Stage 1 (Completed)**: Project Scaffold, Monorepo Setup, Health Endpoint & Live UI Status Indicator
2. **Stage 2 (Completed)**: Database Connection (MongoDB Atlas & Mongoose Models for User, Business, Interest)
3. **Stage 3 (Completed)**: Data Validation & Authentication Layer (JWT, bcrypt password hashing, Zod schemas, role-based authorization)
4. **Stage 4**: Role-Based Profile Flows & Authorization Protection
5. **Stage 5**: Business Profile API (Full CRUD endpoints for venture listings)
6. **Stage 6**: Marketplace Discovery & Search (Filterable marketplace listings for investors)
7. **Stage 7**: Expressions of Interest API (Investor connection workflow & notifications)
8. **Stage 8**: Frontend Dashboard & Role Views (Business management & Investor discovery views)
9. **Stage 9**: Seed Script & Demo Data Generation
10. **Stage 10**: End-to-End Integration, Security Hardening & Final Polish

---

## AI-Assisted Development Log

Use the table below to document tasks completed with AI assistance:

| Task Description | AI Tool Used | What I Reviewed / Changed | How It Was Verified |
| :--- | :--- | :--- | :--- |
| *Scaffold Stage 1 Health Check* | *Antigravity* | *Verified CommonJS exports, decoupled app.js/server.js, and error middleware* | *Ran Jest test suite and checked GET /api/health* |
| *Stage 2 MongoDB Connection & Schemas* | *Antigravity* | *Verified Mongoose 8 connectDB without leaks, server.js startup ordering, User/Business/Interest models, and compound index declaration* | *Ran Jest model test suite (15 tests passing) and verified offline execution* |
| *Stage 3 JWT Authentication & Role Authorization* | *Antigravity* | *Verified Zod schemas, pre-save bcrypt hashing, select: false password protection, JWT signing/verifying with sub claim, authenticate and authorize('business', 'investor') middleware, and 401/403/409 error mapping* | *Executed 39 Jest tests across 5 suites (100% passing) and verified Vite production build* |
| *Task 4* | | | |
| *Task 5* | | | |
