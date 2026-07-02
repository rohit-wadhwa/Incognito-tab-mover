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
        if (!tabs || tabs.length === 0) {
            if (callback) callback(false, 'No tabs found');
            return;
        }

        const isIncognitoWindow = tabs[0].incognito;
        const targetIncognito = !isIncognitoWindow;
        const direction = isIncognitoWindow ? 'incognito \u2192 normal' : 'normal \u2192 incognito';

        // Only http(s)/file URLs can be recreated in another window type.
        // chrome://, extension pages, view-source:, and discarded/blank tabs are skipped
        // instead of aborting the whole batch (this was the "only one tab moved" bug).
        const movable = tabs.filter(t => /^(https?|file):/i.test(t.url || ''));
        const skipped = tabs.length - movable.length;

        if (movable.length === 0) {
            if (callback) callback(false, 'No movable tabs (system pages like chrome:// cannot be moved)');
            return;
        }

        const urls = movable.map(t => t.url);
        const movableIds = movable.map(t => t.id);
        console.log(`Moving all tabs ${direction}: ${movable.length} movable, ${skipped} skipped`);

        // Open ONE new window containing all movable URLs at once.
        // Atomic: no per-tab completion counter to stall, no freshly-created-window race.
        chrome.windows.create({url: urls, incognito: targetIncognito}, (newWindow) => {
            if (chrome.runtime.lastError || !newWindow || !newWindow.id) {
                const msg = (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'Failed to create new window';
                console.error('Failed to create window:', msg);
                if (callback) callback(false, msg);
                return;
            }

            // Remove only the originals we successfully recreated.
            chrome.tabs.remove(movableIds, () => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to remove original tabs:', chrome.runtime.lastError);
                    if (callback) callback(false, chrome.runtime.lastError.message);
                    return;
                }
                const note = skipped > 0 ? ` (${skipped} system tab(s) left in place)` : '';
                if (callback) callback(true, `Moved ${movable.length} tab(s) ${direction} successfully${note}`);
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
