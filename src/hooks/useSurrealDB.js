import { useState, useEffect, useRef } from 'react';
import db from '../lib/db';

const STORAGE_KEY = 'surreal_kanban_cache';

/**
 * useSurrealDB Hook
 * Handles real-time project synchronization with SurrealDB.
 * Implements a localStorage fallback for offline support.
 */
export function useSurrealDB() {
  const [projects, setProjects] = useState([]);
  const [dbStatus, setDbStatus] = useState('CONNECTING...');
  const [dbError, setDbError] = useState(null);
  const [loading, setLoading] = useState(true);
  const liveQueryId = useRef(null);

  useEffect(() => {
    async function initDB() {
      try {
        setLoading(true);
        setDbError(null);
        
        // Close any stale connection first (e.g. after HMR or previous failed attempt)
        try { await db.close(); } catch (_) { /* ignore */ }

        // Attempt connection
        await db.connect(import.meta.env.VITE_SURREAL_URL, {
          namespace: import.meta.env.VITE_SURREAL_NS,
          database: import.meta.env.VITE_SURREAL_DB,
          authentication: { 
            username: import.meta.env.VITE_SURREAL_USER, 
            password: import.meta.env.VITE_SURREAL_PASS 
          }
        });
        
        setDbStatus('ONLINE');

        // Initial fetch from projects table
        const initialProjects = await db.query('SELECT * FROM projekt').then(r => r[0]);
        if (initialProjects) {
          const data = initialProjects.result || initialProjects; // Handle different SDK response formats
          setProjects(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }

        // Live Subscription for real-time updates
        liveQueryId.current = await db.live('projekt', ({ action, result }) => {
          setProjects(prev => {
            let next;
            if (action === 'CREATE') {
              next = [...prev, result];
            } else if (action === 'UPDATE' || action === 'CHANGE') {
              const exists = prev.find(p => p.id === result.id);
              next = exists ? prev.map(p => p.id === result.id ? result : p) : [...prev, result];
            } else if (action === 'DELETE') {
              next = prev.filter(p => p.id !== result.id);
            } else {
              next = prev;
            }
            // Update local cache on every live change
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        });

      } catch (err) {
        console.error('SurrealDB Connection Error:', err);
        setDbError(err.message || String(err));
        
        // Fallback to localStorage if SurrealDB is unreachable
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            setProjects(JSON.parse(cached));
            setDbStatus('OFFLINE (cached)');
          } catch (parseErr) {
            setDbStatus('OFFLINE (error)');
          }
        } else {
          setDbStatus('OFFLINE');
        }
      } finally {
        setLoading(false);
      }
    }

    initDB();

    return () => {
      // Cleanup: Kill live query if component unmounts
      if (liveQueryId.current) {
        db.kill(liveQueryId.current).catch(() => { /* ignore cleanup errors */ });
      }
    };
  }, []);

  return { projects, dbStatus, dbError, loading };
}
