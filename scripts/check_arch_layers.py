"""
scripts/check_arch_layers.py — enforce frontend dependency layers (ADR 0004).

Layers (left → right; imports may only flow leftward):
  Types → Config → Repo → Service → UI

Concrete file mapping for this repo:
  Types:   src/lib/types.ts
  Repo:    src/lib/data.ts          (file I/O against data/)
  Service: src/lib/monitoring.ts, src/lib/utils.ts, src/lib/hooks/**
  UI:      src/app/**, src/components/**

Rules:
  R1. src/lib/types.ts imports nothing internal.
  R2. src/lib/data.ts must not import from src/app/** or src/components/**.
  R3. src/components/ui/** must not import src/lib/data.ts (it must stay reusable).
  R4. Files marked "use client" must not import src/lib/data.ts.
  R5. No file may import from legacy-vite/** or scripts/**.
  R6. No TSX/TS file may import from a literal "data/..." path or contain
      a top-level `import ... from "../../data/..."` reach-around.

Exit code:
  0 — clean
  1 — one or more violations (each printed with WHY + FIX)
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Iterable

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "src"

# Match top-level static `import ... from "..."` statements only. Side-effect
# imports (`import "..."`) are intentionally excluded — they are rare and
# benign here.
IMPORT_RE = re.compile(
    r'^\s*import\s+(?:[^"\']*?\s+from\s+)?["\']([^"\']+)["\']',
    re.MULTILINE,
)
USE_CLIENT_RE = re.compile(r'^\s*[\'"]use client[\'"]', re.MULTILINE)


def _resolve(spec: str, importer: Path) -> str:
    """Map an import specifier to a logical path string for rule matching."""
    if spec.startswith("@/"):
        return f"src/{spec[2:]}"
    if spec.startswith("."):
        target = (importer.parent / spec).resolve()
        try:
            return str(target.relative_to(REPO))
        except ValueError:
            return str(target)
    return spec  # bare module like "react"


def _files() -> Iterable[Path]:
    for ext in ("*.ts", "*.tsx"):
        yield from SRC.rglob(ext)


def _violation(file: Path, why: str, fix: str) -> str:
    rel = file.relative_to(REPO)
    return (
        f"\n[arch-layer] {rel}\n"
        f"  WHY: {why}\n"
        f"  FIX: {fix}\n"
        f"  REF: docs/adr/0004-dependency-layers.md"
    )


def main() -> int:
    if not SRC.is_dir():
        print(f"src/ not found at {SRC}", file=sys.stderr)
        return 1

    issues: list[str] = []

    for file in _files():
        rel = str(file.relative_to(REPO)).replace("\\", "/")
        text = file.read_text(encoding="utf-8")
        is_client = bool(USE_CLIENT_RE.search(text))
        imports = [m.group(1) for m in IMPORT_RE.finditer(text)]

        # R1: types.ts is a leaf.
        if rel == "src/lib/types.ts":
            for spec in imports:
                resolved = _resolve(spec, file)
                if resolved.startswith("src/"):
                    issues.append(_violation(
                        file,
                        f"types.ts must be a leaf, but imports '{spec}' (resolves to {resolved}).",
                        "Move the imported member into types.ts directly, or move the type out into its own leaf file.",
                    ))

        # R2: data.ts must not reach into UI.
        if rel == "src/lib/data.ts":
            for spec in imports:
                resolved = _resolve(spec, file)
                if resolved.startswith("src/app/") or resolved.startswith("src/components/"):
                    issues.append(_violation(
                        file,
                        f"data.ts (Repo layer) imports from UI layer: '{spec}'.",
                        "Move the helper into src/lib/utils.ts (Service) or duplicate the logic locally.",
                    ))

        for spec in imports:
            resolved = _resolve(spec, file)

            # R3: shadcn primitives must stay reusable.
            if rel.startswith("src/components/ui/") and resolved == "src/lib/data.ts":
                issues.append(_violation(
                    file,
                    "shadcn UI primitive imports lib/data.ts — locks it to this app.",
                    "Accept the data via props from the calling page/component.",
                ))

            # R4: client components must not import lib/data.ts.
            if is_client and resolved == "src/lib/data.ts":
                issues.append(_violation(
                    file,
                    'This file is "use client" but imports lib/data.ts (Server-only file I/O).',
                    "Read the data in a Server Component parent and pass it via props.",
                ))

            # R5: no legacy or scripts.
            if resolved.startswith("legacy-vite") or "/legacy-vite/" in resolved:
                issues.append(_violation(
                    file,
                    f"Imports from legacy-vite/: '{spec}'.",
                    "Port the needed code into src/ — see legacy-vite/README.md.",
                ))
            if resolved.startswith("scripts/") or resolved.startswith("../scripts"):
                issues.append(_violation(
                    file,
                    f"Frontend file imports from scripts/: '{spec}'.",
                    "Pipeline code is Python-only; the frontend reads data via lib/data.ts.",
                ))

            # R6: never reach into data/ via a relative path.
            if "/data/" in resolved or resolved.startswith("data/"):
                if not rel.endswith("lib/data.ts"):
                    issues.append(_violation(
                        file,
                        f"Reaches into data/ directly: '{spec}'.",
                        "Use getUpdates() / getMonthlyReport() / getWeeklyData() from @/lib/data.",
                    ))

    if issues:
        for v in issues:
            print(v)
        print(f"\nFAIL: {len(issues)} arch-layer violation(s)", file=sys.stderr)
        return 1

    print("OK: src/ dependency layers respect ADR 0004")
    return 0


if __name__ == "__main__":
    sys.exit(main())
