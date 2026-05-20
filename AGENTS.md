# AGENTS.md — routing for AI agents

> **This file is a map, not a manual.** Read the linked file for actual guidance. Targets: <50 lines.

## Where to look

| Question | File |
|---|---|
| What is this project? | [`README.md`](./README.md) |
| How do I run X locally / why is X broken? | [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) |
| What is the data pipeline? | [`docs/adr/0002-data-flow-pipeline.md`](./docs/adr/0002-data-flow-pipeline.md) |
| What is the data shape? | [`docs/adr/0005-data-schema-contract.md`](./docs/adr/0005-data-schema-contract.md) |
| How do I add a platform? | [`docs/adr/0006-platform-source-registration.md`](./docs/adr/0006-platform-source-registration.md) |
| How are layers organized? | [`docs/adr/0004-dependency-layers.md`](./docs/adr/0004-dependency-layers.md) |
| Next.js 16 specifics | [`CLAUDE.md`](./CLAUDE.md) |

## Hard prohibitions (mechanically enforced — do not bypass)

- **Do not edit `legacy-vite/**`.** Deprecated. Port to `src/app/` instead.
- **Do not edit `scripts/oneshots/**`.** One-shot diagnostics; not part of the pipeline.
- **Do not bypass commit hooks** (`--no-verify`, `--no-gpg-sign`). Fix the failure instead.
- **Do not edit `eslint.config.mjs`, `tsconfig.json`, `.github/workflows/*.yml`** without an accompanying ADR update.
- **Do not invent platforms.** New `Platform` literals require a `sources_config.py` source AND a `PLATFORM_META` entry — `harness-checks.yml` will fail otherwise.
- **Do not write prose to `data/updates.json` by hand.** All entries flow through `scripts/fetch_updates.py`.

## Commands

```bash
npm run dev          # local site
npm run build        # must pass before push
npm run lint         # must pass before push
npm run typecheck    # must pass before push
npm test             # Playwright e2e (requires `npm run build` first)

python scripts/fetch_updates.py --mode=weekly --current-week
python scripts/check_data_schema.py            # data/updates.json contract check
python scripts/check_arch_layers.py            # src/ dependency-layer check
```

## Before reporting a task complete

1. `npm run lint && npm run typecheck && npm run build` all green.
2. `python scripts/check_data_schema.py` green if any `data/` file changed.
3. `python scripts/check_arch_layers.py` green if any `src/` file changed.
4. New behavior covered by a Playwright e2e in `tests/e2e/` if user-visible.

## When the harness rejects you

Read the error. The fix instruction is in the message. Do not loop on the same approach twice — escalate to the user.
