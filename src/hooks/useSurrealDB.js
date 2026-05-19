import { useState, useEffect, useRef } from 'react';
import db, { DB_STATES, getDbStatus, connectDB } from '../lib/db';
import { getApiKey } from '../lib/apiKeys';

const STORAGE_KEY = 'surreal_kanban_cache';

/**
 * useSurrealDB Hook
 * Handles real-time project synchronization with SurrealDB.
 * Implements a localStorage fallback for offline support.
 */
export function useSurrealDB() {
  const [projects, setProjects] = useState([]);
  const [dbStatus, setDbStatus] = useState(() => {
    const status = getDbStatus();
    return status === DB_STATES.IDLE ? 'CONNECTING...' : status;
  });
  const [dbError, setDbError] = useState(null);
  const [loading, setLoading] = useState(true);
  const liveQueryId = useRef(null);

  // Status Events Listener
  useEffect(() => {
    const onConnecting   = () => setDbStatus('CONNECTING...');
    const onOnline       = () => setDbStatus('ONLINE');
    const onReconnecting = (e) => setDbStatus(`RECONNECTING (${e.detail.attempt})...`);
    const onOffline      = (e) => {
      setDbStatus('OFFLINE');
      if (e.detail?.reason) setDbError(e.detail.reason);
    };

    window.addEventListener('surreal:connecting',   onConnecting);
    window.addEventListener('surreal:online',       onOnline);
    window.addEventListener('surreal:reconnecting', onReconnecting);
    window.addEventListener('surreal:offline',      onOffline);

    const currentStatus = getDbStatus();
    if (currentStatus !== DB_STATES.IDLE) {
      if (currentStatus === DB_STATES.CONNECTING) onConnecting();
      else if (currentStatus === DB_STATES.ONLINE) onOnline();
      else if (currentStatus === DB_STATES.OFFLINE) onOffline({ detail: {} });
    }

    return () => {
      window.removeEventListener('surreal:connecting',   onConnecting);
      window.removeEventListener('surreal:online',       onOnline);
      window.removeEventListener('surreal:reconnecting', onReconnecting);
      window.removeEventListener('surreal:offline',      onOffline);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function initDB() {
      try {
        setLoading(true);
        setDbError(null);

        const url = getApiKey('VITE_SURREAL_URL');
        const namespace = getApiKey('VITE_SURREAL_NS');
        const database = getApiKey('VITE_SURREAL_DB');
        const username = getApiKey('VITE_SURREAL_USER');
        const password = getApiKey('VITE_SURREAL_PASS');

        await connectDB(url, {
          namespace,
          database,
          authentication: { username, password }
        });

        if (!isMounted) return;

        if (getDbStatus() !== DB_STATES.ONLINE) {
          // Connection failed permanently — load cached data
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            try { setProjects(JSON.parse(cached)); } catch (_) {}
          }
          return;
        }

        // Initial fetch (exclude archived projects)
        const initialProjects = await db.query('SELECT * FROM projekt WHERE status != "archived" ORDER BY erstellt DESC').then(r => r[0]);
        if (initialProjects && isMounted) {
          const data = initialProjects.result || initialProjects;
          setProjects(data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }

        // Live Subscription
        const liveQuery = await db.live('projekt', ({ action, result }) => {
          if (!isMounted) return;
          setProjects(prev => {
            let next;
            if (action === 'CREATE') {
              if (result.status !== 'archived') next = [...prev, result];
            } else if (action === 'UPDATE' || action === 'CHANGE') {
              if (result.status === 'archived') {
                next = prev.filter(p => p.id !== result.id);
              } else {
                const exists = prev.find(p => p.id === result.id);
                next = exists ? prev.map(p => p.id === result.id ? result : p) : [...prev, result];
              }
            } else if (action === 'DELETE') {
              next = prev.filter(p => p.id !== result.id);
            } else {
              next = prev;
            }
            if (next) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              return next;
            }
            return prev;
          });
        });

        if (isMounted) {
          liveQueryId.current = liveQuery;
        } else {
          liveQuery.kill().catch(() => {});
        }

      } catch (err) {
        if (!isMounted) return;
        console.error('SurrealDB Error:', err);
        setDbError(err.message || String(err));

        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try { setProjects(JSON.parse(cached)); } catch (_) {}
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initDB();

    return () => {
      isMounted = false;
      if (liveQueryId.current) {
        liveQueryId.current.kill().catch(() => {});
      }
    };
  }, []);

  return { projects, dbStatus, dbError, loading };
}
