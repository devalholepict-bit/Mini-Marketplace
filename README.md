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
- **Zod Validation Layer**: Dedicated schemas for registration and login payloads, rejecting malformed inputs with HTTP 400.
- **Bcrypt Password Security**: Automatic pre-save hashing with salt rounds of 10, guarded by `this.isModified('password')` to prevent accidental double-hashing. Plaintext passwords are never persisted.
- **Credential Protection**: User model enforces `select: false` on password; login explicitly requests `.select('+password')`. All responses return sanitized user representations via `user.toSafeObject()`.
- **Cryptographic JWT Utility**: Signs minimum claims (`sub` = user ID, `role`) using HMAC SHA-256 with environment-configured secret (`JWT_SECRET`) and expiration (`JWT_EXPIRES_IN`). Verified via `jwt.verify()`.
- **Reusable `authenticate` & `authorize` Middleware**: Enforces Bearer JWT verification and role-based permissions (`business`, `investor`).

### Stage 4: Business Profile Management
- **Owner-Locked Profile Retrieval**: `GET /api/businesses/me` returns the complete profile (including owner-only `privatePitchLink` and `contactEmail`) for the authenticated founder.
- **Safe Upsert Lifecycle**: `PUT /api/businesses/me` creates (HTTP 201) or updates (HTTP 200) the founder's single profile.
  - Strictly derives `owner` from verified JWT identity (`req.user._id`), never trusting client-supplied IDs.
  - Applies an explicit allowlist of editable fields, preventing injection of `_id`, `owner`, or database operators.
  - Preserves existing publication state (`isPublished`) across profile edits; defaults to `false` on initial creation.
- **Dedicated Publication Control**: `PATCH /api/businesses/me/publish` allows founders to publish or unpublish their profile with strict boolean validation, requiring core fields before publication.
- **Strict Role-Based Guardrails**: Non-business accounts (such as investors) receive HTTP 403 Forbidden on all business profile management endpoints.

### Stage 5: Business Discovery, Search, Filters & Pagination
- **Investor Marketplace Listing**: `GET /api/businesses` allows verified investors to browse published businesses (`isPublished: true`).
- **Flexible & Safe Filtering**: Combines full-text search `q` (with regex special character escaping), exact filters (`industry`, `stage`, `country`), and numeric funding range filters (`minFunding`, `maxFunding`).
- **Deterministic Pagination & Sorting**: Implements `skip`, `limit` (max 50, default 12), and sorting (`createdAt`, `fundingGoal`, `name`) with `_id` tie-breaker. Returns clean metadata (`page`, `limit`, `total`, `totalPages`).
- **Role-Based Private Field Protection**: Detail view (`GET /api/businesses/:id`) exposes `privatePitchLink` and `contactEmail` only to the owner or an investor with an `accepted` Interest status. All public listing responses strictly omit private fields.

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
│   │   │   ├── business.controller.js
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
│   │   │   ├── business.routes.js
│   │   │   └── health.routes.js
│   │   ├── seed/
│   │   ├── utils/
│   │   │   └── jwt.js
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   └── business.validator.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── auth.middleware.test.js
│   │   ├── auth.routes.test.js
│   │   ├── business.discovery.test.js
│   │   ├── business.routes.test.js
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

## API Reference

### 1. Authentication Endpoints (`/api/auth`)

#### `POST /api/auth/register`
Creates a new user account and returns a signed JWT along with the sanitized profile.
```json
// Request
{
  "name": "Jane Founder",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "role": "business"
}
```

#### `POST /api/auth/login`
Authenticates credentials and returns a fresh token.
```json
// Request
{
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

#### `GET /api/auth/me`
Header: `Authorization: Bearer <token>`
Returns the authenticated user's details without password hashes.

---

### 2. Business Profile Endpoints (`/api/businesses`)

#### `GET /api/businesses/me`
Requires `role: "business"`.
Retrieves the authenticated founder's business profile.
- **HTTP 200**: Profile exists; returns complete profile including `privatePitchLink` and `contactEmail`.
- **HTTP 404**: Profile has not yet been created for this founder.
- **HTTP 403**: Caller does not have the `business` role.

#### `PUT /api/businesses/me`
Requires `role: "business"`.
Upsert endpoint creating or updating the authenticated founder's single business profile.
```json
// Request Body Example
{
  "name": "EcoEnergy Labs",
  "tagline": "Next-gen solar storage technologies for modern grids",
  "description": "We develop high-density flow batteries for commercial and residential energy storage.",
  "industry": "CleanTech",
  "country": "Portugal",
  "city": "Lisbon",
  "stage": "Seed",
  "revenueRange": "€50k - €200k ARR",
  "fundingGoal": 500000,
  "purpose": "R&D expansion and CE certification testing",
  "privatePitchLink": "https://dataroom.example.com/ecoenergy",
  "contactEmail": "contact@ecoenergy.pt"
}
```
- **HTTP 201 Created**: Profile was created (`isPublished` defaults to `false`).
- **HTTP 200 OK**: Profile was updated (`isPublished` value is strictly preserved).
- **HTTP 400 Bad Request**: Validation failure.

#### `PATCH /api/businesses/me/publish`
Requires `role: "business"`.
Toggles publication visibility for the founder's profile.
```json
// Request Body Example
{
  "isPublished": true
}
```

---

### 3. Marketplace Discovery Endpoints (`/api/businesses`)

#### `GET /api/businesses`
Marketplace listing for verified investors (`role: "investor"`). Only returns published ventures (`isPublished: true`). Private fields (`privatePitchLink`, `contactEmail`) are **never** returned.

**Supported Query Parameters:**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `q` | `string` | - | Case-insensitive search text across `name`, `tagline`, and `description` (regex special chars safely escaped). |
| `industry`| `string` | - | Exact industry filter (e.g. `CleanTech`, `FinTech`). |
| `stage` | `string` | - | Exact funding stage filter (e.g. `Seed`, `Series A`). |
| `country` | `string` | - | Country filter (e.g. `Portugal`, `India`). |
| `minFunding`| `number` | - | Minimum funding goal amount (`>= minFunding`). Must be `<= maxFunding`. |
| `maxFunding`| `number` | - | Maximum funding goal amount (`<= maxFunding`). |
| `page` | `number` | `1` | Page number (min 1). |
| `limit` | `number` | `12` | Items per page (min 1, max 50). |
| `sortBy` | `string` | `createdAt` | Sort field: `createdAt`, `fundingGoal`, or `name`. |
| `order` | `string` | `desc` | Sort direction: `asc` or `desc`. |

**Example Request:**
```http
GET /api/businesses?industry=CleanTech&country=Portugal&minFunding=100000&maxFunding=1000000&page=1&limit=12&sortBy=fundingGoal&order=asc
Authorization: Bearer <investor_token>
```

**Response Example (HTTP 200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "65f01234567890abcdef0001",
      "name": "EcoEnergy Labs",
      "tagline": "Solar and flow-battery storage solutions",
      "description": "Next generation commercial clean energy storage systems for urban power grids.",
      "industry": "CleanTech",
      "country": "Portugal",
      "city": "Lisbon",
      "stage": "Seed",
      "revenueRange": "€50k - €200k ARR",
      "fundingGoal": 500000,
      "purpose": "R&D expansion and CE certification testing",
      "createdAt": "2026-01-10T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 1,
    "totalPages": 1
  }
}
```

