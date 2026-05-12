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

let draggingComment = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let resizingComment = null;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let comment = [];

const addComment = () =>{
    const commentEl = document.createElement('div');
  commentEl.classList.add('comments');
  commentEl.innerHTML =  `
  <div class="comment-control-panel">
    <div class="comment-control">###</div>
    <button class="comment-delete-btn" title="Delete comment">×</button>
  </div>
  <div class="comment-content" contenteditable="true">
  </div>
  <div class="comment-resize-handle" title="Drag to resize"></div>
   `;
  document.body.appendChild(commentEl);
  makeCommentDraggable(commentEl);
  makeCommentResizable(commentEl);
  
  // Trigger save on content change
  const contentEl = commentEl.querySelector('.comment-content');
  contentEl.addEventListener('input', () => updateCommentsInFirebase(getCommentsData()));
  
  // Delete button
  const deleteBtn = commentEl.querySelector('.comment-delete-btn');
  deleteBtn.addEventListener('click', () => {
    commentEl.remove();
    updateCommentsInFirebase(getCommentsData());
  });
  
  updateCommentsInFirebase(getCommentsData());
}

function getCommentsData() {
  const commentElements = document.querySelectorAll('.comments');
  const commentsData = [];
  
  commentElements.forEach((el) => {
    const content = el.querySelector('.comment-content').innerText;
    const x = parseInt(el.style.left) || 20;
    const y = parseInt(el.style.top) || 200;
    const width = parseInt(el.style.width) || 150;
    const height = parseInt(el.style.height) || 150;
    
    commentsData.push({
      x,
      y,
      width,
      height,
      content
    });
  });
  
  return commentsData;
}

function renderCommentsFromData(commentsData) {
  // Clear existing comments
  const existingComments = document.querySelectorAll('.comments');
  existingComments.forEach(el => el.remove());
  
  // Render each comment from data
  commentsData.forEach((commentData) => {
    const commentEl = document.createElement('div');
    commentEl.classList.add('comments');
    commentEl.style.left = `${commentData.x}px`;
    commentEl.style.top = `${commentData.y}px`;
    commentEl.style.width = `${commentData.width}px`;
    commentEl.style.height = `${commentData.height}px`;
    
    commentEl.innerHTML =  `
    <div class="comment-control-panel">
      <div class="comment-control">###</div>
      <button class="comment-delete-btn" title="Delete comment">×</button>
    </div>
    <div class="comment-content" contenteditable="true">
    ${commentData.content || ''}
    </div>
    <div class="comment-resize-handle" title="Drag to resize"></div>
     `;
    
    document.body.appendChild(commentEl);
    makeCommentDraggable(commentEl);
    makeCommentResizable(commentEl);
    
    const contentEl = commentEl.querySelector('.comment-content');
    contentEl.addEventListener('input', () => updateCommentsInFirebase(getCommentsData()));
    
    const deleteBtn = commentEl.querySelector('.comment-delete-btn');
    deleteBtn.addEventListener('click', () => {
      commentEl.remove();
      updateCommentsInFirebase(getCommentsData());
    });
  });
}

const addCommentBtn = document.querySelector('.add-comment-btn');
addCommentBtn.addEventListener('click', addComment);

const motionTypeEl = document.getElementById('motionType');

console.log(motionTypeEl.innerText);

const makeCommentDraggable = (comment) => {
  const control = comment.querySelector('.comment-control');
  if (!control) return;

  control.style.cursor = 'grab';
  control.style.touchAction = 'none';

  control.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    draggingComment = comment;
    const rect = comment.getBoundingClientRect();
    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    comment.classList.add('dragging');
    control.setPointerCapture(event.pointerId);

     updateCommentsInFirebase(getCommentsData())
  });

  control.addEventListener('pointerup', () => {
    if (draggingComment === comment) {
      stopDragging();
    }
  });

  control.addEventListener('lostpointercapture', () => {
    if (draggingComment === comment) {
      stopDragging();
    }
  });
}

const stopDragging = () => {
  if (!draggingComment) return;
  draggingComment.classList.remove('dragging');
  draggingComment = null;
}

const makeCommentResizable = (comment) => {
  const handle = comment.querySelector('.comment-resize-handle');
  if (!handle) return;

  handle.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    resizingComment = comment;
    const rect = comment.getBoundingClientRect();
    resizeStartX = event.clientX;
    resizeStartY = event.clientY;
    resizeStartWidth = rect.width;
    resizeStartHeight = rect.height;
    handle.setPointerCapture(event.pointerId);

    
   updateCommentsInFirebase(getCommentsData());
  });

  handle.addEventListener('pointerup', () => {
    if (resizingComment === comment) {
      stopResizing();
    }
  });

  handle.addEventListener('lostpointercapture', () => {
    if (resizingComment === comment) {
      stopResizing();
    }
  });

}

function stopResizing() {
  if (!resizingComment) return;
  resizingComment = null;
}

