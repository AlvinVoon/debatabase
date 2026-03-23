import { db } from './firebase.js';
import { 
  collection, 
  getDocs,
  query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
        <h3>${docData.content.substring(0, 50) || 'Untitled'}...</h3>
        <p>${new Date(docData.timestamp.toDate()).toLocaleDateString()}</p>
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

