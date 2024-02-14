chrome.commands.onCommand.addListener((command) => {
    if (command === "move-tab") {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab) {
                // Create a new tab in a regular window with the same URL
                chrome.windows.create({url: currentTab.url, incognito: false});
                // Optionally, close the original tab
                chrome.tabs.remove(currentTab.id);
            }
        });
    }
});
