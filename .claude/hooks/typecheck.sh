#!/bin/bash
# PostToolUse hook: run TypeScript type-check after editing .ts/.tsx files.
# Input: JSON on stdin with tool_input.file_path

INPUT=$(cat)

FILE=$(python3 -c "
import sys, json
d = json.loads(sys.stdin.read())
print(d.get('tool_input', {}).get('file_path', ''))
" <<< "$INPUT" 2>/dev/null)

# Only run for TypeScript files
[[ "$FILE" =~ \.(ts|tsx)$ ]] || exit 0

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Ensure nvm-managed node is on PATH
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" --no-use
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"

cd "$PROJECT_ROOT"

if [[ "$FILE" == *"/frontend/"* ]]; then
  npm run typecheck --workspace=frontend 2>&1 | head -40
elif [[ "$FILE" == *"/backend/"* ]]; then
  npm run typecheck --workspace=backend 2>&1 | head -40
fi