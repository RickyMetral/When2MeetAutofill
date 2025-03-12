const extension = "https://www.when2meet.com/?*"
let fillButton = document.getElementById("autofill");
let stateSlider = document.getElementById("extensionState");

//When autofill button is clicked, check if page is a when2meet and continue to autofill function
fillButton.onclick = () => {
    chrome.storage.local.get("extensionState", (result) => {
        const isOn = result.extensionState ?? false;
        //If extension is on
        if (isOn) {
            fillCurrentTab();
        } else {
            alert("Extension is off");
        }

    });
}

//Makes sure slider is in correct position when opening extension
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get("extensionState", (result) => {
        stateButton.checked = result.extensionState;
    });
});

//Listener for slider button  
stateSlider.addEventListener("change", () => {
    let badgeText = stateButton.checked ? 'ON' : 'OFF';
    //Send message to save the state in local storage
    chrome.runtime.sendMessage({ "extensionState": stateSlider.checked });
    // Update the badge text
    chrome.action.setBadgeText({
        text: badgeText,
    });
});

async function fillCurrentTab() {
    await chrome.tabs.query({ url: extension}, (tab) => {
        if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError);
            return;
        }
        console.log("window: " + Object.keys(tab));
        //If the current window is not a when2meet, don't fill it
        if (Object.keys(tab).length <= 0) {
            alert("Could not find a When2Meet");
            return;
        }
        fillWhen2Meet(tab.id);
    });
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

/**
 * Selects When2Meet boxes within a given time range.
 * @param {string} token - The OAuth2 token needed to access the user's calendar
 */

// document.getElementById('signout_button').style.visibility = 'visible';
async function fetchCalendarEvents(token) {
    let calendarIds = await getCalendarList(token);//CalendarIds is an array of objects
    console.log("token:" + token);
    const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarIds[2].id}/events`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    const data = await response.json();
    return data.items;
}

/**
 * Selects When2Meet boxes within a given time range.
 * @param {number} tabId - Specifies the tabId where the when2meet is
 */

function fillWhen2Meet(tabId){
    //Sends message to background script to authenticate user
    let events;
    chrome.runtime.sendMessage({ action: "authenticate" });
    chrome.storage.local.get("key", (result) => {
        events = fetchCalendarEvents(result.key);
    })
    chrome.scripting.executeScript({
        target: {target: tabId},
        function: selectMeetingTimes(),
        args: ["1/10/2024", "1/20/2024"]
    })
}
/**
 * Selects When2Meet boxes within a given time range.
 * @param {string} startDate - Specifies the start date of when to start looking based on when2meet length
 * @param {string} endDate - Specifies the end date of when to start looking based on when2meet length
 */

function selectMeetingTimes(startDate, endDate){

}