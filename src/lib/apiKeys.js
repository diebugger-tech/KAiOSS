/**
 * Browser-safe API Key resolver
 * No static fs import — Vite-safe for browser builds
 */
function getApiKey(name) {
  // Browser context: localStorage > import.meta.env
  if (typeof window !== 'undefined') {
    return localStorage.getItem(name) ||
           import.meta.env?.[name] ||
           null;
  }

  // Node.js context (scripts, cmd-runner)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || null;
  }

  return null;
}

export { getApiKey };