document.addEventListener('pointermove', (event) => {
  if (draggingComment) {
    event.preventDefault();
    const newLeft = event.clientX - dragOffsetX;
    const newTop = event.clientY - dragOffsetY;
    draggingComment.style.left = `${Math.max(0, newLeft)}px`;
    draggingComment.style.top = `${Math.max(0, newTop)}px`;
    return;
  }

  if (!resizingComment) return;
  event.preventDefault();

  const deltaX = event.clientX - resizeStartX;
  const deltaY = event.clientY - resizeStartY;
  const minWidth = 100;
  const minHeight = 80;

  resizingComment.style.width = `${Math.max(minWidth, resizeStartWidth + deltaX)}px`;
  resizingComment.style.height = `${Math.max(minHeight, resizeStartHeight + deltaY)}px`;
});

document.addEventListener('pointerup', () => {
  if (draggingComment) {
    stopDragging();
    updateCommentsInFirebase(getCommentsData());
  }
  if (resizingComment) {
    stopResizing();
    updateCommentsInFirebase(getCommentsData());
  }
});

let editorPermission = false; // default to read-only until we verify permissions
let timeout = null; // debounce timer for autosave

let currentDocId;
let currentMotionType;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  console.log(window.location.search);     // DEBUG
  console.log([...params.entries()]);      // DEBUG

  const docId = params.get('docId');
  const motionTypeFromUrl = params.get('motionType');

  currentDocId = docId;
  currentMotionType = motionTypeFromUrl || 'General';
  
  // Store motionType from URL to be used later
  if (motionTypeFromUrl) {
    window.pendingMotionType = motionTypeFromUrl;
  }
  
  console.log(docId);
});




const saveBtn = document.querySelector('.save-btn');
saveBtn.addEventListener('click', saveDoc);

function format(command) {
  document.execCommand(command, false, null);
}


const checkPermissions = async () => {
  if (!currentDocId) {
    // Creating new document (or no ID provided), editor should be writable
    editorPermission = true;
    return;
  }

  console.log(currentMotionType);

  const snapshot = await getDoc(doc(db, currentMotionType, currentDocId));
  const user = JSON.parse(localStorage.getItem('user'));

  console.log('Checking permissions for doc:', snapshot.data(), 'User:', user);

  if (!snapshot.exists() || !user) {
    editorPermission = false;
    editor.setAttribute('contenteditable', 'false');
    const toolBar = document.querySelector('.toolbar');
    if (toolBar) toolBar.style.display = 'none';
    alert('This document does not exist or you are not signed in.');
    return;
  }

  if (user.uid === snapshot.data().owner) {
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

async function updateCommentsInFirebase(commentsData) {
  if (!currentDocId) return;
  
  try {
    await setDoc(doc(db, currentMotionType, currentDocId), {
      motion: motion.innerText || 'Untitled',
      content: editor.innerHTML,
      timestamp: new Date(),
      author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
      owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
      comments: commentsData
    }, { merge: true });
  } catch (e) {
    console.error('Error updating comments:', e);
  }
}

async function saveDoc() {
  try {
    showStatus('Saving...');

    if (currentDocId) {
      // Update existing document
      const commentsData = getCommentsData();
      await setDoc(doc(db, currentMotionType, currentDocId), {
        motion: motion.innerText || 'Untitled',
        content: editor.innerHTML,
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        comments: commentsData,
      });
      await setDoc(doc(db, 'documents', currentDocId), {
        motion: motion.innerText || 'Untitled',
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        motionType: currentMotionType
      });

      console.log("Document updated with ID: ", currentDocId);
    } else {
      // Create new document
      const commentsData = getCommentsData();
      const docRef = await addDoc(collection(db, currentMotionType), {
        motion: motion.innerText || 'Untitled',
        content: editor.innerHTML,
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        comments: commentsData,
      });
      await addDoc(collection(db, 'documents'), {
        motion: motion.innerText || 'Untitled',
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        motionType: currentMotionType
      });
      currentDocId = docRef.id;
      sessionStorage.setItem('docId', currentDocId);
      refreshDocInfo();
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
      const commentsData = getCommentsData();
      await setDoc(doc(db, currentMotionType, currentDocId), {
        motion: motion.innerText || 'Untitled',
        content: editor.innerHTML,
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        comments: commentsData
      });
      await setDoc(doc(db, 'documents', currentDocId), {
        motion: motion.innerText || 'Untitled',
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        motionType: currentMotionType
      });
    }

    showStatus('Auto-saved & synced');
  }, 1000);
}

editor.addEventListener('input', scheduleAutosave);
motion.addEventListener('input', () => { scheduleAutosave(); refreshDocInfo(); });
motionTypeEl.addEventListener('input', () => { scheduleAutosave(); refreshDocInfo(); });

let unsubscribe;

window.onload = async () => {
  // Apply motionType from URL if it was passed
  if (window.pendingMotionType) {
    const motionTypeEl = document.getElementById('motionType');
    if (motionTypeEl) {
      motionTypeEl.innerText = window.pendingMotionType;
    }
    delete window.pendingMotionType;
  }
  
  await checkPermissions();
  if (currentDocId) {
    const docRef = doc(db, currentMotionType, currentDocId);

    // 🔥 REAL-TIME LISTENER
    unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        comment = data.comments || [];

        console.log(comment);
        
        // Render comments if they differ from current DOM state
        const currentCommentsData = getCommentsData();
        if (JSON.stringify(currentCommentsData) !== JSON.stringify(comment)) {
          renderCommentsFromData(comment);
        }

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

const debatabaseTitle = document.querySelector('.debatabase');

debatabaseTitle.addEventListener('click', () => {
  window.location.href = 'index.html';
});