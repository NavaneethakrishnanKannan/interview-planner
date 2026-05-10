# AI Interview Preparation Platform

Production-oriented monorepo for an AI-powered interview simulator focused on Senior/Staff/Principal engineers.

## Stack
- Frontend: Next.js App Router, TypeScript, Tailwind, Zustand, TanStack Query
- Backend: NestJS, Prisma, PostgreSQL, Redis, BullMQ
- AI: OpenAI-ready service layer + mock interview evaluator endpoint
- Auth: JWT access/refresh on API, NextAuth scaffold for Google OAuth in web

## Monorepo Structure
- `apps/web`: Next.js frontend
- `apps/api`: NestJS backend
- `apps/api/prisma`: database schema + seed
- `packages`: shared libraries (reserved for later phases)

## Implemented (Phase 1 foundation)
- Authentication API (`/api/auth/signup`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`)
- Dashboard overview API + UI route
- Question bank API + UI route
- AI mock interview API + UI route
- Notes API + UI route
- Landing page + app routes scaffold
- Docker + env template

## Quick Start
1. Copy `.env.example` to `.env` at the **monorepo root** and fill values (API Prisma scripts load it via `dotenv-cli`; Nest loads the same path).
2. Install dependencies:
   - `npm install`
3. Start infra:
   - `docker compose up -d postgres redis`
4. Generate Prisma client + migrate:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
   - Do **not** run bare `npx prisma` from `apps/api` — env lives at repo root; use `npm run prisma:*` or `dotenv -e ../../.env -- npx prisma …` from `apps/api`.
   - One-time baseline (after `db push`): `npm run prisma:resolve:baseline`  
     (On Windows, `npm run prisma:resolve -- --applied …` often breaks because npm treats `--applied` as its own flag; use this script or run from `apps/api`: `npx dotenv-cli -e ../../.env -- prisma migrate resolve --applied 20260509120000_baseline`.)
5. Seed sample data:
   - `npm run seed`
6. Run apps:
   - `npm run dev:api`
   - `npm run dev:web`

## Phase Plan
- Phase 1: Auth, Dashboard, Question Bank, AI chat interview, Notes
- Phase 2: Coding playground + system design whiteboard with React Flow
- Phase 3: AI architecture review + replay mode + advanced analytics
- Phase 4: Voice, collaboration, team interview modes
