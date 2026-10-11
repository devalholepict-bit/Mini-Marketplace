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

### Stage 6: Saved Businesses and Interest Management
- **Saved Businesses API (`/api/investor/saved`)**:
  - `POST /api/investor/saved/:businessId`: Atomic addition to `User.savedBusinesses` via `$addToSet`, preventing duplicates. Restricted to published ventures and investor role.
  - `GET /api/investor/saved`: Returns public-safe business representations for the authenticated investor only; strictly omits `privatePitchLink` and `contactEmail`, safely excludes unpublished or deleted businesses.
  - `DELETE /api/investor/saved/:businessId`: Idempotent atomic removal via `$pull`, ensuring investors can never modify others' bookmarks.
- **Interest Submission & Unique Constraint (`POST /api/interests`)**:
  - Investor submission with Zod validation (non-empty trimmed message up to 1000 characters).
  - Enforces database-level compound unique index on `{ investor: 1, business: 1 }`, translating duplicate attempts (and MongoDB `E11000` errors) into HTTP 409 Conflict.
- **Sent & Received Interest History**:
  - `GET /api/interests/sent`: Returns authenticated investor's sent history with safe public business details (sorted newest first).
  - `GET /api/interests/received`: Returns incoming interests received by the authenticated founder's business profile with sanitized investor sender information (passwords and secrets never exposed).
- **Atomic Status Transitions & Terminal Lock (`PATCH /api/interests/:id/status`)**:
  - Conditional atomic update `findOneAndUpdate` matching `business: ownerBusiness._id` and `status: 'pending'`, strictly transitioning from `pending` to `accepted` or `declined`.
  - Immutable terminal state: HTTP 409 Conflict if attempting to modify an interest that has already been resolved (`accepted` or `declined`). Resets to `pending` are rejected with HTTP 400.
  - Race condition protection: Atomic conditional query prevents concurrent conflicting updates.
- **Privacy Gating Integration**: Accepted interest status automatically unlocks access to `privatePitchLink` and `contactEmail` on the business detail endpoint `GET /api/businesses/:id`.

