# Inventory Demand System

Simple full-stack inventory management app built with:

- Backend: Node.js, Express, PostgreSQL, Prisma
- Frontend: React, Vite, Tailwind CSS, Axios, React Router

## Project Structure<div align="center">

# 📦 Inventory Demand System

**A full-stack inventory, sales & demand-forecasting platform — with a built-in storefront.**

Track stock in real time, catch low-stock issues before they become stockouts, predict demand from recent sales trends, and run a complete e-commerce experience (cart, checkout, coupons, rewards) on top of it — all from one codebase.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [API Overview](#-api-overview) • [Roadmap](#-roadmap)

</div>

---

## ✨ Features

### 🏬 Storefront (Customer)
- Browse products & categories, view product details and images
- Cart, wishlist, and multi-address checkout
- Apply coupons (percentage / fixed, usage limits, first-order-only, min cart value)
- Earn & redeem reward points on orders
- Track order history and order status in real time

### 🛠️ Admin & Staff Console
- Role-based access control — `ADMIN`, `STAFF`, `CUSTOMER`
- Product, category, and inventory management (with image uploads)
- Sales logging that automatically adjusts stock (and reverses cleanly on deletion)
- **Smart stock alerts** — auto-created, auto-resolved, and de-duplicated for:
  - 🔴 Out of Stock
  - 🟠 Critical
  - 🟡 Low Stock
- **Demand prediction** — a 3-entry moving average over the most recent sales, used to flag products at risk of running out before restock
- Order management with status/payment tracking
- Coupon and rewards administration
- Full audit log of admin/staff actions
- User management

### 🔐 Security
- JWT authentication with HTTP-only cookie support
- Bcrypt-hashed passwords
- Rate-limited login, register, and password-reset endpoints
- Password reset tokens generated with `crypto.randomBytes`, SHA-256 hashed, **expire in 15 minutes**
- Helmet, CORS allow-listing, and Express input validation (Zod / express-validator)

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router 6, Tailwind CSS, Axios, Lucide Icons |
| **Backend** | Node.js, Express 4, Prisma ORM |
| **Database** | PostgreSQL |
| **Auth** | JWT, bcryptjs, cookie-parser |
| **Other** | Helmet, express-rate-limit, Zod, Multer (uploads), Nodemailer (email) |

---

## 🗂️ Project Structure

```
inventoryDemand/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Data model (Users, Products, Orders, Coupons, Rewards, Alerts…)
│   │   └── seed.js
│   └── src/
│       ├── config/             # Env & Prisma client setup
│       ├── controllers/        # Request handlers
│       ├── middlewares/        # Auth, roles, validation, audit, error handling
│       ├── routes/             # Express route definitions
│       ├── services/           # Business logic (products, orders, alerts, rewards…)
│       ├── utils/              # Helpers (JWT, pagination, stock classification, CSV/PDF…)
│       └── app.js / server.js
│
└── frontend/
    └── src/
        ├── components/         # Shared UI (tables, modals, layouts, route guards)
        ├── context/             # Auth & toast context providers
        ├── hooks/ & lib/         # API client, loading state
        ├── pages/               # Route-level screens (customer + /admin)
        └── App.jsx              # Route tree (public, customer, admin)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm

### 1. Backend Setup

```bash
cd backend
cp .env.example .env      # then fill in DATABASE_URL, JWT_SECRET, SMTP credentials
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The API runs at **`http://localhost:5000`**.

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app runs at **`http://localhost:5173`**.

### 3. First Login

- Visit `/` for the public landing page
- Register an account, or log in
- You'll land on `/dashboard` (customer) or `/admin/dashboard` (admin/staff)
- Use **Forgot Password** / **Reset Password** to recover access if needed

---

## 📡 API Overview

All endpoints are prefixed with `/api/v1`.

| Area | Base path | Notes |
|---|---|---|
| Auth | `/auth` | login, register, forgot/reset password |
| Public catalog | `/public/products`, `/public/categories` | No auth required |
| Products / Categories | `/products`, `/categories` | Admin-managed |
| Inventory | `/inventory` | Stock levels, reorder thresholds |
| Sales | `/sales` | Logs sales, auto-adjusts stock |
| Alerts | `/alerts` | Stock & demand alerts |
| Cart / Wishlist | `/cart`, `/wishlist` | Customer shopping |
| Orders | `/orders`, `/customer/orders`, `/admin/orders` | Order lifecycle |
| Coupons | `/coupons` | Create, validate, apply |
| Rewards | `/rewards`, `/admin/rewards` | Points wallet |
| Users | `/users`, `/user/addresses` | Profile & address book |
| Audit | `/admin/audit` | Action history |

Health check: `GET /api/v1/health`

---

## 🧠 How Demand Prediction Works

For each product, the system looks at the **most recent sales entries** and computes a rolling **3-entry moving average** of quantities sold. If a product's predicted demand outpaces its current stock, it's surfaced as a risk on the dashboard — giving staff a heads-up to reorder *before* an alert-worthy stockout happens, not after.

## 🔔 How Alerts Work

- Alerts are generated from a single source of truth: current stock vs. `reorderLevel`
- Only **one active alert per product/type** is ever kept — new triggers update it instead of duplicating it
- Alerts **auto-resolve** the moment stock recovers past the relevant threshold
- Staff can also manually **ignore** an alert to silence it

---

## 📝 Notes

- Sales reduce inventory automatically; deleting a sale restores the sold quantity
- Alerts trigger when inventory falls below the product's reorder level (default `10`)
- Coupons support percentage/fixed discounts, usage caps, per-user limits, min cart value, and first-order-only rules
- Reward points are earned on orders/signup/referral and redeemable at checkout

---

## 🗺️ Roadmap

- [ ] Demand-spike detection (comparing recent sales velocity against historical baseline)
- [ ] Configurable moving-average window per product/category
- [ ] Exportable demand & inventory reports (CSV/PDF)
- [ ] Email/SMS notifications for critical alerts

---

## 📄 License

This project currently has no license specified — all rights reserved by the author unless stated otherwise.

<div align="center">

Made with ☕ and a lot of `console.log`s.

</div>

```text
backend/
frontend/
```

## Backend Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Update `DATABASE_URL`, `JWT_SECRET`, and SMTP credentials
3. Install dependencies:

```bash
cd backend
npm install
```

4. Generate Prisma client and run the migration:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Start the API:

```bash
npm run dev
```

Backend runs at `http://localhost:5000`.

## Frontend Setup

1. Copy `frontend/.env.example` to `frontend/.env`
2. Install dependencies:

```bash
cd frontend
npm install
```

3. Start the app:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Main Flow

- `/` is the public landing page
- Register or log in
- After login you land on `/dashboard`
- Manage products, inventory, sales, and alerts
- Use forgot password and reset password to recover access

## Notes

- Password reset tokens are generated with `crypto.randomBytes`, hashed with SHA-256, and expire after 15 minutes
- Sales reduce inventory automatically
- Deleting a sale restores the sold quantity
- Alerts are triggered when inventory is below `10`
- Demand prediction uses a 3-entry moving average from recent sales
..........................
