import { db } from './firebase.js';
import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
  getDocs,
  arrayUnion,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const container = document.querySelector('.editor-container');
const editor = document.getElementById('editor');
const status = document.getElementById('status');
const motion = document.getElementById('motion');

const xMark = document.querySelector('.fa-xmark');

const linkableBtn = document.querySelector('.linkable-btn');

const linkableDisplay = document.querySelector('.linkable-display');

const showLinkableBtn = document.querySelector('.showlinkable-btn');

const shareBtn = document.querySelector('.share-btn');

const splitBtn = document.querySelector('.split-btn');

const tabDisplay = document.querySelector('.tab-display');

const user = JSON.parse(localStorage.getItem('user'));

let draggingComment = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let resizingComment = null;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartWidth = 0;
let resizeStartHeight = 0;
let comment = [];
let tab = [];
let selectedTab = 0;
let totalTab = [];
let splitScreenCheck = false;

let lastActive;

shareBtn.addEventListener('click', async () => {
  const shareData = {
    title: document.title,
    text: "Check out this case on Debatabase!",
    url: window.location.href
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log(err);
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareData.url);

      shareBtn.textContent = 'Link Copied!';

      setTimeout(() => {
        shareBtn.textContent = 'Share';
      }, 2000);

    } catch (err) {
      console.error(err);
    }
  }
})

splitBtn.addEventListener('click', () => {
  if (splitScreenCheck == false){
  splitScreenCheck = true;
  const editor = document.createElement('div');
  editor.classList.add('editor');
  editor.id = 'editor2';
  editor.contentEditable = true;
  container.appendChild(editor);
  }
})

const updateTabsInFirebase = async () => {
  const commentData = getCommentsData();
  try {
    await setDoc(doc(db, currentMotionType, currentDocId), {
      motion: motion.innerText,
      content: tab,
      timestamp: new Date(),
      author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
      owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
      comments: commentData,
      tabs: totalTab
    }, { merge: true });
  } catch (e) {
    console.error('Error updating comments:', e);
  }
}

document.addEventListener('focusin', () => {
  if (document.activeElement.id == 'editor') {
    lastActive = 'editor';
  }
  else if (document.activeElement.id == 'editor2') {
    lastActive = 'editor2';
  }
  console.log(lastActive);
});

const displayTab = (data, title) => {
  tabDisplay.innerHTML = '';
  const addBtn = document.createElement('div');
  addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
  addBtn.addEventListener('click', () => {
    totalTab.push('Tab' + (tab.length + 1));
    tab.push('New Tab' + (tab.length + 1));

    updateTabsInFirebase();
    console.log(totalTab);
  })
  tabDisplay.appendChild(addBtn);

  for (let i = 0; i < data; i++) {
    const tabItem = document.createElement('div');
    tabItem.classList.add('tab-item');
    tabItem.contentEditable = true;
    tabItem.innerText = title[i];
    tabItem.dataset.id = i;
    tabItem.addEventListener('click', () => {
      selectedTab = tabItem.dataset.id;
      console.log(tabItem.dataset);
      if (splitScreenCheck == true) {
        console.log('split screen');
        if (lastActive === 'editor') {
          console.log('editor1 selected');
          editor.innerHTML = tab[selectedTab];
        }
        else {
          const editor2 = document.getElementById('editor2');
          console.log(editor2);
          editor2.innerHTML = tab[selectedTab];
        }
      }
      else {
        console.log('no split screen');
        editor.innerHTML = tab[selectedTab];
      }

    })
    let debounceTimer;
    tabItem.addEventListener('input', () => {
      totalTab[i] = tabItem.innerHTML;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        updateTabsInFirebase();
      }, 500);
    })
    tabDisplay.appendChild(tabItem);
  }
}


showLinkableBtn.addEventListener('click', () => {
  showLinkable();
  linkableDisplay.style.display = 'block';
})