### Stage 7: Role-Based Dashboard Statistics & Idempotent Seed Script
- **Role-Based Dashboard API (`GET /api/dashboard/stats`)**:
  - Authenticated endpoint deriving dashboard context strictly from verified token identity (`req.user.role` and `req.user._id`), rejecting client-supplied IDs.
  - **Business Dashboard**: Returns `profileExists`, `isPublished`, and received interest counts broken down into `total`, `pending`, `accepted`, and `declined`. Returns zeroed metrics when profile is absent.
  - **Investor Dashboard**: Calculates count of `availableBusinesses` (published marketplace ventures), `savedBusinesses` (investor's active, published bookmarks), and sent interest breakdown.
  - **Mongoose Aggregation Pipeline**: Employs `$match` ➔ `$group` by `$status` (`{ $sum: 1 }`) for fast database-level calculation instead of loading documents into Node.js loops. Missing statuses normalize safely to 0.
- **Idempotent Demo Data Seed Script (`npm run seed`)**:
  - Standalone script located at `server/src/seed/seed.js` executed via `npm run seed`.
  - Environment safeguards: reads `SEED_DEMO_PASSWORD` from environment, strictly blocks execution when `NODE_ENV === 'production'`, and never logs credentials.
  - Non-destructive & idempotent: checks record existence prior to creation; never runs `deleteMany()` or collection drops; preserves existing demo users, business profiles, and interest statuses without duplicate collisions.

### Stage 8: React Authentication, Protected Routes and Dashboard Foundation
- **AuthContext & Token Management**: Persistent authentication state in React context, persisting JWT token in `localStorage`, automatic session restoration on app boot via `GET /api/auth/me`.
- **Form Workflows**: Dedicated Login (`/login`) and Register (`/register`) pages with role toggle (`business` vs `investor`), client-side validation, and centralized API errors.
- **Route Guardrails**: Reusable `ProtectedRoute` with role whitelist and fallback to intended routes, plus `GuestRoute` redirecting authenticated users away from auth forms.
- **Shared Application Shell**: `AppLayout` with role-aware header navigation, dynamic badge displays, and responsive container layout.

### Stage 9: Complete Functional Frontend (Investor & Business Workflows)
- **Monochrome & Silver Design System**:
  - Refined fintech aesthetic featuring Near-black (`#0A0A0A`), Pure black (`#000000`), White (`#FFFFFF`), Off-white (`#F5F5F3`), and Silver accents (`#C0C0C0`).
  - Typography: Elegant serif headings (`Georgia, "Times New Roman", serif`) combined with system sans-serif body typography.
  - Subtle metallic styling for MeuLink wordmark, dividers, and status indicators without rainbow badges or loud gradients.
- **Investor Marketplace Discovery (`/marketplace`)**:
  - Live querying via `GET /api/businesses` with server-side full-text search (`q`), industry, stage, country, and funding range filters (`minFunding`, `maxFunding`).
  - Sort selectors (`createdAt`, `fundingGoal`, `name`) with ascending/descending order.
  - Synchronized pagination controls (`page`, `limit`, `total`, `totalPages`) resetting safely on filter changes.
  - Marketplace cards displaying public-safe metrics (industry, stage, revenue range, target funding) while strictly concealing private pitch links and contact emails.
  - Bookmark controls with server synchronization via `POST /api/investor/saved/:businessId` and `DELETE /api/investor/saved/:businessId`.
- **Business Detail View (`/businesses/:id`)**:
  - Retrieves comprehensive venture profile via `GET /api/businesses/:id`.
  - Privacy gating: Displays `contactEmail` and `privatePitchLink` exclusively when returned in an authorized response by the backend (for the owner or an approved investor).
  - Bookmark save/unsave action for investors.
  - Expression of Interest submission form: sends `{ businessId, message }` (1-1000 characters) via `POST /api/interests`, handling HTTP 409 duplicate conflicts gracefully.
  - Founder awareness: Identifies owning founder and offers direct transition to the profile editor.
- **Investor Saved Businesses (`/saved`)**:
  - Dedicated watchlist interface powered by `GET /api/investor/saved`.
  - Instant removal action with optimistic/synchronized UI update via `DELETE /api/investor/saved/:businessId`.
  - Empty state with direct shortcut to the marketplace.
- **Investor Sent Interests History (`/interests/sent`)**:
  - Displays outgoing notes and submission dates via `GET /api/interests/sent`.
  - Understated monochrome `StatusLabel` pills (`pending`, `accepted`, `declined`).
  - Resilient rendering with safe fallback labels for deleted/unavailable business profiles.
  - Direct links to corresponding business detail pages.
- **Business Profile Management (`/business/profile`)**:
  - Founder console powered by `GET /api/businesses/me` and `PUT /api/businesses/me`.
  - Auto-initializes on HTTP 404 with clean profile creation form.
  - Comprehensive field coverage: name, tagline, description, industry, stage, country, city, fundingGoal, revenueRange, purpose, privatePitchLink, contactEmail.
  - Safe submission: excludes database operators, `owner`, and `isPublished` from standard profile update payloads.
  - Dedicated publication controller: toggles visibility in the marketplace via `PATCH /api/businesses/me/publish` with validation feedback for incomplete profiles.
- **Business Incoming Interests Management (`/interests/received`)**:
  - Displays investor outreach inquiries via `GET /api/interests/received` with sanitized investor identifying details.
  - Action controls: Accept / Decline buttons for `pending` inquiries via `PATCH /api/interests/:id/status`.
  - Terminal locks: disables repeated interactions, shows static decision labels for resolved records, and handles HTTP 409 conflict.
- **Connected Dashboard (`/dashboard`)**:
  - Live aggregated metrics from `GET /api/dashboard/stats`.
  - Direct workflow navigation shortcuts for both roles.

### Stage 10: Final QA, Security Audit, Bug Fixes and Submission
- **Security & Session Hardening**:
  - Migrated client JWT token storage from `localStorage` to `sessionStorage` in `AuthContext`, ensuring automatic token destruction upon browser/tab closure and isolating concurrent multi-role demo testing tabs.
  - Verified password protection: passwords hashed via bcrypt (cost factor 10), hidden by default via `select: false`, never returned in API payloads or printed in logs.
  - Generic authentication errors preventing user account enumeration (`Invalid email or password`).
  - Gated private business fields (`privatePitchLink`, `contactEmail`) strictly enforced by the backend on `GET /api/businesses/:id` for owners and approved investors only.
  - Zod validation and MongoDB operator injection prevention on all API endpoints.
- **Client Routing & UX Resilience**:
  - Hardened not-found/error route transitions in `BusinessDetailPage` with role-aware back-links (directing investors to `/marketplace` and founders to `/dashboard`).
  - Replaced native `<a>` anchor tags with React Router `<Link>` components in `BusinessProfilePage` to preserve SPA state without full page reloads.
- **Demo Seeding Audit**:
  - Verified `server/src/seed/seed.js` environment safeguards (`NODE_ENV === 'production'` termination, missing `SEED_DEMO_PASSWORD` exit code 1, non-destructive creation preserving existing user records).
- **Automated Verification**:
  - 143 unit and integration tests passing across 11 Jest suites with 100% offline isolation.
  - Clean Vite production build with zero errors.

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

### 4. Saved Businesses Endpoints (`/api/investor/saved`)

All saved-business endpoints require authentication and the `investor` role (`Authorization: Bearer <investor_token>`).

#### `POST /api/investor/saved/:businessId`
Saves a published business profile to the authenticated investor's bookmark list (`User.savedBusinesses`).
- **URL Parameter**: `businessId` (24-character hex ObjectId).
- **Behavior**: Uses atomic `$addToSet` to guarantee idempotency; repeating a save will not create duplicate entries.
- **Access Control & Visibility**: Target business must exist and have `isPublished: true`.
- **Status Responses**:
  - `HTTP 200 OK`: Business successfully saved (or already saved).
  - `HTTP 400 Bad Request`: Malformed `businessId` parameter.
  - `HTTP 401 Unauthorized`: Missing or invalid JWT.
  - `HTTP 403 Forbidden`: Authenticated user is not an investor.
  - `HTTP 404 Not Found`: Target business does not exist or is unpublished.

**Response Example (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Business saved successfully",
  "savedBusinesses": [
    "65f01234567890abcdef0001"
  ]
}
```

#### `GET /api/investor/saved`
Retrieves the authenticated investor's saved businesses.
- **Behavior**: Retrieves saved businesses strictly for `req.user._id`.
- **Privacy**: Returns public-safe business fields only. `privatePitchLink` and `contactEmail` are **never** exposed in this collection.
- **Resilience**: Safely omits any referenced businesses that were unpublished or deleted without crashing.

**Response Example (HTTP 200 OK):**
```json
{
  "success": true,
  "count": 1,
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
  ]
}
```

#### `DELETE /api/investor/saved/:businessId`
Removes a business from the authenticated investor's saved bookmarks.
- **URL Parameter**: `businessId` (24-character hex ObjectId).
- **Behavior**: Uses atomic `$pull` scoped strictly to `req.user._id`. Repeating an unsave request is idempotent and does not produce an error if the business was already absent.
- **Status Responses**:
  - `HTTP 200 OK`: Business removed from saved list.
  - `HTTP 400 Bad Request`: Malformed `businessId` parameter.
  - `HTTP 401 Unauthorized`: Missing or invalid JWT.
  - `HTTP 403 Forbidden`: Authenticated user is not an investor.

---

### 5. Expressions of Interest Endpoints (`/api/interests`)

Manages the investor connection and introduction pipeline.

#### `POST /api/interests`
Allows an investor (`role: "investor"`) to submit an expression of investment interest to a published business.
- **Body**:
  ```json
  {
    "businessId": "65f01234567890abcdef0001",
    "message": "We lead seed rounds in CleanTech and would like to review your data room."
  }
  ```
- **Validation**:
  - `businessId`: Valid 24-hex ObjectId of an existing, published business (`isPublished: true`).
  - `message`: Non-empty trimmed string between 1 and 1000 characters.
  - Strict payload validation rejects client-injected `investor`, `status`, or internal fields.
- **Duplicate Prevention (HTTP 409 Conflict)**:
  - Backed by compound unique index `{ investor: 1, business: 1 }`.
  - Application-level pre-check and MongoDB `E11000` duplicate key handling prevent duplicate submissions and protect against concurrent race conditions.
- **Status Responses**:
  - `HTTP 201 Created`: Interest successfully created with initial status `pending`.
  - `HTTP 400 Bad Request`: Validation failure or unrecognized body fields.
  - `HTTP 401 Unauthorized`: Missing or invalid JWT.
  - `HTTP 403 Forbidden`: User does not have `investor` role.
  - `HTTP 404 Not Found`: Target business not found or not published.
  - `HTTP 409 Conflict`: Investor has already submitted interest for this business.

**Response Example (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "Interest submitted successfully",
  "data": {
    "id": "65f01234567890abcdef8001",
    "investor": "65f01234567890abcdef2001",
    "business": "65f01234567890abcdef0001",
    "message": "We lead seed rounds in CleanTech and would like to review your data room.",
    "status": "pending",
    "createdAt": "2026-10-11T13:45:00.000Z",
    "updatedAt": "2026-10-11T13:45:00.000Z"
  }
}
```

