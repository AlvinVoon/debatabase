import { db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const debatabaseTitle = document.querySelector('.debatabase');

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

window.addEventListener('DOMContentLoaded', loadUserProfile);