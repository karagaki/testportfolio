function normalizeText(text) {
    return (text ?? '').toString().trim().toLowerCase();
}

function getLocalTodayStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
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

function parseDateFromRule(node, rule) {
    const date = rule.date || {};
    const base = date.dateSelector ? node.querySelector(date.dateSelector) : node;
    if (!base) return null;
    if (date.sourceType === 'text') {
        const val = base.innerText || base.textContent;
        return parseDateString(val);
    }
    if (date.sourceType === 'dayNumber') {
        const dayText = base.innerText || base.textContent || '';
        const dayMatch = dayText.match(/(\d{1,2})/);
        if (!dayMatch) return null;
        const day = Number(dayMatch[1]);
        if (Number.isNaN(day) || day < 1 || day > 31) return null;
        const headerSelector = date.headerSelector || '';
        if (!headerSelector) return null;
        const headerEl = document.querySelector(headerSelector);
        if (!headerEl) return null;
        const header = headerEl.innerText || headerEl.textContent;
        const ym = parseHeaderYearMonth(header, date.headerFormat || 'jp_ym');
        if (!ym || Number.isNaN(ym.year) || Number.isNaN(ym.month)) return null;
        return new Date(ym.year, ym.month - 1, day);
    }
    const attr = date.dateAttr || 'data-date';
    const val = base.getAttribute(attr);
    return parseDateString(val);
}

function applyPastVisual(node, rule) {
    const preset = rule.date?.grayPreset || 'medium';
    let opacity = '0.55';
    let filter = 'grayscale(0.75)';
    if (preset === 'weak') {
        opacity = '0.75';
        filter = 'grayscale(0.4)';
    }
    if (preset === 'strong') {
        opacity = '0.35';
        filter = 'grayscale(1)';
    }
    node.classList.add('aps-date-past');
    node.style.setProperty('--aps-past-opacity', opacity);
    node.style.setProperty('--aps-past-filter', filter);
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

function clearPainted() {
    const painted = document.querySelectorAll('.aps-painted');
    painted.forEach(node => {
        unpaintNode(node);
    });
}

function applyPaint(node, rule) {
    const paint = rule.paint || {};
    const type = paint.type || 'highlight';

    node.classList.add('aps-painted');
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
    clearPainted();
    if (!Array.isArray(rules) || !rules.length) return;

    rules
        .filter(rule => rule?.enabled !== false)
        .filter(rule => matchScope(rule.scope))
        .forEach(rule => {
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

            const allowNoKeywords = rule.date?.enabled && rule.date.applyWithoutKeyword;
            const matchAll = allowNoKeywords && !keywords.length;
            if (!keywords.length && !matchAll) return;

            nodes.forEach(node => {
                let matched = false;
                if (matchAll) {
                    matched = true;
                } else {
                    const text = normalizeText(node.innerText || node.textContent);
                    if (!text) {
                        if (rule.list?.enabled && rule.list.itemSelector) {
                            unpaintNode(node);
                        }
                        return;
                    }
                    matched = keywords.some(keyword => text.includes(keyword));
                }
                if (matched) {
                    applyPaint(node, rule);
                    if (rule.date?.enabled) {
                        const parsed = parseDateFromRule(node, rule);
                        if (parsed && parsed.getTime() < getLocalTodayStart()) {
                            applyPastVisual(node, rule);
                        }
                    }
                } else if (rule.list?.enabled && rule.list.itemSelector) {
                    unpaintNode(node);
                }
            });
        });
}
