function normalizeText(text) {
    return (text ?? '').toString().trim().toLowerCase();
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
}

function clearPainted() {
    const painted = document.querySelectorAll('.aps-painted');
    painted.forEach(node => {
        unpaintNode(node);
    });
}

function applyPaint(node, rule) {
    const paint = rule.paint || {};
    node.classList.add('aps-painted');
    node.setAttribute('data-aps-type', paint.type || 'highlight');
    if (paint.bg) node.style.setProperty('--aps-bg', paint.bg);
    if (paint.border) node.style.setProperty('--aps-border', paint.border);
    if (paint.fg) node.style.setProperty('--aps-fg', paint.fg);
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

            if (!keywords.length) return;

            nodes.forEach(node => {
                const text = normalizeText(node.innerText || node.textContent);
                if (!text) {
                    if (rule.list?.enabled && rule.list.itemSelector) {
                        unpaintNode(node);
                    }
                    return;
                }
                const matched = keywords.some(keyword => text.includes(keyword));
                if (matched) {
                    applyPaint(node, rule);
                } else if (rule.list?.enabled && rule.list.itemSelector) {
                    unpaintNode(node);
                }
            });
        });
}
