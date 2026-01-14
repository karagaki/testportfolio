(async () => {
    const [
        storage,
        rulesEngine,
        selectorGen,
        domPickerModule,
        paletteUIModule,
    ] = await Promise.all([
        import(chrome.runtime.getURL('src/storage.js')),
        import(chrome.runtime.getURL('src/rulesEngine.js')),
        import(chrome.runtime.getURL('src/selectorGen.js')),
        import(chrome.runtime.getURL('src/domPicker.js')),
        import(chrome.runtime.getURL('src/paletteUI.js')),
    ]);

    const {
        loadRules,
        upsertRule,
        deleteRule,
        loadDraft,
        saveDraft,
        loadPaletteState,
        savePaletteState,
        exportAllData,
        importAllData,
    } = storage;
    const { applyRules, matchScope, getPageKey } = rulesEngine;
    const { generateSelector, generateRepeatedItemSelector } = selectorGen;
    const { createDomPicker } = domPickerModule;
    const { createPaletteUI } = paletteUIModule;

    const pageKey = getPageKey();
    const defaultDraft = {
        id: null,
        enabled: true,
        scope: {
            host: pageKey.host,
            pathPattern: pageKey.path,
            useWildcard: false,
            applyToAllPaths: false,
        },
        list: {
            enabled: false,
            itemSelector: '',
        },
        targetSelector: '',
        match: {
            mode: 'includes',
            keywords: [],
        },
        paint: {
            type: 'highlight',
            bg: '#ffc0cb',
            fg: '',
            border: 'rgba(0,0,0,0.15)',
        },
        meta: {
            title: '',
        },
    };

    function mergeDraft(baseDraft, partial) {
        return {
            ...baseDraft,
            ...partial,
            scope: {
                ...baseDraft.scope,
                ...partial?.scope,
            },
            list: {
                ...baseDraft.list,
                ...partial?.list,
            },
            match: {
                ...baseDraft.match,
                ...partial?.match,
            },
            paint: {
                ...baseDraft.paint,
                ...partial?.paint,
            },
            meta: {
                ...baseDraft.meta,
                ...partial?.meta,
            },
        };
    }

    const [rulesData, savedDraft, paletteState] = await Promise.all([
        loadRules(),
        loadDraft(),
        loadPaletteState(),
    ]);

    function waitForElement(selector, { root = document, timeoutMs = 8000, intervalMs = 100 } = {}) {
        const start = Date.now();
        return new Promise((resolve) => {
            const tick = () => {
                const el = root.querySelector(selector);
                if (el) return resolve(el);
                if (Date.now() - start >= timeoutMs) return resolve(null);
                setTimeout(tick, intervalMs);
            };
            tick();
        });
    }

    function safeAppend(parent, child, { fallback = document.body, label = 'safeAppend' } = {}) {
        try {
            const target = parent || fallback;
            if (!target) {
                console.warn(`[ext] ${label}: no parent/fallback`, { parent, fallback, url: location.href });
                return false;
            }
            target.appendChild(child);
            return true;
        } catch (e) {
            console.warn(`[ext] ${label}: append failed`, e, { url: location.href });
            return false;
        }
    }

    let currentRules = rulesData.rules || [];
    let draft = savedDraft ? mergeDraft(defaultDraft, savedDraft) : { ...defaultDraft };
    if (draft.scope?.host && draft.scope.host !== pageKey.host) {
        draft = { ...defaultDraft };
    }
    let paletteVisible = paletteState?.visible ?? false;
    let paletteMinimized = paletteState?.minimized ?? false;
    let lastSelectedElement = null;

    const palette = createPaletteUI({
        onTogglePicker: () => picker.togglePicker(),
        onGenerateListSelector: () => {
            if (!lastSelectedElement) return;
            const generated = generateRepeatedItemSelector(lastSelectedElement);
            if (!generated) return;
            draft = mergeDraft(draft, { list: { itemSelector: generated } });
            palette.setListSelectorValue(generated);
        },
        onExport: handleExport,
        onImport: handleImport,
        onSaveRule: handleSaveRule,
        onRuleEdit: handleEditRule,
        onRuleDelete: handleDeleteRule,
        onRuleToggle: handleToggleRule,
        onClose: () => setPaletteVisible(false),
        onMinimize: () => setPaletteMinimized(!paletteMinimized),
        onDraftChange: newDraft => {
            draft = mergeDraft(draft, newDraft);
            saveDraft(draft);
        },
    });

    const paletteHost = await waitForElement('body');
    console.debug('[APS] append target =', paletteHost, 'selector=body', 'url=', location.href);
    safeAppend(paletteHost, palette.element, { fallback: document.body, label: 'injectPalette' });
    palette.setPageInfo(`${pageKey.host}${pageKey.path}`);
    palette.setDraft(draft);

    function setPaletteVisible(visible) {
        paletteVisible = visible;
        palette.setVisible(visible);
        savePaletteState({ visible: paletteVisible, minimized: paletteMinimized });
    }

    function setPaletteMinimized(minimized) {
        paletteMinimized = minimized;
        palette.setMinimized(minimized);
        savePaletteState({ visible: paletteVisible, minimized: paletteMinimized });
    }

    setPaletteVisible(paletteVisible);
    setPaletteMinimized(paletteMinimized);

    function describeElement(element) {
        if (!element || element.nodeType !== 1) return '';
        const tag = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        const classes = Array.from(element.classList || []).slice(0, 3).join('.');
        const classText = classes ? `.${classes}` : '';
        return `${tag}${id}${classText}`;
    }

    const picker = createDomPicker({
        onSelect: (element, selector) => {
            lastSelectedElement = element;
            palette.setTargetDisplay(describeElement(element));
            palette.setSelectorValue(selector);
            if (draft.list?.enabled) {
                const generated = generateRepeatedItemSelector(element);
                if (generated) {
                    draft = mergeDraft(draft, { list: { itemSelector: generated } });
                    palette.setListSelectorValue(generated);
                }
            }
        },
        onToggle: active => {
            palette.setPickerActive(active);
        },
        getSelector: generateSelector,
    });

    function refreshRulesList() {
        const scoped = currentRules.filter(rule => matchScope(rule.scope));
        palette.setRulesList(scoped);
    }

    function applyAllRules() {
        applyRules(currentRules);
    }

    function formatDate(date) {
        const pad = value => String(value).padStart(2, '0');
        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate()),
            '_',
            pad(date.getHours()),
            pad(date.getMinutes()),
            pad(date.getSeconds()),
        ].join('');
    }

    async function handleExport() {
        const data = await exportAllData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeHost = pageKey.host.replace(/[^a-zA-Z0-9_-]/g, '_') || 'host';
        const filename = `aps_backup_${safeHost}_${formatDate(new Date())}.json`;
        a.href = url;
        a.download = filename;
        const exportHost = await waitForElement('body');
        console.debug('[APS] append target =', exportHost, 'selector=body', 'url=', location.href);
        safeAppend(exportHost, a, { fallback: document.body, label: 'exportAnchor' });
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        palette.setToast('エクスポート完了');
    }

    async function handleImport(payload, mode) {
        try {
            await importAllData(payload, mode);
        } catch (err) {
            palette.setToast('インポート失敗（形式が違います）');
            return;
        }
        const rulesData = await loadRules();
        currentRules = rulesData.rules || [];
        refreshRulesList();
        applyAllRules();
        palette.setToast('インポート完了');
    }

    function handleSaveRule(updatedDraft) {
        const selector = updatedDraft.targetSelector?.trim();
        if (!selector) {
            window.alert('対象の枠を選択してください。');
            return;
        }
        if (!updatedDraft.match?.keywords?.length) {
            window.alert('キーワードを追加してください。');
            return;
        }

        const ruleId = updatedDraft.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
        const rule = {
            id: ruleId,
            enabled: updatedDraft.enabled !== false,
            scope: {
                host: pageKey.host,
                pathPattern: updatedDraft.scope?.pathPattern || pageKey.path,
                useWildcard: !!updatedDraft.scope?.useWildcard,
                applyToAllPaths: !!updatedDraft.scope?.applyToAllPaths,
            },
            list: {
                enabled: !!updatedDraft.list?.enabled,
                itemSelector: updatedDraft.list?.itemSelector || '',
            },
            targetSelector: selector,
            match: {
                mode: 'includes',
                keywords: updatedDraft.match.keywords,
            },
            paint: {
                type: updatedDraft.paint?.type || 'highlight',
                bg: updatedDraft.paint?.bg || '#ffc0cb',
                fg: updatedDraft.paint?.fg || '',
                border: updatedDraft.paint?.border || 'rgba(0,0,0,0.15)',
            },
            meta: {
                title: updatedDraft.meta?.title || '',
                createdAt: updatedDraft.meta?.createdAt || 0,
                updatedAt: updatedDraft.meta?.updatedAt || 0,
            },
        };

        upsertRule(rule).then(data => {
            currentRules = data.rules || [];
            draft = { ...draft, id: ruleId, enabled: rule.enabled };
            saveDraft(draft);
            refreshRulesList();
            applyAllRules();
        });
    }

    function handleEditRule(ruleId) {
        const rule = currentRules.find(item => item.id === ruleId);
        if (!rule) return;
        draft = mergeDraft(defaultDraft, rule);
        palette.setDraft(draft);
        saveDraft(draft);
        if (!paletteVisible) setPaletteVisible(true);
    }

    function handleDeleteRule(ruleId) {
        deleteRule(ruleId).then(data => {
            currentRules = data.rules || [];
            refreshRulesList();
            applyAllRules();
        });
    }

    function handleToggleRule(ruleId, enabled) {
        const rule = currentRules.find(item => item.id === ruleId);
        if (!rule) return;
        const updated = { ...rule, enabled };
        upsertRule(updated).then(data => {
            currentRules = data.rules || [];
            refreshRulesList();
            applyAllRules();
        });
    }

    window.addEventListener('message', event => {
        if (event.source !== window) return;
        if (event.data?.type === 'APS_PICKER_EXPAND_PARENT') {
            picker.expandParent();
        }
        if (event.data?.type === 'APS_PICKER_UNDO') {
            picker.undo();
        }
    });

    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (msg?.type === 'APS_TOGGLE_PALETTE') {
            setPaletteVisible(!paletteVisible);
            sendResponse?.({ ok: true });
            return true;
        }
        if (msg?.type === 'APS_TOGGLE_PICKER') {
            picker.togglePicker();
            sendResponse?.({ ok: true });
            return true;
        }
        return false;
    });

    let observerTimer = null;
    const observer = new MutationObserver(() => {
        clearTimeout(observerTimer);
        observerTimer = setTimeout(() => {
            applyAllRules();
        }, 500);
    });

    function init() {
        refreshRulesList();
        applyAllRules();
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    init();
})();

console.log('[APS][CONTENT] loaded on', location.href);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    console.log('[APS][CONTENT] message received:', msg);

    if (msg?.type === 'APS_TOGGLE_PALETTE') {
        let el = document.getElementById('aps-debug-panel');
        if (!el) {
            el = document.createElement('div');
            el.id = 'aps-debug-panel';
            el.textContent = 'APS PANEL (DEBUG)';
            el.style.cssText = `
        position:fixed;
        top:10px;
        right:10px;
        z-index:2147483647;
        background:#fff;
        border:2px solid red;
        padding:8px 12px;
        font-size:12px;
      `;
            console.debug('[APS] append target =', document.documentElement, 'selector=documentElement', 'url=', location.href);
            safeAppend(document.documentElement, el, { fallback: document.body, label: 'debugPanel' });
        } else {
            el.remove();
        }
        sendResponse({ ok: true });
        return true;
    }
});
