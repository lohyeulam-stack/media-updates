# Architecture Decision Records

Each ADR captures one decision: why it was made, what it constrains, what would supersede it.

| ID | Title | Status |
|---|---|---|
| [0001](./0001-tech-stack.md) | Tech stack (Next.js 16 + Python pipeline + Vercel) | Accepted |
| [0002](./0002-data-flow-pipeline.md) | Data flow pipeline (5-stage scrape → publish) | Accepted |
| [0003](./0003-ai-extraction-rules.md) | AI extraction & validation rules | Accepted |
| [0004](./0004-dependency-layers.md) | Frontend dependency layers | Accepted |
| [0005](./0005-data-schema-contract.md) | Data schema contract (TS + Python) | Accepted |
| [0006](./0006-platform-source-registration.md) | Platform & source registration process | Accepted |
| [0007](./0007-reddit-aggregation.md) | Reddit ad-discussion aggregation (bran.yang) | Accepted |

## How to write a new ADR

1. Pick the next number. Never reuse a number.
2. Copy the structure of an existing ADR: **Status / Context / Decision / Consequences / Constraints on agents**.
3. If you are reversing a previous decision, set the old ADR's Status to `Superseded by NNNN` and link forward.
4. ADRs are **immutable once Accepted**. To change the decision, write a new ADR.

## Reading order for new contributors

`README.md` → `AGENTS.md` → `0001` → `0002` → the ADR closest to the file you are about to edit.
