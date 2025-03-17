chrome.commands.onCommand.addListener((command) => {
    if (command === "move-tab") {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
                moveTabToNonIncognito(currentTab);
            }
        });
    } else if (command === "move-all-tabs") {
        moveAllIncognitoTabs();
    }
});

// Function to move a single tab to non-incognito window
function moveTabToNonIncognito(tab) {
    chrome.windows.create({url: tab.url, incognito: false}, () => {
        chrome.tabs.remove(tab.id);
    });
}

// Function to move all incognito tabs to regular window
function moveAllIncognitoTabs() {
    chrome.tabs.query({currentWindow: true}, (tabs) => {
        // Filter incognito tabs
        const incognitoTabs = tabs.filter(tab => tab.incognito);
        
        if (incognitoTabs.length === 0) return;

        // Create a new window with the first tab
        chrome.windows.create({
            url: incognitoTabs[0].url,
            incognito: false
        }, (newWindow) => {
            // Move remaining tabs to the new window
            const tabIds = incognitoTabs.map(tab => tab.id);
            
            // Remove the first tab from the list since it's already in the new window
            const remainingTabs = incognitoTabs.slice(1);
            
            // Create remaining tabs in the new window
            remainingTabs.forEach(tab => {
                chrome.tabs.create({
                    windowId: newWindow.id,
                    url: tab.url,
                    active: false
                });
            });

            // Remove all original incognito tabs
            chrome.tabs.remove(tabIds);
        });
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "moveAllIncognitoTabs") {
        moveAllIncognitoTabs();
    }
});
