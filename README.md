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
- **Database (Upcoming)**: MongoDB Atlas with Mongoose
- **Security & Utilities**: Helmet, CORS, Morgan, Dotenv, Zod, Bcrypt, JSON Web Tokens
- **Testing**: Jest, Supertest

---

## Current Stage 1 Features

- Clean monorepo structure with separated `client/` and `server/` environments
- Modular Express API with centralized error handling, 404 handler, Helmet, CORS, and Morgan logging
- Decoupled `app.js` and `server.js` architecture for clean testing without port conflicts
- Health check endpoint at `GET /api/health` returning operational status and ISO timestamp
- Automated Jest and Supertest test suite for backend health endpoint verification
- Modern, responsive React starter interface with live backend health verification badge and manual re-check
- Standardized environment templates (`server/.env.example`, `client/.env.example`)
- Unified root scripts for local development and build orchestration

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
│   │   ├── controllers/
│   │   │   └── health.controller.js
│   │   ├── middleware/
│   │   │   └── error.middleware.js
│   │   ├── models/
│   │   ├── routes/
│   │   │   └── health.routes.js
│   │   ├── seed/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   └── health.test.js
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**

---

## Local Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd MeuLink
   ```

2. **Install all dependencies:**
   You can install all dependencies from the root directory:
   ```bash
   npm run install:all
   ```
   *Or install individually:*
   ```bash
   # Root orchestrator
   npm install

   # Backend dependencies
   cd server && npm install && cd ..

   # Frontend dependencies
   cd client && npm install && cd ..
   ```

3. **Configure Environment Variables:**

   **Backend (`server/.env`):**
   ```bash
   cp server/.env.example server/.env
   ```
   Default values inside `server/.env.example`:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/meulink?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key_change_in_production
   JWT_EXPIRES_IN=7d
   ```

   **Frontend (`client/.env`):**
   ```bash
   cp client/.env.example client/.env
   ```
   Default values inside `client/.env.example`:
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

- **Run backend health check tests:**
  ```bash
  npm test
  ```
- **Build frontend for production:**
  ```bash
  npm run build
  ```

---

## Ten-Stage Roadmap

1. **Stage 1 (Completed)**: Project Scaffold, Monorepo Setup, Health Endpoint & Live UI Status Indicator
2. **Stage 2**: Database Connection (MongoDB Atlas & Mongoose initialization)
3. **Stage 3**: Data Models & Validation (User, Business, Interest schemas & Zod validators)
4. **Stage 4**: Authentication & Authorization (JWT auth, role-based access for business and investor)
5. **Stage 5**: Business Profile API (CRUD endpoints for business venture listings)
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
| *e.g. Scaffold Stage 1 Health Check* | *Antigravity* | *Verified CommonJS exports, decoupled app.js/server.js, and error middleware* | *Ran Jest test suite and checked GET /api/health* |
| *Task 2* | | | |
| *Task 3* | | | |
| *Task 4* | | | |
| *Task 5* | | | |
