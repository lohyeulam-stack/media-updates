# scripts/oneshots/ — Ad-hoc data inspection scripts

These are **not** part of the production pipeline. They are kept for occasional manual diagnostics.

| Script | Purpose | Status |
|---|---|---|
| `analyze.py` | Quick platform-distribution count + Chinese-title check on `data/updates.json` | Manual debugging only |
| `filter_chinese.py` | **Destructive** — filters `data/updates.json` to keep only Chinese-content entries and overwrites the file | One-shot remediation; do not run in CI |

## Rules for agents

- Do **not** import from this directory in `scripts/fetch_updates.py` or any production pipeline.
- Do **not** add new automated runs that touch these scripts.
- If a one-shot has been useful more than twice, promote it into a proper module under `scripts/` with tests, then delete the oneshot copy.
