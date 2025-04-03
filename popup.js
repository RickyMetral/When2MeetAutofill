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
                startAutofillWorkflow(tab);
            });
        } else {
            alert("Extension is off");
        }
    });
}

//Makes sure slider is in correct position when opening extension
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["extensionState", "calendars"], (result) => {
        stateSlider.checked = result.extensionState;
        if(result.calendars !== undefined){
            displayCalendarCheckboxes(result.calendars);
        }
    });
});

//Listener for slider button  
stateSlider.addEventListener("change", () => {
    let badgeText = stateSlider.checked ? 'ON' : 'OFF';
    //Send message to save the state in local storage
    chrome.runtime.sendMessage({ "action": "updateState", "extensionState": stateSlider.checked });
        // Update the badge text
        chrome.action.setBadgeText({
            text: badgeText,
        });
});

function startAutofillWorkflow(tab){
    //If the current window is not a when2meet, don't fill it
    if (Object.keys(tab).length <= 0 || tab[0].id === undefined){
        alert("Could not find a When2Meet");
    } else{
        chrome.storage.local.set({"tabId": tab[0].id})//Setting the id of the tab found to be a when2meet in local storage
        chrome.runtime.sendMessage({"action": "authenticate"});//Telling background to authenticate user
    }
}

//Injects the html for a checkbox for each calendar
function displayCalendarCheckboxes(calendars) {
    const container = document.querySelector(".container");
    const header = document.createElement("span");
    header.setAttribute("class", "header");
    header.innerHTML = "Available Calendars:";
    header.style.display = "inline-block";
    container.appendChild(header);

    calendars.forEach(cal => {
        const label = document.createElement("label");
        label.setAttribute("class", "checkbox");
        label.innerHTML = cal.name;

        const input = document.createElement("input");
        input.setAttribute("type", "checkbox");
        //Saving the most recent state of the checkmark
        input.addEventListener("change", () => {
            chrome.storage.local.set({[cal.name]: input.checked});
        });
        //As long as the previous state was not false (undefined or true) we can assume to check the box and save that state
        chrome.storage.local.get([cal.name], (result) =>{
            //If the button was last saved checked set it to checked when reopening the popup
            if(result[cal.name] === undefined || result[cal.name]){
                input.setAttribute("checked", "checked");
            }
            chrome.storage.local.set({[cal.name]: input.checked});//Save the final state of this input
        });

        const span = document.createElement("span");
        span.setAttribute("class", "checkmark");

        label.appendChild(input);
        label.appendChild(span);
        container.appendChild(label);
        container.appendChild(document.createElement("br")); // Line break for spacing
    });
}
