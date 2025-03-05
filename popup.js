    const CLIENT_ID = '308732964720-bkg72fsuf525lfpjndcr6a6rhelqa134.apps.googleusercontent.com';
    const API_KEY = 'AIzaSyAWcv7zU5QoVzbpPW7kjqsz6y5t2SCH9xc';
    const extension = "https://www.when2meet.com/?"
    let fillButton = document.getElementById("autofill");
    let stateButton = document.getElementById("extensionState");


    //
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

    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({prompt: ''});
    }

    async function getCurrentTab() {
        let queryOptions = { active: true, lastFocusedWindow: true };
        // `tab` will either be a `tabs.Tab` instance or `undefined`.
        let [tab] = await chrome.tabs.query(queryOptions);
        return tab;
      }/**
       * Callback after api.js is loaded.
       */
    function gapiLoaded() {
      gapi.load('client', initializeGapiClient);
    }

    /**
     * Callback after the API client is loaded. Loads the
     * discovery doc to initialize the API.
     */
    async function initializeGapiClient() {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
    }

    /**
     * Callback after Google Identity Services are loaded.
     */
    function gisLoaded() {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
      });
      gisInited = true;
    }

    /**
     *  Sign in the user upon button click.
     */
    function  handleAuthClick() {
      tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
          throw (resp);
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = 'Refresh';
        await listUpcomingEvents();
      }
    }

    async function fillWhen2Meet(){
        if (!gapiInited) {
            await initializeGapiClient();
        }
        handleAuthClick();
    }