(async () => {
    // Prevent double initialization
    if (document.querySelector('[data-aps-palette-container]')) {
        console.log('[APS] Palette already mounted, skipping initialization');
        return;
    }

    const [
        storage,
        rulesEngine,
        selectorGen,
        domPickerModule,
    ] = await Promise.all([
        import(chrome.runtime.getURL('src/storage.js')),
        import(chrome.runtime.getURL('src/rulesEngine.js')),
        import(chrome.runtime.getURL('src/selectorGen.js')),
        import(chrome.runtime.getURL('src/domPicker.js')),
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
        date: {
            enabled: false,
            applyWithoutKeyword: false,
            sourceType: 'attr',
            dateSelector: '',
            dateAttr: 'data-date',
            headerSelector: '',
            headerFormat: 'jp_ym',
            grayPreset: 'medium',
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
            date: {
                ...baseDraft.date,
                ...partial?.date,
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
    let pickerTarget = 'target';
    let pickerActive = false;
    let targetDisplay = '未選択';

    function describeElement(element) {
        if (!element || element.nodeType !== 1) return '';
        const tag = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        const classes = Array.from(element.classList || []).slice(0, 3).join('.');
        const classText = classes ? `.${classes}` : '';
        return `${tag}${id}${classText}`;
    }

    function getPageInfo() {
        return `${pageKey.host}${pageKey.path}`;
    }

    function getScopedRules() {
        return currentRules.filter(rule => matchScope(rule.scope));
    }

    function updateReactState() {
        window.__aps_adapter_state = {
            pageInfo: getPageInfo(),
            draft: JSON.parse(JSON.stringify(draft)),
            rules: getScopedRules(),
            pickerActive,
            visible: paletteVisible,
            minimized: paletteMinimized,
            targetDisplay,
        };
        if (window.__aps_react_update) {
            window.__aps_react_update();
        }
    }

    const picker = createDomPicker({
        onSelect: (element, selector) => {
            lastSelectedElement = element;
            targetDisplay = describeElement(element);
            if (pickerTarget === 'date') {
                draft = mergeDraft(draft, { date: { dateSelector: selector } });
            } else if (pickerTarget === 'header') {
                draft = mergeDraft(draft, { date: { headerSelector: selector } });
            } else {
                draft.targetSelector = selector;
                if (draft.list?.enabled) {
                    const generated = generateRepeatedItemSelector(element);
                    if (generated) {
                        draft = mergeDraft(draft, { list: { itemSelector: generated } });
                    }
                }
            }
            saveDraft(draft);
            updateReactState();
        },
        onToggle: active => {
            pickerActive = active;
            updateReactState();
        },
        getSelector: generateSelector,
    });

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
        safeAppend(exportHost, a, { fallback: document.body, label: 'exportAnchor' });
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    async function handleImport(payload, mode) {
        await importAllData(payload, mode);
        const rulesData = await loadRules();
        currentRules = rulesData.rules || [];
        updateReactState();
    }

    async function handleSaveRule(updatedDraft) {
        const selector = updatedDraft.targetSelector?.trim();
        if (!selector) {
            throw new Error('対象の枠を選択してください');
        }
        const allowNoKeywords = updatedDraft.date?.enabled && updatedDraft.date?.applyWithoutKeyword;
        if (!updatedDraft.match?.keywords?.length && !allowNoKeywords) {
            throw new Error('キーワードを追加してください');
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
            date: {
                enabled: !!updatedDraft.date?.enabled,
                applyWithoutKeyword: !!updatedDraft.date?.applyWithoutKeyword,
                sourceType: updatedDraft.date?.sourceType || 'attr',
                dateSelector: updatedDraft.date?.dateSelector || '',
                dateAttr: updatedDraft.date?.dateAttr || 'data-date',
                headerSelector: updatedDraft.date?.headerSelector || '',
                headerFormat: updatedDraft.date?.headerFormat || 'jp_ym',
                grayPreset: updatedDraft.date?.grayPreset || 'medium',
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

        const data = await upsertRule(rule);
        currentRules = data.rules || [];
        draft = mergeDraft(draft, { id: ruleId, enabled: rule.enabled });
        await saveDraft(draft);
        applyRules(currentRules);
        updateReactState();
    }

    function handleEditRule(ruleId) {
        const rule = currentRules.find(item => item.id === ruleId);
        if (!rule) return;
        draft = mergeDraft(defaultDraft, rule);
        saveDraft(draft);
        if (!paletteVisible) setPaletteVisible(true);
        updateReactState();
    }

    async function handleDeleteRule(ruleId) {
        const data = await deleteRule(ruleId);
        currentRules = data.rules || [];
        applyRules(currentRules);
        updateReactState();
    }

    async function handleToggleRule(ruleId, enabled) {
        const rule = currentRules.find(item => item.id === ruleId);
        if (!rule) return;
        const updated = { ...rule, enabled };
        const data = await upsertRule(updated);
        currentRules = data.rules || [];
        applyRules(currentRules);
        updateReactState();
    }

    function setPaletteVisible(visible) {
        paletteVisible = visible;
        savePaletteState({ visible: paletteVisible, minimized: paletteMinimized });
        updateReactState();
    }

    function setPaletteMinimized(minimized) {
        paletteMinimized = minimized;
        savePaletteState({ visible: paletteVisible, minimized: paletteMinimized });
        updateReactState();
    }

    function handleDraftChange(newDraft) {
        draft = mergeDraft(draft, newDraft);
        saveDraft(draft);
    }

    // Set up adapter callbacks for React UI
    window.__aps_adapter_callbacks = {
        onTogglePicker: () => picker.togglePicker(),
        onPickTargetChange: target => {
            pickerTarget = target || 'target';
        },
        onGenerateListSelector: () => {
            if (!lastSelectedElement) return;
            const generated = generateRepeatedItemSelector(lastSelectedElement);
            if (!generated) return;
            draft = mergeDraft(draft, { list: { itemSelector: generated } });
            saveDraft(draft);
            updateReactState();
        },
        onExport: handleExport,
        onImport: handleImport,
        onSaveRule: handleSaveRule,
        onRuleEdit: handleEditRule,
        onRuleDelete: handleDeleteRule,
        onRuleToggle: handleToggleRule,
        onClose: () => setPaletteVisible(false),
        onMinimize: () => setPaletteMinimized(!paletteMinimized),
        onDraftChange: handleDraftChange,
    };

    // Initialize React state
    updateReactState();

    // Load React palette UI
    async function loadReactPalette() {
        // Create container
        const container = document.createElement('div');
        container.setAttribute('data-aps-palette-container', '1');
        container.id = 'aps-palette-container';

        const paletteHost = await waitForElement('body');
        safeAppend(paletteHost, container, { fallback: document.body, label: 'paletteContainer' });

        // Load CSS
        const cssUrl = chrome.runtime.getURL('dist/palette-ui.css');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);

        // Load JS
        const jsUrl = chrome.runtime.getURL('dist/palette-ui.js');
        const script = document.createElement('script');
        script.src = jsUrl;
        script.onload = () => {
            if (window.__aps_mount_palette) {
                window.__aps_mount_palette(container);
                // Set initial visibility after mount
                updateReactState();
            }
        };
        document.head.appendChild(script);
    }

    await loadReactPalette();

    // Message handlers
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
            applyRules(currentRules);
        }, 500);
    });

    function init() {
        applyRules(currentRules);
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    init();
})();

console.log('[APS][CONTENT] loaded on', location.href);
