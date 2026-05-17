# KAiOSS — TODOs & Listen

_Stand: 17.05.2026_

---

## Workflow (Architektur-Review)

1. **Claude** — Architektur / Design
2. **Gemini** — kritisches Review
3. **Claude** — finales Review von Geminis Feedback
4. **Gemini** — Implementierung (nur auf explizites "Go" vom User)

Iterationstiefe flexibel je nach Zeit und Komplexität — kein starres Prozessmodell.

---

## Phase 1 — Foundation & Security

| ID | Task | depends_on | Status |
|----|------|------------|--------|
| #25 | Architektur-Review Workflow etablieren | — | ✅ done |
| #23 | Task-Schema konsistenter machen | #25 | ✅ done — siehe finales Schema unten |
| #16 | Datensicherung mit Hash-Werten (sha256) | — | ⬜ offen |
| #3 | Skill: kaioss-security | — | ⬜ offen |
| #21 | Human-in-the-Loop Konzept | #3 | ⬜ offen |

---

## Phase 2 — KAi Bootstrap

| ID | Task | depends_on | Status |
|----|------|------------|--------|
| #29 | Agent-Priorisierung | — | ⬜ offen |
| #7 | Modell-Wahl für KAi | — | ⬜ offen |
| #2 | Skills erstellen (.kai/) | — | ⬜ offen |
| #15 | Modulare Prompt-Pipeline | #2, #3 | ⬜ offen |
| #8 | KAi Priorisierungslogik | #23 | ⬜ offen |

**Nächster Schritt (Phase 2 Vorbereitung):**
- `useTaskDB` Hook — Architektur-Entwurf: Claude → Gemini Review → Claude finales Review → Gemini implementiert
- `TodoPanel.jsx` Umbau auf task-Table — gleicher Workflow

---

## Phase 3 — Infrastruktur & Resilienz

| ID | Task | depends_on | Status |
|----|------|------------|--------|
| #19 | SurrealDB als Event-Bus | #23 | ⬜ offen |
| #4 | Resilienz (Recovery, Locking) | #19 | ⬜ offen |
| #22 | Task-Verifikation + proaktives Review | #23, #21 | ⬜ offen |
| #11 | NixOS-native Integration (agents.nix) | #3, #4 | ⬜ offen |
| #30a | LISTE2 in SurrealDB migrieren | #23, #19 | ✅ done |

---

## Phase 4 — Ecosystem & Expansion

| ID | Task | depends_on | Status |
|----|------|------------|--------|
| #13 | Agent-Pipeline | #19, #29 | ⬜ offen |
| #18 | Agent-Governance | #13 | ⬜ offen |
| #17 | LearnAgent Quellen | #13 | ⬜ offen |
| #31 | TODO.md -> SurrealDB Sync (GitAgent Use-Case) | — | ✅ done |
| #24 | FalkorDB Phase 2 (CabellistPro) | — | ⬜ offen |

---

## Phase 5 — Horizon / Data-Driven Evolution

| ID | Task | depends_on | Status |
|----|------|------------|--------|
| #26 | Fine-Tuning auf kai_log-Daten | Phase 1–4 | ⬜ offen |
| #28 | Cognee-Trigger definieren | #26 | ⬜ offen |
| #6 | TUI evaluieren | Web-UI stabil | ⬜ offen |
| #9 | Multi-User → GitHub Issue | — | ⬜ offen |
| #10 | Pi.dev evaluieren | — | ⬜ offen |
| #14 | Hermes Agent als Referenz | — | ⬜ offen |
| #20 | Skills als Nix-Flake-Outputs | #2 stabil | ⬜ offen |
| #30 | Voice-Interface (Pipecat > LiveKit) | Web-UI stabil | ⬜ offen |

---

## Referenzen

