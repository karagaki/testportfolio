const RULES_KEY = 'aps_rules_v1';
const DRAFT_KEY = 'aps_draft_v1';
const PALETTE_KEY = 'aps_palette_state_v1';
const SITE_NAMES_KEY = 'aps_site_names_v1';

function getStorage(defaults) {
    return new Promise(resolve => {
        if (!chrome?.storage?.local) {
            resolve({ ...defaults });
            return;
        }
        chrome.storage.local.get(defaults, data => resolve(data));
    });
}

function setStorage(payload) {
    return new Promise(resolve => {
        if (!chrome?.storage?.local) {
            resolve();
            return;
        }
        chrome.storage.local.set(payload, () => resolve());
    });
}

function normalizeRules(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.rules)) {
        return { version: 1, rules: [] };
    }
    const rules = data.rules.map(rule => {
        const scope = rule.scope || {};
        const list = rule.list || {};
        const date = rule.date || {};
        const datePaint = date.paint || {};
        const normalizedDatePaint = {
            type: ['highlight', 'text', 'collapse'].includes(datePaint.type)
                ? datePaint.type
                : 'highlight',
            bg: datePaint.bg || '#ffc0cb',
            fg: datePaint.fg || '',
            border: datePaint.border || 'rgba(0,0,0,0.15)',
        };
        return {
            ...rule,
            scope: {
                ...scope,
                applyToAllPaths: !!scope.applyToAllPaths,
            },
            list: {
                ...list,
                enabled: !!list.enabled,
                itemSelector: list.itemSelector || '',
            },
            date: {
                enabled: !!date.enabled,
                applyWithoutKeyword: !!date.applyWithoutKeyword,
                sourceType: ['attr', 'text', 'dayNumber'].includes(date.sourceType) ? date.sourceType : 'attr',
                dateSelector: date.dateSelector || '',
                dateAttr: date.dateAttr || 'data-date',
                headerSelector: date.headerSelector || '',
                headerFormat: ['jp_ym', 'ym_slash', 'en_month_ym'].includes(date.headerFormat)
                    ? date.headerFormat
                    : 'jp_ym',
                grayPreset: ['weak', 'medium', 'strong'].includes(date.grayPreset) ? date.grayPreset : 'medium',
                paint: normalizedDatePaint,
            },
        };
    });
    return { ...data, rules };
}

function normalizePaint(paint) {
    const src = paint || {};
    const type = ['highlight', 'text', 'collapse'].includes(src.type) ? src.type : 'highlight';
    return {
        type,
        bg: src.bg || '#ffc0cb',
        fg: src.fg || '',
        border: src.border || 'rgba(0,0,0,0.15)',
    };
}

function normalizeDateConfig(date, keywordPaint) {
    const src = date || {};
    const paint = src.paint ? normalizePaint(src.paint) : normalizePaint(keywordPaint);
    return {
        enabled: !!src.enabled,
        applyWithoutKeyword: !!src.applyWithoutKeyword,
        sourceType: ['attr', 'text', 'dayNumber'].includes(src.sourceType) ? src.sourceType : 'attr',
        dateSelector: src.dateSelector || '',
        dateAttr: src.dateAttr || 'data-date',
        headerSelector: src.headerSelector || '',
        headerFormat: ['jp_ym', 'ym_slash', 'en_month_ym'].includes(src.headerFormat)
            ? src.headerFormat
            : 'jp_ym',
        grayPreset: ['weak', 'medium', 'strong'].includes(src.grayPreset) ? src.grayPreset : 'medium',
        paint,
    };
}

function normalizeRuleForImport(rule) {
    if (!rule || typeof rule !== 'object') return null;
    const normalizedPaint = normalizePaint(rule.paint);
    const normalizedDate = normalizeDateConfig(rule.date, normalizedPaint);
    return {
        ...rule,
        paint: normalizedPaint,
        date: normalizedDate,
    };
}

function normalizeDraftForImport(draft) {
    if (!draft || typeof draft !== 'object') return null;
    const normalizedPaint = normalizePaint(draft.paint);
    const normalizedDate = normalizeDateConfig(draft.date, normalizedPaint);
    const step2 = {
        targetConfirmed: !!draft.step2?.targetConfirmed,
        dateMode: typeof draft.step2?.dateMode === 'string' ? draft.step2.dateMode : 'unset',
    };
    return {
        ...draft,
        paint: normalizedPaint,
        date: normalizedDate,
        step2,
    };
}

function normalizeRulesForImport(rulesData) {
    const rules = Array.isArray(rulesData?.rules)
        ? rulesData.rules.map(normalizeRuleForImport).filter(Boolean)
        : [];
    return { version: 1, rules };
}

