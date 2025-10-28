# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router routes under `api/`, plus layout shells and `globals.css`.
- `src/components`: Feature UI (e.g., `workspace/`); colocate new widgets with their consuming module.
- `src/db` with `drizzle/`: Drizzle schema definitions and generated migrations—edit `src/db/schema.ts`, regenerate SQL, never patch `drizzle/` by hand.
- `src/lib`, `src/hooks`, `src/visual-edits`, `public`: Shared helpers, hooks, experimental UI, and static assets; import via the `@/` alias to avoid brittle relatives.

## Build, Test, and Development Commands
- `npm install` or `bun install`: Sync dependencies after cloning or updating manifests.
- `npm run dev`: Turbopack dev server on `http://localhost:3000` with `.env.local` loaded.
- `npm run build` then `npm run start`: Production build and serve; both surface type/lint failures.
- `npm run lint`, `npm run lint:fix`, `npm run typecheck`: Mandatory before every PR to keep warnings out of main.
- `bunx drizzle-kit push` (or `npx`): Apply migrations for any change in `src/db/schema.ts` and commit the generated SQL.

## Coding Style & Naming Conventions
- TypeScript + React 19 functional components; favor hooks and keep state close to consumers.
- Match current formatting: 2-space indent, trailing semicolons, single quotes outside JSX, grouped imports (framework → third-party → local).
- PascalCase component files, camelCase utilities/hooks (`useWorkspaceState`), kebab-case route folders.
- ESLint blocks unresolved imports and noisy `console`; resolve warnings or add intentional comments before merging.

## Testing Guidelines
- Automated tests are not yet in-tree; rely on `npm run lint` and `npm run typecheck` as the baseline gate.
- Add new tests next to their subject (`feature/__tests__/feature.test.tsx`), document fixtures, and exercise Drizzle flows against a local PostgreSQL seeded via `.env.local`.
- Until end-to-end coverage lands, record manual QA steps for collaborative editing and API endpoints within each PR.

## Commit & Pull Request Guidelines
- Git history isn’t bundled; use concise, imperative subjects (e.g., `feat: add workspace layout`) with optional Conventional scopes.
- Keep commits focused—pair schema changes with migrations, avoid mixing refactors with feature code.
- PRs should summarize outcomes, link issues, flag env or migration steps, and attach UI screenshots or API samples; request review only after lint/typecheck pass.

## Security & Configuration Tips
- Keep secrets in `.env.local`; use least-privilege `DATABASE_URL` values and never commit `.env*` files.
- Revisit `next.config.ts`, `dev-setup.sh`, and `src/lib/server/response.ts` whenever altering headers, bootstrap logic, or origin checks to preserve current hardening.
