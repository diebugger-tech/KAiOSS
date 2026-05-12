import React from 'react';
import { createBackup } from '../utils/backup';

export default function Navbar({ theme, toggleTheme, dbStatus, onWikiOpen, onTodoOpen, onCreateOpen, onObsidianSync, showToast }) {
  const handleBackup = () => {
    createBackup({
      url: import.meta.env.VITE_SURREAL_URL,
      user: import.meta.env.VITE_SURREAL_USER,
      pass: import.meta.env.VITE_SURREAL_PASS,
      ns: import.meta.env.VITE_SURREAL_NS,
      db: import.meta.env.VITE_SURREAL_DB,
      showToast
    });
  };

  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '3rem', 
      borderBottom: '1px solid var(--border)', 
      paddingBottom: '1rem' 
    }}>
      <div>
        <h1 className="logo-text" style={{ margin: 0, fontSize: '1.8rem', letterSpacing: '2px' }}>
          <span className="k-part">K</span>
          <span className="ai-part">Ai</span>
          <span className="os-part">OS</span>
          <span className="s-part">S</span>
        </h1>
        <div className="logo-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', transition: 'all 0.3s ease' }}>
          AI-native project hub // v1.4.0
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button 
            onClick={onCreateOpen}
            style={{ ...styles.actionBtn, color: 'var(--accent-blue)', fontWeight: 'bold' }}
            title="Neues Projekt [+]"
          >
            +
          </button>
          <button 
            onClick={handleBackup}
            style={styles.actionBtn}
            title="Datenbank-Backup erstellen [💾]"
          >
            💾
          </button>
          <button
            onClick={onObsidianSync}
            style={{ ...styles.actionBtn, color: 'var(--accent-blue)' }}
            title="Obsidian Vault → SurrealDB Wiki synchronisieren"
          >
            🔮
          </button>
          <button 
            onClick={onWikiOpen}
            style={styles.actionBtn}
            title="Wiki / Hilfe [?]"
          >
            ?
          </button>
          <button 
            onClick={onTodoOpen}
            style={styles.actionBtn}
            title="Todos [T]"
          >
            T
          </button>
        </div>

        <button 
          onClick={toggleTheme}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: 'var(--bg-secondary)', 
            color: 'var(--text-primary)', 
            border: '1px solid var(--border)', 
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          THEME: [{theme.toUpperCase()}]
        </button>
        <div style={{ 
          padding: '0.5rem 1rem', 
          border: '1px solid var(--border)', 
          color: dbStatus === 'ONLINE' ? 'var(--accent-green)' : (dbStatus === 'CONNECTING...' ? 'var(--accent-orange)' : 'var(--error)'), 
          fontSize: '0.8rem' 
        }}>
          DB_STATUS: [{dbStatus}]
        </div>
      </div>
    </header>
  );
}

const styles = {
  actionBtn: {
    padding: '0.5rem 0.8rem', 
    backgroundColor: 'var(--bg-secondary)', 
    color: 'var(--accent-green)', 
    border: '1px solid var(--border)', 
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};
