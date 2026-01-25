# アドブロック反応でパネル非表示になる件 調査報告

調査報告サマリー
- 原因はアドブロックのコスメティック遮断 (CSS) と断定。`ads` プレフィックスのクラス名 (例: `.ads-panel`) が一般的なフィルタに一致し、`display: none` 等で隠される。
- 対象要素は React UI のルート `div.ads-panel`。命名は `ui/palette-app/App.tsx:1258` 付近、スタイル定義は `ui/palette-app/ads.css:42` 付近 (ビルド後は `dist/palette-ui.css:1`)。
- JS での削除経路は無し (検索結果より `removeChild/.remove()` はエクスポート用途などのみ)。
- 発生タイミングは DOM 注入後のコスメティック CSS 適用 (初回 or DOM 変化時)。Debug ログで `display:none`/`opacity:0`/`rect:0` を確認可能。

証拠 (ログ抜粋＋行番号)
- 注入ポイントと root 生成
  - `src/content.js:903-932` で `data-aps-palette-container` を付与し、`aps-react-root-*` を生成して body に挿入。
- ルート要素の命名 (広告っぽい語)
  - `ui/palette-app/App.tsx:1258-1266` の `className="ads-panel"` が最上位コンテナ。
  - 以降も `ads-banner` / `ads-btn` / `ads-card` など `ads-*` 命名が大量に使用。
- CSS 側の定義
  - `ui/palette-app/ads.css:42-62` に `.ads-panel { ... }`。
  - `dist/palette-ui.css:1` に同等の `.ads-panel` が含まれる。
- JS での DOM 削除経路の不在
  - `src/content.js:487` の `a.remove()` はエクスポート用アンカーのみ。
  - `src/paletteUI.js:515` の `innerHTML = ''` はキーワードリストの更新で、パネル自体の削除ではない。
- 計測ログ (追加済み)
  - `src/content.js:24-202` に `APS_DEBUG_PANEL_VIS` ロガーを実装。
  - ログキー: Console に `[APS_DEBUG_PANEL_VIS]`、Storage に `aps_debug_panel_vis_buffer_v1`。
  - 期待されるログ例 (Adblock ON 時):
    - `type: "interval"` で `target: "div.ads-panel"` / `isConnected: true` / `style.display: "none"` / `rect.w: 0` など。

再現手順
1) 調査ログを有効化
   - `chrome.storage.local.set({ aps_debug_panel_vis: true })` を実行。
   - ページをリロード (content script 再注入)。
2) 既知の発生 URL で確認
   - AdGuard ON/OFF, uBlock ON/OFF のマトリクスで確認。
3) ログ取得
   - 対象ページの DevTools コンソールで `[APS_DEBUG_PANEL_VIS]` を確認。
   - もしくは `chrome.storage.local.get('aps_debug_panel_vis_buffer_v1', console.log)`。

最小修正方針 (A/B)
A) 命名変更
- `.ads-*` を `aps-*` 等に置換 (例: `ads-panel` → `aps-panel`)。
- 影響範囲は `ui/palette-app/App.tsx` と `ui/palette-app/ads.css` (ビルド後 `dist/palette-ui.css/js` に反映)。
- 既存挙動を変えず、最小リスク。

B) Shadow DOM 化 (中規模)
- UI を shadow root に移動し、ページ側/拡張側 CSS の衝突と adblock の一般的な CSS 影響を回避。
- 影響範囲が広くなるため、A 案よりコスト高。

