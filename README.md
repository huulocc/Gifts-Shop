# Gifts-Shop

GiftShop is a two-actor academic ecommerce project for Customers and Managers.
The current stack is ReactJS on the frontend and Express + TypeScript + Prisma on the backend.

## Project Structure

- `frontend/` - Vite + React app and API service modules.
- `backend/` - Express + TypeScript API scaffold, Prisma schema, migrations, and seed data.
- `../Docs/` - project context, WBS, sequence diagrams, UI/UX docs, and course references.

## Backend

From `Gifts-Shop/backend`:

```bash
npm install
npm run dev
```

Useful backend commands:

```bash
npm run typecheck
npm run build
npm test
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

Environment variables are documented in `backend/.env.example`:

- `DATABASE_URL` - Neon/PostgreSQL connection string used by Prisma.
- `PORT` - Express API port, defaults to `8080`.
- `JWT_SECRET` - signing secret for the scaffolded HTTP-only session cookie.
- `SESSION_COOKIE_NAME` - defaults to `giftshop_session`.
- `CORS_ORIGIN` - comma-separated frontend origins allowed to send credentials.

The backend currently provides compile-ready route/controller/facade/service/repository scaffolding.
Most business methods intentionally return `501 NOT_IMPLEMENTED` until the team fills in the workflows.
