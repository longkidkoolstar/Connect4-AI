chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "attachDebugger") {
        chrome.debugger.attach({ tabId: sender.tab.id }, "1.3", () => {
            chrome.debugger.sendCommand({ tabId: sender.tab.id }, "Debugger.enable");
            sendResponse({ status: "attached" });
        });
        return true; // Keep the message channel open for sendResponse
    }
    else if (request.action === "detachDebugger") {
        chrome.debugger.detach({ tabId: sender.tab.id });
        sendResponse({ status: "detached" });
    }
});
