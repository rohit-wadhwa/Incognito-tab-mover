document.addEventListener('DOMContentLoaded', function () {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    // Update shortcut texts based on OS
    const singleTabShortcut = document.getElementById('singleTabShortcut');
    const allTabsShortcut = document.getElementById('allTabsShortcut');
    
    if (singleTabShortcut && allTabsShortcut) {
        if (isMac) {
            singleTabShortcut.textContent = 'Use Option+M';
            allTabsShortcut.textContent = 'Use Option+Shift+M';
        } else {
            singleTabShortcut.textContent = 'Use Alt+M';
            allTabsShortcut.textContent = 'Use Alt+Shift+M';
        }
    }

    // Set up move single tab button
    const moveSingleTabButton = document.getElementById('moveSingleTab');
    if (moveSingleTabButton) {
        moveSingleTabButton.addEventListener('click', function() {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                const currentTab = tabs[0];
                if (currentTab) {
                    chrome.runtime.sendMessage({action: 'moveTab', tabId: currentTab.id});
                }
            });
            window.close();
        });
    }

    // Set up move all tabs button
    const moveAllTabsButton = document.getElementById('moveAllTabs');
    if (moveAllTabsButton) {
        moveAllTabsButton.addEventListener('click', function() {
            chrome.runtime.sendMessage({action: 'moveAllIncognitoTabs'});
            window.close();
        });
    }
});

