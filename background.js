chrome.commands.onCommand.addListener((command) => {
    if (command === "move-tab") {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
                moveTabBidirectional(currentTab);
            } else {
                console.log('No active tab found');
            }
        });
    } else if (command === "move-all-tabs") {
        moveAllTabsBidirectional();
    }
});

// Function to move a single tab bidirectionally (incognito ↔ normal)
function moveTabBidirectional(tab, callback) {
    const targetIncognito = !tab.incognito; // Toggle the incognito state
    const direction = tab.incognito ? 'incognito → normal' : 'normal → incognito';
    
    console.log(`Moving tab ${direction}: ${tab.url}`);

    chrome.windows.create({url: tab.url, incognito: targetIncognito}, (newWindow) => {
        if (chrome.runtime.lastError) {
            console.error('Failed to create window:', chrome.runtime.lastError);
            if (callback) callback(false, chrome.runtime.lastError.message);
            return;
        }

        // Validate that newWindow was created successfully
        if (!newWindow || !newWindow.id) {
            console.error('Failed to create window: newWindow is null or invalid');
            if (callback) callback(false, 'Failed to create new window');
            return;
        }

        chrome.tabs.remove(tab.id, () => {
            if (chrome.runtime.lastError) {
                console.error('Failed to remove tab:', chrome.runtime.lastError);
                if (callback) callback(false, chrome.runtime.lastError.message);
                return;
            }
            if (callback) callback(true, `Tab moved ${direction} successfully`);
        });
    });
}

// Function to move all tabs bidirectionally based on current window type
function moveAllTabsBidirectional(callback) {
    chrome.tabs.query({currentWindow: true}, (tabs) => {
        if (chrome.runtime.lastError) {
            console.error('Failed to query tabs:', chrome.runtime.lastError);
            if (callback) callback(false, chrome.runtime.lastError.message);
            return;
        }

        if (tabs.length === 0) {
            console.log('No tabs found');
            if (callback) callback(false, 'No tabs found');
            return;
        }

        // Determine if we're in an incognito window based on the first tab
        const isIncognitoWindow = tabs[0].incognito;
        const targetIncognito = !isIncognitoWindow; // Toggle the window type
        const direction = isIncognitoWindow ? 'incognito → normal' : 'normal → incognito';
        
        console.log(`Moving all tabs ${direction}`, tabs.length, 'tabs');

        // Create a new window with the first tab
        chrome.windows.create({
            url: tabs[0].url,
            incognito: targetIncognito
        }, (newWindow) => {
            if (chrome.runtime.lastError) {
                console.error('Failed to create window:', chrome.runtime.lastError);
                if (callback) callback(false, chrome.runtime.lastError.message);
                return;
            }

            // Validate that newWindow was created successfully
            if (!newWindow || !newWindow.id) {
                console.error('Failed to create window: newWindow is null or invalid');
                if (callback) callback(false, 'Failed to create new window');
                return;
            }

            // Move remaining tabs to the new window
            const tabIds = tabs.map(tab => tab.id);
            
            // Remove the first tab from the list since it's already in the new window
            const remainingTabs = tabs.slice(1);
            
            // Create remaining tabs in the new window
            let completed = 0;
            const total = remainingTabs.length;
            
            if (total === 0) {
                // Only one tab to move
                chrome.tabs.remove(tabIds, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Failed to remove tabs:', chrome.runtime.lastError);
                        if (callback) callback(false, chrome.runtime.lastError.message);
                        return;
                    }
                    if (callback) callback(true, `Moved ${tabs.length} tab(s) ${direction} successfully`);
                });
                return;
            }

            remainingTabs.forEach(tab => {
                chrome.tabs.create({
                    windowId: newWindow.id,
                    url: tab.url,
                    active: false
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Failed to create tab:', chrome.runtime.lastError);
                        if (callback) callback(false, chrome.runtime.lastError.message);
                        return;
                    }
                    
                    completed++;
                    if (completed === total) {
                        // All tabs created, now remove original tabs
                        chrome.tabs.remove(tabIds, () => {
                            if (chrome.runtime.lastError) {
                                console.error('Failed to remove tabs:', chrome.runtime.lastError);
                                if (callback) callback(false, chrome.runtime.lastError.message);
                                return;
                            }
                            if (callback) callback(true, `Moved ${tabs.length} tab(s) ${direction} successfully`);
                        });
                    }
                });
            });
        });
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "moveAllTabs") {
        moveAllTabsBidirectional((success, message) => {
            sendResponse({success, message});
        });
        return true; // Keep message channel open for async response
    } else if (request.action === "moveTab") {
        chrome.tabs.get(request.tabId, (tab) => {
            if (chrome.runtime.lastError) {
                sendResponse({success: false, message: chrome.runtime.lastError.message});
                return;
            }
            
            if (tab) {
                moveTabBidirectional(tab, (success, message) => {
                    sendResponse({success, message});
                });
            } else {
                sendResponse({success: false, message: 'Tab not found'});
            }
        });
        return true; // Keep message channel open for async response
    }
});
