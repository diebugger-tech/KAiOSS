import { Surreal } from 'surrealdb';

const db = new Surreal();

export const DB_STATES = {
  IDLE:         'IDLE',
  CONNECTING:   'CONNECTING',
  ONLINE:       'ONLINE',
  RECONNECTING: 'RECONNECTING',
  OFFLINE:      'OFFLINE'
};

let currentState = DB_STATES.IDLE;
let _connectionParams = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let _connectPromiseResolve = null;

const MAX_RETRIES = 10;
const INITIAL_DELAY = 1000;
const MAX_DELAY = 30000;
const BACKOFF_FACTOR = 2;

function _dispatch(eventName, detail = null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, detail ? { detail } : undefined));
  }
}

function setState(newState, detail = null) {
  if (currentState === newState && !detail) return;
  currentState = newState;

  const eventMap = {
    [DB_STATES.CONNECTING]:   'surreal:connecting',
    [DB_STATES.ONLINE]:       'surreal:online',
    [DB_STATES.RECONNECTING]: 'surreal:reconnecting',
    [DB_STATES.OFFLINE]:      'surreal:offline'
  };

  if (eventMap[newState]) {
    _dispatch(eventMap[newState], detail);
  }
}

function _clearTimers() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function _resolveConnectPromise() {
  if (_connectPromiseResolve) {
    const resolve = _connectPromiseResolve;
    _connectPromiseResolve = null;
    resolve();
  }
}

export function getDbStatus() {
  return currentState;
}

export async function connectDB(url, authOptions) {
  if (currentState === DB_STATES.ONLINE) {
    return;
  }
  if (currentState === DB_STATES.CONNECTING || currentState === DB_STATES.RECONNECTING) {
    if (_connectPromiseResolve) {
      return new Promise((resolve) => {
        const check = () => {
          if (currentState === DB_STATES.ONLINE || currentState === DB_STATES.OFFLINE || currentState === DB_STATES.IDLE) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    }
  }

  _connectionParams = { url, authOptions };
  reconnectAttempts = 0;
  _clearTimers();

  return new Promise((resolve) => {
    _connectPromiseResolve = resolve;
    setState(DB_STATES.CONNECTING);
    _tryConnect();
  });
}

async function _tryConnect() {
  if (!_connectionParams) {
    _resolveConnectPromise();
    return;
  }

  try {
    await db.connect(_connectionParams.url, _connectionParams.authOptions);
    reconnectAttempts = 0;
    setState(DB_STATES.ONLINE);
    _resolveConnectPromise();
  } catch (err) {
    console.error('[db.js] Connect failed:', err);
    _triggerReconnect(err.message);
  }
}

function _triggerReconnect(lastErrorMessage) {
  if (reconnectAttempts >= MAX_RETRIES) {
    setState(DB_STATES.OFFLINE, { reason: lastErrorMessage || 'Max retries exceeded' });
    _clearTimers();
    try { db.close(); } catch (_) {}
    _connectionParams = null;
    _resolveConnectPromise();
    return;
  }

  const delay = Math.min(INITIAL_DELAY * Math.pow(BACKOFF_FACTOR, reconnectAttempts), MAX_DELAY);
  reconnectAttempts++;

  setState(DB_STATES.RECONNECTING, { attempt: reconnectAttempts, delay });

  reconnectTimer = setTimeout(() => {
    _tryConnect();
  }, delay);
}

export async function disconnectDB() {
  _clearTimers();
  _connectionParams = null;
  reconnectAttempts = 0;
  _resolveConnectPromise();
  try {
    await db.close();
  } catch (err) {
    console.error('[db.js] Error closing connection:', err);
  }
  setState(DB_STATES.IDLE);
}

export default db;