#### `GET /api/interests/sent`
Retrieves expressions of interest submitted by the authenticated investor (`role: "investor"`).
- **Behavior**: Scoped strictly to `req.user._id`, sorted newest first (`createdAt: -1`).
- **Privacy & Safety**: Populates public-safe business fields only. `privatePitchLink` and `contactEmail` are omitted. Missing/deleted businesses populate as `null` without crashing.

**Response Example (HTTP 200 OK):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "65f01234567890abcdef8001",
      "message": "We lead seed rounds in CleanTech and would like to review your data room.",
      "status": "pending",
      "createdAt": "2026-10-11T13:45:00.000Z",
      "updatedAt": "2026-10-11T13:45:00.000Z",
      "business": {
        "id": "65f01234567890abcdef0001",
        "name": "EcoEnergy Labs",
        "tagline": "Solar and flow-battery storage solutions",
        "industry": "CleanTech",
        "country": "Portugal",
        "city": "Lisbon",
        "stage": "Seed",
        "fundingGoal": 500000,
        "isPublished": true,
        "createdAt": "2026-01-10T10:00:00.000Z"
      }
    }
  ]
}
```

#### `GET /api/interests/received`
Retrieves expressions of interest received by the authenticated founder's business (`role: "business"`).
- **Behavior**: Scoped to the authenticated owner's `Business` profile. Sorted newest first.
- **Privacy & Sanitization**: Populates only safe investor identity fields (`id`, `name`, `email`). Investor passwords, hashes, and secrets are strictly excluded.
- **Resilience**: Returns an empty array (`data: []`) if the founder has not published a business or has received no interests.

**Response Example (HTTP 200 OK):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "65f01234567890abcdef8001",
      "message": "We lead seed rounds in CleanTech and would like to review your data room.",
      "status": "pending",
      "createdAt": "2026-10-11T13:45:00.000Z",
      "updatedAt": "2026-10-11T13:45:00.000Z",
      "investor": {
        "id": "65f01234567890abcdef2001",
        "name": "Alice Investor",
        "email": "alice@investor.com"
      }
    }
  ]
}
```

