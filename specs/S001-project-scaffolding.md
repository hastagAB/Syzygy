# S001 - Project Scaffolding

**Phase:** 1 | **Depends on:** none | **Priority:** P0

## What
Initialize the Next.js project with TypeScript, Tailwind CSS, ESLint, Prettier, and Vitest. Establish the folder structure from ARCHITECTURE.md Section 12. Verify the dev server starts and a trivial test passes.

## Files
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- Create: `vitest.config.ts`, `.prettierrc`, `.eslintrc.json`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `scripts/vibe-check.ps1`
- Create: `tests/unit/smoke.test.ts`
- Create: `.env.example`

## Tests
- `smoke_test` - import from `src/` resolves, Vitest runs, `1 + 1 === 2` passes

## Acceptance
- [ ] `pnpm dev` starts without errors
- [ ] `pnpm test` runs and smoke test passes
- [ ] `pnpm lint` passes
- [ ] Tailwind classes render in the browser
- [ ] Folder structure matches ARCHITECTURE.md Section 12 (empty placeholder dirs OK)
