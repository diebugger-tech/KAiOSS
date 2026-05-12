# KAiOSS

> AI-native project hub — Kanban, Wiki, Multi-Model KAi, powered by SurrealDB + React

![SurrealDB](https://img.shields.io/badge/SurrealDB-2.x-ff00a0?style=for-the-badge&logo=surrealdb)
![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)
![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge)

```
> kaioss --version 1.4.0
> kaioss::ready
```

---

## Vision

KAiOSS ist mehr als ein Kanban-Tool.

Die Idee: **Alle KI-Chats und Projektdaten gebündelt in einer einzigen SurrealDB** — lokal, privat, unter deiner Kontrolle.

Claude, Gemini, Perplexity, OpenAI, Groq, Ollama — jedes Gespräch, jede Entscheidung, jeder Plan wird in deiner eigenen Datenbank gespeichert. KAiOSS wird zur zentralen Schaltzentrale für KI-gestütztes Arbeiten.

```
Claude ──┐
Gemini ──┤
Groq   ──┼──→ KAiOSS DB (SurrealDB) ──→ Projekte
Ollama ──┤                               Wiki
OpenAI ──┘                               Chat-History
                                         TODOs
```

---

## Kernprinzipien

- **Lokal first** — alle Daten bleiben auf deinem Gerät
- **Open Source** — Apache 2.0, Community-ready
- **Model-agnostisch** — kein Lock-in auf einen Anbieter
- **Privacy by Design** — API Keys nur in localStorage, nie in der DB
- **SurrealDB** — eine DB für alles: Relationen, Live Queries, Realtime

---

## Stack

| Layer | Technologie |
|-------|-------------|
| Frontend | React 18 + Vite 6 |
| Datenbank | SurrealDB 2.x |
| KAi Engine | Claude / Gemini / Groq / Ollama / OpenRouter |
| Agent | Goose + OpenCode |
| Styling | CSS Variables, Terminal-Ästhetik |

---

## Features

### v1.3 — Stabil ✅
- Kanban Board mit Drag & Drop
- Wiki Panel (dynamisch aus SurrealDB)
- TodoPanel mit Snap-Points
- Backup Export (Terminal-Log)
- Wiki Auto-Sync bei neuen Projekten
- System-Manifest pro Projekt
- TODO-Progress Kanban-Balken

### v1.4 — Aktuell 🔄
- Ghost Drop Indicator
- Board.jsx Refactor (globaler dropTarget State)
- KAi Wiki-Search in Cmd+K mit `[DOC]`/`[BUG]`/`[TODO]` Badges
- KAi Fallback via Ollama wenn keine Wiki-Treffer
- Obsidian Vault → SurrealDB Sync Button (File System Access API)
- Auto-Save im DetailPanel (500ms Debounce)

### v1.5 — Geplant 📋
- Multi-Model KAi Hub (Claude, Gemini, Groq, Ollama)
- Chat-History in SurrealDB
- Remote DB Sync
- Chat-History Import (Claude/Gemini JSON Export)
- Ghost Drop zwischen Spalten (Cross-Column Reorder)
- Suchbegriff-Highlighting im Wiki

### v2.0 — Vision 🚀
- Vollständiger KI-Hub
- Zugriffskontrolle (`privat | team | öffentlich`)
- Multi-User (Team-Modus)
- Community Release
- SurrealDB Showcase Einreichung

---

## Datenschutz & Zugriffskontrolle

KAiOSS speichert **keine** API Keys in der Datenbank.

```
localStorage  → API Keys (nur lokal, nie übertragen)
SurrealDB     → Chat-History, Wiki, Projekte, TODOs
Remote Sync   → optional, explizit aktivierbar
```

Zugriffskontrolle (v2.0):
- Jeder Chat-Eintrag hat einen `sichtbarkeit` Flag: `privat | team | öffentlich`
- SurrealDB `DEFINE SCOPE` für User-basierte Zugriffskontrolle
- Lokale Instanz = voller Zugriff, Remote = nur freigegebene Daten

---

## Installation

```bash
git clone https://github.com/diebugger-tech/kaioss
cd kaioss
npm install

# SurrealDB starten (lokal)
surreal start --log trace --user root --pass root memory

# Dev Server
npm run dev
```

### Umgebungsvariablen

```env
VITE_SURREAL_URL=http://127.0.0.1:8000/rpc
VITE_SURREAL_USER=root
VITE_SURREAL_PASS=root
VITE_SURREAL_NS=kaioss
VITE_SURREAL_DB=kaioss
```

### SurrealDB Schema

```sql
USE NS kaioss DB kaioss;
-- Tabellen werden automatisch via db/init.surql angelegt
```

---

## Entwickelt mit

```
Planung       → Claude (Anthropic)
Code          → Gemini 2.5 Flash (antigravity)
Ausführung    → Goose + OpenCode
Reasoning     → Qwen3 32B (Groq)
```

---

## Contributing

KAiOSS ist Open Source (Apache 2.0).
Issues, PRs und Ideen sind willkommen.

Lies [`MILESTONES.md`](./MILESTONES.md) für den aktuellen Entwicklungsstand.

---

*KAiOSS — KAi Open Source System, powered by SurrealDB*
