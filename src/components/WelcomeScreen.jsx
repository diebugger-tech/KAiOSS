import React from 'react';

export default function WelcomeScreen({ onStart, dbStatus }) {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
      textAlign: 'center',
      padding: '2rem',
      fontFamily: "'JetBrains Mono', monospace",
    },
    logoContainer: {
      position: 'relative',
      marginBottom: '3rem',
    },
    logo: {
      fontSize: '5rem',
      fontWeight: 'bold',
      background: 'linear-gradient(45deg, #00ffaa, #00aaff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      filter: 'drop-shadow(0 0 20px rgba(0, 255, 170, 0.3))',
      letterSpacing: '-2px',
    },
    version: {
      position: 'absolute',
      bottom: '-10px',
      right: '0',
      fontSize: '0.8rem',
      color: 'var(--text-muted)',
      backgroundColor: 'var(--bg-primary)',
      padding: '2px 8px',
      border: '1px solid var(--border)',
    },
    title: {
      fontSize: '2.5rem',
      color: 'var(--text-primary)',
      marginBottom: '1rem',
      textTransform: 'uppercase',
      letterSpacing: '4px',
    },
    subtitle: {
      fontSize: '1rem',
      color: 'var(--text-secondary)',
      maxWidth: '600px',
      lineHeight: '1.6',
      marginBottom: '3rem',
    },
    status: {
      fontSize: '0.75rem',
      color: dbStatus === 'ONLINE' ? 'var(--accent-green)' : 'var(--error)',
      marginBottom: '2rem',
      fontFamily: 'monospace',
    },
    button: {
      backgroundColor: 'transparent',
      color: 'var(--accent-green)',
      border: '1px solid var(--accent-green)',
      padding: '1rem 2.5rem',
      fontSize: '1rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      boxShadow: '0 0 15px rgba(0, 255, 170, 0.1)',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '2rem',
      marginTop: '5rem',
      width: '100%',
      maxWidth: '900px',
    },
    card: {
      padding: '1.5rem',
      border: '1px solid var(--border)',
      textAlign: 'left',
      backgroundColor: 'rgba(255,255,255,0.02)',
      transition: 'border-color 0.3s ease',
    },
    cardTitle: {
      color: 'var(--accent-blue)',
      fontSize: '0.9rem',
      marginBottom: '0.5rem',
      display: 'block',
    },
    cardText: {
      color: 'var(--text-muted)',
      fontSize: '0.75rem',
      lineHeight: '1.4',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer} className="welcome-logo-container">
        <div style={styles.logo}>KAiOSS</div>
        <div style={styles.version}>v1.4.0</div>
      </div>

      <h1 style={styles.title}>Initialize System</h1>
      <p style={styles.subtitle}>
        Advanced Kanban orchestration for SurrealDB. 
        High-performance task management with real-time synchronization.
      </p>

      <div style={styles.status}>
        &gt; SYSTEM_STATUS: {dbStatus}
      </div>

      <button 
        style={styles.button}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(0, 255, 170, 0.1)';
          e.target.style.boxShadow = '0 0 25px rgba(0, 255, 170, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.boxShadow = '0 0 15px rgba(0, 255, 170, 0.1)';
        }}
        onClick={onStart}
      >
        [ EXECUTE_BOOT_SEQUENCE ]
      </button>

      <div style={styles.grid}>
        <div style={{ ...styles.card, gridColumn: '1 / -1', backgroundColor: 'rgba(0, 255, 170, 0.05)', borderStyle: 'dashed' }}>
          <span style={styles.cardTitle}>SYSTEM MANIFEST</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            <div>
              <div style={{ color: 'var(--accent-blue)' }}>&gt; IDENTITY:</div>
              <div style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>KAiOSS // AI-native project hub</div>
              
              <div style={{ color: 'var(--accent-blue)' }}>&gt; TERMINAL:</div>
              <div style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>kaioss --version 1.4.0</div>
            </div>
            <div>
              <div style={{ color: 'var(--accent-blue)' }}>&gt; DATABASE:</div>
              <div style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>USE NS kaioss DB kaioss;</div>

              <div style={{ color: 'var(--accent-blue)' }}>&gt; SOURCE:</div>
              <div style={{ color: 'var(--text-primary)' }}>github.com/diebugger-tech/kaioss</div>
            </div>
          </div>
        </div>

        <div style={{ ...styles.card }} className="welcome-card">
          <span style={styles.cardTitle}>Documentation</span>
          <span style={styles.cardText}>Press [?] at any time to open the system wiki and explore features.</span>
        </div>
        <div style={{ ...styles.card }} className="welcome-card">
          <span style={styles.cardTitle}>Command Palette</span>
          <span style={styles.cardText}>Use [CTRL+K] to quickly search projects, tasks, and wiki entries.</span>
        </div>
        <div style={{ ...styles.card }} className="welcome-card">
          <span style={styles.cardTitle}>Real-time Sync</span>
          <span style={styles.cardText}>Leveraging SurrealDB Live Queries for instantaneous updates across all clients.</span>
        </div>
      </div>
    </div>
  );
}
