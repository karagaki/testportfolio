const escapeCss = window.CSS?.escape || (value => String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&'));

function selectorFor(element, maxClasses = 3) {
    if (!element || element.nodeType !== 1) return '';
    if (element.id) return `#${escapeCss(element.id)}`;
    const tag = element.tagName.toLowerCase();
    const classes = Array.from(element.classList || [])
        .filter(Boolean)
        .slice(0, maxClasses)
        .map(cls => escapeCss(cls));
    if (classes.length) return `${tag}.${classes.join('.')}`;
    return tag;
}

function isGoodSelector(selector) {
    if (!selector) return false;
    let count = 0;
    try {
        count = document.querySelectorAll(selector).length;
    } catch (err) {
        return false;
    }
    if (count === 1) return true;
    if (count === 0) return false;
    return count <= 20;
}

export function generateSelector(element) {
    if (!element || element.nodeType !== 1) return '';

    let base = selectorFor(element);
    if (isGoodSelector(base)) return base;

    let childSelector = selectorFor(element);
    let parent = element.parentElement;
    for (let depth = 0; depth < 2; depth += 1) {
        if (!parent) break;
        const parentSelector = selectorFor(parent, 2);
        const candidate = `${parentSelector} > ${childSelector}`;
        if (isGoodSelector(candidate)) return candidate;
        childSelector = candidate;
        parent = parent.parentElement;
    }

    if (element.parentElement) {
        const tag = element.tagName.toLowerCase();
        const siblings = Array.from(element.parentElement.children).filter(
            child => child.tagName === element.tagName
        );
        const index = siblings.indexOf(element) + 1;
        const nthSelector = `${tag}:nth-of-type(${index})`;
        const parentSelector = selectorFor(element.parentElement, 2);
        const candidate = `${parentSelector} > ${nthSelector}`;
        if (isGoodSelector(candidate)) return candidate;
        return candidate;
    }

    return base;
}

function getRepeatSignature(element) {
    if (!element || element.nodeType !== 1) return '';
    const tag = element.tagName.toLowerCase();
    const classes = Array.from(element.classList || [])
        .filter(Boolean)
        .slice(0, 2)
        .map(cls => escapeCss(cls));
    return `${tag}|${classes.join('.')}`;
}

function selectorForRepeatedItem(element) {
    if (!element || element.nodeType !== 1) return '';
    const tag = element.tagName.toLowerCase();
    const classes = Array.from(element.classList || [])
        .filter(Boolean)
        .slice(0, 2)
        .map(cls => escapeCss(cls));
    if (classes.length) return `${tag}.${classes.join('.')}`;
    return tag;
}

export function generateRepeatedItemSelector(element) {
    let current = element;
    while (current && current.parentElement) {
        const parent = current.parentElement;
        const signature = getRepeatSignature(current);
        if (!signature) break;
        const siblings = Array.from(parent.children).filter(
            child => getRepeatSignature(child) === signature
        );
        if (siblings.length >= 2) {
            const parentSelector = selectorFor(parent, 2);
            const childSelector = selectorForRepeatedItem(current);
            const candidate = parentSelector
                ? `${parentSelector} > ${childSelector}`
                : childSelector;
            let count = 0;
            try {
                count = document.querySelectorAll(candidate).length;
            } catch (err) {
                count = 0;
            }
            if (count >= 2) return candidate;
        }
        current = parent;
    }
    return '';
}
