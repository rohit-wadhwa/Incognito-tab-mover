document.addEventListener('DOMContentLoaded', function () {
    // Determine OS for shortcut display
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    // Set shortcut texts based on OS
    updateShortcutTexts(isMac);
    
    // Set up button event listeners
    setupButtonListeners();
});

/**
 * Updates the shortcut text displays based on OS
 */
function updateShortcutTexts(isMac) {
    const singleTabShortcut = document.getElementById('singleTabShortcut');
    const allTabsShortcut = document.getElementById('allTabsShortcut');
    
    if (!singleTabShortcut || !allTabsShortcut) return;
    
    singleTabShortcut.textContent = isMac ? 'Use Option+M' : 'Use Alt+M';
    allTabsShortcut.textContent = isMac ? 'Use Option+Shift+M' : 'Use Alt+Shift+M';
}

/**
 * Sets up event listeners for the action buttons
 */
function setupButtonListeners() {
    // Single tab button
    const moveSingleTabButton = document.getElementById('moveSingleTab');
    if (moveSingleTabButton) {
        moveSingleTabButton.addEventListener('click', handleMoveSingleTab);
    }
    
    // All tabs button
    const moveAllTabsButton = document.getElementById('moveAllTabs');
    if (moveAllTabsButton) {
        moveAllTabsButton.addEventListener('click', handleMoveAllTabs);
    }
}

/**
 * Handles moving a single tab from incognito to regular window
 */
function handleMoveSingleTab() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const currentTab = tabs[0];
        if (!currentTab) {
            window.close();
            return;
        }
        
        // Create a new window with the tab's URL
        chrome.windows.create(
            {url: currentTab.url, incognito: false}, 
            () => {
                // Remove the original tab after new window is created
                chrome.tabs.remove(currentTab.id, () => window.close());
            }
        );
    });
}

/**
 * Handles moving all incognito tabs to a regular window
 */
function handleMoveAllTabs() {
    chrome.runtime.sendMessage({action: 'moveAllIncognitoTabs'});
    
    // Give background script time to process before closing popup
    setTimeout(window.close, 300);
}
