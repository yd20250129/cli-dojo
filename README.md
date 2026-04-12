# CLI Dojo

CLI Dojo is a Japanese quiz app for learning common CLI commands by category.

The MVP uses static TypeScript question data and stores learning progress in Neon PostgreSQL through Next.js Route Handlers.

## Current Scope

- 6 learning sections
- 118 questions across all sections
- Anonymous learner ID stored in `localStorage`
- Progress saved to Neon
- In-progress sections resume from the next unanswered question
- No authentication in MVP
- No ORM in MVP

## Stack

| Area | Technology |
|------|------------|
| Frontend | Next.js App Router, React, TypeScript |
| API | Next.js Route Handlers |
| Database | Neon PostgreSQL |
| DB access | Direct SQL with `@neondatabase/serverless` |
| Styling | Tailwind CSS, shadcn/ui |
| Hosting | Vercel |

## Repository / Worktree

During development, only the app source is managed in GitHub.

| Directory | Branch | Purpose |
|-----------|--------|---------|
| `01_Source/dev` | `dev` | Daily development |
| `01_Source/main` | `main` | Production-equivalent worktree |

GitHub:

```text
https://github.com/yd20250129/cli-dojo
```

Production:

```text
https://cli-dojo.vercel.app
```

Project-wide documents under `00_Docs/` are kept locally during development and will be added to a project-wide repository when the MVP is complete.

## Local Setup

Install dependencies:

```bash
npm install
```

Pull environment variables from Vercel:

```bash
npx vercel env pull .env.local --yes
```

Required environment variable:

```text
DATABASE_URL
```

Do not commit `.env.local`.

## Database

Migration files:

```text
db/migrations/001_create_learning_progress_tables.sql
db/migrations/002_drop_total_questions_default.sql
db/migrations/003_clear_reordered_section_progress.sql
```

Current Neon tables:

- `section_attempts`
- `answer_records`

Question data is not stored in Neon. It is stored in TypeScript files:

```text
data/questions/
data/sections.ts
```

## Development

Run the development server:

```bash
npm run dev -- --port 3001
```

Open:

```text
http://localhost:3001
```

## Verification

Static checks:

```bash
npm run test
npm run lint
npm run build
```

Browser verification with `agent-browser`:

```bash
agent-browser open http://localhost:3001
agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser console
agent-browser errors
agent-browser close
```

## Deploy

Production deployments are run from the `main` worktree:

```bash
cd /Users/yudai/local_development/02_Personal_Projects/cli-dojo/01_Source/main
npm install
npm run lint
npm run build
npx vercel --prod --yes
```

## Scripts

```bash
npm run dev
npm run test
npm run lint
npm run build
```

## Notes

- `dev` is the active development branch.
- `main` is the production-equivalent branch.
- Keep secrets out of Git.
- Test data created during manual verification should be removed from Neon after verification.
