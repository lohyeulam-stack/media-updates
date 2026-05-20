#!/usr/bin/env bash
# .claude/hooks/auto-fix.sh — PostToolUse auto-format + lint feedback.
#
# After a successful Edit/Write/MultiEdit on a TypeScript or JavaScript file:
#   1. Run `eslint --fix` on the changed file (silent if it succeeded).
#   2. Surface remaining lint + tsc errors that touch the file, formatted
#      so the next agent turn can act on them directly.
#
# Output JSON to stdout in the form Claude Code expects:
#   {"hookSpecificOutput": {"additionalContext": "<feedback string>"}}
# Non-zero exit codes are reserved for hook-internal failures, not lint failures.

set -uo pipefail

payload=$(cat || true)
[ -z "$payload" ] && exit 0

target=$(printf '%s' "$payload" | python3 -c '
import json, sys
try:
    p = json.load(sys.stdin)
except Exception:
    sys.exit(0)
inp = p.get("tool_input") or {}
for k in ("file_path", "path"):
    v = inp.get(k)
    if isinstance(v, str) and v:
        print(v)
        break
' 2>/dev/null)

[ -z "$target" ] && exit 0

case "$target" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

case "$target" in
  *node_modules*|*/.next/*|*legacy-vite/*) exit 0 ;;
esac

[ -f package.json ] || exit 0

remaining=""

if [ -f eslint.config.mjs ] || [ -f eslint.config.js ] || [ -f .eslintrc.json ]; then
  npx --no-install eslint --fix "$target" >/dev/null 2>&1 || true
  lint_residual=$(npx --no-install eslint --format=compact "$target" 2>&1 || true)
  if printf '%s' "$lint_residual" | grep -qE "error|warning"; then
    remaining="${remaining}
[eslint residual after --fix on ${target}]
${lint_residual}"
  fi
fi

if [ -f tsconfig.json ]; then
  tsc_out=$(npx --no-install tsc --noEmit 2>&1 || true)
  filtered=$(printf '%s' "$tsc_out" | grep -F "$target" || true)
  if [ -n "$filtered" ]; then
    remaining="${remaining}
[tsc errors touching ${target}]
${filtered}"
  fi
fi

[ -z "$remaining" ] && exit 0

# Hand $remaining to Python via env so quoting cannot break the JSON.
REMAINING="$remaining" TARGET="$target" python3 <<'PY'
import json, os
remaining = os.environ.get("REMAINING", "")
target = os.environ.get("TARGET", "")
msg = (
    "Auto-fix ran on the file you just edited. Remaining issues are below — "
    "fix them before reporting the task complete.\n\n"
    "WHY: AGENTS.md requires lint + typecheck green before declaring done.\n"
    "FIX: Read each error, fix at the source. Do not silence with eslint-disable.\n"
    "EXAMPLE: If tsc complains 'Type X is not assignable to Y', the fix is to "
    "widen Y or narrow X — not to add 'as any'.\n\n"
    f"File: {target}\n"
    f"{remaining}"
)
print(json.dumps({"hookSpecificOutput": {"additionalContext": msg}}))
PY