git diff (調査ログ追加分のみ)
```diff
commit ab38b668a5dddeab83c0b281b4b6f267e999cfa4
Author: karagaki <47020421+karagaki@users.noreply.github.com>
Date:   Sun Jan 25 16:51:44 2026 +0900

    chore: add debug logs for panel visibility

diff --git a/src/content.js b/src/content.js
index c746856..0bf0b92 100644
--- a/src/content.js
+++ b/src/content.js
@@ -23,6 +23,195 @@ if (window.__APS_PALETTE_MOUNTED__ || window.__APS_PALETTE_MOUNTING__) {
             return;
         }
 
+        const DEBUG_PANEL_VIS_DEFAULT = false;
+        const DEBUG_PANEL_VIS_STORAGE_KEY = 'aps_debug_panel_vis';
+        const DEBUG_PANEL_VIS_BUFFER_KEY = 'aps_debug_panel_vis_buffer_v1';
+        const DEBUG_PANEL_VIS_BUFFER_SIZE = 50;
+        const DEBUG_PANEL_VIS_INTERVAL_MS = 1000;
+        let panelVisDebugActive = false;
+
+        function describeElement(el) {
+            if (!el || !el.tagName) return 'null';
+            const parts = [el.tagName.toLowerCase()];
+            if (el.id) parts.push(`#${el.id}`);
+            if (el.classList && el.classList.length) {
+                const classes = Array.from(el.classList).slice(0, 3).join('.');
+                if (classes) parts.push(`.${classes}`);
+            }
+            return parts.join('');
+        }
+
+        function pickComputedStyle(el) {
+            if (!el) return null;
+            const style = window.getComputedStyle(el);
+            return {
+                display: style.display,
+                visibility: style.visibility,
+                opacity: style.opacity,
+                height: style.height,
+                width: style.width,
+                pointerEvents: style.pointerEvents,
+                zIndex: style.zIndex,
+            };
+        }
+
+        function getParentChainInfo(el, depth = 3) {
+            const chain = [];
+            let current = el?.parentElement || null;
+            for (let i = 0; i < depth && current; i += 1) {
+                chain.push({
+                    el: describeElement(current),
+                    style: pickComputedStyle(current),
+                });
+                current = current.parentElement;
+            }
+            return chain;
+        }
+
+        function scheduleDebugBufferFlush(buffer, timerRef) {
+            if (!chrome?.storage?.local) return;
+            if (timerRef.current) return;
+            timerRef.current = setTimeout(() => {
+                chrome.storage.local.set({ [DEBUG_PANEL_VIS_BUFFER_KEY]: buffer }, () => {
+                    timerRef.current = null;
+                });
+            }, 200);
+        }
+
+        function createPanelVisLogger() {
+            const buffer = [];
+            const timerRef = { current: null };
+
+            function push(entry) {
+                const payload = {
+                    ts: Date.now(),
+                    iso: new Date().toISOString(),
+                    ...entry,
+                };
+                buffer.push(payload);
+                if (buffer.length > DEBUG_PANEL_VIS_BUFFER_SIZE) {
+                    buffer.splice(0, buffer.length - DEBUG_PANEL_VIS_BUFFER_SIZE);
+                }
+                console.log('[APS_DEBUG_PANEL_VIS]', payload);
+                scheduleDebugBufferFlush(buffer, timerRef);
+            }
+
+            return { buffer, push };
+        }
+
+        function resolvePanelRoot(container) {
+            if (!container) return null;
+            return container.querySelector('.ads-panel, .aps2-root, .aps-palette-react') || container;
+        }
+
+        function startPanelVisibilityDebug(container) {
+            if (!container || panelVisDebugActive) return;
+            panelVisDebugActive = true;
+            const logger = createPanelVisLogger();
+            const state = {
+                lastTarget: null,
+                observer: null,
+                timerId: null,
+            };
+
+            function nodeListHasTarget(list, target) {
+                if (!list || !target) return false;
+                for (const node of list) {
+                    if (node === target) return true;
+                    if (node?.contains && node.contains(target)) return true;
+                }
+                return false;
+            }
+
+            function attachObserver(target) {
+                if (state.observer) state.observer.disconnect();
+                if (!target?.parentElement) return;
+                const parent = target.parentElement;
+                const observer = new MutationObserver(mutations => {
+                    for (const mutation of mutations) {
+                        if (mutation.type === 'attributes' && mutation.target === target) {
+                            logger.push({
+                                type: 'attr',
+                                target: describeElement(target),
+                                attribute: mutation.attributeName,
+                            });
+                            continue;
+                        }
+                        if (mutation.type === 'childList') {
+                            if (nodeListHasTarget(mutation.removedNodes, target) || nodeListHasTarget(mutation.addedNodes, target)) {
+                                logger.push({
+                                    type: 'child',
+                                    target: describeElement(target),
+                                    parent: describeElement(mutation.target),
+                                    removed: Array.from(mutation.removedNodes || []).map(describeElement),
+                                    added: Array.from(mutation.addedNodes || []).map(describeElement),
+                                });
+                            }
+                        }
+                    }
+                });
+                observer.observe(parent, {
+                    childList: true,
+                    subtree: true,
+                    attributes: true,
+                    attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'],
+                });
+                state.observer = observer;
+                logger.push({
+                    type: 'observer',
+                    target: describeElement(target),
+                    parent: describeElement(parent),
+                });
+            }
+
+            function tick() {
+                const target = resolvePanelRoot(container);
+                if (!target) {
+                    logger.push({ type: 'missing', target: 'null' });
+                    return;
+                }
+                if (target !== state.lastTarget) {
+                    state.lastTarget = target;
+                    logger.push({ type: 'target', target: describeElement(target) });
+                    attachObserver(target);
+                }
+                const rect = target.getBoundingClientRect();
+                logger.push({
+                    type: 'interval',
+                    target: describeElement(target),
+                    isConnected: Boolean(target.isConnected),
+                    rect: {
+                        x: Math.round(rect.x),
+                        y: Math.round(rect.y),
+                        w: Math.round(rect.width),
+                        h: Math.round(rect.height),
+                    },
+                    style: pickComputedStyle(target),
+                    parents: getParentChainInfo(target, 3),
+                });
+            }
+
+            state.timerId = setInterval(tick, DEBUG_PANEL_VIS_INTERVAL_MS);
+            tick();
+        }
+
+        function maybeStartPanelVisibilityDebug(container) {
+            if (!container || panelVisDebugActive) return;
+            try {
+                if (chrome?.storage?.local) {
+                    chrome.storage.local.get({ [DEBUG_PANEL_VIS_STORAGE_KEY]: DEBUG_PANEL_VIS_DEFAULT }, data => {
+                        if (data?.[DEBUG_PANEL_VIS_STORAGE_KEY]) {
+                            startPanelVisibilityDebug(container);
+                        }
+                    });
+                    return;
+                }
+            } catch {}
+            if (DEBUG_PANEL_VIS_DEFAULT) {
+                startPanelVisibilityDebug(container);
+            }
+        }
+
         // Prevent double initialization by DOM check
         if (document.querySelector('[data-aps-palette-container]')) {
             console.log('[APS] Palette container already exists, skipping');
@@ -714,6 +903,7 @@ if (window.__APS_PALETTE_MOUNTED__ || window.__APS_PALETTE_MOUNTING__) {
             // Create container
             const container = document.createElement('div');
             container.setAttribute('data-aps-palette-container', '1');
+            container.setAttribute('data-aps-panel', '1');
             if (!container.id) container.id = 'aps-react-root-' + Math.random().toString(36).slice(2);
 
             const paletteHost = await waitForElement('body');
@@ -739,6 +929,7 @@ if (window.__APS_PALETTE_MOUNTED__ || window.__APS_PALETTE_MOUNTING__) {
                 if (typeof window.__aps_mount_palette === 'function') {
                     window.__aps_mount_palette(container);
                     console.log('[APS] React UI mounted (isolated world)');
+                    maybeStartPanelVisibilityDebug(container);
                 } else {
                     console.error('[APS] React mount function not found after import:', chrome.runtime.getURL('dist/palette-ui.js'));
                 }
```
