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
    chrome.storage.local.set(sliderState);
}); 

chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "authenticate") {
        authenticate();
    }
});

//Autheticates user request to fill and signls start to content script
async function authenticate() {
    //If the token is not expired we dont need to authenticate again
    if(!isTokenExpired()){
        chrome.storage.local.get("tabId", (result) =>{
            chrome.scripting.executeScript({
                target: { tabId: result.tabId},
                files: ["content.js"]
            });
        })
        return;
    }
    clearTokens();
    await chrome.identity.getAuthToken({interactive: true}, (newToken) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
        } else{
            console.log("Authenticated Successfully");
        }
        chrome.storage.local.set({"expirationTime": Date.now + 3600000})//Saves the expiration time of the token locally
        chrome.storage.local.set({"token": newToken});
        chrome.storage.local.get("tabId", (result) =>{
            chrome.scripting.executeScript({
                target: { tabId: result.tabId},
                files: ["content.js"]
            });
        })
    });
}

// Clearing cached tokens
function clearTokens(){
    chrome.identity.clearAllCachedAuthTokens(()=>{
        console.log("Token deleted");
        chrome.storage.local.remove("key");
   });
}

//Checks if token has expired yet
function isTokenExpired(){
    chrome.storage.local.get("expirationTime", (result) =>{
        if(result.expirationTime && result.expirationTime < Date.now){
            return true;
        } else{
            false;
        }
    });
}
