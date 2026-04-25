# CLI Dojo

CLI Dojo is a Japanese quiz app for learning common CLI commands by category.

The app uses static TypeScript question data and stores learning progress in Neon PostgreSQL through Next.js Route Handlers.

## Current Scope

- 6 learning sections
- 118 questions across all sections
- Account authentication with Clerk is implemented in `dev`
- Progress saved to Neon per authenticated account
- Auth methods: Email, GitHub, Google
- In-progress sections resume from the next unanswered question
- Anonymous `localStorage` learner IDs are legacy MVP data and should only be used for migration
- No ORM in MVP

## Stack

| Area | Technology |
|------|------------|
| Frontend | Next.js App Router, React, TypeScript |
| API | Next.js Route Handlers |
| Database | Neon PostgreSQL |
| DB access | Direct SQL with `@neondatabase/serverless` |
| Auth | Clerk for Next.js |
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
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
```

Do not commit `.env.local`.

## Authentication And Progress Ownership

Authentication is being added so scores and progress are managed per account instead of per browser.

Target behavior:

- Clerk is the authentication provider.
- Email is enabled in Clerk sign-in methods.
- GitHub and Google are the supported Clerk social connections.
- Public routes: `/`, `/sign-in`, `/sign-up`.
- Authenticated routes: `/section/[sectionId]`, `/section/[sectionId]/result`, `/progress`.
- Progress APIs require an authenticated Clerk user.
- The server derives ownership from Clerk `userId`; clients must not send ownership IDs for authorization.
- Neon progress records are owned by an app account mapped to Clerk `userId`.
- Existing anonymous `localStorage` learner progress may be migrated once after sign-in, then the account record becomes the source of truth.

Legacy MVP behavior:

- `localStorage` key `cli-dojo:learner-id` currently identifies progress.
- `X-Learner-Id` currently carries that ID to Route Handlers.
- This should be replaced by server-side authenticated user lookup during the auth migration.

## Database

Migration files:

```text
db/migrations/001_create_learning_progress_tables.sql
db/migrations/002_drop_total_questions_default.sql
db/migrations/003_clear_reordered_section_progress.sql
```

Current Neon tables:

- `accounts` (planned)
- `section_attempts`
- `answer_records`

Planned ownership model:

- `accounts.clerk_user_id` stores the external Clerk user ID.
- `section_attempts.account_id` references `accounts.id`.
- `answer_records.account_id` references `accounts.id`.
- Legacy `learner_id` columns remain only long enough to migrate anonymous progress.

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