#### `PATCH /api/interests/:id/status`
Allows a business founder (`role: "business"`) to accept or decline a pending interest.
- **URL Parameter**: `id` (24-character hex ObjectId of the Interest).
- **Body**:
  ```json
  {
    "status": "accepted"
  }
  ```
- **Allowed Status Transitions**:
  - `pending` ➔ `accepted` (Valid)
  - `pending` ➔ `declined` (Valid)
  - Any attempt to transition `accepted` ➔ `declined` returns **HTTP 409 Conflict**.
  - Any attempt to transition `declined` ➔ `accepted` returns **HTTP 409 Conflict**.
  - Any attempt to reset a terminal status back to `pending` returns **HTTP 400 Bad Request**.
- **Atomic Concurrency Protection**:
  - Implemented using conditional MongoDB `findOneAndUpdate` filtering by `_id`, `business: ownerBusiness._id`, and `status: 'pending'`.
  - If two requests attempt concurrent transitions, exactly one succeeds atomically and the subsequent request receives **HTTP 409 Conflict**.
- **Privacy Integration**:
  - Transitioning an interest to `accepted` grants that investor access to the founder's `privatePitchLink` and `contactEmail` via `GET /api/businesses/:id`.
- **Status Responses**:
  - `HTTP 200 OK`: Interest status successfully updated.
  - `HTTP 400 Bad Request`: Invalid status value or malformed ID.
  - `HTTP 401 Unauthorized`: Missing or invalid JWT.
  - `HTTP 403 Forbidden`: User does not have `business` role.
  - `HTTP 404 Not Found`: Interest does not exist or does not belong to the founder's business profile.
  - `HTTP 409 Conflict`: Interest has already reached a terminal state (`accepted` or `declined`).

