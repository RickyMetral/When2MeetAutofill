//When the extension if first loaded or installed log statement and check slider state
chrome.runtime.onInstalled.addListener(() => {
    console.log("When2Meet Autofill Loaded");
    chrome.storage.local.get("extensionState", (result) => {
        const state = (result.extensionState ?? false) ? "ON" : "OFF";
        chrome.action.setBadgeText({
            text: state
        });
    });
});

//listener for sliderstate and authentication messages
chrome.runtime.onMessage.addListener((message) => {
    switch (message.action) {
        case "authenticate":
            authenticate();
            break;
        case "updateState":
            chrome.storage.local.set(message);
            break;
        default:
            console.warn("Unknown message action:", message.action);
    }
});



//Autheticates user request to fill and signls start to content script
async function authenticate() {
    //If the token is not expired we dont need to authenticate again
    if(await isTokenExpired()){
        clearTokens();
        chrome.identity.getAuthToken({interactive: true}, (newToken) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
            } else{
                console.log("Authenticated Successfully");
            }
            chrome.storage.local.set({"token": newToken, "expirationTime": Date.now() + 3600000})//Saves the expiration time of the token locally and sets the new token in local storage
            launchContentScript();
        });
    }else{
        launchContentScript();
    }
}

// Clearing cached tokens
function clearTokens(){
    chrome.identity.clearAllCachedAuthTokens(()=>{
        console.log("Token deleted");
        chrome.storage.local.remove("token");
   });
}

//Checks if token has expired yet
function isTokenExpired() {
    return new Promise((resolve) => {
        chrome.storage.local.get("expirationTime", (result) => {
            resolve(result.expirationTime && result.expirationTime < Date.now());
        });
    });
}


//Gets tabid and launches content script
function launchContentScript(){
    chrome.storage.local.get("tabId", (result) =>{
        chrome.scripting.executeScript({
            target: { tabId: result.tabId},
            files: ["content.js"]
        });
    })
}