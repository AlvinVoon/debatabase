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
const motion = document.getElementById('motion');

const motionTypeEl = document.getElementById('motionType');

console.log(motionTypeEl.innerText);

let editorPermission = false; // default to read-only until we verify permissions
let timeout = null; // debounce timer for autosave

// Get docId from URL parameters
const urlParams = new URLSearchParams(window.location.search);
let currentDocId = urlParams.get('docId');

const saveBtn = document.querySelector('.save-btn');
saveBtn.addEventListener('click', saveDoc);

function format(command) {
  document.execCommand(command, false, null);
}


const checkPermissions = async () => {
  if (localStorage.getItem('user').uid == getDoc(doc(db, motionTypeEl.innerText || 'General', currentDocId)).owner) {
    editorPermission = true;
  } else {
    editorPermission = false;
    editor.setAttribute('contenteditable', 'false');
    const toolBar = document.querySelector('.toolbar');
    if (toolBar) toolBar.style.display = 'none';
    alert('You do not have permission to edit this document. You can view it in read-only mode.');
  }
}

// expose for inline toolbar `onclick="format('bold')"` in editor.html
window.format = format;


async function saveDoc() {
  try {
    showStatus('Saving...');
    
    if (currentDocId) {
      // Update existing document
      await setDoc(doc(db, motionTypeEl.innerText || 'General', currentDocId), {
        motion: motion.innerText || 'Untitled',
        content: editor.innerHTML,
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
      });
        await setDoc(doc(db, 'documents', currentDocId), {
        motion: motion.innerText || 'Untitled',
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        motionType: motionTypeEl.innerText || 'General'
      });

      console.log("Document updated with ID: ", currentDocId);
    } else {
      // Create new document
      const docRef = await addDoc(collection(db, motionTypeEl.innerText || 'General'), {
        motion: motion.innerText || 'Untitled',
        content: editor.innerHTML,
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
      });
      await addDoc(collection(db, 'documents'), {
        motion: motion.innerText || 'Untitled',
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        motionType: motionTypeEl.innerText || 'General'
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

function scheduleAutosave() {
  clearTimeout(timeout);

  timeout = setTimeout(async () => {
    localStorage.setItem('doc', editor.innerHTML);
    localStorage.setItem('motion', motion.innerText);

    if (currentDocId) {
      await setDoc(doc(db, motionTypeEl.innerText || 'General', currentDocId), {
        motion: motion.innerText || 'Untitled',
        content: editor.innerHTML,
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous'
      });
        await setDoc(doc(db, 'documents', currentDocId), {
        motion: motion.innerText || 'Untitled',
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        motionType: motionTypeEl.innerText || 'General'
      });
    }

    showStatus('Auto-saved & synced');
  }, 1000);
}

editor.addEventListener('input', scheduleAutosave);
motion.addEventListener('input', scheduleAutosave);
motionTypeEl.addEventListener('input', scheduleAutosave);

let unsubscribe;

window.onload = async () => {
  checkPermissions();
  if (currentDocId) {
    const docRef = doc(db, motionTypeEl.innerText || 'General', currentDocId);

    // 🔥 REAL-TIME LISTENER
    unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        motion.innerText = data.motion || 'Untitled';

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