---

### 6. Dashboard Statistics Endpoints (`/api/dashboard`)

Provides aggregated performance, portfolio, and engagement metrics partitioned by user role.

#### `GET /api/dashboard/stats`
Retrieves role-tailored dashboard metrics for the authenticated user (`Authorization: Bearer <token>`).
- **Role Detection**: Determines the dashboard view exclusively from `req.user.role`. Never accepts user or business IDs from request bodies or query parameters.
- **Aggregation Strategy**: Uses a Mongoose aggregation pipeline (`$match` ➔ `$group` on `$status` with `{ $sum: 1 }`). Ensures missing status groups normalize to `0` rather than `undefined`.

**Business Role Response (Active Profile):**
```json
{
  "success": true,
  "role": "business",
  "stats": {
    "profileExists": true,
    "isPublished": true,
    "interestsReceived": {
      "total": 5,
      "pending": 2,
      "accepted": 2,
      "declined": 1
    }
  }
}
```

**Business Role Response (No Profile Yet):**
```json
{
  "success": true,
  "role": "business",
  "stats": {
    "profileExists": false,
    "isPublished": false,
    "interestsReceived": {
      "total": 0,
      "pending": 0,
      "accepted": 0,
      "declined": 0
    }
  }
}
```

**Investor Role Response:**
```json
{
  "success": true,
  "role": "investor",
  "stats": {
    "availableBusinesses": 12,
    "savedBusinesses": 4,
    "interestsSent": {
      "total": 6,
      "pending": 2,
      "accepted": 3,
      "declined": 1
    }
  }
}
```

- **Metric Definitions:**
  - `availableBusinesses`: Total published businesses (`isPublished: true`) discoverable across the marketplace.
  - `savedBusinesses`: Authenticated investor's saved ventures that are currently published and still exist.
  - `interestsSent` / `interestsReceived`: Status breakdown calculated via database-level `$group` aggregation.
- **Privacy & Sanitization**: Never leaks passwords, hashes, contact emails, private pitch links, or database internals.

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

# Stage 7: Dedicated password for running demo seed script
SEED_DEMO_PASSWORD=your_secure_demo_seed_password_here
```

### Configuring Frontend in `client/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running the Seed Script

A dedicated, safe demo data seed script is provided for local exploration and internship evaluations.

### Prerequisites & Configuration
1. Ensure `MONGODB_URI` is configured in `server/.env`.
2. Set a local `SEED_DEMO_PASSWORD` in `server/.env` (e.g. `SEED_DEMO_PASSWORD=DemoPassword123!`).
3. The script will refuse to run and safely terminate if `SEED_DEMO_PASSWORD` is missing or if `NODE_ENV === 'production'`.

### Running the Seed
From the root repository directory:
```bash
npm run seed
```
Or directly inside the server directory:
```bash
npm --prefix server run seed
```

### Demo Accounts Created
All demo accounts are initialized using the password you set in `SEED_DEMO_PASSWORD`:

| Role | Account Name | Demo Email | Notes |
| :--- | :--- | :--- | :--- |
| `investor` | Demo Investor (Atlas Syndicate) | `demo.investor@meulink.dev` | Has sent interests (1 accepted, 1 pending) and 1 saved venture. |
| `investor` | Demo Angel (Helena Silva) | `demo.angel@meulink.dev` | Has sent interest (1 declined) and 1 saved venture. |
| `business` | Demo Founder (Dr. Sofia Mendes) | `demo.founder1@meulink.dev` | Owns published venture *ApexQuantum Therapeutics* (BioTech). |
| `business` | Demo Founder (Marco Silva) | `demo.founder2@meulink.dev` | Owns published venture *VerdeGrid Energy Systems* (CleanTech). |

