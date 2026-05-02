# CLI Dojo

CLI Dojo is a Japanese quiz app for learning common CLI commands by category.

The app uses static TypeScript question data and stores learning progress in Neon PostgreSQL through Next.js Route Handlers.

## Current Scope

- 6 learning sections
- 118 questions across all sections
- Clerk authentication is implemented in `dev`
- Progress saved to Neon per authenticated app user
- Auth methods: Email, GitHub, Google
- In-progress sections resume from the next unanswered question
- Anonymous progress is stored only in `sessionStorage`
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
- Public routes: `/`, `/section/[sectionId]`, `/section/[sectionId]/result`, `/sign-in`, `/sign-up`.
- Authenticated route: `/progress`.
- Progress APIs require an authenticated Clerk user.
- The server derives ownership from Clerk identity resolution; clients must not send ownership IDs for authorization.
- Neon progress records are owned by app-level `users.id`, while Clerk `userId` is treated as an external identity.
- Existing anonymous `sessionStorage` progress may be migrated once after sign-in, then the account record becomes the source of truth.
- Unauthenticated quiz answers are stored only in `sessionStorage` and reflected only on the home page summary/cards and anonymous result view.

## Database

Migration files:

```text
db/migrations/001_create_learning_progress_tables.sql
db/migrations/002_drop_total_questions_default.sql
db/migrations/003_clear_reordered_section_progress.sql
db/migrations/004_add_accounts_and_authenticated_progress.sql
db/migrations/005_add_account_preferences.sql
db/migrations/006_add_users_and_user_identities.sql
db/migrations/007_add_canonical_user_profile_fields.sql
db/migrations/008_stop_writing_account_compatibility_fields.sql
db/migrations/009_drop_account_compatibility_columns.sql
db/migrations/010_drop_legacy_learner_support.sql
```

Current Neon tables:

- `users`
- `user_identities`
- `section_attempts`
- `answer_records`

Current ownership model:

- `users.id` is the source of truth for learning progress ownership.
- `user_identities` stores external auth identities such as Clerk `userId`.
- `section_attempts.user_id` references `users.id`.
- `answer_records.user_id` references `users.id`.
- `accounts` / `account_id` / `learner_id` are already removed from the shared DB.

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
