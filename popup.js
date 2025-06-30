document.addEventListener('DOMContentLoaded', function () {
    // Determine OS for shortcut display
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    // Set shortcut texts based on OS
    updateShortcutTexts(isMac);
    
    // Set up button event listeners
    setupButtonListeners();
    
    // Check current tab state and update UI accordingly
    checkCurrentTabState();
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
 * Check current tab state and update UI accordingly
 */
function checkCurrentTabState() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const currentTab = tabs[0];
        if (!currentTab) return;
        
        const moveSingleTabButton = document.getElementById('moveSingleTab');
        const moveAllTabsButton = document.getElementById('moveAllTabs');
        
        // Update button text based on current state
        if (currentTab.incognito) {
            // In incognito mode - show moving to normal
            if (moveSingleTabButton) {
                moveSingleTabButton.textContent = 'Move to Normal Window';
            }
            if (moveAllTabsButton) {
                moveAllTabsButton.textContent = 'Move All to Normal';
            }
            showMessage('Currently in incognito mode. Click to move to normal window.', 'info');
        } else {
            // In normal mode - show moving to incognito
            if (moveSingleTabButton) {
                moveSingleTabButton.textContent = 'Move to Incognito Window';
            }
            if (moveAllTabsButton) {
                moveAllTabsButton.textContent = 'Move All to Incognito';
            }
            showMessage('Currently in normal mode. Click to move to incognito window.', 'info');
        }
    });
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
 * Handles moving a single tab bidirectionally (incognito ↔ normal)
 */
function handleMoveSingleTab() {
    const button = document.getElementById('moveSingleTab');
    if (button.disabled) return;
    
    // Disable button and show loading state
    button.disabled = true;
    button.textContent = 'Moving...';
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const currentTab = tabs[0];
        if (!currentTab) {
            showMessage('No active tab found', 'error');
            resetButton('moveSingleTab');
            return;
        }
        
        const targetIncognito = !currentTab.incognito;
        const direction = currentTab.incognito ? 'incognito to normal' : 'normal to incognito';
        
        // Create a new window with the tab's URL
        chrome.windows.create(
            {url: currentTab.url, incognito: targetIncognito}, 
            (newWindow) => {
                if (chrome.runtime.lastError) {
                    showMessage('Failed to create window: ' + chrome.runtime.lastError.message, 'error');
                    resetButton('moveSingleTab');
                    return;
                }
                
                // Remove the original tab after new window is created
                chrome.tabs.remove(currentTab.id, () => {
                    if (chrome.runtime.lastError) {
                        showMessage('Failed to remove tab: ' + chrome.runtime.lastError.message, 'error');
                        return;
                    }
                    
                    // Success - close popup after a brief delay
                    showMessage(`Tab moved ${direction} successfully!`, 'success');
                    setTimeout(() => {
                        window.close();
                    }, 1000);
                });
            }
        );
    });
}

/**
 * Handles moving all tabs bidirectionally
 */
function handleMoveAllTabs() {
    const button = document.getElementById('moveAllTabs');
    if (button.disabled) return;
    
    // Disable button and show loading state
    button.disabled = true;
    button.textContent = 'Moving All...';
    
    chrome.runtime.sendMessage({action: 'moveAllTabs'}, (response) => {
        if (chrome.runtime.lastError) {
            showMessage('Communication error: ' + chrome.runtime.lastError.message, 'error');
            resetButton('moveAllTabs');
            return;
        }
        
        if (response && response.success) {
            showMessage(response.message, 'success');
            // Close popup after success
            setTimeout(() => {
                window.close();
            }, 1000);
        } else {
            showMessage(response ? response.message : 'Unknown error occurred', 'error');
            resetButton('moveAllTabs');
        }
    });
}

/**
 * Show a message to the user
 */
function showMessage(message, type = 'info') {
    // Remove existing message
    const existingMessage = document.getElementById('statusMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message element
    const messageDiv = document.createElement('div');
    messageDiv.id = 'statusMessage';
    messageDiv.textContent = message;
    messageDiv.style.padding = '10px';
    messageDiv.style.margin = '10px 0';
    messageDiv.style.borderRadius = '4px';
    messageDiv.style.fontSize = '12px';
    messageDiv.style.textAlign = 'center';
    
    // Set colors based on message type
    switch (type) {
        case 'success':
            messageDiv.style.backgroundColor = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.style.border = '1px solid #c3e6cb';
            break;
        case 'error':
            messageDiv.style.backgroundColor = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            break;
        case 'warning':
            messageDiv.style.backgroundColor = '#fff3cd';
            messageDiv.style.color = '#856404';
            messageDiv.style.border = '1px solid #ffeaa7';
            break;
        default:
            messageDiv.style.backgroundColor = '#d1ecf1';
            messageDiv.style.color = '#0c5460';
            messageDiv.style.border = '1px solid #bee5eb';
    }
    
    // Insert message after actions div
    const actionsDiv = document.getElementById('actions');
    actionsDiv.parentNode.insertBefore(messageDiv, actionsDiv.nextSibling);
}

/**
 * Reset button to original state based on current tab mode
 */
function resetButton(buttonId) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const currentTab = tabs[0];
        const button = document.getElementById(buttonId);
        
        if (button && currentTab) {
            button.disabled = false;
            button.style.backgroundColor = '#4CAF50';
            
            if (buttonId === 'moveSingleTab') {
                button.textContent = currentTab.incognito ? 'Move to Normal Window' : 'Move to Incognito Window';
            } else if (buttonId === 'moveAllTabs') {
                button.textContent = currentTab.incognito ? 'Move All to Normal' : 'Move All to Incognito';
            }
        }
    });
}
