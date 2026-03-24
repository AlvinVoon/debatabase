import { auth } from './firebase.js';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {avataaars} from './avataaars.js'

const provider = new GoogleAuthProvider();

const debatabaseTitle = document.querySelector('.debatabase');
debatabaseTitle.addEventListener('click', () => {
    window.location.href = 'index.html';
});

const userAvatarDiv = document.querySelector('.user-avatar');
window.onload = () => {
    var svg= avataaars.create({
        height: '100',
        width: '100',
        eyes:"wink",
        mouth:"twinkle",
    });

    userAvatarDiv.innerHTML = svg;

}

// Email/Password Sign Up
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('full-name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update the user's display name
        await updateProfile(user, {
            displayName: fullName
        });

        alert('Account created successfully! You can now log in.');
        // Redirect to login page or main page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error creating account:', error);
        alert('Error creating account: ' + error.message);
    }
});

// Email/Password Sign In
const signInForm = document.getElementById('signin-form');
if (signInForm) {
    signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log(user);
            alert('Signed in successfully!');

            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing in:', error);
            alert('Error signing in: ' + error.message);
        }
    });
}

// Google Sign In/Sign Up
document.getElementById('google-signup').addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log(user);
        localStorage.removeItem('user'); // Clear any existing user data
        localStorage.setItem('user', JSON.stringify({
            displayName: user.displayName,
            email: user.email,
            uid: user.uid
        }));
        alert('Signed in with Google successfully!');
        // Redirect to main page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing in with Google:', error);
        alert('Error signing in with Google: ' + error.message);
    }
});