### Idempotency & Data Safety Guarantees
- **Non-Destructive**: Never calls `deleteMany()`, never drops collections, and never alters unrelated user accounts.
- **Idempotent**: Safe to run repeatedly. Existing users, business profiles, and expressions of interest are detected by unique keys and preserved as-is.
- **Credential Protection**: Uses standard Mongoose `User.create()` so passwords are automatically salted and hashed via bcrypt; passwords and secrets are never logged.

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
  Included test suites (143 tests across 11 suites):
  - `tests/dashboard.routes.test.js`: 12 Supertest tests verifying 401 unauthenticated guardrail, business stats isolation, investor stats isolation, aggregation pipeline accuracy, missing status zero-normalization, zeroed response when profile is missing, saved-business filtering for published/existing ventures only, and privacy protection.
  - `tests/seed.test.js`: 8 unit and integration tests verifying missing password fail-safe, production environment blocking, initial creation, and idempotent preservation on repeated runs without duplication.
  - `tests/interest.routes.test.js`: 30 Supertest tests verifying 401/403 authorization, valid interest creation (201), duplicate prevention via compound unique index (`E11000` & app check -> 409), input validation (400), sent/received isolation, password hash protection, owner acceptance/declining (200), terminal status locking (409), atomic conditional updates under concurrency, and private field unlocking integration.
  - `tests/saved.routes.test.js`: 17 Supertest tests verifying 401/403 authorization, atomic `$addToSet` bookmarking, idempotency, unpublished/nonexistent rejection (404), public-safe serialization, resilient missing reference handling, and atomic `$pull` unsaving.
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
6. **Stage 6 (Completed)**: Saved Businesses and Interest Management (Investor bookmarking, atomic interest pipeline, unique compound index constraint, terminal status lock)
7. **Stage 7 (Completed)**: Role-Based Dashboard Statistics and Seed Data (Mongoose `$match` ➔ `$group` aggregation pipeline, role-tailored stats, safe idempotent demo seed script)
8. **Stage 8 (Completed)**: React Authentication, Protected Routes and Dashboard Foundation (AuthContext, ProtectedRoute, role guardrails, and dashboard foundations)
9. **Stage 9 (Completed)**: Complete Functional Frontend (Monochrome & silver design system, investor marketplace & filters, business detail view & privacy gating, saved bookmarks, sent/received interest pipelines, and profile editor with publication control)
10. **Stage 10 (Completed)**: Final QA, Security Audit, Bug Fixes, Session Storage Hardening & Submission

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
| *Stage 6 Saved Businesses & Interest Management* | *Antigravity* | *Implemented /api/investor/saved (POST/GET/DELETE) with $addToSet/$pull and safe fields, /api/interests (create, sent, received, status PATCH) with E11000->409 handling, atomic conditional findOneAndUpdate status transitions, terminal locks, and private data unlocking* | *Executed 123 Jest tests across 9 suites (100% passing) and verified Vite production build* |
| *Stage 7 Role-Based Dashboard Statistics & Seed Script* | *Antigravity* | *Implemented GET /api/dashboard/stats with Mongoose $match/$group status aggregation, role-based metrics isolation (business vs investor), safe zero normalization, and idempotent non-destructive seed script (server/src/seed/seed.js, npm run seed) with environment validation and credential safety* | *Executed 143 Jest tests across 11 suites (100% passing), verified Vite production build, and confirmed seed script CLI fail-safe* |
| *Stage 8 React Authentication & Protected Routing* | *Antigravity* | *Implemented AuthContext with token in localStorage, session restoration via /api/auth/me, ProtectedRoute with role whitelisting, GuestRoute, LoginPage, RegisterPage, and AppLayout shell* | *Verified Vite production build (100 modules transformed) and executed all 143 backend test suites* |
| *Stage 9 Complete Functional Frontend* | *Antigravity* | *Implemented monochrome & silver design system (Georgia typography, subtle metallic accents), MarketplacePage with real query/filters/pagination, BusinessDetailPage with authorized private field gating, SavedBusinessesPage with remove sync, SentInterestsPage, BusinessProfilePage with publication toggle, ReceivedInterestsPage with Accept/Decline, and updated DashboardPage* | *Ran Vite production build (113 modules transformed in 1.1s) and executed 143 backend tests across 11 suites (100% passing)* |
| *Stage 10 Final QA, Security Audit & Submission* | *Antigravity* | *Migrated AuthContext to sessionStorage for safe session boundaries, fixed 404 role-aware back-links in BusinessDetailPage, replaced native anchors with React Router Link components, audited seed script safeguards, verified all 6 root scripts, and audited security & privacy rules* | *Executed all 143 Jest tests across 11 suites (100% passing), verified root npm run build (113 modules, 1.1s), tested seed fail-safe, and completed Git submission review* |

