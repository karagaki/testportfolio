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
            },
        };
    });
    return { ...data, rules };
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
    const normalizedRules = normalizeRules(payload.rules);

    if (mode === 'replace') {
        await setStorage({
            [RULES_KEY]: normalizedRules,
            [DRAFT_KEY]: payload.draft ?? null,
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
    normalizedRules.rules.forEach(rule => {
        if (rule?.id) merged.set(rule.id, rule);
    });

    await saveRules({ version: 1, rules: Array.from(merged.values()) });

    if (incomingSiteNames) {
        const cur = await getStorage({ [SITE_NAMES_KEY]: {} });
        const mergedNames = { ...(cur[SITE_NAMES_KEY] || {}), ...incomingSiteNames };
        await setStorage({ [SITE_NAMES_KEY]: mergedNames });
    }
}
