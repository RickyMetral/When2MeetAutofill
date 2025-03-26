const extension = "https://www.when2meet.com/?*";
let fillButton = document.getElementById("autofill");
let stateSlider = document.getElementById("extensionState");

//When autofill button is clicked, check if page is a when2meet and continue to autofill function
fillButton.onclick = () => {
    chrome.storage.local.get("extensionState", (result) => {
        const isOn = result.extensionState ?? false;
        //If extension is on
        if (isOn) {
            //Finds tab that contains when2meet url
            chrome.tabs.query({ url: extension}, (tab) => {
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError);
                    return;
                }
                //If the current window is not a when2meet, don't fill it
                if (Object.keys(tab).length <= 0 || tab[0].id === undefined){
                    alert("Could not find a When2Meet");
                } else{
                    chrome.storage.local.set({"tabId": tab[0].id})//Setting the id of the tab found to be a when2meet in local storage
                    chrome.runtime.sendMessage({"action": "authenticate"});//Telling background to authenticate user
                }
            });
        } else {
            alert("Extension is off");
        }
    });
}

//Makes sure slider is in correct position when opening extension
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get("extensionState", (result) => {
        stateSlider.checked = result.extensionState;
    });
});

//Listener for slider button  
stateSlider.addEventListener("change", () => {
    let badgeText = stateSlider.checked ? 'ON' : 'OFF';
    //Send message to save the state in local storage
    chrome.runtime.sendMessage({ "extensionState": stateSlider.checked });
        // Update the badge text
        chrome.action.setBadgeText({
            text: badgeText,
        });
});