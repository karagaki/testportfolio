const SITE_BLOCKLIST_KEY = 'aps_site_blocklist_v1';
const SITE_BLOCKLIST_INCLUDE_SUBDOMAINS_KEY = 'aps_site_blocklist_include_subdomains_v1';
const RULES_KEY = 'aps_rules_v1';
const HOSTNAME_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/i;

function normalizeHostValue(value) {
    const v = String(value || '').trim().toLowerCase();
    if (!v || !HOSTNAME_RE.test(v)) return '';
    return v;
}

function isSpecialUrl(url) {
    if (!url) return true;
    return url.startsWith('chrome://')
        || url.startsWith('edge://')
        || url.startsWith('about:')
        || url.startsWith('chrome-extension://');
}

function isHostBlocked(host, blocklist, includeSubdomains) {
    if (!host || !Array.isArray(blocklist) || !blocklist.length) return false;
    for (const entry of blocklist) {
        const blockedHost = normalizeHostValue(entry);
        if (!blockedHost) continue;
        if (host === blockedHost) return true;
        if (includeSubdomains && host.endsWith(`.${blockedHost}`)) return true;
    }
    return false;
}

function isRegisteredHost(host, rulesData) {
    const rules = Array.isArray(rulesData?.rules) ? rulesData.rules : [];
    for (const rule of rules) {
        const candidate = normalizeHostValue(rule?.scope?.host);
        if (candidate && candidate === host) return true;
    }
    return false;
}

function getStorage(defaults) {
    return new Promise(resolve => {
        if (!chrome?.storage?.local) {
            resolve({ ...defaults });
            return;
        }
        chrome.storage.local.get(defaults, data => resolve(data));
    });
}

function setBadge(text, bgColor, textColor) {
    chrome.action.setBadgeText({ text });
    if (bgColor) chrome.action.setBadgeBackgroundColor({ color: bgColor });
    if (textColor && chrome.action.setBadgeTextColor) {
        chrome.action.setBadgeTextColor({ color: textColor });
    }
}

async function updateBadgeForTab(tab) {
    const url = tab?.url || '';
    if (!url || isSpecialUrl(url)) {
        chrome.action.setBadgeText({ text: '' });
        return;
    }

    let host = '';
    try {
        host = new URL(url).hostname.toLowerCase();
    } catch {
        chrome.action.setBadgeText({ text: '' });
        return;
    }

    const normalizedHost = normalizeHostValue(host);
    if (!normalizedHost) {
        chrome.action.setBadgeText({ text: '' });
        return;
    }

    const data = await getStorage({
        [SITE_BLOCKLIST_KEY]: [],
        [SITE_BLOCKLIST_INCLUDE_SUBDOMAINS_KEY]: false,
        [RULES_KEY]: { version: 1, rules: [] },
    });

    const blocklist = Array.isArray(data?.[SITE_BLOCKLIST_KEY]) ? data[SITE_BLOCKLIST_KEY] : [];
    const includeSubdomains = !!data?.[SITE_BLOCKLIST_INCLUDE_SUBDOMAINS_KEY];
    const rulesData = data?.[RULES_KEY];

    if (isHostBlocked(normalizedHost, blocklist, includeSubdomains)) {
        setBadge('!', '#444444', '#ff2b2b');
        return;
    }

    if (isRegisteredHost(normalizedHost, rulesData)) {
        setBadge('ON', '#ffb3b3', '#2b2b2b');
        return;
    }

    chrome.action.setBadgeText({ text: '' });
}

function updateBadgeForActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs && tabs[0];
        updateBadgeForTab(tab);
    });
}

// Helper function to send message to active tab
function sendMessageToTab(tabId, message) {
    chrome.tabs.sendMessage(tabId, message, (resp) => {
        if (chrome.runtime.lastError) {
            console.warn('[APS][SW] sendMessage error:', chrome.runtime.lastError.message);
        } else {
            console.log('[APS][SW] sendMessage ok:', resp);
        }
    });
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    console.log('[APS][SW] action clicked', tab && tab.id, tab && tab.url);

    const tabId = tab && tab.id;
    if (!tabId) {
        console.warn('[APS][SW] no tab id');
        return;
    }

    sendMessageToTab(tabId, { type: 'APS_TOGGLE_PALETTE' });
});

// Handle keyboard shortcuts (commands)
chrome.commands.onCommand.addListener((command) => {
    console.log('[APS][SW] command received:', command);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0];
        const tabId = tab && tab.id;
        if (!tabId) {
            console.warn('[APS][SW] no active tab for command:', command);
            return;
        }

        if (command === 'toggle-palette') {
            sendMessageToTab(tabId, { type: 'APS_TOGGLE_PALETTE' });
        } else if (command === 'toggle-picker') {
            sendMessageToTab(tabId, { type: 'APS_TOGGLE_PICKER' });
        }
    });
});

chrome.tabs.onActivated.addListener(activeInfo => {
    if (!activeInfo?.tabId) return;
    chrome.tabs.get(activeInfo.tabId, tab => updateBadgeForTab(tab));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!tab?.active) return;
    if (changeInfo?.status !== 'complete' && !changeInfo?.url) return;
    updateBadgeForTab(tab);
});

chrome.windows.onFocusChanged.addListener(windowId => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) return;
    updateBadgeForActiveTab();
});

chrome.runtime.onStartup.addListener(() => {
    updateBadgeForActiveTab();
});

chrome.runtime.onInstalled.addListener(() => {
    updateBadgeForActiveTab();
});