- **#1** Cognee — additiver Layer on top of SurrealDB, kein Ersatz. Integration erst wenn konkrete Freitext-Use-Cases definiert
- **#12** Agent-Optionen (Entscheidung später): SecurityAgent, GitAgent, DocAgent, ReviewAgent, DepAgent, TestAgent, LearnAgent, CogneeAgent, MarketAgent — alle als NixOS-Services, Scoped SurrealDB-User (Least Privilege)
- **#27** Kernprinzip: Tool bleibt schlank. SurrealDB = Obsidian-Ersatz. Kein Feature-Creep

---

## Finales Task-Schema (#23 ✅)

Ergebnis nach 4 Reviews: Claude → Gemini → DeepSeek R1 → Gemini Pro

```surql
-- === task table ===
DEFINE TABLE task SCHEMAFULL;

DEFINE FIELD titel                      ON task TYPE string;
DEFINE FIELD beschreibung               ON task TYPE option<string>;
DEFINE FIELD projekt                    ON task TYPE string;
DEFINE FIELD status                     ON task TYPE string
    DEFAULT 'offen'
    ASSERT $value IN ['offen','in_arbeit','blockiert','done'];
DEFINE FIELD risiko                     ON task TYPE string
    DEFAULT 'medium'
    ASSERT $value IN ['low','medium','high','critical'];
DEFINE FIELD verifikation               ON task TYPE string
    DEFAULT 'ausstehend'
    ASSERT $value IN ['ausstehend','bestanden','abgelehnt'];
DEFINE FIELD verifiziert_von            ON task TYPE option<string>
    ASSERT $value = NONE OR $value IN ['kai','validationagent','human'];
DEFINE FIELD zugewiesen_an              ON task TYPE option<string>;
DEFINE FIELD akzeptanzkriterien         ON task TYPE array<object> DEFAULT [];
DEFINE FIELD akzeptanzkriterien.*.kriterium ON task TYPE string;
DEFINE FIELD akzeptanzkriterien.*.erfüllt   ON task TYPE bool DEFAULT false;
DEFINE FIELD depends_on                 ON task TYPE array<record<task>> DEFAULT [];
DEFINE FIELD priorität                  ON task TYPE option<int>;
DEFINE FIELD tags                       ON task TYPE option<array<string>>;
DEFINE FIELD erstellt                   ON task TYPE datetime DEFAULT time::now();
DEFINE FIELD geändert                   ON task TYPE datetime VALUE time::now();

DEFINE INDEX idx_task_status    ON task FIELDS status;
DEFINE INDEX idx_task_projekt   ON task FIELDS projekt;
DEFINE INDEX idx_task_priorität ON task FIELDS priorität;

-- Guards: app-seitig (React + ValidationAgent) — kein DB-EVENT wegen async-Problem

-- === kai_log table ===
DEFINE TABLE kai_log SCHEMAFULL;

DEFINE FIELD task      ON kai_log TYPE record<task>;
DEFINE FIELD agent     ON kai_log TYPE string;
DEFINE FIELD modell    ON kai_log TYPE string;
DEFINE FIELD aktion    ON kai_log TYPE string
    ASSERT $value IN ['prompt','response','update','verify','error'];
DEFINE FIELD prompt    ON kai_log TYPE option<string>;
DEFINE FIELD response  ON kai_log TYPE option<string>;
DEFINE FIELD ergebnis  ON kai_log TYPE option<string>;
DEFINE FIELD bewertung ON kai_log TYPE option<int>;
DEFINE FIELD timestamp ON kai_log TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_kai_log_task ON kai_log FIELDS task;
```

**Design-Entscheidungen:**
- Guards app-seitig (React + ValidationAgent) — DB-EVENTs in SurrealDB sind asynchron, THROW rollt Transaktion nicht zurück
- `kai_log` umgekehrt verlinkt (`kai_log.task`) — Task-Record bleibt schlank, kein wachsendes Array
- `depends_on` als `array<record<task>> DEFAULT []` — kein `option`, einfacher zu querien
- Zirkuläre Deps: App-seitig per DFS, self-cycle zusätzlich DB-seitig möglich
- `akzeptanzkriterien` embedded — kein Reuse-Pattern im MVP, kein JOIN-Overhead
