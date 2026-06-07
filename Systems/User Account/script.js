// ─── FIREBASE LIVE CONFIGURATION WITH YOUR CREDENTIALS ───
const firebaseConfig = {
    apiKey: "AIzaSyA0iPIwr_8ImMMsNEfS-LRyiDRXBep1BSU",
    authDomain: "neofun-c1400.firebaseapp.com",
    databaseURL: "https://neofun-c1400-default-rtdb.firebaseio.com",
    projectId: "neofun-c1400",
    storageBucket: "neofun-c1400.firebasestorage.app",
    messagingSenderId: "426963072723",
    appId: "1:426963072723:web:b089fd57ba0e9fe1008626",
    measurementId: "G-D74TNTW27G"
};

// Initialize Firebase App Instance
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();

// ─── DOM ELEMENTS REGISTRY ───
const authFormContainer = document.getElementById('auth-form-container');
const profileContainer = document.getElementById('profile-container');
const authStatusTitle = document.getElementById('auth-status-title');

const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const displayNameInput = document.getElementById('profile-display-name');
const bioInput = document.getElementById('profile-bio');
const deviceInput = document.getElementById('profile-device');
const dashboardAvatar = document.getElementById('dashboard-avatar');
const avatarFileInput = document.getElementById('avatar-file-input');

// ─── LIVE AUTH STATE LISTENER ───
auth.onAuthStateChanged((user) => {
    if (user) {
        // User logged in state (Panel visibility toggle)
        authFormContainer.classList.remove('active');
        profileContainer.classList.add('active');
        authStatusTitle.innerHTML = `<h2>Connecting Matrix...</h2><p>Fetching your player records...</p>`;
        
        // Live data stream hook from Firebase Realtime Database
        database.ref('users/' + user.uid).once('value').then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Populating input elements with data from cloud node
                displayNameInput.value = data.displayName || '';
                bioInput.value = data.bio || '';
                deviceInput.value = data.device || '';
                if (data.avatar) {
                    dashboardAvatar.src = data.avatar;
                }
                authStatusTitle.innerHTML = `<h2>Welcome, ${data.displayName || 'Player'}</h2><p>Database Handshake Successful</p>`;
            } else {
                // If account exists but node data is completely fresh
                authStatusTitle.innerHTML = `<h2>Welcome Player</h2><p>Setup your profile node below</p>`;
            }
        }).catch(err => {
            console.error("Database read error:", err);
            authStatusTitle.innerHTML = `<h2>Sync Error</h2><p>Check your Firebase Realtime Rules.</p>`;
        });
    } else {
        // User logged out state (Reset panel view)
        profileContainer.classList.remove('active');
        authFormContainer.classList.add('active');
        authStatusTitle.innerHTML = `<h2>Account Access</h2><p>Join the global production cloud</p>`;
    }
});

// ─── EVENT TRIGGER 1: SECURE ACCOUNT SIGNUP ───
document.getElementById('signup-btn').addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert('Access Denied: Authentication parameters cannot remain null.');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Initializing clean dynamic object node inside 'users/uid'
            database.ref('users/' + userCredential.user.uid).set({
                displayName: "NEO_Gamer_" + Math.floor(1000 + Math.random() * 9000),
                bio: "Aesthetic. Quality. Impact.",
                device: "PC/Mobile"
            });
            alert('Account Initialized Successfully! Welcome to NEO.FUN');
        })
        .catch(error => {
            alert("Signup Error: " + error.message);
        });
});

// ─── EVENT TRIGGER 2: SESSION INITIALIZATION (LOGIN) ───
document.getElementById('login-btn').addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert('Credentials required for system validation.');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert('Access Granted. Session Initialized.');
        })
        .catch(error => {
            alert("Login Error: " + error.message);
        });
});

// ─── EVENT TRIGGER 3: DATA NODE SYNCHRONIZATION (SAVE DATA) ───
document.getElementById('save-profile-btn').addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
        // Pushing real-time text updates directly to the node payload
        database.ref('users/' + user.uid).update({
            displayName: displayNameInput.value.trim(),
            bio: bioInput.value.trim(),
            device: deviceInput.value.trim()
        }).then(() => {
            alert('Parameters Successfully Synced to Firebase Cluster!');
        }).catch(error => {
            alert("Sync Failed: " + error.message);
        });
    }
});

// ─── EVENT TRIGGER 4: IMAGE BUFFER OVERLAY STREAM (AVATAR CHANGE) ───
avatarFileInput.addEventListener('change', function() {
    const targetFile = this.files[0];
    const user = auth.currentUser;
    
    if (targetFile && user) {
        const memoryStreamReader = new FileReader();
        memoryStreamReader.onload = function(event) {
            const base64String = event.target.result;
            dashboardAvatar.src = base64String;
            
            // Storing the Base64 image data block inside user node stream directly
            database.ref('users/' + user.uid).update({
                avatar: base64String
            }).then(() => {
                console.log("Avatar synchronized with real-time cloud data node.");
            }).catch(err => {
                alert("Avatar upload failed: Make sure file size isn't too huge for database limits.");
            });
        };
        memoryStreamReader.readAsDataURL(targetFile);
    }
});

// ─── EVENT TRIGGER 5: TERMINATE SESSION BLOCK (LOGOUT) ───
document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            // Clean interface strings on wipe
            emailInput.value = '';
            passwordInput.value = '';
            alert('Session safely terminated. Disconnected from database cluster.');
        })
        .catch(error => {
            alert("Logout Error: " + error.message);
        });
});
