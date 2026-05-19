#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SET_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$SET_DIR/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TIMESTAMP_ISO=$(date --iso-8601=seconds)
REPORT_FILE="$REPORT_DIR/diagnose_$TIMESTAMP.md"
HOST=$(hostname)

# Umgebungsvariablen laden
ENV_FILE="$SCRIPT_DIR/../../../.env"
ENV_LOCAL="$SCRIPT_DIR/../../../.env.local"
[ -f "$ENV_FILE" ] && export $(grep -v '^#' "$ENV_FILE" | xargs)
[ -f "$ENV_LOCAL" ] && export $(grep -v '^#' "$ENV_LOCAL" | xargs)

SDB_URL="${VITE_SURREAL_URL:-ws://localhost:8000/rpc}"
SDB_URL="${SDB_URL%/rpc}"
SDB_USER="${VITE_SURREAL_USER:-root}"
SDB_PASS="${VITE_SURREAL_PASS:-root}"
SDB_NS="pflanternen"
SDB_DB="diagnosen"

mkdir -p "$REPORT_DIR"

echo "🔍 Starte Pflanternen Diagnose ($TIMESTAMP)..."
echo "   -> Sammle System-Status..."

FAILED_UNITS_RAW=$(systemctl --failed --no-legend --no-pager | awk '{print $1}')
mapfile -t FAILED_UNITS < <(echo "$FAILED_UNITS_RAW")
[[ -z "${FAILED_UNITS_RAW}" ]] && FAILED_UNITS=()

ERROR_LOGS_RAW=$(journalctl -p err -n 20 --no-pager --output=short --no-hostname | head -c 10000)
mapfile -t ERROR_LOGS < <(echo "$ERROR_LOGS_RAW")

echo "   -> Prüfe NixOS Dry-Activate..."
DRY_OUT_FILE="/tmp/nixos_dry_out_$TIMESTAMP"
if sudo nixos-rebuild dry-activate --flake /etc/nixos &>"$DRY_OUT_FILE"; then
    DRY_OK=true
    DRY_MSG="✅ dry-activate erfolgreich"
else
    DRY_OK=false
    DRY_MSG="❌ dry-activate fehlgeschlagen"
fi
DRY_OUT=$(cat "$DRY_OUT_FILE")

{
    echo "# Pflanternen System-Diagnose"
    echo "Datum: $(date)"
    echo "Host: $HOST"
    echo ""
    echo "## 1. Fehlgeschlagene Systemd Units"
    echo '```text'
    [[ ${#FAILED_UNITS[@]} -eq 0 ]] && echo "Keine Fehler gefunden." || printf "%s\n" "${FAILED_UNITS[@]}"
    echo '```'
    echo ""
    echo "## 2. Letzte 50 Error-Logs"
    echo '```text'
    printf "%s\n" "${ERROR_LOGS[@]}"
    echo '```'
    echo ""
    echo "## 3. NixOS Dry-Activate"
    echo "Status: $DRY_MSG"
    echo '```text'
    echo "$DRY_OUT"
    echo '```'
} > "$REPORT_FILE"

echo "   -> Übertrage Daten an SurrealDB..."
JSON_PAYLOAD=$(jq -n \
    --arg ts "$TIMESTAMP_ISO" \
    --arg host "$HOST" \
    --argjson units "$(printf '%s\n' "${FAILED_UNITS[@]}" | jq -R . | jq -s .)" \
    --argjson logs "$(printf '%s\n' "${ERROR_LOGS[@]}" | jq -R . | jq -s .)" \
    --argjson dry_ok "$DRY_OK" \
    --arg dry_out "$DRY_OUT" \
    '{timestamp: $ts, host: $host, failed_units: $units, error_logs: $logs, dry_activate_ok: $dry_ok, dry_activate_output: $dry_out}')

TMP_QUERY=$(mktemp)
printf "CREATE diagnose CONTENT %s;\n" "$JSON_PAYLOAD" > "$TMP_QUERY"

SDB_RESPONSE=$(surreal sql --endpoint "$SDB_URL" --namespace "$SDB_NS" --database "$SDB_DB" --username "$SDB_USER" --password "$SDB_PASS" --hide-welcome < "$TMP_QUERY" 2>/dev/null || true)
rm -f "$TMP_QUERY"

RECORD_ID=$(echo "$SDB_RESPONSE" | grep -oP 'id: diagnose:\K[^,} ]+' | head -1 || echo "unbekannt")

echo "✅ Bericht lokal: $REPORT_FILE"
if [[ "$RECORD_ID" != "null" && "$RECORD_ID" != "unbekannt" ]]; then
    echo "🚀 SurrealDB Record: $RECORD_ID"
else
    echo "⚠️ SurrealDB: Fehler beim Schreiben oder Verbindung fehlgeschlagen"
fi

rm -f "$DRY_OUT_FILE"