#### `GET /api/businesses/:id`
Authenticated detail endpoint for a single business profile.

**Privacy & Access Rules:**
1. **Unpublished Businesses**: Return HTTP 404 to all non-owners (including investors). Only the verified profile owner can view their own unpublished profile.
2. **Private Fields (`privatePitchLink`, `contactEmail`)**:
   - **Exposed to**: The profile owner, OR an investor whose `Interest` document for this business has `status: "accepted"`.
   - **Hidden from**: Investors without an interest, or with interests in `pending` or `declined` states.

---

## Authorization & Security Rules

- **Identity Derivation**: Profile ownership is always derived from the verified token's `sub` claim (`req.user._id`).
- **HTTP 401 vs. HTTP 403**:
  - `HTTP 401 Unauthorized`: Missing, expired, or invalid Bearer token.
  - `HTTP 403 Forbidden`: Authenticated user lacks the required role (e.g. founder accessing investor-only `/api/businesses` list).
- **Injection Defense**: Regex query parameters are strictly escaped using `escapeRegex()`, protecting MongoDB queries from ReDoS or injection patterns.

---

## Environment Variables & Configuration

> [!IMPORTANT]
> **Security Reminder**: Never commit real database connection strings, passwords, or JWT secrets to Git. The `.gitignore` file is configured to exclude all `.env` files while tracking `.env.example` templates.

### Configuring Backend in `server/.env`
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/meulink?retryWrites=true&w=majority
JWT_SECRET=your_secure_256_bit_secret_key_here
JWT_EXPIRES_IN=1d
```

### Configuring Frontend in `client/.env`
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

All unit and integration tests execute completely offline without mutating remote Atlas databases:

- **Run all backend tests:**
  ```bash
  npm test
  ```
  Included test suites:
  - `tests/business.discovery.test.js`: 17 Supertest tests verifying marketplace listing, search regex safety, multi-field filtering, funding goal range validation, pagination metadata, sorting, detail view access, and role-based private field exposure.
  - `tests/business.routes.test.js`: 14 Supertest tests verifying 401/403 authorization, 201 creation, 200 update upsert, isolation between owners, field injection prevention, validation, and publication toggling.
  - `tests/auth.routes.test.js`: Supertest integration tests for `register`, `login`, `me`, password hashing, duplicate detection, and sanitization.
  - `tests/auth.middleware.test.js`: Unit tests for `authenticate` and `authorize` middleware covering 401/403 scenarios.
  - `tests/jwt.test.js`: Cryptographic signing, expiration, and verification.
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
4. **Stage 4 (Completed)**: Business Profile Management (Owner profile CRUD, safe upsert, and publish controls)
5. **Stage 5 (Completed)**: Business Discovery, Search, Filters & Pagination (Marketplace listing, safe search, filters, private field gating)
6. **Stage 6**: Saved Businesses API (Investor bookmarking functionality)
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
| *Stage 4 Business Profile Management* | *Antigravity* | *Implemented GET/PUT/PATCH owner profile routes, Zod validation, safe upsert logic preserving isPublished, owner ID lock to req.user._id, and investor 403 access control* | *Executed 53 Jest tests across 6 suites (100% passing) and verified Vite production build* |
| *Stage 5 Business Discovery & Search* | *Antigravity* | *Implemented GET /api/businesses with Zod query validation, safe regex escaping, multi-field filters, pagination metadata, and GET /api/businesses/:id with private field gating (owner vs accepted investor)* | *Executed 76 Jest tests across 7 suites (100% passing) and verified Vite production build* |
