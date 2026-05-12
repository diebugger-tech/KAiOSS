export const createBackup = async ({ url, user, pass, ns, db, showToast }) => {
  try {
    const httpUrl = url
      .replace('ws://', 'http://')
      .replace('wss://', 'https://')
      .replace('/rpc', '');
    const res = await fetch(`${httpUrl}/export`, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${user}:${pass}`),
        'surreal-ns': ns,
        'surreal-db': db,
        'Accept': 'application/octet-stream'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `kaioss_backup_${timestamp}.surql`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
    window.dispatchEvent(new CustomEvent('surreal-log', {
      detail: { 
        action: 'success', 
        table: 'system', 
        message: `[${ts}] ✓ backup::export() → kaioss_backup.surql` 
      }
    }));
    showToast?.(`✅ Backup: ${filename}`, 'success');
  } catch (err) {
    showToast?.(`❌ Backup fehlgeschlagen: ${err.message}`, 'error');
  }
};
