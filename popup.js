const extension = "https://www.when2meet.com/?"
let fillButton = document.getElementById("autofill");
let stateButton = document.getElementById("extensionState");
let gapiInited = false;

//When autofill button is clicked, check if page is a when2meet and continue to autofill function
fillButton.onclick = () => {
    let tab = getCurrentTab();
    chrome.storage.local.get("extensionState", (result) => {
        const isChecked = result.extensionState ?? false;
        //If extension is on
        if (isChecked) {
            // Extension is on and the URL matches
            if(tab.url !== undefined && !tab.url.startsWith(extension)){
                alert("Could not find a When2Meet");
                return;
            }
            fillWhen2Meet();
        } else {
            // TODO: Make a popup saying the extension is off
            alert("Extension is off");
        }
    });
};
//Listener for slider button  
stateButton.addEventListener("change", () => {
    let badgeText = stateButton.checked ? 'ON' : 'OFF';
    // Save the state in local storage
    chrome.runtime.sendMessage({extensionState: stateButton.checked});
    // Update the badge text
    chrome.action.setBadgeText({
        text: badgeText,
    });
});
 
//Makes sure slider is in correct position when opening extension
document.addEventListener("DOMContentLoaded", ()=>{
    chrome.storage.local.get("extensionState", (result) => {
        stateButton.checked = result.extensionState;
    });
});

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function getCalendarList(token) {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.items) {
        console.log("Available Calendars:", data.items);
        return data.items.map(cal => ({ id: cal.id, name: cal.summary }));
    } else {
        console.error("Failed to retrieve calendar list:", data);
        return [];
    }
}

  // document.getElementById('signout_button').style.visibility = 'visible';
async function fetchCalendarEvents(token) {
    let calendarId = getCalendarList(token).id;
    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    const data = await response.json();
    console.log(data);
    return data.items;
}

function fillWhen2Meet(){
//Sends message to background script to authenticate user
    chrome.runtime.sendMessage({action: "authenticate"}, (response) => {
    console.log(response.message);
    if(response.staus==="success"){
      const token = response.key;
      const calendarId = adka;
      fetchCalendarEvents(token, calendarId);
    }
  })

}