import { db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const debatabaseTitle = document.querySelector('.debatabase');
const privateCasesSection = document.querySelector('#private-cases');

debatabaseTitle.addEventListener('click', () => {
  window.location.href = 'index.html';
});

const user = JSON.parse(localStorage.getItem('user'));

console.log(user);

async function loadUserProfile() {
  if (!user || !user.uid) {
    window.location.href = 'signUp.html';
    return;
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log(userData);
      displayProfile(userData);
    } else {
      console.log('No user data found');
    }
  } catch (e) {
    console.error('Error loading user profile:', e);
  }
}

const displayProfile = (userData) => {
  const profileContainer = document.querySelector('#profile-container');
  
  profileContainer.className = 'profile-container';
  
  profileContainer.innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">
        ${userData.displayName ? userData.displayName.charAt(0).toUpperCase() : '?'}
      </div>
      <div class="profile-info">
        <h2>${userData.displayName || 'Anonymous'}</h2>
        <p class="email">${userData.email || 'No email'}</p>
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-value">${userData.casesCreated || 0}</span>
            <span class="stat-label">Cases Created</span>
          </div>
          <div class="stat">
            <span class="stat-value">${userData.casesEdited || 0}</span>
            <span class="stat-label">Cases Edited</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

const privateCases = async () => {
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);
  const docs = userDoc.data().privateDocs;
  const docsId = docs.map(doc => doc.split('_')[0]);
  const docsMotion = docs.map(doc => doc.split('_')[2]);
  const docsType = docs.map(doc => doc.split('_')[1]);

  docs.forEach(doc => {
    console.log(doc);
    const [docId, motionType, motion] = doc.split('_');
    const caseCard = document.createElement('div');
    caseCard.className = 'case-card';
    caseCard.innerHTML = `
    <a href="editor.html?docId=${docId}&motionType=${encodeURIComponent(motionType)}">
      <h3>Motion: ${motion}</h3>
      <p>${motionType}</p>
      </a>
    `;
    privateCasesSection.appendChild(caseCard);
  });

  console.log(docsId);
  console.log(docsMotion);
  console.log(docsType);
}

privateCases();

window.addEventListener('DOMContentLoaded', loadUserProfile);