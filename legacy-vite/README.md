# legacy-vite/ — DEPRECATED

> **DO NOT MODIFY.** This directory is the pre-Next.js Vite prototype, kept only as a historical reference.

## Status

- **Replaced**: 2026-Q1 by the Next.js 16 App Router implementation in `src/app/`.
- **Excluded from build**: see `eslint.config.mjs` `globalIgnores` and `tsconfig.json` `exclude`.
- **Not deployed**: nothing here ships to Vercel.

## Why it still exists

Some component layouts (`Sidebar`, `DashboardStats`, `TrendChart`) were ported to `src/app/components/` with adjustments for Server Components and Tailwind v4. The Vite originals are kept readable to make those ports auditable.

## Rules for agents

- **Do not edit any file in this directory.** Changes here have no production effect.
- **Do not import from this directory.** It is not on the TypeScript path and Next.js cannot resolve it.
- If you need a pattern from here, **port it into `src/app/components/`** — do not re-export.
- If asked to "fix" something here, push back: the fix belongs in the corresponding `src/app/` file.

## When to delete this directory

Remove the entire `legacy-vite/` tree once all of the following are true:

1. No PR in the last 90 days has referenced it.
2. The corresponding ADR (`docs/adr/0001-tech-stack.md`) is marked as Accepted-and-stable.
3. A grep across `src/`, `scripts/`, and `docs/` finds zero references.
