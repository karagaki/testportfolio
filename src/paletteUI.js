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
    onPickTargetChange,
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

    const dateSection = el('div', 'aps-section');
    const dateLabel = el('div', 'aps-label', '日付機能');
    const dateEnabledLabel = el('label', 'aps-checkbox');
    const dateEnabledInput = el('input');
    dateEnabledInput.type = 'checkbox';
    const dateEnabledText = document.createTextNode(' 過去日付をグレー化');
    dateEnabledLabel.append(dateEnabledInput, dateEnabledText);
    const dateApplyLabel = el('label', 'aps-checkbox');
    const dateApplyInput = el('input');
    dateApplyInput.type = 'checkbox';
    const dateApplyText = document.createTextNode(' キーワード一致なしでも適用（カレンダー全体向け）');
    dateApplyLabel.append(dateApplyInput, dateApplyText);

    const sourceTypeLabel = el('div', 'aps-label', '日付取得元');
    const sourceTypeSelect = el('select', 'aps-input');
    const optAttr = el('option');
    optAttr.value = 'attr';
    optAttr.textContent = '属性';
    const optSourceText = el('option');
    optSourceText.value = 'text';
    optSourceText.textContent = 'テキスト';
    const optDayNumber = el('option');
    optDayNumber.value = 'dayNumber';
    optDayNumber.textContent = '日付番号 + 年月ヘッダ';
    sourceTypeSelect.append(optAttr, optSourceText, optDayNumber);

    const dateSelectorLabel = el('div', 'aps-label', '日付要素セレクタ');
    const dateSelectorRow = el('div', 'aps-row');
    const dateSelectorInput = el('input', 'aps-input');
    dateSelectorInput.type = 'text';
    const dateSelectorBtn = el('button', 'aps-btn aps-btn-small', '日付要素を選択');
    dateSelectorRow.append(dateSelectorInput, dateSelectorBtn);

    const dateAttrLabel = el('div', 'aps-label', '日付属性名');
    const dateAttrInput = el('input', 'aps-input');
    dateAttrInput.type = 'text';

    const headerSelectorLabel = el('div', 'aps-label', '年月ヘッダセレクタ');
    const headerSelectorRow = el('div', 'aps-row');
    const headerSelectorInput = el('input', 'aps-input');
    headerSelectorInput.type = 'text';
    const headerSelectorBtn = el('button', 'aps-btn aps-btn-small', '年月ヘッダを選択');
    headerSelectorRow.append(headerSelectorInput, headerSelectorBtn);

    const headerFormatLabel = el('div', 'aps-label', '年月フォーマット');
    const headerFormatSelect = el('select', 'aps-input');
    const optJpYm = el('option');
    optJpYm.value = 'jp_ym';
    optJpYm.textContent = '2026年1月';
    const optYmSlash = el('option');
    optYmSlash.value = 'ym_slash';
    optYmSlash.textContent = '2026/1';
    const optEnMonth = el('option');
    optEnMonth.value = 'en_month_ym';
    optEnMonth.textContent = 'January 2026';
    headerFormatSelect.append(optJpYm, optYmSlash, optEnMonth);

    const grayPresetLabel = el('div', 'aps-label', 'グレー強度');
    const grayPresetSelect = el('select', 'aps-input');
    const optWeak = el('option');
    optWeak.value = 'weak';
    optWeak.textContent = '弱';
    const optMedium = el('option');
    optMedium.value = 'medium';
    optMedium.textContent = '中';
    const optStrong = el('option');
    optStrong.value = 'strong';
    optStrong.textContent = '強';
    grayPresetSelect.append(optWeak, optMedium, optStrong);

    dateSection.append(
        dateLabel,
        dateEnabledLabel,
        dateApplyLabel,
        sourceTypeLabel,
        sourceTypeSelect,
        dateSelectorLabel,
        dateSelectorRow,
        dateAttrLabel,
        dateAttrInput,
        headerSelectorLabel,
        headerSelectorRow,
        headerFormatLabel,
        headerFormatSelect,
        grayPresetLabel,
        grayPresetSelect
    );

    const paintSection = el('div', 'aps-section');
    const paintLabel = el('div', 'aps-label', '表現');
    const paintRow = el('div', 'aps-row');
    const colorInput = el('input', 'aps-input');
    colorInput.type = 'color';
    const typeSelect = el('select', 'aps-input');
    const optHighlight = el('option');
    optHighlight.value = 'highlight';
    optHighlight.textContent = '塗り（highlight）';
    const optText = el('option');
    optText.value = 'text';
    optText.textContent = '文字（text）';
    const optCollapse = el('option');
    optCollapse.value = 'collapse';
    optCollapse.textContent = '非表示（詰める）';
    typeSelect.append(optHighlight, optText, optCollapse);
    paintRow.append(colorInput, typeSelect);
    paintSection.append(paintLabel, paintRow);

    const textColorLabel = el('div', 'aps-label', '文字色');
    const textColorInput = el('input', 'aps-input');
    textColorInput.type = 'color';
    paintSection.append(textColorLabel, textColorInput);

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

    const statusRow = el('div', 'aps-status-row');
    statusRow.style.display = 'flex';
    statusRow.style.justifyContent = 'space-between';
    statusRow.style.alignItems = 'center';
    statusRow.style.padding = '4px 0';
    statusRow.style.fontSize = '12px';
    statusRow.style.borderTop = '1px solid rgba(0, 0, 0, 0.1)';
    statusRow.style.marginTop = '4px';
    statusRow.style.color = '#555';
    const statusLabel = el('span', 'aps-status-label', '未保存');
    const statusInfo = el('span', 'aps-status-info', 'ルール: 0');
    statusRow.append(statusLabel, statusInfo);

    const traceRow = el('div', 'aps-trace-row');
    traceRow.style.display = 'flex';
    traceRow.style.justifyContent = 'space-between';
    traceRow.style.alignItems = 'center';
    traceRow.style.padding = '4px 0';
    traceRow.style.fontSize = '11px';
    traceRow.style.fontFamily = 'monospace';
    traceRow.style.color = '#777';
    traceRow.style.borderTop = '1px dashed rgba(0, 0, 0, 0.15)';
    const traceText = el('span', 'aps-trace-text', 'apply=UNKNOWN last=--:--:-- count=0 host=');
    traceRow.append(traceText);

    body.append(
        pageSection,
        pickerToggle,
        pickerTools,
        urlSection,
        listModeSection,
        keywordSection,
        dateSection,
        paintSection,
        titleSection,
        saveBtn,
        backupSection,
        statusRow,
        traceRow,
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
            fg: '#888888',
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

        dateEnabledInput.checked = !!draft.date?.enabled;
        dateApplyInput.checked = !!draft.date?.applyWithoutKeyword;
        sourceTypeSelect.value = draft.date?.sourceType || 'attr';
        dateSelectorInput.value = draft.date?.dateSelector || '';
        dateAttrInput.value = draft.date?.dateAttr || 'data-date';
        headerSelectorInput.value = draft.date?.headerSelector || '';
        headerFormatSelect.value = draft.date?.headerFormat || 'jp_ym';
        grayPresetSelect.value = draft.date?.grayPreset || 'medium';

        const showAttr = sourceTypeSelect.value === 'attr';
        const showHeader = sourceTypeSelect.value === 'dayNumber';
        dateAttrLabel.style.display = showAttr ? 'block' : 'none';
        dateAttrInput.style.display = showAttr ? 'block' : 'none';
        headerSelectorLabel.style.display = showHeader ? 'block' : 'none';
        headerSelectorRow.style.display = showHeader ? 'flex' : 'none';
        headerFormatLabel.style.display = showHeader ? 'block' : 'none';
        headerFormatSelect.style.display = showHeader ? 'block' : 'none';

        const isText = draft.paint.type === 'text';
        textColorLabel.style.display = isText ? 'block' : 'none';
        textColorInput.style.display = isText ? 'block' : 'none';
        if (isText) {
            textColorInput.value = draft.paint.fg || '#888888';
        }

        const noFill = draft.paint.type === 'collapse' || draft.paint.type === 'text';
        colorInput.disabled = noFill;
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
            date: {
                ...draft.date,
                ...partial.date,
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

    pickerToggle.addEventListener('click', () => {
        onPickTargetChange?.('target');
        onTogglePicker?.();
    });
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
        syncDraftToInputs();
        emitDraftChange();
    });

    textColorInput.addEventListener('input', () => {
        draft.paint.fg = textColorInput.value;
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

    dateEnabledInput.addEventListener('change', () => {
        draft.date.enabled = dateEnabledInput.checked;
        emitDraftChange();
    });

    dateApplyInput.addEventListener('change', () => {
        draft.date.applyWithoutKeyword = dateApplyInput.checked;
        emitDraftChange();
    });

    sourceTypeSelect.addEventListener('change', () => {
        draft.date.sourceType = sourceTypeSelect.value;
        syncDraftToInputs();
        emitDraftChange();
    });

    dateSelectorInput.addEventListener('input', () => {
        draft.date.dateSelector = dateSelectorInput.value.trim();
        emitDraftChange();
    });

    dateSelectorBtn.addEventListener('click', () => {
        onPickTargetChange?.('date');
        onTogglePicker?.();
    });

    dateAttrInput.addEventListener('input', () => {
        draft.date.dateAttr = dateAttrInput.value.trim();
        emitDraftChange();
    });

    headerSelectorInput.addEventListener('input', () => {
        draft.date.headerSelector = headerSelectorInput.value.trim();
        emitDraftChange();
    });

    headerSelectorBtn.addEventListener('click', () => {
        onPickTargetChange?.('header');
        onTogglePicker?.();
    });

    headerFormatSelect.addEventListener('change', () => {
        draft.date.headerFormat = headerFormatSelect.value;
        emitDraftChange();
    });

    grayPresetSelect.addEventListener('change', () => {
        draft.date.grayPreset = grayPresetSelect.value;
        emitDraftChange();
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

    function setDateSelectorValue(selector) {
        dateSelectorInput.value = selector || '';
        draft.date.dateSelector = selector || '';
        emitDraftChange();
    }

    function setHeaderSelectorValue(selector) {
        headerSelectorInput.value = selector || '';
        draft.date.headerSelector = selector || '';
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

    function setStatus(text) {
        statusLabel.textContent = text || '未保存';
    }

    function setStatusInfo(text) {
        statusInfo.textContent = text || '';
    }

    function setTrace(text) {
        traceText.textContent = text || '';
    }

    return {
        element: root,
        setPageInfo,
        setPickerActive,
        setTargetDisplay,
        setSelectorValue,
        setDateSelectorValue,
        setHeaderSelectorValue,
        setListSelectorValue,
        setRulesList,
        setVisible,
        setMinimized,
        setDraft,
        setToast,
        setStatus,
        setStatusInfo,
        setTrace,
    };
}

export function mountPaletteUI(container) {
    const callbacks = window.__aps_adapter_callbacks ?? {};
    const palette = createPaletteUI(callbacks);
    container.appendChild(palette.element);
    palette.setStatus('未保存');
    palette.setStatusInfo('ルール: 0');
    palette.setTrace('apply=UNKNOWN last=--:--:-- count=0 host=unknown');

    function updateState(state) {
        if (!state) return;
        const {
            pageInfo,
            pickerActive,
            targetDisplay,
            rules,
            draft,
            visible,
            minimized,
        } = state;
        palette.setPageInfo(pageInfo || '');
        palette.setPickerActive(!!pickerActive);
        palette.setTargetDisplay(targetDisplay || '');
        palette.setRulesList(rules || []);
        palette.setDraft(draft || {});
        palette.setVisible(!!visible);
        palette.setMinimized(!!minimized);
        palette.setToast('');
        palette.setStatusInfo(`ルール: ${rules?.length || 0}`);
    }

    return {
        updateState,
        setStatus: palette.setStatus,
        setTrace: palette.setTrace,
    };
}
