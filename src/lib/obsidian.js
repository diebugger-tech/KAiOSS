/**
 * Obsidian Integration Utilities for KAiOSS
 */

// --- Frontmatter parser ---
export function parseFrontmatter(raw) {
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
    if (val.startsWith('[') && val.endsWith(']')) {
      fm[key] = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      fm[key] = val;
    }
  }
  return { fm, body: raw.slice(end + 4).trim() };
}

// --- Resolve [[Wikilinks]] ---
export function resolveWikilinks(text) {
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$1 ($2)')
    .replace(/\[\[([^\]]+)\]\]/g, '$1');
}

// --- Stable SurrealDB-safe ID from path ---
export function noteId(path) {
  return path
    .toLowerCase()
    .replace(/\.md$/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

// --- Recursive File Collection (Modern API) ---
export async function collectFiles(dirHandle, base = '') {
  const files = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (name.startsWith('.')) continue;
    if (handle.kind === 'directory') {
      const sub = await collectFiles(handle, `${base}${name}/`);
      files.push(...sub);
    } else if (handle.kind === 'file' && name.endsWith('.md')) {
      files.push({ handle, path: `${base}${name}` });
    }
  }
  return files;
}

// --- Map Obsidian note -> KAiOSS wiki record ---
export function mapNoteToRecord(path, fileName, rawContent, options = {}) {
  const { fm, body } = parseFrontmatter(rawContent);
  const cleanBody = resolveWikilinks(body);
  const title = fm.title || fileName.replace(/\.md$/, '');
  
  return {
    titel: title,
    inhalt: cleanBody.slice(0, 8000),
    typ: fm.type === 'bug' ? 'bug' : fm.type === 'todo' ? 'todo' : 'doc',
    projekt: fm.project || fm.projekt || 'Obsidian',
    status: fm.status || 'open',
    quelle: options.source || 'obsidian',
    obsidian_path: path,
    erstellt: fm.date || fm.created || new Date().toISOString(),
    geaendert: new Date().toISOString(),
    fm // Keep original frontmatter metadata
  };
}
