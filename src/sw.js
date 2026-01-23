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
