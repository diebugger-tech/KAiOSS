# AI Agent Constraints & Architecture (KAiOSS)

> Global context and technical constraints for AI coding agents working on this repository.
> Repo: github.com/diebugger-tech/KAiOSS

## 🏗 Project Structure
- `src/components/`: Modular UI components (Columns, Cards, DetailPanel).
- `src/lib/db.js`: Centralized SurrealDB connection logic (Singleton).
- `src/hooks/`: Custom React hooks for data fetching and live updates.
- `src/App.jsx`: Main application orchestration.
- `system-check.sh`: Automated environment diagnostics.

## 🤖 Critical Rules for Agents
1. **db.js is Singleton**: Do NOT initialize multiple connections. Use the shared instance.
2. **Environment Variables**: Access all configuration via `import.meta.env.VITE_*`.
3. **LIVE SELECT**: Always use Live Queries for real-time data synchronization.
4. **No Backend**: All logic is handled via frontend and SurrealDB. No custom API middleware.
5. **NixOS Compatibility**: All shell scripts must use `#!/usr/bin/env bash`.
6. **Code Style**: Functional React 18 components with Runes-like clarity (hooks).

## 🔧 Verification
- Verify changes using `npm run dev`.
- Ensure new features adhere to the terminal dark theme aesthetic.

