# Inventory Demand System

Simple full-stack inventory management app built with:

- Backend: Node.js, Express, PostgreSQL, Prisma
- Frontend: React, Vite, Tailwind CSS, Axios, React Router

## Project Structure

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
