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
│   │   │   └── health.controller.js
│   │   ├── middleware/
│   │   │   └── error.middleware.js
│   │   ├── models/
│   │   │   ├── Business.js
│   │   │   ├── Interest.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   └── health.routes.js
│   │   ├── seed/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── health.test.js
│   │   └── models.test.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

---

## Database Architecture & Models

### 1. User Model (`server/src/models/User.js`)
- **Fields**: `name`, `email`, `password`, `role`, `savedBusinesses`, timestamps (`createdAt`, `updatedAt`).
- **Indexes**: Unique index on `email` prevents multiple accounts per email.
- **Security**: `password` is defined with `select: false` so hashes are omitted from default database queries.
- **References**: `savedBusinesses` holds an array of `Business` ObjectIds bookmarked by investors.
- *Note on Auth*: Password hashing via bcrypt will be applied in Stage 3 during user registration/login.

### 2. Business Model (`server/src/models/Business.js`)
- **Fields**: `owner`, `name`, `tagline`, `description`, `industry`, `country`, `city`, `stage`, `revenueRange`, `fundingGoal`, `purpose`, `isPublished`, `privatePitchLink`, `contactEmail`, timestamps.
- **Indexes**: Unique index on `owner` enforces a strict 1-to-1 relationship—each founder can register at most one active business profile.
- **Validation**: `fundingGoal` enforces a minimum value >= 1. Flexible string definitions for `industry` and `stage` allow API validation rules (Zod) to manage supported values cleanly.
- **Private Fields**: `privatePitchLink` is persisted in the model and will be gated by backend authorization middleware in later stages.

### 3. Interest Model (`server/src/models/Interest.js`)
- **Fields**: `investor` (User ref), `business` (Business ref), `message`, `status` (`pending`, `accepted`, `declined`), timestamps.
- **Compound Unique Index**: `{ investor: 1, business: 1 }` with `{ unique: true }`.
  - **Constraint Behavior**: Mongoose's `unique` declaration configures a MongoDB engine-level index. In a live MongoDB Atlas instance, attempting to insert a duplicate expression of interest from the same investor to the same business triggers an `E11000` duplicate key error, which will be mapped to HTTP 409 Conflict in Stage 6.
- **Query Indexes**:
  - `{ investor: 1 }`: Optimized index for investors viewing their sent interest pipeline.
  - `{ business: 1, status: 1 }`: Compound index for business founders filtering incoming pitches by status.

---

## Environment Variables & Configuration

> [!IMPORTANT]
> **Security Reminder**: Never commit real database connection strings, passwords, or JWT secrets to Git. The `.gitignore` file is configured to exclude all `.env` files while tracking `.env.example` templates.

### Configuring MongoDB Atlas in `server/.env`

1. Create a `server/.env` file in the `server/` directory (you can copy the example template):
   ```bash
   cp server/.env.example server/.env
   ```
2. Open `server/.env` and replace `MONGODB_URI` with your MongoDB Atlas connection string:
   ```env
   # Server Port
   PORT=5000

   # Client Application URL for CORS
   CLIENT_URL=http://localhost:5173

   # MongoDB Atlas Connection URI
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/meulink?retryWrites=true&w=majority

   # JWT Configuration (for Stage 3)
   JWT_SECRET=your_jwt_secret_key_change_in_production
   JWT_EXPIRES_IN=7d
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
  *(Requires valid `MONGODB_URI` in `server/.env` to start the backend server listener)*
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

All unit and schema tests run completely offline and do **not** require a running MongoDB instance, network access, or Atlas credentials:

- **Run all backend tests:**
  ```bash
  npm test
  ```
  Included test suites:
  - `tests/health.test.js`: Verifies `GET /api/health` status 200, ISO timestamp, 404 handler, and reported database readyState (`disconnected` in test mode).
  - `tests/models.test.js`: Verifies `User`, `Business`, and `Interest` schema requirements, compound indexes, reference paths, and `connectDB` missing-URI error handling.
- **Build frontend for production:**
  ```bash
  npm run build
  ```

---

## Ten-Stage Roadmap

1. **Stage 1 (Completed)**: Project Scaffold, Monorepo Setup, Health Endpoint & Live UI Status Indicator
2. **Stage 2 (Completed)**: Database Connection (MongoDB Atlas & Mongoose Models for User, Business, Interest)
3. **Stage 3**: Data Validation & Authentication Layer (JWT, bcrypt password hashing, Zod schemas)
4. **Stage 4**: Role-Based Authorization & User Profile Management (business vs investor flows)
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
| *Task 3* | | | |
| *Task 4* | | | |
| *Task 5* | | | |
