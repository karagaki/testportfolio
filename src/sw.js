chrome.action.onClicked.addListener((tab) => {
    console.log('[APS][SW] action clicked', tab?.id, tab?.url);

    if (!tab?.id) {
        console.warn('[APS][SW] no tab id');
        return;
    }

    chrome.tabs.sendMessage(
        tab.id,
        { type: 'APS_TOGGLE_PALETTE' },
        (resp) => {
            if (chrome.runtime.lastError) {
                console.warn(
                    '[APS][SW] sendMessage error:',
                    chrome.runtime.lastError.message
                );
            } else {
                console.log('[APS][SW] sendMessage ok:', resp);
            }
        }
    );
});
