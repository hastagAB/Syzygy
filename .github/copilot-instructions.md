# Syzygy - Copilot Instructions

## Project Overview
Satellite transit finder - predicts when ISS/Hubble/Tiangong transit the Sun or Moon from a given location.

## Tech Stack
- **Runtime**: Node.js 20+
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+ (strict mode)
- **Styling**: Tailwind CSS 3+
- **Map**: Leaflet + react-leaflet
- **State**: Zustand
- **Testing**: Vitest + @testing-library/react
- **Package Manager**: pnpm
- **Linter**: ESLint (next/core-web-vitals + typescript)
- **Formatter**: Prettier

## Key Dependencies
- `satellite.js` - SGP4/SDP4 orbital propagation from TLEs
- `astronomia` - Sun/Moon ephemeris calculations
- `date-fns` - Date manipulation
- `zod` - Input validation (API layer)

## Conventions

### Code
- Before writing new code, search `src/` for existing utilities. Prefer extension over duplication.
- No hardcoded values. Config goes in `src/lib/config.ts`, secrets via environment variables.
- Every new function needs a type signature and at least one test.
- Functions < 30 lines. Max 3 parameters; use an options object beyond that.
- Prefer `const` and immutability by default.
- No commented-out code. No TODO/FIXME in delivered code.
- Use early returns over deep nesting.
- Never use em-dashes or en-dashes - use hyphens instead.

### Testing
- Tests first - non-negotiable. Tests are the AI's leash.
- AAA pattern: Arrange, Act, Assert.
- Test names: `should_<expected>_when_<condition>`.
- Unit tests in `tests/unit/`, integration in `tests/integration/`, e2e in `tests/e2e/`.
- Mock at system boundaries (HTTP, filesystem, clock). Never mock `satellite.js` internals.
- Minimum 90% coverage. The uncovered 10% is where hallucinated logic hides.

### API
- All endpoints under `/api/v1/`.
- Validate all inputs with Zod schemas.
- Error shape: `{ error: { code, message, details } }`.
- No stack traces in responses.

### Git
- Conventional commits: `feat(scope): description (spec: SXXX)`
- One slice per commit. Small diffs, small blast radius.

## Stop Directive
If you are unsure whether a function, method, or API exists in a dependency, STOP and say "I'm not sure this API exists - please verify." Do not invent plausible-looking function signatures.

## Current State
The project is feature-complete (v1.0). All engine, API, and UI code is in `src/`.
109 tests across 16 files. Run `pnpm check` for full quality gate.
