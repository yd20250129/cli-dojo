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

Current operation note:

- Production is currently using Clerk `pk_test_` / `sk_test_` keys for private usability verification.
- Before wider release or external user onboarding, switch Vercel Production to Clerk live keys and verify the production instance end to end.

Target behavior:

- Clerk is the authentication provider.
- Email is enabled in Clerk sign-in methods.
- GitHub and Google are the supported Clerk social connections.
- Public routes: `/`, `/section/[sectionId]`, `/section/[sectionId]/result`, `/sign-in`, `/sign-up`.
- Authenticated route: `/progress`.
- Progress APIs require an authenticated Clerk user.
- The server derives ownership from Clerk identity resolution; clients must not send ownership IDs for authorization.
- Neon progress records are owned by app-level `users.id`, while Clerk `userId` is treated as an external identity.
- In `dev`, sign-in / sign-up auto-links to an existing `users.id` only when the Clerk verified primary email matches exactly one existing verified email candidate.
- Existing anonymous `sessionStorage` progress may be migrated once after sign-in, then the account record becomes the source of truth.
- Unauthenticated quiz answers are stored only in `sessionStorage` and reflected only on the home page summary/cards and anonymous result view.

Anonymous session behavior:

- `sessionStorage` key `cli-dojo:anonymous-progress` stores unauthenticated quiz answers for the current browser session only.
- This anonymous session progress is visible on the home page and anonymous result view.
- The detailed progress page `/progress` is not available without sign-in.

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
db/migrations/011_add_user_display_name.sql
db/migrations/012_create_feedback_submissions.sql
```

Manual operation helper:

```text
db/operations/001_merge_duplicate_user_ownership.sql
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
- If a verified email maps to multiple existing `user_id` candidates, auto-link is skipped and manual merge is required.

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

Reset a reusable test account before manual auth verification:

```bash
npx vercel env pull /private/tmp/cli-dojo-prod.env --yes --environment=production
npm run reset:test-user -- wkdkzskg_next@yahoo.co.jp --yes
```

Notes:

- The reset script reads `DATABASE_URL` from `/private/tmp/cli-dojo-prod.env` by default.
- If that env file does not contain `CLERK_SECRET_KEY`, the script falls back to `01_Source/dev/.env.local`.
- Use `--dry-run` first when you only want to inspect matching Neon / Clerk records.

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
