// KAiOSS — KanbanCard
// Mit data-card Attribut für Ghost Calculation v1.4

import React from 'react';

export default function KanbanCard({ project, onDragStart, onDragEnd, onClick, wikiStats }) {
  const stats = wikiStats[project.name] || { done: 0, total: 0 };
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  const styles = {
    card: {
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '1rem',
      marginBottom: '1rem',
      cursor: 'grab',
      transition: 'all 0.2s ease',
      borderLeft: '4px solid var(--accent-green)'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.8rem',
      marginBottom: '0.5rem'
    },
    icon: { fontSize: '1.2rem' },
    cardTitle: {
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: 'var(--accent-green)',
      margin: 0
    },
    stack: {
      fontSize: '0.7rem',
      color: 'var(--text-muted)',
      marginBottom: '0.8rem',
      fontStyle: 'italic'
    },
    desc: {
      fontSize: '0.75rem',
      color: 'var(--text-secondary)',
      lineHeight: '1.4',
      marginBottom: '1rem'
    },
    pulseContainer: {
      marginTop: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.3rem'
    },
    pulseBar: {
      height: '4px',
      backgroundColor: 'var(--bg-tertiary)',
      borderRadius: '2px',
      overflow: 'hidden'
    },
    pulseFill: {
      height: '100%',
      backgroundColor: 'var(--accent-green)',
      width: `${progress}%`,
      transition: 'width 0.5s ease-out',
      boxShadow: '0 0 10px rgba(0, 255, 170, 0.4)'
    },
    pulseText: {
      fontSize: '0.6rem',
      color: 'var(--text-muted)',
      display: 'flex',
      justifyContent: 'space-between'
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.4rem',
      marginTop: '0.8rem'
    },
    tag: {
      fontSize: '0.65rem',
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--accent-green)',
      padding: '2px 6px',
      borderRadius: '2px',
      border: '1px solid var(--border)'
    },
  };

  return (
    <div
      data-card={project.id}
      style={styles.card}
      draggable
      onDragStart={(e) => onDragStart(e, project.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(project.id)}
    >
      <div style={styles.cardHeader}>
        <span style={styles.icon}>{project.icon || '📦'}</span>
        <h3 style={styles.cardTitle}>{project.name}</h3>
      </div>
      <div style={styles.stack}>{project.stack}</div>
      <div style={styles.desc}>{project.desc}</div>
      
      <div style={styles.pulseContainer}>
        <div style={styles.pulseText}>
          <span>PROJECT_PULSE</span>
          <span>{progress}%</span>
        </div>
        <div style={styles.pulseBar}>
          <div style={styles.pulseFill} />
        </div>
      </div>

      <div style={styles.tagsContainer}>
        {Array.isArray(project.tags) && project.tags.map((tag, idx) => (
          <span key={idx} style={styles.tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}
