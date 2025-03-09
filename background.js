//When the extension if first loaded or installed log statement and check slider state
chrome.runtime.onInstalled.addListener(() => {
    console.log("When2Meet Autofill Loaded");
    chrome.storage.local.get("extensionState", (result) => {
        const state = result.extensionState ?? false ? "ON" : "OFF";
        chrome.action.setBadgeText({
            text: state
        });
    });
});

//Message to store slider state
chrome.runtime.onMessage.addListener(sliderState => {
    console.log(sliderState);
    chrome.storage.local.set(sliderState);
}) 

//Clearing cached tokens
// chrome.identity.clearAllCachedAuthTokens(()=>{
//     console.log("Token deleted");
// })

async function authenticate() {
    await chrome.identity.getAuthToken({interactive: true}, (token) => {
        if (chrome.runtime.lastError) {
               console.error(chrome.runtime.lastError.message);
               sendResponse({ status: "error", message: chrome.runtime.lastError.message });
               return;
        }
        sendResponse({ status: "success", message: "Authenticated Successfully", key: token});
    });
    return true;//Keeps message channel open for sendresponse
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "authenticate") {
        authenticate();
    }
});

