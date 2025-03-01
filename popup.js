document.getElementById("autofill").addEventListener("click", function() {
    let isChecked = document.getElementById("extensionState").checked;

    //Checks if the tab is a when2meet schedule and the extension is turned on    
    if (isChecked && tab.url.startsWith(extensions)) {
        
    } else {
        //TODO Make a popup saying extension is off
    }
});

document.getElementById("extensionState").addEventListener("change",function() {
    // Update the badge text 
    chrome.action.setBadgeText({
        text: this.checked? 'ON' : 'OFF'
    });
});

const extensions = "https://www.when2meet.com/?"

// When the user clicks on the extension action
