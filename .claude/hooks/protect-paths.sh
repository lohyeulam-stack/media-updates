#!/usr/bin/env bash
# .claude/hooks/protect-paths.sh — PreToolUse safety gate.
#
# Reads the tool-call payload from stdin and refuses edits to paths that are
# explicitly forbidden by ADR 0001 / 0004 / AGENTS.md unless the human user
# has clearly opted in for this session.
#
# Exit codes:
#   0  — allow the tool call (silent)
#   2  — block the tool call (the message printed to stderr is shown to the agent)
#
# Anything else is treated as a non-blocking error.

set -uo pipefail

payload=$(cat || true)
[ -z "$payload" ] && exit 0

# Extract the target file path from any of: file_path, path, notebook_path.
target=$(printf '%s' "$payload" | python3 -c '
import json, sys
try:
    p = json.load(sys.stdin)
except Exception:
    sys.exit(0)
inp = p.get("tool_input") or {}
for k in ("file_path", "path", "notebook_path"):
    v = inp.get(k)
    if isinstance(v, str) and v:
        print(v)
        break
' 2>/dev/null)

[ -z "$target" ] && exit 0

# Normalize: drop trailing whitespace, resolve ~/.
target_norm="${target/#\~/$HOME}"

block() {
  echo "BLOCKED by .claude/hooks/protect-paths.sh: $1" >&2
  echo "" >&2
  echo "Why: $2" >&2
  echo "Fix: $3" >&2
  exit 2
}

case "$target_norm" in
  */legacy-vite/*|legacy-vite/*)
    block "$target" \
      "legacy-vite/ is the deprecated Vite prototype (see legacy-vite/README.md)." \
      "Port the change to src/app/ instead. If you genuinely need to edit the prototype, ask the user to confirm in chat."
    ;;
  */scripts/oneshots/*|scripts/oneshots/*)
    block "$target" \
      "scripts/oneshots/ holds ad-hoc one-shot diagnostics (see scripts/oneshots/README.md)." \
      "If the script is becoming a regular tool, promote it to scripts/ with tests, then ask the user before editing the oneshot copy."
    ;;
  */eslint.config.mjs|eslint.config.mjs|*/tsconfig.json|tsconfig.json)
    block "$target" \
      "Lint/TS config changes affect every PR; ADR 0001 marks these as harness-protected." \
      "Confirm the change with the user and update the relevant ADR in the same commit. Bypass requires explicit user approval in this session."
    ;;
  */.github/workflows/*.yml|.github/workflows/*.yml)
    block "$target" \
      "Workflow changes alter CI for everyone; harness-checks.yml is the gate that prevents schema regressions." \
      "Confirm with the user and update docs/adr/ if the trigger or check set changes."
    ;;
esac

exit 0