const addComment = () => {
  const commentEl = document.createElement('div');
  commentEl.classList.add('comments');
  commentEl.innerHTML = `
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

    commentEl.innerHTML = `
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

const wrapSelection = () => {
  // Get the user's current text selection
  const selection = window.getSelection();

  // Ensure the user actually selected something
  if (!selection.rangeCount || selection.isCollapsed) return;

  // Get the precise range of the selected text
  const range = selection.getRangeAt(0);

  return range;

};

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

xMark.addEventListener('click', () => {
  linkableDisplay.style.display = 'none';
})
// One-time setup — call this once on page load
const initLinkablePreviews = () => {
  document.addEventListener('mousedown', (e) => {
    if (!(e.target instanceof Element)) return;
    const anchor = e.target.closest('a');
    if (!anchor) return;
    e.preventDefault();
    window.location.href = anchor.href;
  });

  document.addEventListener('mouseenter', (e) => {
    if (!(e.target instanceof Element)) return;
    const anchor = e.target.closest('a');
    if (!anchor) return;

    document.querySelector('.linkable-preview')?.remove();

    const preview = document.createElement('div');
    preview.classList.add('linkable-preview');
    preview.textContent = anchor.dataset.preview ?? '';

    const rect = anchor.getBoundingClientRect();
    preview.style.position = 'fixed';
    preview.style.top = `${rect.bottom + 8}px`;
    preview.style.left = `${rect.left}px`;
    preview.style.zIndex = '9999';
    preview.style.background = '#fff';
    preview.style.border = '1px solid #ccc';
    preview.style.borderRadius = '6px';
    preview.style.padding = '8px 12px';
    preview.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';

    document.body.appendChild(preview);
  }, true); // capture phase required for mouseenter delegation

  document.addEventListener('mouseleave', (e) => {
    if (!(e.target instanceof Element)) return;
    const anchor = e.target.closest('a');
    if (!anchor) return;
    document.querySelector('.linkable-preview')?.remove();
  }, true);
};

const addLinkable = (doc, motionType, entry, previewContent) => {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    console.warn('addLinkable: no valid selection');
    return;
  }

  const range = selection.getRangeAt(0).cloneRange();
  selection.removeAllRanges();

  const anchor = document.createElement('a');
  const relativeHref = `editor.html?docId=${doc}&motionType=${encodeURIComponent(motionType)}#${entry}`;
  anchor.href = relativeHref;
  anchor.dataset.preview = previewContent; // store preview on the element for delegation to read

  anchor.appendChild(range.extractContents());
  range.insertNode(anchor);
  range.collapse(false);

  saveDoc();
};

// Call once on page load
initLinkablePreviews();

const showLinkable = async () => {
  const linkableRef = collection(db, 'users', user.uid, 'linkable');
  const snapshot = await getDocs(linkableRef);

  snapshot.forEach(doc => {
    const { texts, motion, motionType } = doc.data();

    const title = document.createElement('h1');
    title.classList.add('linkable-title');
    title.textContent = motion;
    linkableDisplay.appendChild(title);

    texts.forEach(entry => {
      const container = document.createElement('div');

      container.classList.add('linkable-data-container');

      const anchor = document.createElement('a');
      const relativeHref = `editor.html?docId=${doc.id}&motionType=${encodeURIComponent(motionType)}#${entry.id}`;
      anchor.href = relativeHref;
      anchor.textContent = entry.text;

      anchor.addEventListener('mousedown', (e) => {
        e.preventDefault();
        window.location.href = relativeHref; // ✅ relative, not anchor.href
      });

      const dataText = document.createElement('h2');
      dataText.classList.add('linkable-data');
      dataText.appendChild(anchor);
      container.appendChild(dataText);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.classList.add('linkable-checkbox');
      checkbox.dataset.entryId = entry.id;
      checkbox.dataset.docId = doc.id;
      checkbox.dataset.motionType = motionType;
      checkbox.dataset.previewContent = entry.text;

      container.appendChild(checkbox);

      linkableDisplay.appendChild(container);
    });
  });
}

linkableDisplay.addEventListener('change', (e) => {
  if (e.target.classList.contains('linkable-checkbox')) {
    const { entryId, docId, motionType, previewContent } = e.target.dataset;
    if (e.target.checked) {
      addLinkable(docId, motionType, entryId, previewContent);
      console.log('Checked:', entryId, docId);
      setInterval(() => {
        e.target.checked = false;
      }, 100)
    } else {
      console.log('Unchecked:', entryId, docId);
    }
  }
});


