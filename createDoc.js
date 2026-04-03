// =====================
// LOAD GOOGLE SCRIPTS
// =====================
const loadScript = (src) =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    document.body.appendChild(script);
  });

await loadScript("https://apis.google.com/js/api.js");
await loadScript("https://accounts.google.com/gsi/client");

// =====================
// UI ELEMENTS
// =====================
const authButton = document.getElementById("authorize_button");
//const signoutButton = document.getElementById("signout_button");
const contentEl = document.getElementById("content");

authButton.style.visibility = "hidden";
//signoutButton.style.visibility = "hidden";

// =====================
// CONFIG
// =====================
const CLIENT_ID =
  "994243653826-qfng16dv3435sm5ddanfddkqv9hddmdi.apps.googleusercontent.com";

const API_KEY = "AIzaSyCsj4apMMS0vSKZsugSsnV5X9C6_iWEV-8";

const DISCOVERY_DOC =
  "https://docs.googleapis.com/$discovery/rest?version=v1";

const SCOPES = "https://www.googleapis.com/auth/documents.readonly";

// =====================
// GLOBAL STATE
// =====================
let tokenClient;

// =====================
// INIT GAPI
// =====================
await new Promise((resolve) => gapi.load("client", resolve));

await gapi.client.init({
  apiKey: API_KEY,
  discoveryDocs: [DISCOVERY_DOC],
});

// =====================
// INIT GIS (Google Identity Services)
// =====================
tokenClient = google.accounts.oauth2.initTokenClient({
  client_id: CLIENT_ID,
  scope: SCOPES,
  callback: "", // set dynamically later
});

// show button after init
authButton.style.visibility = "visible";

// =====================
// AUTH HANDLER
// =====================
async function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error) {
      console.error(resp);
      return;
    }

    signoutButton.style.visibility = "visible";
    authButton.innerText = "Refresh";

    await printDocTitle();
    await getDocContent(
      "1WU9QMkZrzJ4wBBWkNtFsbW6Mxf8w-r9w4dxI-PCwOM8"
    );
  };

  const token = gapi.client.getToken();

  if (!token) {
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    tokenClient.requestAccessToken({ prompt: "" });
  }
}

// =====================
// SIGN OUT
// =====================
function handleSignoutClick() {
  const token = gapi.client.getToken();

  if (token) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken("");

    contentEl.innerText = "";
    authButton.innerText = "Authorize";
    signoutButton.style.visibility = "hidden";
  }
}

// =====================
// PRINT DOC TITLE
// =====================
async function printDocTitle() {
  try {
    const response = await gapi.client.docs.documents.get({
      documentId: "1WU9QMkZrzJ4wBBWkNtFsbW6Mxf8w-r9w4dxI-PCwOM8",
    });

    const doc = response.result;

    contentEl.innerText =
      `Document "${doc.title}" successfully loaded.\n\n`;
  } catch (err) {
    console.error(err);
    contentEl.innerText = err.message;
  }
}

// =====================
// GET FULL DOC CONTENT
// =====================
async function getDocContent(docId) {
  try {
    const response = await gapi.client.docs.documents.get({
      documentId: docId,
    });

    const doc = response.result;
    let text = "";

    doc.body?.content?.forEach((block) => {
      block.paragraph?.elements?.forEach((el) => {
        if (el.textRun?.content) {
          text += el.textRun.content;
        }
      });
    });

    contentEl.innerText += "\n\n" + text;
  } catch (err) {
    console.error(err);
    contentEl.innerText = err.message;
  }
}

// =====================
// EVENTS
// =====================
authButton.onclick = handleAuthClick;
signoutButton.onclick = handleSignoutClick;