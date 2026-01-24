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
    onStep2TargetConfirmToggle,
    onStep2DateModeChange,
}) {
    const root = el('div', 'aps-palette');
    root.setAttribute('data-aps-palette', '1');

    const header = el('div', 'aps-header');
    const title = el('div', 'aps-title', 'Aパレットサーチ');
    const minimizeBtn = el('button', 'aps-icon-btn', '_');
    const closeBtn = el('button', 'aps-icon-btn', '×');
    header.append(title, minimizeBtn, closeBtn);

    const bannerContainer = el('div', 'aps-banner');
    bannerContainer.style.display = 'none';
    const bannerText = el('span', 'aps-banner-text', '選択モード：要素を選択中');
    const bannerBtns = el('div', 'aps-banner-btns');
    const bannerEndBtn = el('button', 'aps-btn aps-btn-small', '終了');
    const bannerCancelBtn = el('button', 'aps-btn aps-btn-small', 'キャンセル');
    bannerBtns.append(bannerEndBtn, bannerCancelBtn);
    bannerContainer.append(bannerText, bannerBtns);

    const body = el('div', 'aps-body');

    const pageSection = el('div', 'aps-section');
    const pageLabel = el('div', 'aps-label', '現在ページ');
    const pageValue = el('div', 'aps-page');
    pageSection.append(pageLabel, pageValue);
    pageSection.dataset.step = 'step1';

    const pickerToggle = el('button', 'aps-btn aps-picker-toggle', '要素を選択');
    pickerToggle.dataset.step = 'step2';

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
    pickerTools.dataset.step = 'step2';

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
    urlSection.dataset.step = 'step1';

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
    listModeSection.dataset.step = 'step3_1';

    const keywordSection = el('div', 'aps-section');
    const keywordLabel = el('div', 'aps-label', 'キーワード');
    const keywordRow = el('div', 'aps-row');
    const keywordInput = el('input', 'aps-input');
    keywordInput.type = 'text';
    const keywordAdd = el('button', 'aps-btn aps-btn-small', '追加');
    keywordRow.append(keywordInput, keywordAdd);
    const keywordList = el('div', 'aps-keyword-list');
    keywordSection.append(keywordLabel, keywordRow, keywordList);
    keywordSection.dataset.step = 'step3_2';

    const dateAuxSection = el('div', 'aps-section');
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

    const dateAttrLabel = el('div', 'aps-label', '日付属性名');
    const dateAttrInput = el('input', 'aps-input');
    dateAttrInput.type = 'text';

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

    dateAuxSection.append(
        dateLabel,
        dateEnabledLabel,
        dateApplyLabel,
        sourceTypeLabel,
        sourceTypeSelect,
        dateAttrLabel,
        dateAttrInput,
        grayPresetLabel,
        grayPresetSelect
    );
    dateAuxSection.dataset.step = 'step3_3';

    const dateSelectorSection = el('div', 'aps-section');
    const dateSelectorLabel = el('div', 'aps-label', '日付要素セレクタ');
    const dateSelectorRow = el('div', 'aps-row');
    const dateSelectorInput = el('input', 'aps-input');
    dateSelectorInput.type = 'text';
    const dateSelectorBtn = el('button', 'aps-btn aps-btn-small', '日付要素を選択');
    dateSelectorRow.append(dateSelectorInput);

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

    dateSelectorSection.append(
        dateSelectorLabel,
        dateSelectorRow,
        headerSelectorLabel,
        headerSelectorRow,
        headerFormatLabel,
        headerFormatSelect
    );
    dateSelectorSection.dataset.step = 'step4';

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
    paintSection.dataset.step = 'step3_3';

    const textColorLabel = el('div', 'aps-label', '文字色');
    const textColorInput = el('input', 'aps-input');
    textColorInput.type = 'color';
    paintSection.append(textColorLabel, textColorInput);

    const titleSection = el('div', 'aps-section');
    const titleLabel = el('div', 'aps-label', 'タイトル');
    const titleInput = el('input', 'aps-input');
    titleInput.type = 'text';
    titleSection.append(titleLabel, titleInput);
    titleSection.dataset.step = 'step3_3';

    const saveBtn = el('button', 'aps-btn aps-save', '保存して有効化');
    saveBtn.dataset.step = 'step4';

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

    // 工程見出し
    const step1Header = el('div', 'aps-step-header');
    const step1Title = el('span', 'aps-step-title', '① 対象');
    const step1Chip = el('span', 'aps-step-chip', '未設定');
    step1Chip.style.display = 'none';
    step1Header.append(step1Title, step1Chip);
    step1Header.dataset.step = 'step1';

    const step2Header = el('div', 'aps-step-header');
    const step2Title = el('span', 'aps-step-title', '② 要素');
    const step2Chip = el('span', 'aps-step-chip', '未設定');
    step2Chip.style.display = 'none';
    step2Header.append(step2Title, step2Chip);
    step2Header.dataset.step = 'step2';

    const slotSection = el('div', 'aps-slot-section');
    const targetSlotRow = el('div', 'aps-slot-row');
    const targetSlotLabel = el('span', 'aps-slot-label', '対象要素');
    const targetSlotControls = el('div', 'aps-slot-controls');
    const targetSlotStatus = el('span', 'aps-slot-status', '未設定');
    targetSlotControls.append(pickerToggle, targetSlotStatus);
    targetSlotRow.append(targetSlotLabel, targetSlotControls);

    const targetConfirmArea = el('div', 'aps-step2-confirm');
    const targetConfirmBtn = el('button', 'aps-btn aps-btn-small aps-step2-confirm-btn', '対象を確定');
    targetConfirmArea.append(targetConfirmBtn);
    targetConfirmArea.style.display = 'none';

    const dateModeArea = el('div', 'aps-step2-datemode');
    const dateModeLabel = el('span', 'aps-step2-datemode-label', '日付の有無');
    const dateModeNeedBtn = el('button', 'aps-btn aps-btn-small aps-step2-datemode-btn', '日付を指定する');
    const dateModeSkipBtn = el('button', 'aps-btn aps-btn-small aps-step2-datemode-btn', '日付は指定しない');
    dateModeArea.append(dateModeLabel, dateModeNeedBtn, dateModeSkipBtn);
    dateModeArea.style.display = 'none';

    const dateSlotRow = el('div', 'aps-slot-row');
    const dateSlotLabel = el('span', 'aps-slot-label', '日付要素');
    const dateSlotControls = el('div', 'aps-slot-controls');
    const dateSlotStatus = el('span', 'aps-slot-status', '未設定');
    const dateRequirementBadge = el('span', 'aps-badge aps-badge--optional', '任意');
    dateSlotControls.append(dateSelectorBtn, dateSlotStatus, dateRequirementBadge);
    dateSlotRow.append(dateSlotLabel, dateSlotControls);

    slotSection.append(targetSlotRow, targetConfirmArea, dateModeArea, dateSlotRow);

    const step3_1Header = el('div', 'aps-step-header');
    const step3_1Title = el('span', 'aps-step-title', '③-1 条件タイプ');
    const step3_1Chip = el('span', 'aps-step-chip', '未設定');
    step3_1Chip.style.display = 'none';
    step3_1Header.append(step3_1Title, step3_1Chip);
    step3_1Header.dataset.step = 'step3_1';

    const step3_2Header = el('div', 'aps-step-header');
    const step3_2Title = el('span', 'aps-step-title', '③-2 条件内容');
    const step3_2Chip = el('span', 'aps-step-chip', '未設定');
    step3_2Chip.style.display = 'none';
    step3_2Header.append(step3_2Title, step3_2Chip);
    step3_2Header.dataset.step = 'step3_2';

    const step3_3Header = el('div', 'aps-step-header');
    const step3_3Title = el('span', 'aps-step-title', '③-3 補助条件');
    const step3_3Chip = el('span', 'aps-step-chip', '未設定');
    step3_3Chip.style.display = 'none';
    step3_3Header.append(step3_3Title, step3_3Chip);
    step3_3Header.dataset.step = 'step3_3';

    const step5Header = el('div', 'aps-step-header');
    const step5Title = el('span', 'aps-step-title', '⑤ 保存・有効化');
    const step5Chip = el('span', 'aps-step-chip', '未設定');
    step5Chip.style.display = 'none';
    step5Header.append(step5Title, step5Chip);
    step5Header.dataset.step = 'step5';

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
    const dirtyChip = el('span', 'aps-dirty-chip');
    dirtyChip.style.display = 'none';
    dirtyChip.textContent = '未保存';
    const applyStateLabel = el('span', 'aps-apply-state', '下書き');
    const statusInfo = el('span', 'aps-status-info', 'ルール: 0');
    statusRow.append(statusLabel, dirtyChip, applyStateLabel, statusInfo);

    const guideLine = el('div', 'aps-guide-line');
    guideLine.style.display = 'none';
    guideLine.textContent = '';

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

    const step1Block = el('div', 'aps-step-block');
    step1Block.dataset.step = 'step1';
    step1Block.append(step1Header, pageSection, urlSection);

    const step2Block = el('div', 'aps-step-block');
    step2Block.dataset.step = 'step2';
    step2Block.append(step2Header, slotSection, pickerTools);

    const step3_1Block = el('div', 'aps-step-block');
    step3_1Block.dataset.step = 'step3_1';
    step3_1Block.append(step3_1Header, listModeSection);

    const step3_2Block = el('div', 'aps-step-block');
    step3_2Block.dataset.step = 'step3_2';
    step3_2Block.append(step3_2Header, keywordSection, paintSection, titleSection);

    const step3_3Block = el('div', 'aps-step-block');
    step3_3Block.dataset.step = 'step3_3';
    step3_3Block.append(step3_3Header, dateAuxSection);

    const step4Block = el('div', 'aps-step-block');
    step4Block.dataset.step = 'step4';
    step4Block.append(dateSelectorSection);

    const step5Block = el('div', 'aps-step-block');
    step5Block.dataset.step = 'step5';
    step5Block.append(step5Header, saveBtn);

    body.append(
        step1Block,
        step2Block,
        step3_1Block,
        step3_2Block,
        step3_3Block,
        step4Block,
        step5Block,
        backupSection,
        statusRow,
        guideLine,
        traceRow,
        listSection
    );

    root.append(header, bannerContainer, body);

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
    bannerEndBtn.addEventListener('click', () => onTogglePicker?.());
    bannerCancelBtn.addEventListener('click', () => onTogglePicker?.());
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

    targetConfirmBtn.addEventListener('click', () => {
        onStep2TargetConfirmToggle?.();
    });
    dateModeNeedBtn.addEventListener('click', () => {
        onStep2DateModeChange?.('need');
    });
    dateModeSkipBtn.addEventListener('click', () => {
        onStep2DateModeChange?.('skip');
    });

    function setPageInfo(text) {
        pageValue.textContent = text || '';
    }

    function setPickerActive(active, target) {
        pickerToggle.textContent = active ? '選択終了' : '要素を選択';
        pickerTools.style.display = active ? 'block' : 'none';
        bannerContainer.style.display = active ? 'flex' : 'none';
        if (active) {
            if (target === 'date') {
                bannerText.textContent = '選択モード：日付要素を選択中';
            } else if (target === 'header') {
                bannerText.textContent = '選択モード：年月ヘッダを選択中';
            } else {
                bannerText.textContent = '選択モード：対象要素を選択中';
            }
        }
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

    let toastTimer = null;
    function setToast(message, ttlMs = 2000) {
        clearTimeout(toastTimer);
        toast.textContent = message || '';
        toast.style.display = message ? 'block' : 'none';
        if (message && ttlMs > 0) {
            toastTimer = setTimeout(() => {
                toast.textContent = '';
                toast.style.display = 'none';
            }, ttlMs);
        }
    }

    function setDirty(isDirty) {
        dirtyChip.style.display = isDirty ? 'inline-block' : 'none';
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

    function setGuideMessage(text) {
        if (!text) {
            guideLine.textContent = '';
            guideLine.style.display = 'none';
            return;
        }
        guideLine.textContent = text;
        guideLine.style.display = 'block';
    }

    function applyButtonState(button, enabled) {
        if (!button) return;
        button.disabled = !enabled;
        button.classList.toggle('aps-disabled', !enabled);
    }

    function applyStepLock(block, locked) {
        if (!block) return;
        block.classList.toggle('aps-step-locked', !!locked);
        block.setAttribute('aria-disabled', locked ? 'true' : 'false');
    }

    function setActiveStep(stepKey) {
        const blocks = root.querySelectorAll('.aps-step-block');
        blocks.forEach(block => {
            const attr = block.dataset.step || '';
            if (!attr) return;
            if (!stepKey) {
                block.classList.add('aps-step-light');
                block.classList.remove('aps-step-dark');
                return;
            }
            if (attr === stepKey) {
                block.classList.add('aps-step-light');
                block.classList.remove('aps-step-dark');
            } else {
                block.classList.add('aps-step-dark');
                block.classList.remove('aps-step-light');
            }
        });
    }

    function setStep2ConfirmState(state = {}) {
        const { targetSelected, targetConfirmed } = state;
        const showConfirm = !!targetSelected;
        targetConfirmArea.style.display = showConfirm ? 'flex' : 'none';
        targetConfirmBtn.textContent = targetConfirmed ? '対象を再選択' : '対象を確定';
        targetConfirmBtn.classList.toggle('aps-step2-confirm-btn--active', !!targetConfirmed);
        targetSlotRow.classList.toggle('aps-slot-row--confirmed', !!targetConfirmed);
    }

    function setStep2DateModeState(state = {}) {
        const { targetConfirmed, dateMode = 'unset', dateSelected } = state;
        const showDateMode = !!targetConfirmed;
        dateModeArea.style.display = showDateMode ? 'flex' : 'none';
        dateModeNeedBtn.classList.toggle('aps-step2-datemode-btn--active', dateMode === 'need');
        dateModeSkipBtn.classList.toggle('aps-step2-datemode-btn--active', dateMode === 'skip');
        const shouldHighlightDate = targetConfirmed && dateMode === 'need' && !dateSelected;
        dateSlotRow.classList.toggle('aps-slot-row--dim', targetConfirmed && dateMode === 'skip');
        dateSlotRow.classList.toggle('aps-slot-row--highlight', shouldHighlightDate);
        dateSelectorBtn.classList.toggle('aps-step2-date-selector--highlight', shouldHighlightDate);
    }

    function setSlotStatus(status = {}) {
        const { targetSelected, dateSelected, dateMode = 'unset' } = status;
        if (typeof targetSelected === 'boolean') {
            const text = targetSelected ? '設定済' : '未設定';
            targetSlotStatus.textContent = text;
            targetSlotStatus.classList.toggle('aps-slot-status--set', !!targetSelected);
        }
        if (typeof dateSelected === 'boolean') {
            const text = dateSelected ? '設定済' : '未設定';
            dateSlotStatus.textContent = text;
            dateSlotStatus.classList.toggle('aps-slot-status--set', !!dateSelected);
        }
        const normalizedMode = dateMode || 'unset';
        let badgeText = '未決定';
        if (normalizedMode === 'need') badgeText = '必須';
        else if (normalizedMode === 'skip') badgeText = '指定しない';
        const isNeed = normalizedMode === 'need';
        const isSkip = normalizedMode === 'skip';
        dateRequirementBadge.textContent = badgeText;
        dateRequirementBadge.classList.toggle('aps-badge--required', isNeed);
        dateRequirementBadge.classList.toggle('aps-badge--skip', isSkip);
        dateRequirementBadge.classList.toggle('aps-badge--optional', !isNeed && !isSkip);
    }

    function setStepState(stepState) {
        step1Chip.style.display = stepState?.step1 ? 'none' : 'inline-block';
        step2Chip.style.display = stepState?.step2 ? 'none' : 'inline-block';
        step3_1Chip.style.display = stepState?.step3_1 ? 'none' : 'inline-block';
        step3_2Chip.style.display = stepState?.step3_2 ? 'none' : 'inline-block';
        step3_3Chip.style.display = stepState?.step3_3 ? 'none' : 'inline-block';
        step5Chip.style.display = stepState?.step5 ? 'none' : 'inline-block';

        const allowStep2 = !!stepState?.step1;

        // STEP2: 要素選択（対象）は step1 完了で許可
        applyButtonState(pickerToggle, allowStep2);

        // STEP2: 日付要素の選択は「対象確定」＋「日付を指定する」選択時のみ許可
        const targetConfirmed = !!draft?.step2?.targetConfirmed;
        const dateMode = draft?.step2?.dateMode || 'unset';
        const allowDatePick = allowStep2 && targetConfirmed && dateMode === 'need';
        applyButtonState(dateSelectorBtn, allowDatePick);

        // リスト生成も step1 完了で許可
        applyButtonState(listGenerateBtn, allowStep2);

        const lockAfterStep2 = !stepState?.step2;
        const lockAfterStep3_1 = !stepState?.step3_1;
        const lockAfterStep3_2 = !stepState?.step3_2;

        applyStepLock(step3_1Block, lockAfterStep2);
        applyStepLock(step3_2Block, lockAfterStep2 || lockAfterStep3_1);
        applyStepLock(step3_3Block, lockAfterStep2 || lockAfterStep3_1 || lockAfterStep3_2);

        applyStepLock(step4Block, lockAfterStep2 || lockAfterStep3_1 || lockAfterStep3_2);
        applyStepLock(step5Block, lockAfterStep2 || lockAfterStep3_1 || lockAfterStep3_2);

        const canSave = !!stepState?.step1 && !!stepState?.step2 && !!stepState?.step3_1 && !!stepState?.step3_2;
        applyButtonState(saveBtn, canSave);
    }

    function setApplyState(state) {
        const labels = {
            draft: '下書き',
            saved: '保存済（未適用）',
            applied: '適用済',
        };
        applyStateLabel.textContent = labels[state] || '下書き';
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
        setDirty,
        setStatus,
        setStatusInfo,
        setTrace,
        setStepState,
        setGuideMessage,
        setStep2ConfirmState,
        setStep2DateModeState,
        setSlotStatus,
        setActiveStep,
        setApplyState,
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
        setToast: palette.setToast,
        setDirty: palette.setDirty,
        setPickerActive: palette.setPickerActive,
        setStepState: palette.setStepState,
        setGuideMessage: palette.setGuideMessage,
        setStep2ConfirmState: palette.setStep2ConfirmState,
        setStep2DateModeState: palette.setStep2DateModeState,
        setSlotStatus: palette.setSlotStatus,
        setActiveStep: palette.setActiveStep,
        setApplyState: palette.setApplyState,
    };
}
