import { db } from './firebase.js';
import { 
  collection, 
  getDocs,
  query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const filterItems = document.querySelectorAll('.filter-item');
filterItems.forEach(item => {
  item.addEventListener('click', () => {
    filterItems.forEach(i => i.classList.remove('active'));
   item.classList.add('active');
  });
});



async function loadDocuments() {
  try {
    const docsContainer = document.getElementById('documents-container');
    if (!docsContainer) return;
    
    const q = query(collection(db, "documents"));
    const querySnapshot = await getDocs(q);
    
    docsContainer.innerHTML = '';
    
    querySnapshot.forEach((docSnapshot) => {
      const docData = docSnapshot.data();
      const div = document.createElement('div');
      div.className = 'document-item';
      div.innerHTML = `
        <strong>${docData.motion || 'Untitled'}</strong><br>
        <small>${new Date(docData.timestamp?.toMillis()).toLocaleString() || 'No timestamp'}</small>
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

