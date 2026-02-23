# VibeLearn LMS

Минималистичная LMS-платформа для обучения вайб-кодингу и применению AI.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **UI**: shadcn/ui (Radix), Tiptap editor, React Flow, Sonner
- **Backend**: Next.js App Router API routes
- **Database**: PostgreSQL 16 + Prisma ORM 6
- **Cache**: Redis (Valkey)
- **Storage**: MinIO (S3-compatible)
- **Auth**: NextAuth v5 (Google OAuth + Magic Link)
- **AI**: OpenRouter (Claude, GPT-4o)
- **Payments**: CloudPayments

## Quick Start

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
npm install

# 3. Copy env
cp .env.example .env

# 4. Generate Prisma client & push schema
npm run db:generate
npm run db:push

# 5. Seed demo data
npm run db:seed

# 6. Start dev server
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/
  app/
    (public)/       # Public pages (catalog, course detail)
    (student)/      # Auth-required (dashboard, lessons, profile)
    admin/          # Admin panel (courses, pages, graph, users, settings)
    api/            # API routes
    auth/           # Auth pages (signin, verify, error)
  components/
    ui/             # shadcn/ui components
    editor/         # Tiptap rich text editor
    quiz/           # Quiz player
    sandbox/        # AI prompt sandbox
    layout/         # Header, Footer, AdminSidebar
  lib/              # Prisma, Redis, MinIO, Auth, Utils
  services/         # XP, Streaks, Achievements, OpenRouter, CloudPayments
  types/            # Shared TypeScript types
prisma/
  schema.prisma     # Database schema (15 models)
  seed.ts           # Demo data
```

## Features

- 6 lesson types: Article, Video, Quiz, Sandbox, Interactive, Media
- XP/Level gamification with 7 tiers
- Daily streak tracking with bonuses
- Achievement system (7 achievement types)
- AI sandbox evaluation via OpenRouter
- AI hints (Socratic method) and explanations
- RBAC: Student, Instructor, Admin
- CMS pages with Tiptap editor
- Content graph visualization (React Flow)
- CloudPayments integration
- Rate limiting + AI budget control
- Dark/Light theme
- Russian localization

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:push      # Push schema to DB
npm run db:seed      # Seed demo data
npm run db:studio    # Prisma Studio
npm run docker:up    # Start containers
npm run docker:down  # Stop containers
npm run test         # Run tests
```
