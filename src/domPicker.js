export function createDomPicker({ onSelect, onToggle, getSelector }) {
    let active = false;
    let hoverElement = null;
    let currentElement = null;
    const history = [];

    function isPaletteElement(target) {
        return target?.closest?.('.aps-palette') || target?.closest?.('[data-aps-palette-container]') || target?.closest?.('.aps-palette-react');
    }

    function setHover(element) {
        if (hoverElement === element) return;
        if (hoverElement) hoverElement.classList.remove('aps-picker-hover');
        hoverElement = element;
        if (hoverElement) hoverElement.classList.add('aps-picker-hover');
    }

    function setCurrent(element, pushHistory = true) {
        if (!element) return;
        if (currentElement) currentElement.classList.remove('aps-picker-selected');
        currentElement = element;
        currentElement.classList.add('aps-picker-selected');
        if (pushHistory) history.push(element);
        const selector = getSelector(element);
        onSelect?.(element, selector);
    }

    function onMouseOver(event) {
        if (!active) return;
        if (isPaletteElement(event.target)) return;
        setHover(event.target);
    }

    function onMouseOut(event) {
        if (!active) return;
        if (event.target === hoverElement) {
            setHover(null);
        }
    }

    function onClick(event) {
        if (!active) return;
        if (isPaletteElement(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        setCurrent(event.target, true);
    }

    function startPicker() {
        if (active) return;
        active = true;
        document.addEventListener('mouseover', onMouseOver, true);
        document.addEventListener('mouseout', onMouseOut, true);
        document.addEventListener('click', onClick, true);
        onToggle?.(true);
    }

    function stopPicker() {
        if (!active) return;
        active = false;
        document.removeEventListener('mouseover', onMouseOver, true);
        document.removeEventListener('mouseout', onMouseOut, true);
        document.removeEventListener('click', onClick, true);
        if (hoverElement) hoverElement.classList.remove('aps-picker-hover');
        if (currentElement) currentElement.classList.remove('aps-picker-selected');
        hoverElement = null;
        currentElement = null;
        history.length = 0;
        onToggle?.(false);
    }

    function expandParent() {
        if (!currentElement) return;
        const parent = currentElement.parentElement;
        if (parent && parent !== document.body) {
            setCurrent(parent, true);
        }
    }

    function undo() {
        if (history.length <= 1) return;
        history.pop();
        const previous = history[history.length - 1];
        if (previous) setCurrent(previous, false);
    }

    return {
        startPicker,
        stopPicker,
        togglePicker() {
            if (active) {
                stopPicker();
            } else {
                startPicker();
            }
        },
        expandParent,
        undo,
        getActive: () => active,
        getCurrent: () => currentElement,
    };
}
