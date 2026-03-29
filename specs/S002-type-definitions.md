# S002 - Type Definitions

**Phase:** 1 | **Depends on:** S001 | **Priority:** P0

## What
Define the core TypeScript types used throughout the engine: geographic coordinates, TLE records, satellite metadata, transit events, search parameters, and search results. These types are the shared vocabulary for all modules.

## Files
- Create: `src/types/geo.ts`
- Create: `src/types/satellite.ts`
- Create: `src/types/transit.ts`
- Create: `tests/unit/types/type-check.test.ts`

## Tests
- `type_check` - create instances of each type, verify they satisfy the type constraints (compile-time test via satisfies + runtime shape check)

## Acceptance
- [ ] All types compile with strict TypeScript
- [ ] Types match API contracts in ARCHITECTURE.md Section 8
- [ ] No `any` types used
- [ ] Types exported from barrel files for clean imports
