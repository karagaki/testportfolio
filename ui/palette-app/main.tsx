import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './App';
import './styles.css';

declare global {
  interface Window {
    __aps_react_root?: Root;
    __aps_mount_palette?: (container: HTMLElement) => void;
    __aps_unmount_palette?: () => void;
  }
}

function mountPalette(container: HTMLElement) {
  if (window.__aps_react_root) {
    return;
  }
  const root = createRoot(container);
  window.__aps_react_root = root;
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

function unmountPalette() {
  if (window.__aps_react_root) {
    window.__aps_react_root.unmount();
    window.__aps_react_root = undefined;
  }
}

window.__aps_mount_palette = mountPalette;
window.__aps_unmount_palette = unmountPalette;

export { mountPalette, unmountPalette };