const makeLinkable = async () => {
  const idBro = crypto.randomUUID();

  const range = wrapSelection();

  // Create the new span element
  const span = document.createElement("span");
  span.className = "highlighted-text";
  span.id = idBro;

  // Extract content and place it inside the span
  span.appendChild(range.extractContents());

  // Insert the decorated span back into the document
  range.insertNode(span);

  // Clear the selection highlight from the screen
  window.getSelection().removeAllRanges();

  await setDoc(doc(db, 'users', user.uid, 'linkable', currentDocId), {
    texts: arrayUnion({
      text: span.innerText,
      id: idBro,
      createdAt: new Date().toISOString()
    }),
    motion: motion.innerText,
    motionType: currentMotionType
  }, { merge: true });

  showLinkable();
  saveDoc();
}

linkableBtn.addEventListener('click', makeLinkable);

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

  console.log('Checking permissions for doc:', snapshot.data(), 'User:', user);

  if (!snapshot.exists()) {
    editorPermission = false;
    editor.setAttribute('contenteditable', 'false');
    const toolBar = document.querySelector('.toolbar');
    if (toolBar) toolBar.style.display = 'none';
    alert('This document does not exist or you are not signed in.');
    return;
  }

  if (!user) {
    editorPermission = false;
    editor.setAttribute('contenteditable', 'false');
    const toolBar = document.querySelector('.toolbar');
    if (toolBar) toolBar.style.display = 'none';
    alert('Please sign in first.');
    return;
  }

  if (user.uid === snapshot.data().owner) {
    editorPermission = true;
  } else {
    editorPermission = false;
    editor.setAttribute('contenteditable', 'false');
    const toolBar = document.querySelector('.toolbar');
    if (toolBar) toolBar.style.display = 'none';
  }
}

// expose for inline toolbar `onclick="format('bold')"` in editor.html
window.format = format;

async function updateCommentsInFirebase(commentsData) {
  if (!currentDocId) return;

  try {
    await setDoc(doc(db, currentMotionType, currentDocId), {
      motion: motion.innerText || 'Untitled',
      content: tab,
      timestamp: new Date(),
      author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
      owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
      comments: commentsData,
      tabs: totalTab
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
      tab[selectedTab] = editor.innerHTML;
      await setDoc(doc(db, currentMotionType, currentDocId), {
        motion: motion.innerText || 'Untitled',
        content: tab,
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        comments: commentsData,
        tabs: totalTab
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
      tab[0] = editor.innerHTML;
      const docRef = await addDoc(collection(db, currentMotionType), {
        motion: motion.innerText || 'Untitled',
        content: tab,
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        comments: commentsData,
        tabs: totalTab
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
    localStorage.setItem('doc', tab);
    localStorage.setItem('motion', motion.innerText);

    if (currentDocId) {
      const commentsData = getCommentsData();
      tab[selectedTab] = editor.innerHTML;
      console.log(tab);
      await setDoc(doc(db, currentMotionType, currentDocId), {
        motion: motion.innerText || 'Untitled',
        content: tab,
        timestamp: new Date(),
        author: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).displayName : 'anonymous',
        owner: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).uid : 'anonymous',
        comments: commentsData,
        tabs: totalTab
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

window.addEventListener('load', () => {
  const hash = window.location.hash.substring(1);
  if (!hash) return;

  // Wait for dynamic content to render
  const tryScroll = setInterval(() => {
    const target = document.getElementById(hash);
    if (target) {
      clearInterval(tryScroll);
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.style.backgroundColor = 'yellow';
    }
  }, 100); // check every 100ms

  // Stop trying after 5 seconds
  setTimeout(() => clearInterval(tryScroll), 5000);
});

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

        console.log(data);

        tab = data.content;
        totalTab = data.tabs;

        comment = data.comments || [];
        console.log(comment);

        displayTab(totalTab.length, totalTab);

        // Render comments if they differ from current DOM state
        const currentCommentsData = getCommentsData();
        if (JSON.stringify(currentCommentsData) !== JSON.stringify(comment)) {
          renderCommentsFromData(comment);
        }

        motion.innerText = data.motion || 'Untitled';

        // Prevent cursor jump / overwrite while typing
        if (editor.innerHTML !== tab[selectedTab]) {
          console.log('needs to sync')
          editor.innerHTML = tab[selectedTab];
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