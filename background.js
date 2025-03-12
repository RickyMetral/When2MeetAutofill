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
}) 

chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "authenticate") {
        authenticate();
    }
});

// Clearing cached tokens
function clearTokens(){
    chrome.identity.clearAllCachedAuthTokens(()=>{
        console.log("Token deleted");
        chrome.storage.local.remove("key");
    })
}

//TODO Add a sign out option when logged in 

async function authenticate() {
    chrome.storage.local.get("key", (result) =>{
        //If the token is not expired we dont need to authenticate again
        if(!isTokenExpired(result.key)){
            return;
        }
    })
    clearTokens();
    await chrome.identity.getAuthToken({interactive: true}, (token) => {
        if (chrome.runtime.lastError) {
               console.error(chrome.runtime.lastError.message);
        } else{
            console.log("Authenticated Successfully");
        }
        chrome.storage.local.set({"key": token});
    });
}


