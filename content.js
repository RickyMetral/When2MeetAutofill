//Calling everything when script is ran
fillWhen2Meet();

function fillWhen2Meet(){
    const timeSlots = document.querySelectorAll("[id^=YouTime]");
    const timeMin = new Date(timeSlots[0].getAttribute("data-time") * 1000).toISOString();
    const timeMax = new Date(timeSlots[timeSlots.length-1].getAttribute("data-time") * 1000).toISOString();
    fillEvents(timeMin, timeMax);
}

/**
 * Gets all the calendarIds, events and calls function to click on slots based on that data
 * @param {ISOstring} timeMin - The first available time slot of the wnen2meet
 * @param {ISOstring} tmeMax - The last available time slot of the wnen2meet
 */
function fillEvents(timeMin, timeMax){
    chrome.storage.local.get("key", async (result) => {
        console.log("Token: " + result.key);
        let calendarIds = await getCalendarList(result.key);//CalendarIds is an array of objects
        for(i = 0; i < Object.keys(calendarIds).length; i++){
            let events = await fetchCalendarEvents(result.key, calendarIds[i].id, timeMin, timeMax);
            console.log(events);
            selectMeetingTimes(events);
        }
    });
}

/**
 * Selects When2Meet boxes within a given time range.
 * @param {string} token - The OAuth2 token needed to access the user's calendar
 */

async function fetchCalendarEvents(token, calendarId, timeMin, timeMax) {
    let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

    let response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    let data = await response.json();
    console.log("Events" + data);
    return data.items;
}

/**
 * Returns all of a users available calendars to fetch events from
 * @param {string} token - The OAuth2 token needed to access the user's calendar
 */
async function getCalendarList(token) {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    if(data.items) {
        console.log("Available Calendars:", data.items);
        return data.items.map(cal => ({ id: cal.id, name: cal.summary }));
    } else {
        console.error("Failed to retrieve calendar list:", data);
        return [];
    }
}

/**
 * Selects When2Meet boxes within a given time range.
 * @param {Object} Events - All the events of a given calendar
 */

function selectMeetingTimes(events){
    console.log("Filling all Slots");
    const timeSlots = document.querySelectorAll("[id^=YouTime]");
    timeSlots.forEach(slot => {
        //Makes sure slot is not already selected
        if(slot.style.backgroud!=="rgb(51, 153, 0)"){
            clickSlot(slot);
        }
    });
}

/**
 * Clicks any single given when2meet slot
 * @param {Object} slot - Expects a div of the timeslot
 */

function clickSlot(slot){
    slot.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    slot.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
}