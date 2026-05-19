#!/usr/bin/env bash
# Pflanternen Stufe 2 — .project.toml → SurrealDB Sync (KAiOSS Core)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
ENV_LOCAL="$SCRIPT_DIR/../.env.local"

# Lade Umgebungsvariablen falls vorhanden
[ -f "$ENV_FILE" ] && export $(grep -v '^#' "$ENV_FILE" | xargs)
[ -f "$ENV_LOCAL" ] && export $(grep -v '^#' "$ENV_LOCAL" | xargs)

SDB_ENDPOINT="${VITE_SURREAL_URL:-ws://localhost:8000/rpc}"
SDB_ENDPOINT="${SDB_ENDPOINT%/rpc}"
SDB_USER="${VITE_SURREAL_USER:-root}"
SDB_PASS="${VITE_SURREAL_PASS:-root}"

PROJECTS_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

for toml in "$PROJECTS_DIR"/*/.project.toml; do
    [ -f "$toml" ] || continue
    name=$(grep 'name' "$toml" | cut -d'"' -f2)
    stack=$(grep 'stack' "$toml" | cut -d'"' -f2)
    desc=$(grep 'desc' "$toml" | cut -d'"' -f2)
    icon=$(grep 'icon' "$toml" | cut -d'"' -f2)
    status=$(grep 'status' "$toml" | cut -d'"' -f2)
    cmd_start=$(grep 'cmd_start' "$toml" | cut -d'"' -f2)
    cmd_stop=$(grep 'cmd_stop' "$toml" | cut -d'"' -f2)
    
    # ID Mapping
    declare -A id_map=(
        ["CabellistPro"]="cabellistpro"
        ["GuterPrompt"]="guterprompt"
        ["3DNTerminal"]="terminal"
        ["Pflanternen"]="pflanternen"
        ["surreal-board"]="surrealboard"
        ["Agenten-System"]="agentsystem"
        ["NixOS KI-OS"]="nixos"
    )
    id="${id_map[$name]:-$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr -d ' -')}"
    echo "Syncing $name..."
    surreal sql --endpoint "$SDB_ENDPOINT" \
      --username "$SDB_USER" --password "$SDB_PASS" \
      --namespace kanban --database projects \
      --hide-welcome <<< "UPDATE projekt:$id SET name='$name', stack='$stack', desc='$desc', icon='$icon', status='$status', cmd_start='$cmd_start', cmd_stop='$cmd_stop', updated=time::now();"
done
echo "✅ Sync complete"
