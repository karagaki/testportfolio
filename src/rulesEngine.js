function normalizeText(text) {
    return (text ?? '').toString().trim().toLowerCase();
}

function getScopeKey() {
    return location.host + location.pathname;
}

function getLocalTodayStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function getBaseDateFromUrl() {
    try {
        const params = new URLSearchParams(location.search);
        const year = Number(params.get('target_year'));
        const month = Number(params.get('target_month'));
        if (Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12) {
            return new Date(year, month - 1, 1, 0, 0, 0, 0);
        }
    } catch (e) {
        // ignore
    }
    return null;
}

function parseDateString(value) {
    const text = (value ?? '').toString().trim();
    if (!text) return null;
    let match = text.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
            return new Date(year, month - 1, day);
        }
    }
    match = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
    if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
            return new Date(year, month - 1, day);
        }
    }
    return null;
}

function parseDateFromTextNode(node, selector) {
    if (!node) return null;
    const target = selector ? node.querySelector(selector) : node;
    if (!target) return null;
    const text = target.innerText || target.textContent || '';
    return parseDateString(text);
}

function parseHeaderYearMonth(text, format) {
    const raw = (text ?? '').toString().trim();
    if (!raw) return null;
    if (format === 'ym_slash') {
        const match = raw.match(/(\d{4})\s*\/\s*(\d{1,2})/);
        if (!match) return null;
        return { year: Number(match[1]), month: Number(match[2]) };
    }
    if (format === 'en_month_ym') {
        const match = raw.match(/([A-Za-z]+)\s+(\d{4})/);
        if (!match) return null;
        const name = match[1].toLowerCase();
        const months = {
            jan: 1,
            january: 1,
            feb: 2,
            february: 2,
            mar: 3,
            march: 3,
            apr: 4,
            april: 4,
            may: 5,
            jun: 6,
            june: 6,
            jul: 7,
            july: 7,
            aug: 8,
            august: 8,
            sep: 9,
            sept: 9,
            september: 9,
            oct: 10,
            october: 10,
            nov: 11,
            november: 11,
            dec: 12,
            december: 12,
        };
        const month = months[name];
        if (!month) return null;
        return { year: Number(match[2]), month };
    }
    const match = raw.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/);
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]) };
}

function parseDayOnlyText(text, baseDate) {
    if (!baseDate) return null;
    const raw = (text ?? '').toString();
    const match = raw.match(/(\d{1,2})/);
    if (!match) return null;
    const day = Number(match[1]);
    if (Number.isNaN(day) || day < 1 || day > 31) return null;
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), day);
}

function parseDateFromRule(node, rule, baseDate) {
    const date = rule.date || {};
    const container = node?.closest?.('.schedule_list_container')
        || (node?.classList?.contains?.('schedule_list_container') ? node : node);
    const base = date.dateSelector ? container?.querySelector?.(date.dateSelector) : null;

    if (date.sourceType === 'attr') {
        const attrTarget = base || container;
        const attr = date.dateAttr || 'data-date';
        const val = attrTarget ? attrTarget.getAttribute(attr) : null;
        const parsed = parseDateString(val);
        if (parsed) return parsed;
    }

    if (date.sourceType === 'text' && base) {
        const val = base.innerText || base.textContent;
        const parsed = parseDateString(val);
        if (parsed) return parsed;
    }

    if (date.sourceType === 'dayNumber') {
        const dayTarget = base || container;
        const dayText = dayTarget?.innerText || dayTarget?.textContent || '';
        const dayMatch = dayText.match(/(\d{1,2})/);
        if (dayMatch) {
            const day = Number(dayMatch[1]);
            if (!Number.isNaN(day) && day >= 1 && day <= 31) {
                const headerSelector = date.headerSelector || '';
                if (headerSelector) {
                    const headerEl = document.querySelector(headerSelector);
                    const header = headerEl?.innerText || headerEl?.textContent;
                    const ym = parseHeaderYearMonth(header, date.headerFormat || 'jp_ym');
                    if (ym && !Number.isNaN(ym.year) && !Number.isNaN(ym.month)) {
                        return new Date(ym.year, ym.month - 1, day);
                    }
                }
            }
        }
    }

    if (base) {
        const fallbackText = parseDateString(base.innerText || base.textContent || '');
        if (fallbackText) return fallbackText;
    }

    const scheduleText = parseDateFromTextNode(container, '.schedule_list_text');
    if (scheduleText) return scheduleText;

    const dayEl = container?.querySelector?.('.schedule_list_day');
    const dayOnly = parseDayOnlyText(dayEl?.textContent || '', baseDate);
    if (dayOnly) return dayOnly;

    return null;
}

export function getPageKey() {
    return {
        host: location.host,
        path: location.pathname,
    };
}

export function matchScope(scope) {
    if (!scope?.host) return false;
    if (scope.host !== location.host) return false;
    if (scope.applyToAllPaths) return true;
    const pattern = scope.pathPattern || '';
    if (scope.useWildcard) {
        const prefix = pattern.replace('*', '');
        return location.pathname.startsWith(prefix);
    }
    return location.pathname === pattern;
}

