import React, { useState, useCallback } from 'react';
import db from '../lib/db';

// ─── Frontmatter parser (no deps) ──────────────────────────────────────────
function parseFrontmatter(raw) {
  const fm = {};
  if (!raw.startsWith('---')) return { fm, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { fm, body: raw };
  const block = raw.slice(3, end);
  for (const line of block.split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const val = line.slice(colon + 1).trim();
    // Parse arrays: "tags: [a, b]" or "- item" style (simplified)
    if (val.startsWith('[') && val.endsWith(']')) {
      fm[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      fm[key] = val;
    }
  }
  return { fm, body: raw.slice(end + 4).trim() };
}

// ─── Resolve [[Wikilinks]] to plain text ───────────────────────────────────
function resolveWikilinks(text) {
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$1 ($2)')
    .replace(/\[\[([^\]]+)\]\]/g, '$1');
}

// ─── Stable SurrealDB-safe ID from note path ───────────────────────────────
function noteId(path) {
  // e.g. "Projects/KAiOSS.md" → "projects__kaioss"
  return path
    .toLowerCase()
    .replace(/\.md$/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

// ─── Read all .md files from a directory handle (recursive) ───────────────
async function collectFiles(dirHandle, base = '') {
  const files = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (name.startsWith('.')) continue; // skip .obsidian, .trash, .git
    if (handle.kind === 'directory') {
      const sub = await collectFiles(handle, `${base}${name}/`);
      files.push(...sub);
    } else if (handle.kind === 'file' && name.endsWith('.md')) {
      files.push({ handle, path: `${base}${name}` });
    }
  }
  return files;
}

// ─── ObsidianSync Modal ────────────────────────────────────────────────────
export default function ObsidianSync({ onClose, onNotify }) {
  const [phase, setPhase] = useState('idle'); // idle | picking | scanning | syncing | done | error
  const [progress, setProgress] = useState({ current: 0, total: 0, skipped: 0, upserted: 0 });
  const [log, setLog] = useState([]);
  const [tagFilter, setTagFilter] = useState('kaioss');
  const [errorMsg, setErrorMsg] = useState('');

  const addLog = (msg) => setLog(prev => [...prev.slice(-60), msg]);

  const handleSync = useCallback(async () => {
    // ── 1. Pick vault directory ──────────────────────────────────────────
    let dirHandle;
    try {
      dirHandle = await window.showDirectoryPicker({ mode: 'read' });
    } catch {
      return; // user cancelled
    }

    setPhase('scanning');
    setLog([]);
    setProgress({ current: 0, total: 0, skipped: 0, upserted: 0 });
    addLog('> Scanning vault...');

    // ── 2. Collect all .md files ─────────────────────────────────────────
    let files = [];
    try {
      files = await collectFiles(dirHandle);
    } catch (err) {
      setPhase('error');
      setErrorMsg(`Scan failed: ${err.message}`);
      return;
    }

    addLog(`> Found ${files.length} markdown files`);
    const tags = tagFilter
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);
    addLog(`> Tag filter: ${tags.length > 0 ? tags.map(t => `#${t}`).join(', ') : 'NONE (import all)'}`);

    setPhase('syncing');
    setProgress(p => ({ ...p, total: files.length }));

    let upserted = 0;
    let skipped = 0;

    // ── 3. Process each file ──────────────────────────────────────────────
    for (let i = 0; i < files.length; i++) {
      const { handle, path } = files[i];
      setProgress(p => ({ ...p, current: i + 1 }));

      try {
        const file = await handle.getFile();
        const raw = await file.text();
        const { fm, body } = parseFrontmatter(raw);

        // Tag filter: if a filter is set, skip notes without matching tag
        if (tags.length > 0) {
          const noteTags = Array.isArray(fm.tags)
            ? fm.tags.map(t => t.toLowerCase().replace(/^#/, ''))
            : (typeof fm.tags === 'string' ? fm.tags.toLowerCase().split(',').map(t => t.trim().replace(/^#/, '')) : []);
          const hasTag = tags.some(t => noteTags.includes(t));
          if (!hasTag) {
            skipped++;
            setProgress(p => ({ ...p, skipped }));
            continue;
          }
        }

        const cleanBody = resolveWikilinks(body);
        const id = noteId(path);
        const title = fm.title || handle.name.replace(/\.md$/, '');

        // Map Obsidian note → KAiOSS wiki entry
        const record = {
          titel: title,
          inhalt: cleanBody.slice(0, 8000), // cap at 8k chars
          typ: fm.type === 'bug' ? 'bug' : fm.type === 'todo' ? 'todo' : 'doc',
          projekt: fm.project || fm.projekt || 'Obsidian',
          status: fm.status || 'open',
          quelle: 'obsidian',
          obsidian_path: path,
          erstellt: fm.date || fm.created || new Date().toISOString(),
          geaendert: new Date().toISOString(),
        };

        await db.query(
          `UPSERT type::thing('wiki', $id) CONTENT $data`,
          { id, data: record }
        );

        upserted++;
        setProgress(p => ({ ...p, upserted }));
        if (upserted % 5 === 0 || i < 5) {
          addLog(`  ↑ ${path}`);
        }
      } catch (err) {
        addLog(`  ✗ ${path}: ${err.message}`);
      }
    }

    addLog(`\n> Sync complete: ${upserted} upserted, ${skipped} skipped (no tag match)`);
    setPhase('done');
    onNotify(`Obsidian sync done: ${upserted} notes`, 'success');
  }, [tagFilter, onNotify]);

  const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>[ ESC ]</button>

        <div style={styles.header}>
          <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '1px' }}>
            OBSIDIAN_SYNC
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
            File System Access API → SurrealDB wiki
          </span>
        </div>

        {!isSupported && (
          <div style={styles.warning}>
            ⚠️ File System Access API not supported in this browser.
            Use Chrome or Chromium.
          </div>
        )}

        {/* ── Config ─────────────────────────────────────────────────── */}
        <div style={styles.section}>
          <div style={styles.label}>TAG_FILTER</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Nur Notes mit diesen Tags importieren. Kommagetrennt, ohne #. Leer lassen = alles importieren.
          </div>
          <input
            style={styles.input}
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            placeholder="kaioss, project, ..."
            disabled={phase === 'syncing' || phase === 'scanning'}
          />
        </div>

        {/* ── Action ─────────────────────────────────────────────────── */}
        <button
          style={{
            ...styles.syncBtn,
            opacity: (!isSupported || phase === 'syncing' || phase === 'scanning') ? 0.5 : 1,
            cursor: (!isSupported || phase === 'syncing' || phase === 'scanning') ? 'not-allowed' : 'pointer',
          }}
          onClick={handleSync}
          disabled={!isSupported || phase === 'syncing' || phase === 'scanning'}
        >
          {phase === 'scanning' ? '> SCANNING VAULT...' :
           phase === 'syncing' ? `> SYNCING... ${progress.current}/${progress.total}` :
           phase === 'done' ? '> SYNC AGAIN' :
           '> SELECT VAULT & SYNC'}
        </button>

        {/* ── Progress bar ────────────────────────────────────────────── */}
        {(phase === 'syncing' || phase === 'done') && progress.total > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              />
            </div>
            <div style={styles.progressStats}>
              <span>↑ {progress.upserted} upserted</span>
              <span>— {progress.skipped} skipped</span>
              <span style={{ marginLeft: 'auto' }}>{progress.current}/{progress.total} files</span>
            </div>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div style={styles.warning}>{errorMsg}</div>
        )}

        {/* ── Log ─────────────────────────────────────────────────────── */}
        {log.length > 0 && (
          <div style={styles.logBox}>
            {log.map((line, i) => (
              <div key={i} style={{ color: line.startsWith('  ✗') ? 'var(--error)' : line.startsWith('\n') ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                {line}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '1rem', fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
          Notes landen in <span style={{ color: 'var(--accent-green)' }}>wiki</span> Table →{' '}
          <span style={{ color: 'var(--accent-green)' }}>typ: doc/bug/todo</span> je nach Frontmatter-Feld <code>type:</code>.<br />
          Existing entries werden per <code>UPSERT</code> aktualisiert (kein Duplikat-Problem).
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    paddingTop: '10vh', zIndex: 2100,
  },
  modal: {
    width: '100%', maxWidth: '560px',
    backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)',
    boxShadow: '0 0 40px rgba(0,0,0,0.6)', padding: '2rem',
    fontFamily: 'monospace', position: 'relative',
    maxHeight: '80vh', overflowY: 'auto',
  },
  header: {
    display: 'flex', flexDirection: 'column', gap: '0.2rem',
    marginBottom: '1.5rem', paddingBottom: '1rem',
    borderBottom: '1px solid var(--border)',
  },
  closeBtn: {
    position: 'absolute', top: '1rem', right: '1rem',
    background: 'transparent', border: 'none',
    color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'monospace',
  },
  section: { marginBottom: '1.25rem' },
  label: {
    fontSize: '0.7rem', color: 'var(--text-muted)',
    letterSpacing: '1px', marginBottom: '0.4rem',
  },
  input: {
    width: '100%', padding: '0.6rem',
    backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-green)',
    border: '1px solid var(--border)', fontFamily: 'monospace',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
  },
  syncBtn: {
    width: '100%', padding: '0.9rem',
    backgroundColor: 'rgba(0,255,170,0.08)',
    border: '1px solid var(--accent-green)',
    color: 'var(--accent-green)', fontFamily: 'monospace',
    fontSize: '0.9rem', letterSpacing: '0.5px',
    transition: 'background 0.2s',
  },
  progressBar: {
    height: '4px', backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '2px', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: 'var(--accent-green)',
    boxShadow: '0 0 8px var(--accent-green)',
    transition: 'width 0.3s ease',
  },
  progressStats: {
    display: 'flex', gap: '1rem',
    fontSize: '0.7rem', color: 'var(--text-muted)',
    marginTop: '0.4rem',
  },
  warning: {
    padding: '0.8rem', backgroundColor: 'rgba(255,68,68,0.1)',
    border: '1px solid var(--error)', color: 'var(--error)',
    fontSize: '0.8rem', marginBottom: '1rem',
  },
  logBox: {
    marginTop: '1rem', maxHeight: '200px', overflowY: 'auto',
    backgroundColor: 'var(--bg-secondary)', padding: '0.8rem',
    border: '1px solid var(--border)', fontSize: '0.7rem',
    lineHeight: '1.6',
  },
};
