function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function debounce(fn, wait) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
    };
}

function cloneDraft(draft) {
    return JSON.parse(JSON.stringify(draft));
}

export function createPaletteUI({
    onTogglePicker,
    onGenerateListSelector,
    onExport,
    onImport,
    onSaveRule,
    onRuleEdit,
    onRuleDelete,
    onRuleToggle,
    onClose,
    onMinimize,
    onDraftChange,
}) {
    const root = el('div', 'aps-palette');
    root.setAttribute('data-aps-palette', '1');

    const header = el('div', 'aps-header');
    const title = el('div', 'aps-title', 'Aパレットサーチ');
    const minimizeBtn = el('button', 'aps-icon-btn', '_');
    const closeBtn = el('button', 'aps-icon-btn', '×');
    header.append(title, minimizeBtn, closeBtn);

    const body = el('div', 'aps-body');

    const pageSection = el('div', 'aps-section');
    const pageLabel = el('div', 'aps-label', '現在ページ');
    const pageValue = el('div', 'aps-page');
    pageSection.append(pageLabel, pageValue);

    const pickerToggle = el('button', 'aps-btn aps-picker-toggle', '要素を選択');

    const pickerTools = el('div', 'aps-picker-tools');
    const pickerActions = el('div', 'aps-picker-actions');
    const expandBtn = el('button', 'aps-btn aps-btn-small', '範囲を広げる');
    const undoBtn = el('button', 'aps-btn aps-btn-small', '1つ戻す');
    pickerActions.append(expandBtn, undoBtn);
    const targetDisplay = el('div', 'aps-target-display', '未選択');

    const selectorLabel = el('div', 'aps-label', '生成された CSS セレクタ');
    const selectorInput = el('input', 'aps-input');
    selectorInput.type = 'text';

    pickerTools.append(pickerActions, targetDisplay, selectorLabel, selectorInput);

    const urlSection = el('div', 'aps-section');
    const urlLabel = el('div', 'aps-label', '対象URL');
    const urlRow = el('div', 'aps-row');
    const pathInput = el('input', 'aps-input');
    pathInput.type = 'text';
    const wildcardLabel = el('label', 'aps-checkbox');
    const wildcardInput = el('input');
    wildcardInput.type = 'checkbox';
    const wildcardText = document.createTextNode(' * を使う');
    wildcardLabel.append(wildcardInput, wildcardText);
    urlRow.append(pathInput, wildcardLabel);
    const applyAllLabel = el('label', 'aps-checkbox');
    const applyAllInput = el('input');
    applyAllInput.type = 'checkbox';
    const applyAllText = document.createTextNode(' このホスト内の全ページに適用');
    applyAllLabel.append(applyAllInput, applyAllText);
    urlSection.append(urlLabel, urlRow, applyAllLabel);

    const listModeSection = el('div', 'aps-section');
    const listModeLabel = el('label', 'aps-checkbox');
    const listModeInput = el('input');
    listModeInput.type = 'checkbox';
    const listModeText = document.createTextNode(' 類似項目を処理');
    listModeLabel.append(listModeInput, listModeText);
    const listTools = el('div', 'aps-list-tools');
    const listSelectorLabel = el('div', 'aps-label', '類似項目セレクタ');
    const listSelectorInput = el('input', 'aps-input');
    listSelectorInput.type = 'text';
    const listGenerateBtn = el('button', 'aps-btn aps-btn-small', '現在の選択から類似セレクタ生成');
    listTools.append(listSelectorLabel, listSelectorInput, listGenerateBtn);
    listModeSection.append(listModeLabel, listTools);

    const keywordSection = el('div', 'aps-section');
    const keywordLabel = el('div', 'aps-label', 'キーワード');
    const keywordRow = el('div', 'aps-row');
    const keywordInput = el('input', 'aps-input');
    keywordInput.type = 'text';
    const keywordAdd = el('button', 'aps-btn aps-btn-small', '追加');
    keywordRow.append(keywordInput, keywordAdd);
    const keywordList = el('div', 'aps-keyword-list');
    keywordSection.append(keywordLabel, keywordRow, keywordList);

    const paintSection = el('div', 'aps-section');
    const paintLabel = el('div', 'aps-label', '色設定');
    const paintRow = el('div', 'aps-row');
    const colorInput = el('input', 'aps-input');
    colorInput.type = 'color';
    const typeSelect = el('select', 'aps-input');
    const optHighlight = el('option');
    optHighlight.value = 'highlight';
    optHighlight.textContent = 'highlight';
    const optDim = el('option');
    optDim.value = 'dim';
    optDim.textContent = 'dim';
    typeSelect.append(optHighlight, optDim);
    paintRow.append(colorInput, typeSelect);
    paintSection.append(paintLabel, paintRow);

    const titleSection = el('div', 'aps-section');
    const titleLabel = el('div', 'aps-label', 'タイトル');
    const titleInput = el('input', 'aps-input');
    titleInput.type = 'text';
    titleSection.append(titleLabel, titleInput);

    const saveBtn = el('button', 'aps-btn aps-save', '保存して有効化');

    const backupSection = el('div', 'aps-section');
    const backupLabel = el('div', 'aps-label', 'バックアップ');
    const backupRow = el('div', 'aps-row');
    const exportBtn = el('button', 'aps-btn aps-btn-small', 'エクスポート');
    const importBtn = el('button', 'aps-btn aps-btn-small', 'インポート');
    const importMode = el('select', 'aps-input');
    const optMerge = el('option');
    optMerge.value = 'merge';
    optMerge.textContent = 'マージ（推奨）';
    const optReplace = el('option');
    optReplace.value = 'replace';
    optReplace.textContent = '置換';
    importMode.append(optMerge, optReplace);
    const importInput = el('input');
    importInput.type = 'file';
    importInput.accept = 'application/json';
    importInput.style.display = 'none';
    backupRow.append(exportBtn, importBtn);
    backupSection.append(backupLabel, backupRow, importMode, importInput);

    const toast = el('div', 'aps-toast');
    toast.style.cssText = 'margin-top:6px;font-size:11px;color:#555;';
    backupSection.append(toast);

    const listSection = el('div', 'aps-section');
    const listLabel = el('div', 'aps-label', 'このページのルール一覧');
    const rulesList = el('div', 'aps-rules');
    listSection.append(listLabel, rulesList);

    body.append(
        pageSection,
        pickerToggle,
        pickerTools,
        urlSection,
        listModeSection,
        keywordSection,
        paintSection,
        titleSection,
        saveBtn,
        backupSection,
        listSection
    );

    root.append(header, body);

    let draft = {
        id: null,
        scope: {
            host: '',
            pathPattern: '',
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

    const emitDraftChange = debounce(() => {
        onDraftChange?.(cloneDraft(draft));
    }, 300);

    function syncKeywords() {
        keywordList.innerHTML = '';
        draft.match.keywords.forEach((keyword, index) => {
            const tag = el('div', 'aps-keyword-tag');
            const label = el('span', null, keyword);
            const remove = el('button', 'aps-icon-btn', '×');
            remove.addEventListener('click', () => {
                draft.match.keywords.splice(index, 1);
                syncKeywords();
                emitDraftChange();
            });
            tag.append(label, remove);
            keywordList.append(tag);
        });
    }

    function syncDraftToInputs() {
        pathInput.value = draft.scope.pathPattern || '';
        wildcardInput.checked = !!draft.scope.useWildcard;
        applyAllInput.checked = !!draft.scope.applyToAllPaths;
        selectorInput.value = draft.targetSelector || '';
        colorInput.value = draft.paint.bg || '#ffc0cb';
        typeSelect.value = draft.paint.type || 'highlight';
        titleInput.value = draft.meta.title || '';
        listModeInput.checked = !!draft.list?.enabled;
        listSelectorInput.value = draft.list?.itemSelector || '';
        listTools.style.display = draft.list?.enabled ? 'block' : 'none';
        syncKeywords();
    }

    function updateDraft(partial) {
        draft = {
            ...draft,
            ...partial,
            scope: {
                ...draft.scope,
                ...partial.scope,
            },
            match: {
                ...draft.match,
                ...partial.match,
            },
            list: {
                ...draft.list,
                ...partial.list,
            },
            paint: {
                ...draft.paint,
                ...partial.paint,
            },
            meta: {
                ...draft.meta,
                ...partial.meta,
            },
        };
        syncDraftToInputs();
        emitDraftChange();
    }

    pickerToggle.addEventListener('click', () => onTogglePicker?.());
    expandBtn.addEventListener('click', () => {
        window.postMessage({ type: 'APS_PICKER_EXPAND_PARENT' }, '*');
    });
    undoBtn.addEventListener('click', () => {
        window.postMessage({ type: 'APS_PICKER_UNDO' }, '*');
    });

    selectorInput.addEventListener('input', () => {
        draft.targetSelector = selectorInput.value.trim();
        emitDraftChange();
    });

    pathInput.addEventListener('input', () => {
        draft.scope.pathPattern = pathInput.value.trim();
        emitDraftChange();
    });

    wildcardInput.addEventListener('change', () => {
        draft.scope.useWildcard = wildcardInput.checked;
        emitDraftChange();
    });

    applyAllInput.addEventListener('change', () => {
        draft.scope.applyToAllPaths = applyAllInput.checked;
        emitDraftChange();
    });

    listModeInput.addEventListener('change', () => {
        draft.list.enabled = listModeInput.checked;
        listTools.style.display = listModeInput.checked ? 'block' : 'none';
        emitDraftChange();
    });

    listSelectorInput.addEventListener('input', () => {
        draft.list.itemSelector = listSelectorInput.value.trim();
        emitDraftChange();
    });

    listGenerateBtn.addEventListener('click', () => {
        onGenerateListSelector?.();
    });

    titleInput.addEventListener('input', () => {
        draft.meta.title = titleInput.value;
        emitDraftChange();
    });

    colorInput.addEventListener('input', () => {
        draft.paint.bg = colorInput.value;
        emitDraftChange();
    });

    typeSelect.addEventListener('change', () => {
        draft.paint.type = typeSelect.value;
        emitDraftChange();
    });

    keywordAdd.addEventListener('click', () => {
        const value = keywordInput.value.trim();
        if (!value) return;
        draft.match.keywords.push(value);
        keywordInput.value = '';
        syncKeywords();
        emitDraftChange();
    });

    keywordInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            keywordAdd.click();
        }
    });

    saveBtn.addEventListener('click', () => onSaveRule?.(cloneDraft(draft)));
    closeBtn.addEventListener('click', () => onClose?.());
    minimizeBtn.addEventListener('click', () => onMinimize?.());
    exportBtn.addEventListener('click', () => onExport?.());
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', () => {
        const file = importInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const payload = JSON.parse(String(reader.result || ''));
                onImport?.(payload, importMode.value);
            } catch (err) {
                toast.textContent = 'インポート失敗（JSON形式）';
            }
        };
        reader.readAsText(file);
    });

    function setPageInfo(text) {
        pageValue.textContent = text || '';
    }

    function setPickerActive(active) {
        pickerToggle.textContent = active ? '選択終了' : '要素を選択';
        pickerTools.style.display = active ? 'block' : 'none';
    }

    function setTargetDisplay(text) {
        targetDisplay.textContent = text || '未選択';
    }

    function setSelectorValue(selector) {
        selectorInput.value = selector || '';
        draft.targetSelector = selector || '';
        emitDraftChange();
    }

    function setListSelectorValue(selector) {
        listSelectorInput.value = selector || '';
        draft.list.itemSelector = selector || '';
        emitDraftChange();
    }

    function setRulesList(rules) {
        rulesList.innerHTML = '';
        if (!rules.length) {
            rulesList.textContent = 'ルールはまだありません。';
            return;
        }

        rules.forEach(rule => {
            const row = el('div', 'aps-rule-row');
            const info = el('div', 'aps-rule-info');
            const name = rule.meta?.title || rule.targetSelector || '無題';
            info.textContent = name;

            const actions = el('div', 'aps-rule-actions');
            const enabled = el('input');
            enabled.type = 'checkbox';
            enabled.checked = rule.enabled !== false;
            enabled.addEventListener('change', () => onRuleToggle?.(rule.id, enabled.checked));

            const editBtn = el('button', 'aps-btn aps-btn-small', '編集');
            editBtn.addEventListener('click', () => onRuleEdit?.(rule.id));

            const deleteBtn = el('button', 'aps-btn aps-btn-small', '削除');
            deleteBtn.addEventListener('click', () => onRuleDelete?.(rule.id));

            actions.append(enabled, editBtn, deleteBtn);
            row.append(info, actions);
            rulesList.append(row);
        });
    }

    function setVisible(visible) {
        root.style.display = visible ? 'block' : 'none';
    }

    function setMinimized(minimized) {
        root.classList.toggle('aps-minimized', minimized);
    }

    function setDraft(newDraft) {
        draft = { ...draft, ...cloneDraft(newDraft) };
        syncDraftToInputs();
    }

    function setToast(message) {
        toast.textContent = message || '';
    }

    return {
        element: root,
        setPageInfo,
        setPickerActive,
        setTargetDisplay,
        setSelectorValue,
        setListSelectorValue,
        setRulesList,
        setVisible,
        setMinimized,
        setDraft,
        setToast,
    };
}
