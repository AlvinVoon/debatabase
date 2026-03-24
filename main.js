import { db } from './firebase.js';
import { 
  collection, 
  getDocs,
  query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const filterItems = document.querySelectorAll('.filter-item');

const getStarted = document.querySelector('.cta-button');

const userInfoDiv = document.querySelector('.user-info');

console.log(localStorage);
const user = JSON.parse(localStorage.getItem('user'));
if (user) {
  userInfoDiv.innerHTML = `
    <p>Welcome back, ${user.displayName}!</p>
  `;
}

getStarted.addEventListener('click', () => {
  window.location.href = 'signUp.html';
});

let selectedFilter = null;

filterItems.forEach(item => {
  item.addEventListener('click', () => {
    filterItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    selectedFilter = item.textContent.trim();
    console.log('Selected filter:', selectedFilter);
    loadDocuments();

  });
});



async function loadDocuments() {
  try {
    const docsContainer = document.getElementById('documents-container');
    if (!docsContainer) return;
    
    const q = query(collection(db, selectedFilter || 'documents'));
    const querySnapshot = await getDocs(q);
    
    docsContainer.innerHTML = '';
    
    querySnapshot.forEach((docSnapshot) => {
      const docData = docSnapshot.data();
      const div = document.createElement('div');
      div.className = 'document-item';
      div.innerHTML = `
        <strong>${docData.motion || 'Untitled'}</strong><br>
        <small>${new Date(docData.timestamp?.toMillis()).toLocaleString() || 'No timestamp'}</small>
        <small>${docData.author || 'Unknown Author'}</small>
      `;
      div.style.cursor = 'pointer';
      div.onclick = () => {
        window.location.href = `editor.html?docId=${docSnapshot.id}`;
      };
      docsContainer.appendChild(div);
    });
  } catch (e) {
    console.error("Error loading documents: ", e);
  }
}

window.addEventListener('DOMContentLoaded', loadDocuments);

