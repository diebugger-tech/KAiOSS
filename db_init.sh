#!/bin/bash
# SurrealDB Initialization for Kanban Board
# Namespace: kaioss, Database: kaioss

# Configuration
ENDPOINT="http://localhost:8000/sql"
NS="kaioss"
DB="kaioss"
AUTH="root:root"

echo "Initializing SurrealDB projects..."

# Function to execute SQL via curl
run_sql() {
  curl -s -X POST \
    -u "root:root" \
    -H "Accept: application/json" \
    -d "USE NS kaioss DB kaioss; $1" \
    "http://localhost:8000/sql"
}

# Clear existing data (optional but good for clean init)
# run_sql "DELETE projekt"

# Create Projects
run_sql "
CREATE projekt:cabellistpro SET name = 'CabellistPro', stack = 'FastAPI / Python / MySQL', desc = 'B2B SaaS Kabelmanagement', status = 'done', tags = ['#SaaS', '#Production'], icon = '🚀', cmd_start = 'make dev', cmd_stop = 'make stop', updated = time::now();
CREATE projekt:guterprompt SET name = 'GuterPrompt', stack = 'PHP 8.3 / SvelteKit / FastAPI', desc = 'Community Prompt-Bewertungsmodell', status = 'in-progress', tags = ['#Research', '#PHP', '#AI'], icon = '📝', cmd_start = 'composer serve', cmd_stop = 'killall php', updated = time::now();
CREATE projekt:terminal SET name = '3DNTerminal', stack = 'Rust / Bevy / Wayland', desc = '3D-Flip Terminal for Cosmic Desktop', status = 'in-progress', tags = ['#Rust', '#Wayland', '#Graphics'], icon = '🖥️', cmd_start = 'cargo run', cmd_stop = 'killall 3dnterminal', updated = time::now();
CREATE projekt:pflanternen SET name = 'Pflanternen', stack = 'Bash / SurrealDB / NixOS', desc = 'Multi-stage NixOS automation framework', status = 'in-progress', tags = ['#NixOS', '#Automation', '#SurrealDB'], icon = '🌿', cmd_start = 'bash diagnose.sh', cmd_stop = 'pkill diagnose.sh', updated = time::now();
CREATE projekt:agentsystem SET name = 'Agenten-System', stack = 'Claude / Goose / Pi', desc = 'Multi-Agent Framework', status = 'backlog', tags = ['#AI', '#Orchestration', '#LLM'], icon = '🤖', cmd_start = 'claude-code', cmd_stop = 'exit', updated = time::now();
CREATE projekt:nixos_ki_os SET name = 'NixOS KI-OS', stack = 'jail.nix / GitNexus / MCP', desc = 'Hardened AI Operating System environment', status = 'done', tags = ['#Security', '#NixOS', '#MCP'], icon = '❄️', cmd_start = 'nix-shell', cmd_stop = 'exit', updated = time::now();
"

echo "Database initialized successfully."
