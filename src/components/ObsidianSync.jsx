import React, { useState, useCallback } from 'react';
import db from '../lib/db';
import { 
  collectFiles, 
  noteId, 
  mapNoteToRecord, 
  parseFrontmatter 
} from '../lib/obsidian';
import './ObsidianSync.css';

export default function ObsidianSync({ onClose, onNotify }) {
  const [phase, setPhase] = useState('idle'); // idle | picking | scanning | syncing | done | error
  const [progress, setProgress] = useState({ current: 0, total: 0, skipped: 0, upserted: 0 });
  const [log, setLog] = useState([]);
  const [tagFilter, setTagFilter] = useState('kaioss');
  const [errorMsg, setErrorMsg] = useState('');

  const addLog = (msg) => setLog(prev => [...prev.slice(-60), msg]);

  const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const handleSync = useCallback(async () => {
    let dirHandle;
    try {
      dirHandle = await window.showDirectoryPicker({ mode: 'read' });
    } catch { return; }

    setPhase('scanning');
    setLog([]);
    setProgress({ current: 0, total: 0, skipped: 0, upserted: 0 });
    addLog('> Scanning vault...');

    let files = [];
    try {
      files = await collectFiles(dirHandle);
    } catch (err) {
      setPhase('error');
      setErrorMsg(`Scan failed: ${err.message}`);
      return;
    }

    addLog(`> Found ${files.length} markdown files`);
    const tags = tagFilter.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
    
    setPhase('syncing');
    setProgress(p => ({ ...p, total: files.length }));

    let upserted = 0;
    let skipped = 0;

    for (let i = 0; i < files.length; i++) {
      const { handle, path } = files[i];
      setProgress(p => ({ ...p, current: i + 1 }));

      try {
        const file = await handle.getFile();
        const raw = await file.text();
        const record = mapNoteToRecord(path, handle.name, raw, { source: 'obsidian' });

        // Tag filter check
        if (tags.length > 0) {
          const noteTags = Array.isArray(record.fm.tags) 
            ? record.fm.tags.map(t => t.toLowerCase().replace(/^#/, '')) 
            : [];
          if (!tags.some(t => noteTags.includes(t))) {
            skipped++;
            setProgress(p => ({ ...p, skipped }));
            continue;
          }
        }

        const id = noteId(path);
        await db.query(`UPSERT type::thing('wiki', $id) CONTENT $data`, { id, data: record });

        upserted++;
        setProgress(p => ({ ...p, upserted }));
        if (upserted % 5 === 0 || i < 5) addLog(`  ↑ ${path}`);
      } catch (err) { addLog(`  ✗ ${path}: ${err.message}`); }
    }

    setPhase('done');
    onNotify(`Obsidian sync done: ${upserted} notes`, 'success');
  }, [tagFilter, onNotify]);

  return (
    <div className="obsidian-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="obsidian-modal">
        <button onClick={onClose} className="obsidian-close-btn">[ ESC ]</button>

        <div className="obsidian-header">
          <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '1px' }}>
            OBSIDIAN_SYNC
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
            File System Access API → SurrealDB wiki
          </span>
        </div>

        {!isSupported && (
          <div className="obsidian-warning">
            <div style={{ fontWeight: 'bold', marginBottom: '0.4rem' }}>⚠️ API_UNSUPPORTED</div>
            <div style={{ fontSize: '0.75rem' }}>
              Die <strong>File System Access API</strong> wird in diesem Browser nicht unterstützt.<br/><br/>
              • <strong>Brave:</strong> Aktiviere <code>#file-system-access-api</code> in <code>brave://flags</code>.<br/>
              • <strong>Firefox:</strong> Unterstützt diese API aktuell nicht (Datenschutz-Vorgabe).<br/>
              • <strong>Empfehlung:</strong> Nutze Chrome, Edge oder einen Chromium-Browser.
            </div>
          </div>
        )}

        <div className="obsidian-section">
          <div className="obsidian-label">TAG_FILTER</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Nur Notes mit diesen Tags importieren. Kommagetrennt, ohne #. Leer lassen = alles importieren.
          </div>
          <input
            className="obsidian-input"
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            placeholder="kaioss, project, ..."
            disabled={phase === 'syncing' || phase === 'scanning'}
          />
        </div>

        {isSupported ? (
          <button
            className="obsidian-sync-btn"
            style={{ opacity: (phase === 'syncing' || phase === 'scanning') ? 0.5 : 1 }}
            onClick={handleSync}
            disabled={phase === 'syncing' || phase === 'scanning'}
          >
            {phase === 'scanning' ? '> SCANNING VAULT...' :
             phase === 'syncing' ? `> SYNCING... ${progress.current}/${progress.total}` :
             phase === 'done' ? '> SYNC AGAIN' :
             '> SELECT VAULT & SYNC'}
          </button>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              className="obsidian-sync-btn"
              style={{ 
                opacity: (phase === 'syncing' || phase === 'scanning') ? 0.5 : 1,
                backgroundColor: 'rgba(0, 170, 255, 0.08)',
                borderColor: 'var(--accent-blue)',
                color: 'var(--accent-blue)'
              }}
              onClick={() => document.getElementById('legacy-vault-input').click()}
              disabled={phase === 'syncing' || phase === 'scanning'}
            >
              {phase === 'syncing' ? `> SYNCING... ${progress.current}/${progress.total}` : '> SELECT VAULT (LEGACY MODE)'}
            </button>
            <input 
              id="legacy-vault-input"
              type="file" 
              webkitdirectory="true" 
              directory="true"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const fileList = Array.from(e.target.files).filter(f => f.name.endsWith('.md'));
                if (fileList.length === 0) return;
                
                setPhase('syncing');
                setLog([]);
                setProgress({ current: 0, total: fileList.length, skipped: 0, upserted: 0 });
                addLog(`> Legacy Scan: Found ${fileList.length} markdown files`);
                
                const tags = tagFilter.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);

                let upserted = 0;
                let skipped = 0;

                for (let i = 0; i < fileList.length; i++) {
                  const file = fileList[i];
                  const path = file.webkitRelativePath || file.name;
                  setProgress(p => ({ ...p, current: i + 1 }));

                  try {
                    const raw = await file.text();
                    const record = mapNoteToRecord(path, file.name, raw, { source: 'obsidian-legacy' });

                    if (tags.length > 0) {
                      const noteTags = Array.isArray(record.fm.tags) ? record.fm.tags.map(t => t.toLowerCase().replace(/^#/, '')) : [];
                      if (!tags.some(t => noteTags.includes(t))) {
                        skipped++;
                        setProgress(p => ({ ...p, skipped }));
                        continue;
                      }
                    }

                    const id = noteId(path);
                    await db.query(`UPSERT type::thing('wiki', $id) CONTENT $data`, { id, data: record });

                    upserted++;
                    setProgress(p => ({ ...p, upserted }));
                    if (upserted % 5 === 0 || i < 5) addLog(`  ↑ ${path}`);
                  } catch (err) { addLog(`  ✗ ${path}: ${err.message}`); }
                }
                setPhase('done');
                onNotify(`Obsidian legacy sync done: ${upserted} notes`, 'success');
              }}
            />
          </div>
        )}

        {(phase === 'syncing' || phase === 'done') && progress.total > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <div className="obsidian-progress-bar">
              <div
                className="obsidian-progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <div className="obsidian-progress-stats">
              <span>↑ {progress.upserted} upserted</span>
              <span>— {progress.skipped} skipped</span>
              <span style={{ marginLeft: 'auto' }}>{progress.current}/{progress.total} files</span>
            </div>
          </div>
        )}

        {phase === 'error' && <div className="obsidian-warning">{errorMsg}</div>}

        {log.length > 0 && (
          <div className="obsidian-log-box">
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
