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
        paletteModule,
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

    const pageKey = getPageKey();
    const traceState = {
        lastApplyAt: null,
        applySource: 'UNKNOWN',
        ruleCount: 0,
        pageKey: pageKey.host,
        lastSaveAction: null,
    };
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
        step2: {
            targetConfirmed: false,
            dateMode: 'unset',
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
            step2: {
                ...baseDraft.step2,
                ...partial?.step2,
            },
            meta: {
                ...baseDraft.meta,
                ...partial?.meta,
            },
        };
    }

    function formatTraceTime(at) {
        if (!at) return '--:--:--';
        return new Date(at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function buildTraceText() {
        const timeLabel = formatTraceTime(traceState.lastApplyAt);
        let text = `apply=${traceState.applySource} last=${timeLabel} count=${traceState.ruleCount} host=${traceState.pageKey}`;
        if (traceState.lastSaveAction) {
            text += ` save=${traceState.lastSaveAction}`;
        }
        return text;
    }

    function updateTraceDisplay(source, count) {
        traceState.applySource = source;
        traceState.ruleCount = count;
        traceState.lastApplyAt = Date.now();
        const text = buildTraceText();
        paletteController?.setTrace(text);
        traceState.lastSaveAction = null;
    }

    function runApplyRules(source, rules) {
        const targetRules = rules || currentRules;
        applyRules(targetRules);
        const ruleCount = Array.isArray(targetRules) ? targetRules.length : 0;
        updateTraceDisplay(source, ruleCount);
    }

    async function tracedLoad(source, loader) {
        traceState.lastLoad = { source, at: Date.now(), count: 0, pageKey: traceState.pageKey };
        const data = await loader();
        const count = source === 'RULES'
            ? (Array.isArray(data?.rules) ? data.rules.length : 0)
            : data ? 1 : 0;
        traceState.lastLoad = { source, at: Date.now(), count, pageKey: traceState.pageKey };
        return data;
    }

    const [rulesData, savedDraft, paletteState] = await Promise.all([
        tracedLoad('RULES', loadRules),
        tracedLoad('DRAFT', loadDraft),
        tracedLoad('PALETTE_STATE', loadPaletteState),
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
    let paletteController = null;
    let lastSelectedElement = null;
    let pickerTarget = 'target';
    let pickerActive = false;
    let targetDisplay = '未選択';
    let draftDirty = false;

    function setDraftDirty(isDirty) {
        draftDirty = isDirty;
        paletteController?.setDirty(isDirty);
    }

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

    function getSlotStatus() {
        const targetValue = draft.targetSelector?.trim();
        const dateValue = draft.date?.dateSelector?.trim();
        const needsDate = Boolean(draft.date?.enabled);
        const targetConfirmed = Boolean(draft.step2?.targetConfirmed);
        const dateMode = draft.step2?.dateMode || 'unset';
        return {
            targetSelected: Boolean(targetValue),
            dateSelected: Boolean(dateValue),
            dateRequired: needsDate,
            targetConfirmed,
            dateMode,
            targetValue: targetValue || '',
            dateValue: dateValue || '',
        };
    }

    function isStep2Ready(status) {
        if (!status.targetConfirmed) return false;
        if (status.dateMode === 'need') return status.dateSelected;
        if (status.dateMode === 'skip') return true;
        return false;
    }

    const STEP_SEQUENCE = ['step1', 'step2', 'step3_1', 'step3_2', 'step3_3', 'step4', 'step5'];

    function normalizeStepState(rawState = {}) {
        const normalized = {};
        let previousDone = true;
        for (const step of STEP_SEQUENCE) {
            const done = Boolean(rawState[step]);
            normalized[step] = done && previousDone;
            previousDone = normalized[step];
        }
        return normalized;
    }

    function getStepState(slotStatus) {
        const status = slotStatus || getSlotStatus();
        const step1 = !!(draft.scope?.host || draft.scope?.pathPattern);
        const step2 = status.targetSelected && isStep2Ready(status);
        const keywordsProvided = Array.isArray(draft.match?.keywords) && draft.match.keywords.length > 0;
        const conditionTypeSelected = !!(draft.list?.enabled || draft.date?.enabled || keywordsProvided);
        const listSelectorProvided = draft.list?.itemSelector?.trim();
        const dateSelectorProvided = status.dateSelected;
        const conditionContentProvided = !!(
            keywordsProvided ||
            (draft.list?.enabled && listSelectorProvided) ||
            (draft.date?.enabled && dateSelectorProvided)
        );
        const step3_1 = conditionTypeSelected;
        const step3_2 = conditionContentProvided;
        const step3_3 = true; // auxiliary step is optional
        const step4 = status.dateMode !== 'need' || status.dateSelected;
        const step5 = !draftDirty;
        return normalizeStepState({ step1, step2, step3_1, step3_2, step3_3, step4, step5 });
    }

    function getActiveStep(stepState, slotStatus) {
        if (!stepState) return null;
        if (!stepState?.step1) return 'step1';
        if (!slotStatus?.targetSelected) return 'step2';
        if (!slotStatus?.targetConfirmed) return 'step2';
        if (slotStatus?.dateMode === 'unset') return 'step2';
        if (slotStatus?.dateMode === 'need' && !slotStatus?.dateSelected) return 'step2';
        const order = ['step1', 'step2', 'step3_1', 'step3_2', 'step4', 'step5'];
        for (const key of order) {
            if (key === 'step4' && !draft.date?.enabled) continue;
            if (!stepState[key]) return key;
        }
        return null;
    }

    function getGuideMessage(stepState, slotStatus) {
        if (!stepState?.step1) {
            return '対象を決めてください';
        }
        if (!slotStatus?.targetSelected) {
            return '対象要素を選択してください';
        }
        if (!slotStatus?.targetConfirmed) {
            return '範囲を調整して「対象を確定」してください';
        }
        if (slotStatus?.dateMode === 'unset') {
            return '日付を指定するか選んでください';
        }
        if (slotStatus?.dateMode === 'need' && !slotStatus?.dateSelected) {
            return '日付要素を選択してください';
        }
        if (!stepState?.step3_1) {
            return '条件の種類を選択してください';
        }
        if (!stepState?.step3_2) {
            return '条件内容を入力してください';
        }
        if (draft.date?.enabled && !stepState?.step4) {
            return '日付要素を選択してください';
        }
        if (!stepState?.step5) {
            return '内容を確認して保存してください';
        }
        return '';
    }

    function getApplyState() {
        if (draftDirty) return 'draft';
        if (traceState.applySource === 'RULES' || traceState.applySource === 'PALETTE_STATE') {
            return 'applied';
        }
        if (draft.id) return 'saved';
        return 'draft';
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
        paletteController?.updateState(window.__aps_adapter_state);
        const slotStatus = getSlotStatus();
        const stepState = getStepState(slotStatus);
        paletteController?.setSlotStatus(slotStatus);
        paletteController?.setStep2ConfirmState({
            targetSelected: slotStatus.targetSelected,
            targetConfirmed: slotStatus.targetConfirmed,
            targetValue: slotStatus.targetValue,
        });
        paletteController?.setStep2DateModeState({
            targetConfirmed: slotStatus.targetConfirmed,
            dateMode: slotStatus.dateMode,
            dateSelected: slotStatus.dateSelected,
        });
        paletteController?.setStepState(stepState);
        paletteController?.setGuideMessage(getGuideMessage(stepState, slotStatus));
        paletteController?.setActiveStep(getActiveStep(stepState, slotStatus));
        paletteController?.setApplyState(getApplyState());
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
            setDraftDirty(true);
            saveDraft(draft);
            updateReactState();
            if (picker.getActive()) showPickerFloatbar();
        },
        onToggle: active => {
            pickerActive = active;
            paletteController?.setPickerActive(active, pickerTarget);
            updateReactState();
            if (active) showPickerFloatbar(); else hidePickerFloatbar();
        },
        getSelector: generateSelector,
    });

    // ===== Picker Floatbar (attach to selected outline bottom-left) =====
    let pickerFloatbarEl = null;

    function ensurePickerFloatbar() {
        if (pickerFloatbarEl) return pickerFloatbarEl;

        const bar = document.createElement('div');
        bar.className = 'aps-picker-floatbar';
        bar.setAttribute('aria-hidden', 'true');

        const mkBtn = (label, className) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = className || 'aps-btn aps-btn-small';
            b.textContent = label;
            return b;
        };

        const expand = mkBtn('範囲を広げる', 'aps-btn aps-btn-small');
        const undo = mkBtn('1つ戻す', 'aps-btn aps-btn-small');
        const confirm = mkBtn('決定', 'aps-btn aps-btn-small aps-picker-floatbar__primary');
        const cancel = mkBtn('キャンセル', 'aps-btn aps-btn-small');

        expand.addEventListener('click', () => {
            picker.expandParent();
            positionPickerFloatbar();
            updatePickerFloatbarEnabled();
        });
        undo.addEventListener('click', () => {
            picker.undo();
            positionPickerFloatbar();
            updatePickerFloatbarEnabled();
        });
        confirm.addEventListener('click', () => {
            const cur = picker.getCurrent();
            if (!cur) return;

            // target選択の場合のみ「対象確定」まで進める
            if ((pickerTarget || 'target') === 'target') {
                handleStep2TargetConfirmToggle();
            }

            picker.stopPicker();
            hidePickerFloatbar();
            updateReactState();
        });
        cancel.addEventListener('click', () => {
            picker.stopPicker();
            hidePickerFloatbar();
            updateReactState();
        });

        bar.append(expand, undo, confirm, cancel);


        document.documentElement.appendChild(bar);
        pickerFloatbarEl = bar;
        return bar;
    }

    function showPickerFloatbar() {
        ensurePickerFloatbar();
        pickerFloatbarEl.setAttribute('aria-hidden', 'false');
        positionPickerFloatbar();
        updatePickerFloatbarEnabled();
    }

    function hidePickerFloatbar() {
        if (!pickerFloatbarEl) return;
        pickerFloatbarEl.setAttribute('aria-hidden', 'true');
    }

    function updatePickerFloatbarEnabled() {
        if (!pickerFloatbarEl) return;
        const hasCurrent = !!picker.getCurrent();
        const btn = pickerFloatbarEl.querySelector('.aps-picker-floatbar__primary');
        if (btn) btn.disabled = !hasCurrent;
    }

    function positionPickerFloatbar() {
        if (!pickerFloatbarEl) return;
        const cur = picker.getCurrent();
        if (!cur) return;

        // 表示状態にしてからサイズ計測
        pickerFloatbarEl.setAttribute('aria-hidden', 'false');

        const r = cur.getBoundingClientRect();
        const offset = 8;

        const barRect = pickerFloatbarEl.getBoundingClientRect();

        // 左下（枠に付随）: 要素内の左下に“食い込ませる”配置で誤クリックを減らす
        let left = r.left + offset;
        let top = r.bottom - barRect.height - offset;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (left + barRect.width > vw - 6) left = Math.max(6, vw - barRect.width - 6);
        if (left < 6) left = 6;

        if (top + barRect.height > vh - 6) top = Math.max(6, vh - barRect.height - 6);
        if (top < 6) top = 6;

        pickerFloatbarEl.style.left = `${Math.round(left)}px`;
        pickerFloatbarEl.style.top = `${Math.round(top)}px`;
    }
    // ===== /Picker Floatbar =====


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
            paletteController?.setToast('保存できない：対象の枠を選択してください', 4000);
            return;
        }
        const allowNoKeywords = updatedDraft.date?.enabled && updatedDraft.date?.applyWithoutKeyword;
        if (!updatedDraft.match?.keywords?.length && !allowNoKeywords) {
            paletteController?.setToast('保存できない：キーワードを追加してください', 4000);
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

        traceState.lastSaveAction = 'UPSERT';
        paletteController?.setToast('保存中…', 0);
        paletteController?.setStatus('保存中…');
        try {
            const data = await upsertRule(rule);
            currentRules = data.rules || [];
            draft = mergeDraft(draft, { id: ruleId, enabled: rule.enabled });
            await saveDraft(draft);
            setDraftDirty(false);
            runApplyRules('RULES', currentRules);
            updateReactState();
            const timeLabel = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            paletteController?.setToast(`保存OK (${timeLabel})`, 2000);
            paletteController?.setStatus(`保存OK (${timeLabel})`);
        } catch (error) {
            const reason = String(error?.message || '保存エラー').split('\n')[0].slice(0, 20);
            paletteController?.setToast(`保存失敗：${reason}`, 4000);
            paletteController?.setStatus(`保存失敗 (${reason})`);
        }
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
        traceState.lastSaveAction = 'DELETE';
        const data = await deleteRule(ruleId);
        currentRules = data.rules || [];
        runApplyRules('RULES', currentRules);
        updateReactState();
    }

    async function handleToggleRule(ruleId, enabled) {
        traceState.lastSaveAction = 'UPSERT';
        const rule = currentRules.find(item => item.id === ruleId);
        if (!rule) return;
        const updated = { ...rule, enabled };
        const data = await upsertRule(updated);
        currentRules = data.rules || [];
        runApplyRules('RULES', currentRules);
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

    function handleStep2TargetConfirmToggle() {
        const slotStatus = getSlotStatus();
        if (!slotStatus.targetSelected) return;
        const nextConfirmed = !slotStatus.targetConfirmed;
        const nextMode = nextConfirmed ? (draft.step2?.dateMode || 'unset') : 'unset';
        draft = mergeDraft(draft, {
            step2: {
                ...draft.step2,
                targetConfirmed: nextConfirmed,
                dateMode: nextMode,
            },
        });
        setDraftDirty(true);
        saveDraft(draft);
        if (nextConfirmed) {
            paletteController?.setToast('対象を確定しました', 1500);
        }
        updateReactState();
    }

    function handleStep2DateModeChange(mode) {
        if (!['need', 'skip'].includes(mode)) return;
        const slotStatus = getSlotStatus();
        if (!slotStatus.targetConfirmed) return;
        if ((draft.step2?.dateMode || 'unset') === mode) return;
        draft = mergeDraft(draft, {
            step2: {
                ...draft.step2,
                dateMode: mode,
            },
        });
        setDraftDirty(true);
        saveDraft(draft);
        updateReactState();
    }

    function handleDraftChange(newDraft) {
        draft = mergeDraft(draft, newDraft);
        setDraftDirty(true);
        saveDraft(draft);
    }

    // Set up adapter callbacks for React UI
    window.__aps_adapter_callbacks = {
        onTogglePicker: () => picker.togglePicker(),
        onPickTargetChange: target => {
            pickerTarget = target || 'target';
        },
        onStep2TargetConfirmToggle: handleStep2TargetConfirmToggle,
        onStep2DateModeChange: handleStep2DateModeChange,
        onGenerateListSelector: () => {
            if (!lastSelectedElement) return;
            const generated = generateRepeatedItemSelector(lastSelectedElement);
            if (!generated) return;
            draft = mergeDraft(draft, { list: { itemSelector: generated } });
            setDraftDirty(true);
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

    // Picker floatbar follow
    window.addEventListener('scroll', () => {
        if (!picker.getActive()) return;
        positionPickerFloatbar();
    }, { passive: true });

    window.addEventListener('resize', () => {
        if (!picker.getActive()) return;
        positionPickerFloatbar();
    });


    // Initialize React state
    updateReactState();

    // Load DOM-based palette UI
    async function loadPaletteUI() {
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

        paletteController = paletteModule.mountPaletteUI(container);
        paletteController.updateState(window.__aps_adapter_state);
        paletteController.setTrace(buildTraceText());
    }

    await loadPaletteUI();

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
            runApplyRules('PALETTE_STATE', currentRules);
        }, 500);
    });

    function init() {
        runApplyRules('RULES', currentRules);
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    init();
})();

console.log('[APS][CONTENT] loaded on', location.href);
