# ADR 0004 — Dependency layers (frontend)

- **Status**: Accepted
- **Date**: 2026-02-18

## Context

Without architectural boundaries, agents and humans alike create cycles:

- A UI component imports from `data/` directly.
- A type file imports from a component.
- A `lib/` helper reaches into `app/`.

Cycles make refactors painful and break Server Component / Client Component splits.

## Decision

The frontend follows a **strict left-to-right import direction**. Each layer may only import from layers to its **left**.

```
Types  →  Config  →  Repo  →  Service  →  UI
```

### Layer mapping (this repo)

| Layer | Path | What lives here |
|---|---|---|
| Types | `src/lib/types.ts` | `Platform`, `Category`, `MediaUpdate`, `PLATFORM_META`, label maps. **Pure data — no `fs`, no React, no `process`.** |
| Config | (folded into Types in this small repo) | `PLATFORM_META`, `GROUP_LABELS`, `CATEGORY_LABELS` — constants only. |
| Repo | `src/lib/data.ts` | File I/O against `data/`. Reads JSON / Markdown. **No React, no business rules.** |
| Service | `src/lib/monitoring.ts`, `src/lib/utils.ts`, `src/lib/hooks/*` | Cross-cutting helpers. May import Types + Repo. **No JSX.** |
| UI | `src/app/**`, `src/components/**` | Pages, layouts, components. May import any layer to the left. |

### Hard rules

1. **Types may not import** from any other layer. They are leaves.
2. **Repo may not import** from `src/app/**` or `src/components/**`.
3. **`src/components/ui/**` (shadcn primitives) may not import from `src/app/**` or from `src/lib/data.ts`.** They are reusable; reaching into the data layer locks them to this app.
4. **`src/app/**` server components** may import from any layer; **client components** (`"use client"`) may not import `src/lib/data.ts` directly — pass data through props.
5. No file may import from `legacy-vite/**` or from `scripts/**`. The Python pipeline is a separate world.

### Mechanical enforcement

`scripts/check_arch_layers.py` walks the import graph and exits non-zero if any rule is violated. Run in `harness-checks.yml` for every PR.

## Consequences

**Positive**

- Server / Client Component split stays sane: the data layer never accidentally becomes client code.
- Refactoring `data.ts` cannot break a UI test that doesn't import it.
- New hires can find anything in seconds: business rules in `lib/`, shape in `types.ts`, presentation in `app/`.

**Negative**

- Sometimes a UI component "wants" to read from JSON directly — this rule forces it through `getUpdates()`. The cost is one extra prop; the gain is testability.
- shadcn primitives that need data must accept it via props or a render prop.

## Constraints this places on agents

- **Do not** add `import` from `data/` (the JSON folder) into TSX files. Use `getUpdates()`.
- **Do not** add `"use client"` to a file that imports `src/lib/data.ts`. The CI check will fail.
- **Do not** introduce `src/lib/types.ts` → `src/components/...` imports. The graph must remain a DAG.
- If you genuinely need to break a rule, propose an ADR-supersession PR that updates this file *and* the `check_arch_layers.py` rules in the same commit.