function unpaintNode(node) {
    node.classList.remove('aps-painted');
    node.removeAttribute('data-aps-type');
    node.style.removeProperty('--aps-bg');
    node.style.removeProperty('--aps-border');
    node.style.removeProperty('--aps-fg');
    node.style.removeProperty('--aps-opacity');
    node.style.removeProperty('--aps-text');
    node.classList.remove('aps-date-past');
    node.style.removeProperty('--aps-past-opacity');
    node.style.removeProperty('--aps-past-filter');
    node.style.removeProperty('color');
    clearTextColorDeep(node);
}

function applyTextColorDeep(root, color) {
    root.style.setProperty('color', color, 'important');

    const qs = 'a,p,span,strong,em,small,label,button';
    root.querySelectorAll(qs).forEach(el => {
        if (el.querySelector && el.querySelector('img,video,svg')) return;
        el.style.setProperty('color', color, 'important');
    });
}

function clearTextColorDeep(root) {
    root.style.removeProperty('color');
    const qs = 'a,p,span,strong,em,small,label,button';
    root.querySelectorAll(qs).forEach(el => {
        if (el.querySelector && el.querySelector('img,video,svg')) return;
        el.style.removeProperty('color');
    });
}

function clearPainted(scopeKey) {
    const painted = document.querySelectorAll('.aps-painted');
    painted.forEach(node => {
        if (node.dataset.apsScopeKey === scopeKey) {
            unpaintNode(node);
        }
    });
}

function applyPaint(node, rule, paintOverride) {
    const paint = paintOverride || rule.paint || {};
    const type = paint.type || 'highlight';

    node.classList.add('aps-painted');
    node.dataset.apsScopeKey = getScopeKey();
    node.setAttribute('data-aps-type', type);

    if (type === 'highlight') {
        if (paint.bg) node.style.setProperty('--aps-bg', paint.bg);
        if (paint.border) node.style.setProperty('--aps-border', paint.border);
        if (paint.fg) node.style.setProperty('--aps-fg', paint.fg);
    }

    if (type === 'text') {
        const c = paint.fg || paint.text;
        if (c) applyTextColorDeep(node, c);
        else clearTextColorDeep(node);
    } else {
        clearTextColorDeep(node);
    }
}

export function applyRules(rules) {
    if (!Array.isArray(rules) || !rules.length) return;

    const scopeKey = getScopeKey();
    const activeRules = rules
        .filter(rule => rule?.enabled !== false)
        .filter(rule => matchScope(rule.scope));

    if (!activeRules.length) return;

    clearPainted(scopeKey);

    activeRules.forEach(rule => {
            if (!Array.isArray(rule.match?.keywords)) return;
            let nodes = [];
            try {
                if (rule.list?.enabled && rule.list.itemSelector) {
                    nodes = Array.from(document.querySelectorAll(rule.list.itemSelector));
                } else {
                    if (!rule.targetSelector) return;
                    nodes = Array.from(document.querySelectorAll(rule.targetSelector));
                }
            } catch (err) {
                return;
            }

            const keywords = rule.match.keywords
                .map(keyword => normalizeText(keyword))
                .filter(Boolean);
            const hasKeywords = keywords.length > 0;
            const dateEnabled = rule.date?.enabled === true;
            if (!hasKeywords && !dateEnabled) return;
            let baseYMDate = null;
            let compareDate = null;
            if (dateEnabled) {
                const today = new Date();
                compareDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                baseYMDate = compareDate;
                const selected = document.querySelector('p.schedule_list_text.aps-picker-selected, p.schedule_list_day.aps-picker-selected');
                const selectedItem = selected?.closest?.('.schedule_list_container');
                if (selectedItem) {
                    const parsed = parseDateFromRule(selectedItem, rule, compareDate);
                    if (parsed) {
                        baseYMDate = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
                    }
                } else {
                    const urlBase = getBaseDateFromUrl();
                    if (urlBase) {
                        baseYMDate = urlBase;
                    }
                }
            }
            const compareMs = compareDate ? compareDate.getTime() : null;
            const shouldFilterByDate = dateEnabled && compareMs !== null;
            const keywordSet = new Set();
            const dateSet = new Set();
            const dateMap = new Map();
            const keywordPaint = rule.paint || {};
            const datePaint = rule.date?.paint || {};
            const resolvedDatePaint = {
                type: datePaint.type || 'highlight',
                bg: datePaint.bg || '#ffc0cb',
                fg: datePaint.fg || '',
                border: datePaint.border || 'rgba(0,0,0,0.15)',
            };
            nodes.forEach(node => {
                const targetNode = node?.closest?.('.schedule_list_container')
                    || (node?.classList?.contains?.('schedule_list_container') ? node : node);
                if (!targetNode) return;

                if (hasKeywords) {
                    const text = normalizeText(targetNode.innerText || targetNode.textContent);
                    if (text && keywords.some(keyword => text.includes(keyword))) {
                        keywordSet.add(targetNode);
                    }
                }

                if (dateEnabled) {
                    const parsedDate = parseDateFromRule(targetNode, rule, baseYMDate);
                    if (parsedDate) {
                        dateMap.set(targetNode, parsedDate);
                        if (shouldFilterByDate && parsedDate.getTime() < compareMs) {
                            dateSet.add(targetNode);
                        }
                    }
                }
            });

            keywordSet.forEach(node => {
                applyPaint(node, rule, keywordPaint);
            });

            dateSet.forEach(node => {
                if (keywordSet.has(node)) return;
                applyPaint(node, rule, resolvedDatePaint);
            });
        });
}