function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function mergeDefined(base, incoming) {
    if (!isPlainObject(base)) return incoming ?? base;
    if (!isPlainObject(incoming)) return base;
    const out = { ...base };
    Object.keys(incoming).forEach(key => {
        const value = incoming[key];
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
            out[key] = value;
            return;
        }
        if (isPlainObject(value)) {
            out[key] = mergeDefined(isPlainObject(base[key]) ? base[key] : {}, value);
            return;
        }
        out[key] = value;
    });
    return out;
}

export async function loadRules() {
    const data = await getStorage({ [RULES_KEY]: { version: 1, rules: [] } });
    return normalizeRules(data[RULES_KEY]);
}

export async function saveRules(rulesData) {
    await setStorage({ [RULES_KEY]: rulesData });
}

export async function upsertRule(rule) {
    const rulesData = await loadRules();
    const now = Date.now();
    const updatedRule = {
        ...rule,
        meta: {
            title: rule.meta?.title || '',
            createdAt: rule.meta?.createdAt || now,
            updatedAt: now,
        },
    };

    const index = rulesData.rules.findIndex(r => r.id === updatedRule.id);
    if (index >= 0) {
        rulesData.rules[index] = updatedRule;
    } else {
        rulesData.rules.push(updatedRule);
    }

    await saveRules(rulesData);
    return rulesData;
}

export async function deleteRule(ruleId) {
    const rulesData = await loadRules();
    rulesData.rules = rulesData.rules.filter(rule => rule.id !== ruleId);
    await saveRules(rulesData);
    return rulesData;
}

export async function loadDraft() {
    const data = await getStorage({ [DRAFT_KEY]: null });
    return data[DRAFT_KEY];
}

export async function saveDraft(draft) {
    await setStorage({ [DRAFT_KEY]: draft });
}

export async function clearDraft() {
    await setStorage({ [DRAFT_KEY]: null });
}

export async function loadPaletteState() {
    const data = await getStorage({ [PALETTE_KEY]: null });
    return data[PALETTE_KEY];
}

export async function savePaletteState(state) {
    await setStorage({ [PALETTE_KEY]: state });
}

export { RULES_KEY, DRAFT_KEY, PALETTE_KEY };

export async function exportAllData() {
    const data = await getStorage({
        [RULES_KEY]: { version: 1, rules: [] },
        [DRAFT_KEY]: null,
        [PALETTE_KEY]: null,
        [SITE_NAMES_KEY]: {},
    });
    return {
        exportedAt: Date.now(),
        schema: 'aps_backup_v1',
        rules: normalizeRules(data[RULES_KEY]),
        draft: data[DRAFT_KEY],
        paletteState: data[PALETTE_KEY],
        siteNames: data[SITE_NAMES_KEY] || {},
    };
}

function isValidBackup(payload) {
    if (!payload || payload.schema !== 'aps_backup_v1') return false;
    if (payload.rules?.version !== 1) return false;
    if (!Array.isArray(payload.rules?.rules)) return false;
    return true;
}

export async function importAllData(payload, mode) {
    if (!isValidBackup(payload)) {
        throw new Error('Invalid backup schema');
    }

    const incomingSiteNames =
        (payload && payload.siteNames && typeof payload.siteNames === 'object' && !Array.isArray(payload.siteNames))
            ? payload.siteNames
            : null;
    const incomingRules = Array.isArray(payload.rules?.rules) ? payload.rules.rules : [];
    const normalizedRules = normalizeRulesForImport(payload.rules);
    const normalizedDraft = normalizeDraftForImport(payload.draft);

    if (mode === 'replace') {
        await setStorage({
            [RULES_KEY]: normalizedRules,
            [DRAFT_KEY]: normalizedDraft,
            [PALETTE_KEY]: payload.paletteState ?? null,
            [SITE_NAMES_KEY]: incomingSiteNames ?? {},
        });
        return;
    }

    const rulesData = await loadRules();
    const merged = new Map();
    rulesData.rules.forEach(rule => {
        if (rule?.id) merged.set(rule.id, rule);
    });
    incomingRules.forEach(rule => {
        if (!rule?.id) return;
        const existing = merged.get(rule.id);
        if (existing) {
            const mergedRule = mergeDefined(existing, rule);
            const normalized = normalizeRuleForImport(mergedRule);
            if (normalized) merged.set(rule.id, normalized);
            return;
        }
        const normalized = normalizeRuleForImport(rule);
        if (normalized) merged.set(rule.id, normalized);
    });

    await saveRules({ version: 1, rules: Array.from(merged.values()) });

    if (incomingSiteNames) {
        const cur = await getStorage({ [SITE_NAMES_KEY]: {} });
        const mergedNames = { ...(cur[SITE_NAMES_KEY] || {}), ...incomingSiteNames };
        await setStorage({ [SITE_NAMES_KEY]: mergedNames });
    }

    if (payload.draft) {
        const currentDraft = await loadDraft();
        const mergedDraft = normalizeDraftForImport(mergeDefined(currentDraft || {}, payload.draft));
        await saveDraft(mergedDraft);
    }
}
