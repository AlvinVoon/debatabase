import { db } from './firebase.js';
import { 
  collection, 
  addDoc,
  setDoc,
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const editor = document.getElementById('editor');
const status = document.getElementById('status');

// Get docId from URL parameters
const urlParams = new URLSearchParams(window.location.search);
let currentDocId = urlParams.get('docId');

const saveBtn = document.querySelector('.save-btn');
saveBtn.addEventListener('click', saveDoc);

function format(command) {
  document.execCommand(command, false, null);
}

async function saveDoc() {
  try {
    showStatus('Saving...');
    
    if (currentDocId) {
      // Update existing document
      await setDoc(doc(db, "documents", currentDocId), {
        content: editor.innerHTML,
        timestamp: new Date()
      });
      console.log("Document updated with ID: ", currentDocId);
    } else {
      // Create new document
      const docRef = await addDoc(collection(db, "documents"), {
        content: editor.innerHTML,
        timestamp: new Date()
      });
      currentDocId = docRef.id;
      sessionStorage.setItem('docId', currentDocId);
      console.log("Document written with ID: ", currentDocId);
    }
    showStatus('Saved to Firebase');
  } catch (e) {
    console.error("Error saving document: ", e);
    showStatus('Save failed');
  }
}

function showStatus(text) {
  status.textContent = text;
  status.classList.add('show');
  setTimeout(() => status.classList.remove('show'), 1500);
}

editor.addEventListener('input', () => {
  clearTimeout(timeout);

  timeout = setTimeout(async () => {
    localStorage.setItem('doc', editor.innerHTML);

    if (currentDocId) {
      await setDoc(doc(db, "documents", currentDocId), {
        content: editor.innerHTML,
        timestamp: new Date()
      });
    }

    showStatus('Auto-saved & synced');
  }, 1000);
});

let unsubscribe;

window.onload = async () => {
  if (currentDocId) {
    const docRef = doc(db, "documents", currentDocId);

    // 🔥 REAL-TIME LISTENER
    unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        // Prevent cursor jump / overwrite while typing
        if (editor.innerHTML !== data.content) {
          editor.innerHTML = data.content;
          showStatus('Synced');
        }
      }
    });

  } else {
    const saved = localStorage.getItem('doc');
    if (saved) editor.innerHTML = saved;
  }
};