//Making sure the user is logged into when2meet and slots displayed
{
    const firstSlot = document.querySelector("[id^=YouTime]");
    if((firstSlot.offsetParent !== null)){
        console.log("Slots Available");
        fillWhen2Meet();
    } else{
        console.log("Slots Unavailable")
    }
}

function fillWhen2Meet(){
    const timeSlots = document.querySelectorAll("[id^=YouTime]");
    const timeMin = new Date(timeSlots[0].getAttribute("data-time") * 1000).toISOString();
    const timeMax = new Date(timeSlots[timeSlots.length-1].getAttribute("data-time") * 1000).toISOString();
    fillEvents(timeMin, timeMax, timeSlots);
}

/**
 * Gets all the calendarIds, events and calls function to click on slots based on that data
 * @param {ISOstring} timeMin - The first available time slot of the when2meet
 * @param {ISOstring} timeMax - The last available time slot of the wnen2meet
 * @param {Object} timeSlots - All timeSlots available in the DOM
 */
async function fillEvents(timeMin, timeMax, timeSlots) {
    //Retrieves the auth token, retrieves all the available calendars and caches them
    chrome.storage.local.get(["calendars", "token"], async (result) => {
        let calendars = result.calendars ?? await getCalendarList(result.token);//If the calendars have not already been cached, retrieve them
        chrome.storage.local.set({ "calendars": calendars });//Calendars have two vars, calendars.id is the id and calendars.name is the summary
        if (calendars.length === 0) {
            alert("Could not find any Google Calendars");
            return;
        }

        selectAllMeetingTimes(timeSlots); // Fill all slots first

        const eventPromises = calendars.map(cal => 
            new Promise((resolve) => {
                //Fetching the checked state of this calendar
                chrome.storage.local.get([cal.name], (calendar) => {
                    //Checking the if the calendar is checked or not
                    if (calendar[cal.name] === undefined || calendar[cal.name] === true) {
                        resolve(fetchCalendarEvents(result.token, cal.id, timeMin, timeMax));
                    } else {
                        resolve(null);
                    }
                });
            })
        );

        const allEvents = await Promise.all(eventPromises);

        allEvents.forEach(events => {
            if (events) selectMeetingTimes(events, timeSlots);
        });
    });
}

/**
 * Selects When2Meet boxes within a given time range.
 * @param {string} token - The OAuth2 token needed to access the user's calendar
 * @param {Object} calendarId - The id the calendar to fetch events from
 * @param {ISOstring} timeMin - The first time slot in the time range of a given event
 * @param {ISOstring} timeMax - The last time slot in the time range of a given event
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
 * @param {Object} timeSlots - All the timeslots on the DOM
 */

function selectAllMeetingTimes(timeSlots){
    console.log("Filling all Slots");
    selectSlotRange(timeSlots);
}

/**
 * Selects When2Meet boxes within a given time range.
 * @param {Object} Events - A list of events in a single calendar
 * @param {Object} timeSlots - All timeSlots available in the DOM
 */

function selectMeetingTimes(events, timeSlots){
    console.log("Removing availability");
    const confirmedEvents = events.filter(event => event.status === "confirmed");
    confirmedEvents.forEach(event => {
        const timeMin = Math.floor(new Date(event.start.dateTime).getTime()/1000);
        const timeMax = Math.floor(new Date(event.end.dateTime).getTime()/1000);
        deselectTimeRange(timeMin, timeMax, timeSlots);
    });
}

/**
 * Selects When2Meet boxes within a given time range.
 * @param {Object} slots - A group of CONSEVUTIVE time slots to be selected
 */
function selectSlotRange(slots){
    if(slots === undefined){console.log("Slots empty"); return;}
    for(let i = 0; i < slots.length; i++){
        //Presses on the first empty slot found to allow for hovering of the rest
        if(slots[i].style.background !=="rgb(51, 153, 0)"){
            slots[i].dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            break;
        }
    }
    if(slots.length-1 >= 0){
        slots[slots.length-1].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));//hovers mouse over last slot in the range, selecting all of them automatically
        slots[slots.length-1].dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));//ends the hover
    }else{
        slots[0].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        slots[0].dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    }
}

/**
 * Selects When2Meet boxes within a given time range.
 * @param {Object} slots - A group of CONSECUTIVE time slots to be de-selected
 */
function deselectSlotRange(slots){
    if(slots === undefined || slots.length == 0){console.log("Slots empty"); return;}
    for(let i = 0; i < slots.length; i++){
        //Presses on the first empty slot found to allow for hovering of the rest
        if(slots[i].style.background==="rgb(51, 153, 0)"){
            slots[i].dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            break;
        }
    }
    if(slots.length-1 >= 0){
        slots[slots.length-1].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));//hovers mouse over last slot in the range, selecting all of them automatically
        slots[slots.length-1].dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));//ends the hover
    }else{
        slots[slots.length].dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        slots[slots.length].dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    }
}

/**
 * Gets all the calendarIds, events and calls function to click on slots based on that data
 * @param {ISOstring} timeMin - The first time slot in the time range of a given event
 * @param {ISOstring} timeMax - The last time slot in the time range of a given event
 * @param {Object} timeSlots - All timeSlots available in the DOM
 */
function selectTimeRange(timeMin, timeMax, timeSlots){
    const slots = Array.from(timeSlots).filter((element) => {
        const timestamp = parseInt(element.id.replace('YouTime', ''), 10);
        return timestamp >= timeMin && timestamp <= timeMax;
    });
    console.log(slots);
    selectSlotRange(slots);
}

/**
 * Gets all the calendarIds, events and calls function to click on slots based on that data
 * @param {ISOstring} timeMin - The first time slot in the time range of a given event
 * @param {ISOstring} timeMax - The last time slot in the time range of a given event
 * @param {Object} timeSlots - All timeSlots available in the DOM
 */
function deselectTimeRange(timeMin, timeMax, timeSlots){
    const slots = Array.from(timeSlots).filter((element) => {
        const timestamp = parseInt(element.id.replace('YouTime', ''), 10);
        return timestamp >= timeMin && timestamp <= timeMax;
    });
    deselectSlotRange(slots);
}

/**
 * Returns bool based on if Unix timestamp is wihin the hours of the given range
 * @param {int} startHour - The first hour in the when2meet
 * @param {int} endHour - The last hour in the when2meet
 * @param {int} imestamp- A unix epoch timestamp to be compared
 */
function isInRange(startHour, endHour, timestamp) {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    const hours = date.getUTCHours();
    return hours < startHour || hours >= endHour;  // Before beginngin or after end
}

/**
* Clicks any single given when2meet slot
 * @param {Object} slot - Expects a div of the timeslot
 */
function clickSlot(slot){
    slot.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    slot.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
}