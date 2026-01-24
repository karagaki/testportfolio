// Runs in MAIN world (injected via <script src="...">). No inline execution.
(function () {
  if (window.__aps_main_bridge_loaded) return;
  window.__aps_main_bridge_loaded = true;

  window.addEventListener('message', (ev) => {
    try {
      const data = ev && ev.data;
      if (!data || data.type !== 'APS_MOUNT_PALETTE') return;
      const cid = data.containerId;
      if (!cid) return;

      const el = document.getElementById(cid);
      if (!el) {
        console.warn('[APS] mount bridge: container not found', cid);
        return;
      }
      if (typeof window.__aps_mount_palette !== 'function') {
        console.warn('[APS] React mount function not found');
        return;
      }
      window.__aps_mount_palette(el);
      console.log('[APS] React UI mounted');
    } catch (e) {
      console.error('[APS] mount bridge failed', e);
    }
  });
})();
