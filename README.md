# MeuLink — Early-Stage Venture & Investor Marketplace

A MERN-stack marketplace where **founders** publish company profiles and **investors** discover, save, and express investment interest in them.

---

## 1. Project Description

MeuLink connects early-stage founders seeking capital with investors through a secure, role-based platform.

- **Business (Founder):** creates a venture profile (pitch link, funding target, stage, revenue, location), publishes or unpublishes it, and accepts or declines inbound investor interest.
- **Investor:** searches and filters published ventures, keeps a private watchlist, sends interest requests with an intro note, and tracks their status.

---

## 2. Key Features

- **Role-based auth:** `business` / `investor` registration and login, Bcrypt-hashed passwords, JWT with role claims, `authenticate` and `authorize` middleware.
- **Founder tools:** profile upsert (`/me`), draft-until-published control, private contact email and pitch link hidden from the public.
- **Investor discovery:** server-side text search (regex-escaped), filters (industry, stage, country, funding range), pagination.
- **Watchlist:** idempotent save and remove using atomic `$addToSet` / `$pull`.
- **Interest pipeline:** one request per investor/business pair (compound unique index), founder accept/decline with a **terminal lock** (atomic `findOneAndUpdate`, HTTP 409 on conflict). Acceptance unlocks private contact details for that investor only.
- **Dashboard analytics:** role-specific stats via MongoDB aggregation (`$match` → `$group`).
- **UI:** monochrome design system in vanilla CSS, responsive, with loading, empty, and error states.

---

## 3. Technologies Used

| Layer | Stack |
| :--- | :--- |
| Frontend | React 18, Vite, React Router v6, Axios, Vanilla CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose v8 |
| Validation & Security | Zod, Bcrypt, JWT, Helmet, CORS, Morgan |
| Testing | Jest, Supertest (143 offline tests, 11 suites) |
| AI Assistant | **Code0** |

---

## 4. Setup and Installation

**Prerequisites:** Node.js ≥ 18, npm ≥ 9, MongoDB Atlas cluster or local MongoDB.

```bash
git clone https://github.com/devalholepict-bit/Mini-Marketplace.git
cd Mini-Marketplace
npm install
npm --prefix server install
npm --prefix client install
```

**Environment variables** (copy from the `.env.example` files; real secrets are never committed):

`server/.env`
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority
JWT_SECRET=<long_random_secret>
JWT_EXPIRES_IN=1d
SEED_DEMO_PASSWORD=<demo_password>
```

`client/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 5. How to Run the Application

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Run frontend and backend together (API on `:5000`, client on `:5173`) |
| `npm run dev:server` | Backend only |
| `npm run dev:client` | Frontend only |
| `npm run seed` | Load demo founders, businesses, and investors (idempotent; blocked in production) |
| `npm test` | Run all 143 tests offline (11 suites, all passing) |
| `npm run build` | Production client build |

<details>
<summary><b>API overview</b></summary>

| Area | Endpoints |
| :--- | :--- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Businesses | `GET/PUT /api/businesses/me`, `PATCH /api/businesses/me/publish`, `GET /api/businesses`, `GET /api/businesses/:id` |
| Watchlist | `POST/DELETE /api/investor/saved/:businessId`, `GET /api/investor/saved` |
| Interests | `POST /api/interests`, `GET /api/interests/sent`, `GET /api/interests/received`, `PATCH /api/interests/:id/status` |
| Dashboard | `GET /api/dashboard/stats` |
| Health | `GET /api/health` |

</details>

---

## 6. Confirmation of Code0 Usage

**Code0 was used as the primary AI coding assistant** across design, implementation, debugging, refactoring, and testing of MeuLink. The project was committed and pushed to GitHub from the Code0 terminal (`git init`, commits, `git push`).

---

## 7. AI Development Experience with Code0

- **Architectural continuity:** Code0 kept Mongoose schemas, Zod validators, Express controllers, and React context consistent across the whole codebase, which helped avoid regressions.
- **Security-first suggestions:** pre-save Bcrypt guard against double hashing, minimal JWT claims, regex escaping against ReDoS, NoSQL operator-injection prevention, and `sessionStorage` token handling.
- **Fast, thorough testing:** Code0 generated 143 Jest and Supertest tests covering happy paths, edge cases, race conditions, and role guardrails.
- **UI refinement:** it helped build a clean, responsive monochrome interface in plain CSS with no heavy dependencies.

---

## 8. Specific Tasks Where Code0 Was Used

| # | Area | Task | Files |
| :-: | :--- | :--- | :--- |
| 1 | **Database integration** | Designed Mongoose schemas, the unique `{ investor, business }` index on `Interest`, and `select: false` on `User.password` | [`Business.js`](server/src/models/Business.js), [`Interest.js`](server/src/models/Interest.js), [`User.js`](server/src/models/User.js) |
| 2 | **API creation** | Built Zod validators (strip unknown fields) and `authorize(...roles)` middleware, correctly separating 401 from 403 | [`auth.validator.js`](server/src/validators/auth.validator.js), [`business.validator.js`](server/src/validators/business.validator.js), [`authorize.middleware.js`](server/src/middleware/authorize.middleware.js) |
| 3 | **Debugging / concurrency** | Implemented the atomic accept/decline state machine (`findOneAndUpdate` scoped to `status: 'pending'`) so concurrent updates return 409 | [`interest.controller.js`](server/src/controllers/interest.controller.js) |
| 4 | **Component development & refactoring** | Built `AuthContext` and `ProtectedRoute` (role whitelist, return-path); refactored token storage from `localStorage` to `sessionStorage` | [`AuthContext.jsx`](client/src/contexts/AuthContext.jsx), [`ProtectedRoute.jsx`](client/src/components/ProtectedRoute.jsx) |
| 5 | **Testing** | Authored 11 suites / 143 offline tests with mocked Mongoose | [`interest.routes.test.js`](server/tests/interest.routes.test.js), [`dashboard.routes.test.js`](server/tests/dashboard.routes.test.js), [`business.discovery.test.js`](server/tests/business.discovery.test.js) |
