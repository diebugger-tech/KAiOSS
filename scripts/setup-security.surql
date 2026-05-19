-- KAiOSS Security Schema v1.0
-- Erweiterung zu init_clean.surql (NICHT src/db/init_clean.surql ändern)
-- Tabellen: task_queue, kai_command_log
--
-- Ausführen:
--   surreal sql --endpoint ws://localhost:8000 \
--     --username root --password root \
--     --namespace kaioss --database kaioss \
--     --hide-welcome < scripts/setup-security.surql
--
-- Oder via Makefile:
--   make security-setup

-- === task_queue ===
-- Empfangsschicht für Agenten-Anfragen.
-- cmd-runner.js liest diese Tabelle via LIVE SELECT und führt Befehle aus.
-- Der HITL-Status läuft hier (NICHT in der task-Tabelle).

DEFINE TABLE IF NOT EXISTS task_queue SCHEMAFULL;

DEFINE FIELD alias                 ON task_queue TYPE string;
DEFINE FIELD status                ON task_queue TYPE string DEFAULT 'pending'
    ASSERT $value IN [
        'pending',
        'awaiting_approval',
        'approved',
        'running',
        'done',
        'failed',
        'error',
        'timeout',
        'cancelled'
    ];
DEFINE FIELD approved_by           ON task_queue TYPE option<string>;
DEFINE FIELD approval_requested_at ON task_queue TYPE option<datetime>;
DEFINE FIELD started_at            ON task_queue TYPE option<datetime>;
DEFINE FIELD finished_at           ON task_queue TYPE option<datetime>;
DEFINE FIELD exit_code             ON task_queue TYPE option<int>;
DEFINE FIELD error                 ON task_queue TYPE option<string>;
DEFINE FIELD created_at            ON task_queue TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_task_queue_status ON task_queue FIELDS status;

-- === kai_command_log ===
-- Audit-Trail aller ausgeführten Befehle.
-- Auch abgelehnte und fehlgeschlagene Ausführungen werden hier protokolliert.

DEFINE TABLE IF NOT EXISTS kai_command_log SCHEMAFULL;

DEFINE FIELD command        ON kai_command_log TYPE string;
DEFINE FIELD risiko         ON kai_command_log TYPE string;
DEFINE FIELD status         ON kai_command_log TYPE string;
DEFINE FIELD user_approved  ON kai_command_log TYPE bool DEFAULT false;
DEFINE FIELD approved_by    ON kai_command_log TYPE option<string>;
DEFINE FIELD stdout         ON kai_command_log TYPE option<string>;
DEFINE FIELD stderr         ON kai_command_log TYPE option<string>;
DEFINE FIELD exit_code      ON kai_command_log TYPE option<int>;
DEFINE FIELD timestamp      ON kai_command_log TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_cmd_log_command ON kai_command_log FIELDS command;
DEFINE INDEX idx_cmd_log_ts      ON kai_command_log FIELDS timestamp;
