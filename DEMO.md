# KAiOSS Demo Setup

Dieses Repository enthält einen vollständig isolierten Demo-Modus, um die KAiOSS Kanban-Board Benutzeroberfläche mit Beispieldaten auszuprobieren. Deine echten Projektdaten bleiben dabei zu 100% geschützt.

## 🚀 Schnellstart (3 Befehle)

```bash
# 1. SurrealDB lokal starten (falls nicht bereits aktiv)
make db-start

# 2. Demo-Daten im isolierten demo-Namespace laden & Server starten
make db-demo

# 3. Der Server startet auf http://localhost:5174
```

## ✨ Was du im Demo-Modus siehst

- **3 Demo-Projekte:** KAiOSS Demo, CabellistPro Demo (komplett fiktive Dummy-Daten) und Pflanternen Demo.
- **Tasks in verschiedenen Phasen:** Aufgaben in `offen`, `in_arbeit`, `blockiert` und `done` mit echten Akzeptanzkriterien.
- **Fortschrittsbalken:** Das Roadmap-HUD berechnet die Fortschritte live aus den Akzeptanzkriterien.
- **Umfangreiches Wiki:** Vollständig befüllte Dokumente, simulierte Fehlerberichte, Todos und Diagnose-Einträge.

## 🛡️ Sicherheit: Deine echten Daten sind sicher

Der Demo-Modus läuft im isolierten SurrealDB-Namespace `demo` und der Datenbank `demo`.
* Deine produktiven Daten in `kaioss` werden **nie berührt**.
* Das Hintergrund-Synchronisations-Script (`scripts/todo-sync.js`) schaltet im Demo-Modus automatisch auf den `demo`-Namespace um.

## 🗑️ Demo zurücksetzen

Wenn du die Demo-Datenbank wipen und wieder frisch aufsetzen möchtest:

```bash
make db-reset
```

**Sicherheitsfeatures beim Reset:**
1. **Production-Blocker:** Verhindert das Zurücksetzen von echten Namespaces wie `kaioss` oder `kanban`.
2. **Explizite Bestätigung:** Du musst den Reset explizit mit `yes` bestätigen.
3. **Audit-Log:** Jede Zurücksetzung wird revisionssicher unter `logs/db-operations.log` dokumentiert.

## 📁 Eigene produktive Daten nutzen

Um wieder deine echten, produktiven Daten anzuzeigen:

1. Stelle sicher, dass in deiner `.env`-Datei folgendes konfiguriert ist:
   ```env
   VITE_SURREAL_NS=kaioss
   VITE_SURREAL_DB=kaioss
   ```
2. Starte KAiOSS wie gewohnt über:
   ```bash
   make dev
   ```
