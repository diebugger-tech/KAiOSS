-- ============================================================
-- KAiOSS — SurrealDB Server-Side Events Setup
-- Run once: surreal import --conn ws://localhost:8000 --ns kaioss --db kaioss --user root --pass root scripts/setup-db-events.surql
-- ============================================================

-- Auto-update timestamp on every UPDATE (removes need to set it in frontend)
DEFINE EVENT auto_updated ON TABLE projekt
  WHEN $event = "UPDATE"
  THEN UPDATE $after SET updated = time::now();

DEFINE EVENT auto_updated ON TABLE wiki
  WHEN $event = "UPDATE"
  THEN UPDATE $after SET updated = time::now();

-- Log all projekt deletions to an audit trail table
DEFINE EVENT audit_delete ON TABLE projekt
  WHEN $event = "DELETE"
  THEN CREATE audit SET
    table = "projekt",
    record_id = $before.id,
    action = "DELETE",
    snapshot = $before,
    deleted_at = time::now();
