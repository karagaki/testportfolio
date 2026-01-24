import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

declare global {
  interface Window {
    __aps_react_root?: ReactDOM.Root;
    __aps_mount_palette?: (container: HTMLElement) => void;
    __aps_unmount_palette?: () => void;
  }
}

// 契約: content.js が呼び出す mount 関数を window に直接定義
window.__aps_mount_palette = (container: HTMLElement) => {
  if (!container) return;
  if (window.__aps_react_root) return;

  const root = ReactDOM.createRoot(container);
  window.__aps_react_root = root;
  root.render(<App />);
};

window.__aps_unmount_palette = () => {
  if (window.__aps_react_root) {
    window.__aps_react_root.unmount();
    window.__aps_react_root = undefined;
  }
};
