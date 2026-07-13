
// ==========================================
// 🚀 FIREBASE CLOUD ENGINE & VIP LOGIC
// ==========================================

// 1. Your Secret Keys
const firebaseConfig = {
  apiKey: "AIzaSyC9-SkZtquTnt_4F08vkXO71O9u21_r5b8",
  authDomain: "sanskrit-vartika.firebaseapp.com",
  projectId: "sanskrit-vartika",
  storageBucket: "sanskrit-vartika.firebasestorage.app",
  messagingSenderId: "335310316057",
  appId: "1:335310316057:web:6949c57ac8923591070088",
  measurementId: "G-KT34D6Y4B4"
};

// 2. Turn on the Engine
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 3. Global App Data & Subject Engine
const CORE_SUBJECTS = {
  'sanskrit': { name: 'Sanskrit', code: '25', icon: '🪷', badge: 'Sanskrit Pass' },
  'bengali': { name: 'Bengali', code: '19', icon: '📖', badge: 'Bengali Pass' },
  'philosophy': { name: 'Philosophy', code: '03', icon: '🧘', badge: 'Philosophy Pass' }
};

// Change this to show all or only sanskrit in guest mode switch
let currentCoreSubject = localStorage.getItem('vartika_core_subject') || 'sanskrit';

let currentUser = null;
let isSignUpMode = false;

// 🚀 NEW: Guest Mode Visual Filter Engine
function filterGuestMocks(subject) {
  // 1. Update active tab styling
  document.querySelectorAll('.guest-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll(`.guest-tab[onclick*="${subject}"]`).forEach(btn => btn.classList.add('active'));

  // 2. 🚀 FIX: Hide/Show the relevant cards ONLY on the Mock Tests page!
  document.querySelectorAll('#page-mocktest [data-subject-group]').forEach(el => {
    el.style.display = (el.getAttribute('data-subject-group') === subject) ? '' : 'none';
  });

  // 3. Update the AI Booster dynamic titles in Guest Mode
  if (CORE_SUBJECTS[subject]) {
     const aiTitle = document.getElementById('ai-title-core');
     const aiIcon = document.getElementById('ai-icon-core');
     if (aiTitle) aiTitle.textContent = `AI Booster: ${CORE_SUBJECTS[subject].name}`;
     if (aiIcon) aiIcon.textContent = CORE_SUBJECTS[subject].icon;
  }
}


// 🚀 MASTER UI ROUTER: Instantly repaints the entire website to match the selected subject!
function applyCoreSubjectUI(subjectKey) {
  const guestTabs = document.querySelectorAll('.guest-mock-tabs');
  const tipTexts = document.querySelectorAll('.subject-tip-text');
  
  // 🚀 GUEST VIEW: Unlocks Tabs!
  if (subjectKey === 'all') {
    // Show the filter tabs, hide the settings tips
    guestTabs.forEach(el => el.style.display = 'flex');
    tipTexts.forEach(el => el.style.display = 'none');
    
    // Automatically collapse the Mock Tests page down to just Sanskrit initially
    filterGuestMocks('sanskrit');
    
    // 🚀 FIX: Ensure ALL cards on the Free Content page are completely visible!
    document.querySelectorAll('#page-free [data-subject-group]').forEach(el => el.style.display = '');

    // Set generic fallback texts for standard UI elements
    if (document.getElementById('hub-core-title')) document.getElementById('hub-core-title').textContent = "Paper 2 Tests";
    if (document.getElementById('hub-core-badge')) document.getElementById('hub-core-badge').textContent = "Core Pass";
    if (document.getElementById('tab-btn-core')) document.getElementById('tab-btn-core').textContent = "Paper 2";
    if (document.getElementById('sq-tab-core')) document.getElementById('sq-tab-core').textContent = "Paper 2";
    
    if (typeof renderCourses === 'function') renderCourses(); 
    return; // Stop here!
  }

  // 🚀 NORMAL STUDENT VIEW: Locks to 1 Subject!
  // Hide the filter tabs, show the settings tips
  guestTabs.forEach(el => el.style.display = 'none');
  tipTexts.forEach(el => el.style.display = 'block');

  if (!CORE_SUBJECTS[subjectKey]) subjectKey = 'sanskrit';
  const subjData = CORE_SUBJECTS[subjectKey];

  // A. Hide/Show specific Subject Cards
  document.querySelectorAll('[data-subject-group]').forEach(el => {
      el.style.display = (el.getAttribute('data-subject-group') === subjectKey) ? '' : 'none';
  });

  // B. Update Dynamic Texts
  const hubTitle = document.getElementById('hub-core-title');
  const hubBadge = document.getElementById('hub-core-badge');
  const hubIcon = document.querySelector('#hub-core-card .test-cat-icon');
  if (hubTitle) hubTitle.textContent = `${subjData.name} Tests`;
  if (hubBadge) hubBadge.textContent = subjData.badge;
  if (hubIcon) hubIcon.textContent = subjData.icon;

  const aiTitle = document.getElementById('ai-title-core');
  const aiIcon = document.getElementById('ai-icon-core');
  if (aiTitle) aiTitle.textContent = `AI Booster: ${subjData.name}`;
  if (aiIcon) aiIcon.textContent = subjData.icon;

  const tabCore = document.getElementById('tab-btn-core');
  const sqTabCore = document.getElementById('sq-tab-core');
  if (tabCore) tabCore.textContent = subjData.name;
  if (sqTabCore) sqTabCore.textContent = subjData.name;

  // C. Update Sales Page
  if (typeof renderCourses === 'function') renderCourses();
}

// Call it immediately on load for Guests
document.addEventListener('DOMContentLoaded', () => {
    applyCoreSubjectUI(currentCoreSubject);
});


// 4. The "Master Launch Switch" (Change this date to your actual Launch Day + 7 days)
const LAUNCH_PROMO_END_DATE = new Date("2030-05-01T00:00:00Z"); 


// 5A. MASTER WHATSAPP NUMBER (Centralized)
const WHATSAPP_NUMBER = "918172063129";

// 6. TESTING SWITCH: Require Email Verification?
const REQUIRE_EMAIL_VERIFICATION = false; // Change to true before official public launch!
const ENFORCE_VERIFICATION_AFTER_DATE = "2026-07-10"; // Old users created before this date will bypass verification!

// 7. TRIAL SETTINGS: How many days free?
const FREE_TRIAL_DAYS = 3; // Change this single number to update the entire website

// 8. AI BOOSTER SETTINGS: How many custom tests per day?
const AI_BOOSTER_DAILY_LIMIT = 3; // Change this single number to update the AI limits everywhere!

// 9. CLOUD VAULT SETTINGS: Max saved questions per user (Prevents Firebase crashes)
const MAX_SAVED_QUESTIONS = 150;

// 10. ANALYTICS SETTINGS: How many recent tests to use for the average percentage?
const ANALYTICS_RECENT_LIMIT = 10;


// --- AUTHENTICATION UI LOGIC ---
function showAuthModal(forceMode = null) {
  document.getElementById('auth-modal').style.display = 'flex';
  document.getElementById('auth-error').style.display = 'none';
  
  // SMART UI SYNC: Ensures the popup matches the button you clicked
  if (forceMode === 'signup' && !isSignUpMode) {
    toggleAuthMode();
  } else if (forceMode === 'login' && isSignUpMode) {
    toggleAuthMode();
  }
}

// === SECURITY SHIELD ===
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
  );
}

function toggleAuthMode() {
  isSignUpMode = !isSignUpMode;
  const title = document.getElementById('auth-title');
  const subtitle = document.getElementById('auth-subtitle');
  const nameInput = document.getElementById('auth-name');
  const whatsappInput = document.getElementById('auth-whatsapp');
  const subjectInput = document.getElementById('auth-core-subject'); // 🚀 NEW
  const actionBtn = document.getElementById('auth-action-btn');
  const switchText = document.getElementById('auth-switch-text');
  const forgotPassBox = document.getElementById('forgot-password-box');
  
  if (isSignUpMode) {
    title.textContent = "Create Account";
    
    // 🚀 DYNAMIC UX FIX: Only show the trial text if the Master Switch is > 0
    if (FREE_TRIAL_DAYS > 0) {
      subtitle.textContent = `🎁 Start your ${FREE_TRIAL_DAYS}-Day Free Combo Pass Trial! 🎉`;
    } else {
      subtitle.textContent = "Create a free account to track your progress.";
    }
    
    nameInput.style.display = 'block';
    if(whatsappInput) whatsappInput.style.display = 'block';
    if(subjectInput) subjectInput.style.display = 'block'; // 🚀 NEW
    if(forgotPassBox) forgotPassBox.style.display = 'none';
    actionBtn.textContent = "Sign Up";
    // 🚀 BUG FIX: Changed href='#' to href='javascript:void(0);' to prevent the pop-up closer from triggering!
    switchText.innerHTML = "Already have an account? <a href='javascript:void(0);' onclick='toggleAuthMode()' style='color: var(--saffron); font-weight: bold;'>Log In</a>";
  } else {
    title.textContent = "Welcome Back";
    subtitle.textContent = "Log in to track your scores.";
    nameInput.style.display = 'none';
    if(whatsappInput) whatsappInput.style.display = 'none';
    if(subjectInput) subjectInput.style.display = 'none'; // 🚀 NEW
    if(forgotPassBox) forgotPassBox.style.display = 'block';
    actionBtn.textContent = "Log In";
    // 🚀 BUG FIX: Changed href='#' to href='javascript:void(0);' to prevent the pop-up closer from triggering!
    switchText.innerHTML = "New here? <a href='javascript:void(0);' onclick='toggleAuthMode()' style='color: var(--saffron); font-weight: bold;'>Create an account</a>";
  }

  // 🚀 NEW: Show Checkbox ONLY on Sign-Up
  const legalBox = document.getElementById('legal-checkbox-container');
  if (legalBox) {
    legalBox.style.display = isSignUpMode ? 'block' : 'none';
  }
}

// --- FIXED: FORGOT PASSWORD MUST BE OUTSIDE ---
async function handleForgotPassword() {
  const email = document.getElementById('auth-email').value.trim();
  const errorBox = document.getElementById('auth-error');
  
  if (!email) {
    errorBox.textContent = "Please enter your email address in the box first.";
    errorBox.style.display = 'block';
    return;
  }
  
  try {
    await auth.sendPasswordResetEmail(email);
    showToast("📧 Password reset link sent! Check your inbox.");
    document.getElementById('auth-modal').style.display = 'none';
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.style.display = 'block';
  }
}

// --- CLOUD SIGN UP & LOG IN LOGIC ---
let isNewSignUp = false; // NEW: Prevents Firebase from interrupting the database write

async function handleAuthAction() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value.trim();
  const whatsapp = document.getElementById('auth-whatsapp').value.trim();
  const selectedSubject = document.getElementById('auth-core-subject') ? document.getElementById('auth-core-subject').value : 'sanskrit'; // 🚀 NEW
  const errorBox = document.getElementById('auth-error');
  
  if (!email || !password || (isSignUpMode && (!name || !whatsapp))) {
    errorBox.textContent = "Please fill in all fields.";
    errorBox.style.display = 'block';
    return;
  }

  if (isSignUpMode) {
    // 🚀 NEW: Strict Email Whitelist to destroy Fake/Temporary Accounts
    const allowedDomains = ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com', '@icloud.com'];
    const emailLower = email.toLowerCase();
    
    // Check if the email ends with any of our trusted domains
    const isValidDomain = allowedDomains.some(domain => emailLower.endsWith(domain));
    
    if (!isValidDomain) {
      errorBox.textContent = "⚠️ Please use a valid Google, Yahoo, Microsoft, or Apple email address to register.";
      errorBox.style.display = 'block';
      return;
    }

    // 🚀 NEW: WhatsApp Smart Formatter (Indian 10-Digit Standard)
    // ^[6-9] means it must start with 6,7,8,or 9. \d{9}$ means exactly 9 more digits.
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(whatsapp)) {
      errorBox.textContent = "⚠️ Please enter a valid 10-digit WhatsApp number (without +91).";
      errorBox.style.display = 'block';
      return;
    }

    // 🚀 The Legal Gatekeeper
    const isAgreed = document.getElementById('legal-agree-checkbox').checked;
    if (!isAgreed) {
      errorBox.textContent = "⚠️ You must agree to the Terms & Privacy Policy to create an account.";
      errorBox.style.display = 'block';
      return;
    }
  }

  const btn = document.getElementById('auth-action-btn');
  btn.textContent = "Please wait...";
  btn.disabled = true;

  // 🚀 NEW: Give them a VIP pass to bypass the Bouncer since they used a password!
  window.isFreshLogin = true;

  try {
    if (isSignUpMode) {
      isNewSignUp = true; // Lock the background observer!
      
      // Create Account
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // 🚀 OPTIMIZATION: Only send the email if the system actually requires it! Saves Firebase quota.
      if (REQUIRE_EMAIL_VERIFICATION) {
        try { await user.sendEmailVerification(); } catch(e) {}
      }
      
      // 🚀 DYNAMIC TRIAL PASS LOGIC (No more 'combo')
      currentCoreSubject = selectedSubject; 
      localStorage.setItem('vartika_core_subject', currentCoreSubject);
      applyCoreSubjectUI(currentCoreSubject);

      let initialPasses = { batch: null, general: null };
      Object.keys(CORE_SUBJECTS).forEach(sub => initialPasses[sub] = null); // Add all known subjects securely

      let initialAccessLevel = "basic";
      if (new Date() < LAUNCH_PROMO_END_DATE) {
        let d = new Date();
        d.setDate(d.getDate() + FREE_TRIAL_DAYS);
        initialPasses.general = d.toISOString(); // Trial for Paper 1
        initialPasses[currentCoreSubject] = d.toISOString(); // Trial for specific subject
        initialAccessLevel = "premium";
      }

      // Create Firestore Profile
      await db.collection("users").doc(user.uid).set({
        name: name,
        email: email,
        whatsapp: whatsapp,
        passes: initialPasses, 
        accessLevel: initialAccessLevel,
        coreSubject: currentCoreSubject,
        createdAt: new Date().toISOString()
      });
      
      // DEV SWITCH LOGIC: Show the hard pop-up instead of a disappearing toast!
      if (REQUIRE_EMAIL_VERIFICATION) {
        await auth.signOut(); 
        document.getElementById('verify-alert-modal').style.display = 'flex'; 
      } else {
        showToast("Account created successfully! Welcome.");
        
        // === 🚀 BUG FIX 1: SEAMLESS SPA LOGIN (No Page Reloads!) ===
        currentUser = user;
        currentUser.dbData = {
          name: name,
          email: email,
          whatsapp: whatsapp,
          passes: initialPasses, 
          accessLevel: initialAccessLevel,
          createdAt: new Date().toISOString()
        };
        
        isFirebaseReady = true;
        updateNavUI(currentUser, name);
        updateTestCardLocks();
        if (currentPage === 'dashboard') loadDashboard();
      }
      
      document.getElementById('auth-modal').style.display = 'none';
      isNewSignUp = false; // Unlock the background observer!
      
    } else {
      // Log In
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      await user.reload(); 
      
            // DEV SWITCH LOGIC: Check verification only if required (with Old User Bypass)
      if (REQUIRE_EMAIL_VERIFICATION && !user.emailVerified && new Date(user.metadata.creationTime) >= new Date(ENFORCE_VERIFICATION_AFTER_DATE)) {
        await auth.signOut();
        errorBox.textContent = "⚠️ Please verify your email before logging in. Check your inbox & spam folder!";
        errorBox.style.display = 'block';
        return;
      }
      
      showToast("Welcome back!");
      document.getElementById('auth-modal').style.display = 'none';
    }
  } catch (error) {
    isNewSignUp = false; // <-- CRITICAL FIX: Instantly unlock if sign-up fails!
    errorBox.textContent = error.message;
    errorBox.style.display = 'block';
  } finally {
    btn.textContent = isSignUpMode ? "Sign Up" : "Log In";
    btn.disabled = false;
  }
}

// --- LISTEN FOR LOGIN CHANGES (REAL-TIME SYNC) ---
let isFirebaseReady = false; // NEW: Prevents dashboard glitches


// Helper to instantly force the Nav button to update
function updateNavUI(user, nameStr) {
  const userMenuBtn = document.getElementById('nav-user-menu');
  const bellBtn = document.getElementById('nav-bell-btn');
  const userNameDisplay = document.getElementById('user-name-display');
  const loginBtn = document.getElementById('nav-auth-btn'); // The original login button

  if (user) {
    // 1. Hide the old login button
    if (loginBtn) loginBtn.style.display = 'none';
    
    // 2. Show the new Bell and Dropdown
    if (userMenuBtn) userMenuBtn.style.display = 'inline-block';
    if (bellBtn) bellBtn.style.display = 'inline-block';
    
    // 3. Truncate long names (Max 10 chars)
    let firstName = (nameStr || "Student").split(' ')[0];
    if (firstName.length > 10) {
      firstName = firstName.substring(0, 10) + "...";
    }
    if (userNameDisplay) userNameDisplay.textContent = `Hi, ${firstName}`;
    
    // 4. THE FINAL WIRE-UP! Trigger the background notification fetch
    if (typeof initializeNotifications === 'function') {
      initializeNotifications(); 
    }

  } else {
    // User is logged out: Show Login button, hide Bell and Dropdown
    if (loginBtn) {
        loginBtn.style.display = 'inline-flex';
        loginBtn.innerHTML = `🔒 Log In`;
        loginBtn.style.background = "transparent";
        loginBtn.style.color = "var(--gold)";
        loginBtn.style.border = "1px solid var(--gold)";
        loginBtn.onclick = () => showAuthModal('login'); // Force Login Mode
    }
    if (userMenuBtn) userMenuBtn.style.display = 'none';
    if (bellBtn) bellBtn.style.display = 'none';
  }
}

auth.onAuthStateChanged(async (user) => {
  // FIX: Do not interrupt the account creation process!
  if (isNewSignUp) return; 

  if (user) {
    // Check verification safely on page load
    try { await user.reload(); } catch(e) {}
    
        // DEV SWITCH LOGIC: Only kick them out if verification is strictly required (with Old User Bypass)
    if (REQUIRE_EMAIL_VERIFICATION && !user.emailVerified && new Date(user.metadata.creationTime) >= new Date(ENFORCE_VERIFICATION_AFTER_DATE)) {
      await auth.signOut();
      return; 
    }

    currentUser = user;
    updateNavUI(user, "..."); // Instant UI feedback
    
    // NEW ARCHITECTURE: Fetch once, do not stay connected.
    db.collection("users").doc(user.uid).get().then((doc) => {
      if (doc.exists) {
        currentUser.dbData = doc.data();

        // 🛡️ SECURITY GATEKEEPER 1: SUSPENSION CHECK
        const susp = currentUser.dbData.suspension;
        if (susp && susp.active) {
           const isPermanent = susp.expiresAt === 'permanent';
           const isExpired = !isPermanent && new Date(susp.expiresAt) <= new Date();
           
           if (isPermanent || !isExpired) {
               // 🚀 FIX: Ensure it looks like a real ban
               const modalTitle = document.querySelector('#suspended-modal h2');
               if (modalTitle) modalTitle.textContent = "Account Suspended";
               const waBtn = document.getElementById('suspended-whatsapp-btn');
               if (waBtn) waBtn.style.display = 'flex'; // Show WhatsApp button
               
               document.getElementById('suspended-reason-text').textContent = "Reason: " + (susp.reason || "Violating Terms of Service");
               let dur = isPermanent ? "This ban is permanent." : "Suspension expires on: " + new Date(susp.expiresAt).toLocaleDateString('en-IN');
               document.getElementById('suspended-duration-text').textContent = dur;
               
               // 🚀 BUG FIX: Save their details in a safe temporary vault before we wipe their session!
               window.tempSuspendedUser = {
                 name: currentUser.dbData.name || 'N/A',
                 email: currentUser.email || 'N/A',
                 phone: currentUser.dbData.whatsapp || 'N/A'
               };
               
               document.getElementById('suspended-modal').style.display = 'flex';
               auth.signOut(); // Memory wiped here!
               return; // 🛑 INSTANT KILL: Stop loading the app!
               // Ban naturally expired, silently lift it
               db.collection("users").doc(user.uid).update({ "suspension.active": false });
               currentUser.dbData.suspension.active = false;
           }
        }
        
        // 🛡️ SECURITY GATEKEEPER 2: WARNING CHECK
        if (currentUser.dbData.warningMessage) {
           document.getElementById('warning-msg-text').textContent = currentUser.dbData.warningMessage;
           document.getElementById('warning-modal').style.display = 'flex';
        }

        // 🚀 NEW SECURITY GATEKEEPER 3: THE DEVICE BOUNCER (Anti-Sharing)
        const myUUID = getDeviceUUID();
        const myCategory = getDeviceCategory(); // Checks if Mobile or Desktop
        
        // If they don't have a VIP pass, and their device slot is taken by someone else...
        if (!window.isFreshLogin && currentUser.dbData.activeDevices && currentUser.dbData.activeDevices[myCategory]) {
           if (currentUser.dbData.activeDevices[myCategory] !== myUUID) {
               // 🛑 TRAP TRIGGERED! Kick them out!
               const modalTitle = document.querySelector('#suspended-modal h2');
               if (modalTitle) modalTitle.textContent = "Session Expired";
               
               // 🚀 FIX: Hide the WhatsApp button because they just need to log back in!
               const waBtn = document.getElementById('suspended-whatsapp-btn');
               if (waBtn) waBtn.style.display = 'none'; 
               
               document.getElementById('suspended-reason-text').textContent = "Account accessed on another " + (myCategory === 'mobile' ? "Phone" : "Computer") + ".";
               document.getElementById('suspended-duration-text').textContent = "For security, you can only use 1 phone and 1 computer at a time. Please log in again to use this device.";
               
               window.tempSuspendedUser = { name: currentUser.dbData.name || 'N/A', email: currentUser.email || 'N/A', phone: currentUser.dbData.whatsapp || 'N/A' };
               document.getElementById('suspended-modal').style.display = 'flex';
               
               auth.signOut();
               return; // INSTANT KILL!
           }
        }
        
        // 🚀 SYNC WORKSPACE FROM CLOUD
        if (currentUser.dbData.coreSubject) {
            currentCoreSubject = currentUser.dbData.coreSubject;
            localStorage.setItem('vartika_core_subject', currentCoreSubject);
            applyCoreSubjectUI(currentCoreSubject);
        }
        
        // === NEW: AUTO-HEALING ACCESS LEVEL ===
        let hasActivePass = false;
        const now = new Date();
        const p = currentUser.dbData.passes || {};
        
        // 🚀 FIX: Check all passes dynamically without hardcoding!
        Object.keys(p).forEach(pass => {
          if (p[pass] && new Date(p[pass]) > now) hasActivePass = true;
        });

        const correctLevel = hasActivePass ? "premium" : "basic";
        
        // 🔒 SECURE FIX: We update the local UI state so the website works, 
        // but we NEVER tell the database to update it! (Prevents DevTools hacking)
        currentUser.dbData.accessLevel = correctLevel;
        // ======================================
        
        // 1. Tell the app Firebase is ready!
        isFirebaseReady = true;
        logDeviceActivity();

        // 2. Update the Navbar with their real name
        updateNavUI(user, currentUser.dbData.name);
        
        
        // 4. Update Lock Icons on Mock Tests
        updateTestCardLocks();

        // 5. Finally, load the dashboard if they are on it
        if (currentPage === 'dashboard') loadDashboard(); 
        
      } else {
        // SMART FIX: Check multiple times for slow internet!
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          
          // Knock on the database door again
          db.collection("users").doc(user.uid).get().then((retryDoc) => {
            if (retryDoc.exists) {
              clearInterval(checkInterval); // Stop checking!
              
              // === 🚀 BUG FIX 2: RESTORE MISSING UI SYNC ===
              currentUser.dbData = retryDoc.data();
              
              // Run Auto-Healing Access Level on Retry
              let hasActivePass = false;
              const now = new Date();
              const p = currentUser.dbData.passes || {};
              ['combo', 'batch', 'sanskrit', 'general'].forEach(pass => {
                if (p[pass] && new Date(p[pass]) > now) hasActivePass = true;
              });
              const correctLevel = hasActivePass ? "premium" : "basic";
              
              // 🔒 SECURE FIX: Update local UI only. No database writes!
              currentUser.dbData.accessLevel = correctLevel;

              isFirebaseReady = true;
              updateNavUI(user, currentUser.dbData.name);
              updateTestCardLocks();
              if (currentPage === 'dashboard') loadDashboard();
              
            } else if (attempts >= 5) {
              // Give up after 5 seconds to prevent an endless loop
              clearInterval(checkInterval);
              
              // === 🚀 BUG FIX 3: CRITICAL ACCOUNT REPAIR (Missing Profile Auto-Generator) ===
              // If they somehow have an Auth account but no Firestore document due to a network crash, generate a blank one safely!
              const newProfile = {
                name: "Student",
                email: user.email,
                whatsapp: "",
                passes: { batch: null, general: null, sanskrit: null, bengali: null, philosophy: null },
                accessLevel: "basic",
                createdAt: new Date().toISOString()
              };
              db.collection("users").doc(user.uid).set(newProfile);
              currentUser.dbData = newProfile;

              isFirebaseReady = true;
              updateNavUI(user, newProfile.name);
              updateTestCardLocks();
              if (currentPage === 'dashboard') loadDashboard();
            }
          });
          
        }, 1000); // Check every 1000 milliseconds (1 second)
      }
    }).catch(err => console.error("Error fetching profile:", err));

  } else {
    // User is completely logged out (Guest)
    currentUser = null;
    isFirebaseReady = true; 
    
        
    updateNavUI(null); // Set to "Log In"
    if (currentPage === 'dashboard') loadDashboard();
    
    // FIX: This must be OUTSIDE the if-statement so it runs for brand new guests!
    updateTestCardLocks(); 

        // 🚀 NEW: The "Polite" 20-Second Guest Promo Engine
    // (SMART FIX: It will completely disable itself if FREE_TRIAL_DAYS is 0!)
    if (!sessionStorage.getItem('guest_promo_shown') && FREE_TRIAL_DAYS > 0) {
      // Wait the initial 20 seconds...
      setTimeout(() => {
        
        // Now, check the screen every 2 seconds until it's clear
        const promoInterval = setInterval(() => {
          // 1. If they successfully logged in while waiting, kill the timer forever!
          if (currentUser) {
            clearInterval(promoInterval);
            return;
          }
          
          // 2. Check if ANY pop-up is open, or if they are taking a mock test
          const openModals = Array.from(document.querySelectorAll('.modal-overlay')).filter(m => m.style.display === 'flex');
          const isTestRunning = document.body.classList.contains('test-mode-active');
          
          // 3. ONLY show the promo if the screen is completely clear!
          if (openModals.length === 0 && !isTestRunning) {
            clearInterval(promoInterval); // Stop checking
            
            const subjName = currentCoreSubject === 'all' ? 'Core Subject' : CORE_SUBJECTS[currentCoreSubject].name;
            const promoNameEl = document.getElementById('promo-subject-name');
            if (promoNameEl) promoNameEl.textContent = subjName;
            
            document.getElementById('guest-trial-modal').style.display = 'flex';
            sessionStorage.setItem('guest_promo_shown', 'true');
          }
        }, 2000); // Checks every 2 seconds

      }, 20000); // 20000 milliseconds = 20 seconds
    }
  }
});

// ==========================================
// 🚀 FIREBASE CLOUD ENGINE & VIP LOGIC ends

// ==========================================



// === NAVIGATION & UI ===
let isFreeMode = false;
let currentPage = 'home';
let pendingNavigation = null;
let hasNavigated = false; // 🚀 NEW: Tracks if they have moved past the first page

function navigate(page, addToHistory = true, keepFreeMode = false) {
  // --- NEW: INTERCEPT NAVIGATION IF TEST IS RUNNING ---
  if (testState.timerInterval && !testState.finished && document.getElementById('test-interface').style.display === 'block') {
    pendingNavigation = { page, addToHistory, keepFreeMode };
    document.getElementById('exit-modal').style.display = 'flex';
    return; // Stop the navigation instantly!
  }

  hasNavigated = true; // 🚀 NEW: Tell the app they are no longer on the first page!


  // 🚨 PERMANENT FIX: CLOSE ALL OVERLAYS ON TAB SWITCH 🚨
  // If a user clicks a nav link while looking at Sets or Results, instantly hide the overlays!
  const setsView = document.getElementById('test-sets-view');
  const testInterface = document.getElementById('test-interface');
  const testResults = document.getElementById('test-results');
  if (setsView) setsView.style.display = 'none';
  if (testInterface) testInterface.style.display = 'none';
  if (testResults) testResults.style.display = 'none';
  document.body.classList.remove('test-mode-active');

  // SMART STATE ROUTING: Respect the free mode flag
  if (page === 'mocktest') {
    isFreeMode = keepFreeMode;
  } else {
    isFreeMode = false;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    currentPage = page;
    window.scrollTo(0, 0);
    
    // Browser History Integration
    if (addToHistory) {
      history.pushState({ page: page, isFree: isFreeMode }, '', '#' + page);
    }

    // Dynamic Tab Titles (UPDATED FOR NEW ARCHITECTURE)
    const titles = { 
      'home': 'Home', 
      'study': 'My Study Hub', 
      'mocktest': 'Mock Tests', 
      'courses': 'Courses', 
      'free': 'Free Services', 
      'dashboard': 'Student Dashboard', 
      'about': 'About Us', 
      'contact': 'Contact' 
    };
    const pageTitle = (titles[page] || 'Welcome') + ' | संस्कृत-वर्तिका';
    document.title = pageTitle;

    // === GOOGLE ANALYTICS SPA TRACKING ===
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', { page_title: pageTitle, page_location: window.location.href, page_path: '/' + page });
    }

    // Update Mobile Bottom Nav
    document.querySelectorAll('.mat-item').forEach(el => el.classList.remove('active'));
    const activeNavBtn = document.getElementById('bnav-' + page);
    if (activeNavBtn) activeNavBtn.classList.add('active');
  }

  // === UPDATE DESKTOP TOP NAV ACTIVE STATE (NEW ARCHITECTURE) ===
  document.querySelectorAll('.nav-links .nav-btn').forEach(btn => btn.classList.remove('active'));
  
  const topNavMap = {
    'home': 'Home', 'study': 'Study', 'mocktest': 'Test',
    'courses': 'Courses', 'free': 'Free Content', 'dashboard': 'Dashboard',
    'about': 'About Us', 'contact': 'Contact'
  };
  
  let activeText = topNavMap[page];

  // SMART OVERRIDE: If we are on Mock Tests but it's Free Mode, trick the nav bar!
  if (page === 'mocktest' && isFreeMode) activeText = 'Free Content';

  if (activeText) {
    document.querySelectorAll('.nav-links .nav-btn').forEach(btn => {
      if (btn.textContent.trim() === activeText) btn.classList.add('active');
    });
  }
  // ===============================================
  
  if (page === 'dashboard') loadDashboard();
  if (page === 'mocktest') {
    if (!isFreeMode) showCategories();
    updateTestCardLocks();
    if (typeof updateAIBoosterLimitsUI === 'function') updateAIBoosterLimitsUI(); // <-- NEW ALARM
  }
  // CLEANUP LOGIC: Reset sub-views when navigating away
  if (page === 'study' && typeof closePremiumSubView === 'function') closePremiumSubView();
  if (page === 'free') {
    if (typeof backToNotesMain === 'function') backToNotesMain();
    if (typeof backToVideosMain === 'function') backToVideosMain();
  }
}

// --- NEW: Modal Control Functions ---
function confirmExitTest() {
  const exitModal = document.getElementById('exit-modal');
  if (exitModal) exitModal.style.display = 'none';
  
  if (pendingNavigation) {
    // 🚨 PERMANENT FIX: If they clicked a nav link, fulfill that navigation!
    document.body.classList.remove('test-mode-active');
    clearInterval(testState.timerInterval);
    testState.finished = true; // Mark as finished so it doesn't trigger intercept again
    navigate(pendingNavigation.page, pendingNavigation.addToHistory, pendingNavigation.keepFreeMode);
    pendingNavigation = null;
  } else {
    // Normal exit behavior (e.g., they clicked the red Exit button)
    showCategories(); 
  }
}

function cancelExitTest() {
  document.getElementById('exit-modal').style.display = 'none';
  
  // If they used the browser back button, we need to artificially fix the URL
  if (pendingNavigation && pendingNavigation.addToHistory === false) {
    history.pushState({ page: currentPage }, '', '#' + currentPage);
  }
  pendingNavigation = null;
}

// --- UPGRADED: Smart Browser Back Button Listener ---
window.addEventListener('popstate', function(event) {
  
  // 1. Check if the Mobile "More" Drawer is open
  const drawer = document.getElementById('mobileDrawer');
  if (drawer && drawer.classList.contains('open')) {
    toggleMobileDrawer(); 
    // 🚀 NEW: Restore the URL so the browser doesn't get confused!
    history.pushState({ page: currentPage, isFree: isFreeMode }, '', '#' + currentPage);
    return; 
  }

  // 🚀 1.5 NEW: Check if the Student Dropdown is open
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown && dropdown.classList.contains('show')) {
    dropdown.classList.remove('show'); // Close the dropdown
    // Artificially restore the URL so the browser doesn't accidentally change the page!
    history.pushState({ page: currentPage, isFree: isFreeMode }, '', '#' + currentPage);
    return; 
  }
  
  // 2. Check if the Mobile Question Palette is open
  const paletteDrawer = document.getElementById('mobile-palette-drawer');
  if (paletteDrawer && paletteDrawer.classList.contains('open')) {
    closeMobilePalette(); 
    return; 
  }

  // 3. THE UNIVERSAL POP-UP CLOSER
  // Finds any modal that is currently open and closes it!
  const openModals = Array.from(document.querySelectorAll('.modal-overlay')).filter(m => m.style.display === 'flex');
  if (openModals.length > 0) {
    openModals.forEach(m => m.style.display = 'none');
    
    // If they pressed back on the "Leave Test" warning, cancel the pending exit
    if (pendingNavigation) {
      pendingNavigation = null;
      // 🚀 BUG FIX: Artificially restore the URL so the browser doesn't get confused!
      history.pushState({ page: currentPage, isFree: isFreeMode }, '', '#' + currentPage);
    }
    return; // Stop here! The back button successfully closed the pop-up.
  }

  // 4. If the screen is completely clear, do normal page navigation!
  if (event.state && event.state.page) {
    const wasFree = event.state.isFree || false;
    navigate(event.state.page, false, wasFree);
  } else {
    navigate('home', false);
  }
});

// ==========================================
// === UNIVERSAL POP-UP & BACKGROUND MANAGER ===
// ==========================================
let lastModalState = false;
const modalObserver = new MutationObserver(() => {
  // Check if ANY modal is currently open
  const openModals = Array.from(document.querySelectorAll('.modal-overlay')).filter(m => m.style.display === 'flex');
  const isModalOpen = openModals.length > 0;
  
  if (isModalOpen && !lastModalState) {
    // A pop-up just opened! Lock the background scroll.
    document.body.style.overflow = 'hidden';
    
    // Trap the browser's Back Button so it closes the pop-up instead of leaving the page
    history.pushState({ modalOpen: true, page: currentPage, isFree: isFreeMode }, '', '#' + currentPage);
  } else if (!isModalOpen && lastModalState) {
    // All pop-ups closed! Unlock the background scroll.
    document.body.style.overflow = '';
  }
  
  lastModalState = isModalOpen;
});

// Feature: Toast Notifications
function showToast(msg) {
  const container = document.getElementById('toast-container');
  if(!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  // Trigger animation slightly after appending
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- SKELETON LOADER FACTORY ---
function getSkeletonGrid(count = 6, type = 'test') {
  let html = '';
  for(let i = 0; i < count; i++) {
    if (type === 'test') {
      html += `
        <div class="skel-card">
          <div class="skeleton skel-icon"></div>
          <div class="skeleton skel-title"></div>
          <div class="skeleton skel-text"></div>
          <div class="skeleton skel-text-short"></div>
        </div>
      `;
    } else if (type === 'note') {
      html += `
        <div class="skel-card" style="align-items: flex-start; text-align: left; height: 160px;">
          <div class="skeleton skel-title" style="margin: 0 0 8px 0; width: 80%;"></div>
          <div class="skeleton skel-text"></div>
          <div class="skeleton skel-text-short" style="margin: 0;"></div>
          <div class="skeleton skel-button"></div>
        </div>
      `;
    } else if (type === 'video') {
      // NEW: Custom skeleton for video thumbnails
      html += `
        <div class="skel-card" style="padding: 0; gap: 0; height: 230px;">
          <div class="skeleton" style="height: 160px; width: 100%; border-radius: var(--radius) var(--radius) 0 0;"></div>
          <div style="padding: 14px 16px;">
            <div class="skeleton skel-title" style="margin: 0 0 8px 0; width: 90%;"></div>
            <div class="skeleton skel-text" style="width: 50%;"></div>
          </div>
        </div>
      `;
    }
  }
  return html;
}

function toggleMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const isOpening = !drawer.classList.contains('open'); // Check if it's opening
  
  drawer.classList.toggle('open');
  document.getElementById('mobileDrawerOverlay').classList.toggle('open');

  // 🚀 NEW: If it's opening on the very first page, trap the back button!
  if (isOpening && !hasNavigated) {
    history.pushState({ page: currentPage, isFree: isFreeMode }, '', '#' + currentPage);
    hasNavigated = true; 
  }
}

// === STUDY TABS ===
function switchTab(tab) {
  // 🚀 FIX: Isolate the tab logic to the Free Content page so it doesn't break the Mock Tests tabs!
  document.querySelectorAll('#page-free .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#page-free .tab-content').forEach(c => c.classList.remove('active'));
  const btn = document.querySelector(`#page-free .tab-btn[onclick*="${tab}"]`);
  const content = document.getElementById('tab-' + tab);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');

  // NEW: Lazy Load PYQs with Skeletons
  if (tab === 'pyqs' && !window.pyqsLoaded) {
    window.pyqsLoaded = true; // Mark as loaded so it doesn't fetch again
    loadPYQsFromSheet(); // Skeletons are handled inside this function now
  }
}
let allQuestions = {}; // This saves downloaded questions so they only load once

let freeQuestionsCache = {
  'free_skt_topic': {},
  'free_skt_full': {},
  'free_p1_full': {},
  'free_p1_topic': {}
};


// === MOCK TEST ENGINE ===
let testState = {
  category: null,
  currentSet: null,
  questions: [],
  current: 0,
  answers: {},
  marked: {},
  timerInterval: null,
  timeLeft: 3600,
  finished: false,
  testName: ''
};

const catNames = {
  // Sanskrit
  paid_skt_full: 'Sanskrit Full Mocks', paid_skt_vedic: 'वैदिकसाहित्यम्', paid_skt_grammar: 'व्याकरणम्', paid_skt_darshan: 'दर्शनम्', paid_skt_sahitya: 'साहित्यम्', paid_skt_other: 'अन्यानि',
  // Bengali
  paid_ben_full: 'Bengali Full Mocks', paid_ben_u1: 'Unit 1: History of Language', paid_ben_u2: 'Unit 2: History of Literature', paid_ben_u3: 'Unit 3: Poetry', paid_ben_u4: 'Unit 4: Fiction', paid_ben_u5: 'Unit 5: Prose', paid_ben_u6: 'Unit 6: Drama', paid_ben_u7: 'Unit 7: Folk Literature', paid_ben_u8: 'Unit 8: Rabindra Sahitya', paid_ben_u9: 'Unit 9: Prosody & Rhetoric', paid_ben_u10: 'Unit 10: Poetics',
  // Philosophy
  paid_phil_full: 'Philosophy Full Mocks', paid_phil_u1: 'Unit 1: Classical Indian', paid_phil_u2: 'Unit 2: Classical Western', paid_phil_u3: 'Unit 3: Indian Ethics', paid_phil_u4: 'Unit 4: Western Ethics', paid_phil_u5: 'Unit 5: Contemporary Indian', paid_phil_u6: 'Unit 6: Recent Western', paid_phil_u7: 'Unit 7: Social & Political (Indian)', paid_phil_u8: 'Unit 8: Social & Political (Western)', paid_phil_u9: 'Unit 9: Logic', paid_phil_u10: 'Unit 10: Applied Ethics',
  // Paper 1
  paid_p1_full: '1st Paper Full sets', paid_p1_topic: '1st Paper Topic-wise',
  // Free
  free_skt_full: 'Free Sanskrit Full Mocks', free_skt_topic: 'Free Sanskrit Topic-wise',
  free_ben_full: 'Free Bengali Full Mocks', free_ben_topic: 'Free Bengali Topic-wise',
  free_phil_full: 'Free Philosophy Full Mocks', free_phil_topic: 'Free Philosophy Topic-wise',
  free_p1_full: 'Free Paper 1 Full Sets', free_p1_topic: 'Free Paper 1 Topic-wise'
};

// 2. THE CENTRAL DATA FETCHER (Upgraded with Smart Decryption & Timeout)
async function fetchQuestions(cat) {
  if (allQuestions[cat]) return true; // Already loaded in memory!

  const targetURL = TEST_DATABASE_URLS[cat];
  if (!targetURL || (typeof targetURL === 'string' && targetURL.includes('PASTE_'))) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); 

    let data = [];
    
    // --- THE SECRET DECRYPTION KEY (Must match Encryptor.html) ---
    const SECRET_KEY = "SanskritVartikaSecure2026!"; 

    // --- NEW ENGINE: Handle Arrays of ENCRYPTED JSON Files ---
    if (Array.isArray(targetURL)) {
      const fetchPromises = targetURL.map(item => {
        const url = (typeof item === 'string') ? item : item.url;
        const tabName = (typeof item === 'string') ? null : item.tabName;

        return fetch(url, { signal: controller.signal })
          .then(res => {
            if (!res.ok) throw new Error("HTTP Error " + res.status); // Protects against 404 missing files
            return res.text();
          }) // Get raw text (Gibberish or JSON)
          .then(textData => {
            let fileData;
            
            try {
              // Attempt 1: Try to decrypt it (Layer 3)
              const bytes = CryptoJS.AES.decrypt(textData, SECRET_KEY);
              const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
              if (!decryptedString) throw new Error("Empty decryption");
              fileData = JSON.parse(decryptedString);
            } catch(e) {
              // Attempt 2 (Smart Fallback): If decryption fails, maybe you forgot to encrypt it!
              // It will parse normal JSON files safely without crashing.
              fileData = JSON.parse(textData);
            }

            // Secretly inject the tab name into the questions
            if (tabName && Array.isArray(fileData)) {
              fileData.forEach(row => {
                if (!row.category && !row.Category) row.category = tabName;
              });
            }
            return fileData;
          })
          .catch(err => {
            // SAFETY NET: If one file breaks, log the error but don't crash the whole app!
            console.error(`Failed to load ${tabName}:`, err);
            return []; // Return an empty array so Promise.all keeps running
          });
      });
      
      const allResults = await Promise.all(fetchPromises);
      clearTimeout(timeoutId);
      
      // Glue all the separate files into one massive data list
      allResults.forEach(fileData => {
        if (Array.isArray(fileData)) data = data.concat(fileData);
      });

    } else {
      // --- OLD ENGINE: Handle single Google Sheet URL ---
      const response = await fetch(targetURL, { signal: controller.signal });
      clearTimeout(timeoutId);
      const textData = await response.text();
      data = JSON.parse(textData);
    }

    allQuestions[cat] = {};

    // Build the Grid System for the UI
    data.forEach(row => {
      const originalSet = String(row.set || row.Set || "1").trim();
      const questionText = row.question || row.Question;
      let sheetName = String(row.category || row.Category || "").trim();
      sheetName = sheetName.charAt(0).toUpperCase() + sheetName.slice(1);

      // 🚀 NEW: Dynamic Naming Engine!
      let setKey;
      const isFullSet = cat.includes('full'); // Automatically detects 'paid_skt_full', 'paid_p1_full', etc.

      if (isFullSet) {
        // RULE 1: If Full Set -> Use ONLY the Tab Name (e.g., "Set- 1")
        if (sheetName && !sheetName.toLowerCase().startsWith('sheet')) {
          setKey = sheetName;
        } else {
          setKey = "Set " + originalSet; // Fallback if tab is blank
        }
      } else {
        // RULE 2: If Topic Set -> Use "Tab Name - Set Number" (e.g., "ऋग्वेदः - Set 1")
        if (sheetName && !sheetName.toLowerCase().startsWith('sheet')) {
          setKey = sheetName + " - Set " + originalSet;
        } else {
          setKey = "Set " + originalSet;
        }
      }

      if (questionText) {
        if (!allQuestions[cat][setKey]) allQuestions[cat][setKey] = [];

        let rawAns = String(row.answer || row.Answer || "1").trim().toUpperCase();
        let convertedAns = 0;
        if (rawAns === "A" || rawAns === "1") convertedAns = 0;
        else if (rawAns === "B" || rawAns === "2") convertedAns = 1;
        else if (rawAns === "C" || rawAns === "3") convertedAns = 2;
        else if (rawAns === "D" || rawAns === "4") convertedAns = 3;
        else convertedAns = Math.max(0, Number(rawAns) - 1);

        const groupId = String(row.groupid || row.GroupID || row.group || "").trim();
        
        allQuestions[cat][setKey].push({
          q: questionText,
          options: [row.opta || row.opt0 || "A", row.optb || row.opt1 || "B", row.optc || row.opt2 || "C", row.optd || row.opt3 || "D"],
          answer: convertedAns,
          explanation: row.explanation || "",          
          groupId: groupId
        });
      }
    });
    return true;
  } catch (error) { 
    if (error.name === 'AbortError') {
      console.warn("Connection timed out. Took longer than 30 seconds.");
    } else {
      console.error("Fetch error:", error); 
    }
    return false; 
  }
}

// --- NEW: THE UNIVERSAL ACCESS ENGINE ---
function hasAccess(requiredPass) {
  if (!currentUser || !currentUser.dbData || !currentUser.dbData.passes) return false; 
  
  const passes = currentUser.dbData.passes;
  const now = new Date();

  const isValid = (passDateStr) => {
    if (!passDateStr) return false;
    return new Date(passDateStr) > now;
  };

  // 🚀 DYNAMIC ROUTING: If clicking a core test, map the lock to their specific core subject pass!
  if (requiredPass === 'core') {
    return isValid(passes[currentCoreSubject]);
  }
  
  if (requiredPass === 'general') {
    return isValid(passes.general);
  }
  if (requiredPass === 'batch') {
    return isValid(passes.batch);
  }
  
  return false; 
}

// Dynamically adds or removes the lock icon based on the specific card's requirement
function updateTestCardLocks() {
  // UPGRADED: Now targets ANY card with a data-req attribute (including AI cards)
  const cards = document.querySelectorAll('.test-cat-card[data-req]');
  
  cards.forEach(card => {
    const reqPass = card.getAttribute('data-req');
    if (hasAccess(reqPass)) {
      card.classList.remove('locked-card');
    } else {
      card.classList.add('locked-card');
    }
  });
}
// ==========================================
// === PREMIUM STUDY HUB ENGINE ===
// ==========================================
function openPremiumSubView(type) {
  // 🚀 FIX: Catch guests before checking locks!
  if (!currentUser) {
    showToast("⚠️ Please create a free account to unlock practice tests!");
    showAuthModal('signup');
    return;
  }

  let reqPass = 'core'; 
  if (type === 'paper1') reqPass = 'general';
  if (type === 'batch') reqPass = 'batch';

  if (!hasAccess(reqPass)) {
    document.getElementById('premium-lock-modal').style.display = 'flex';
    return;
  }

  document.getElementById('study-hub-gateway').style.display = 'none';
  const subView = document.getElementById('study-sub-view');
  subView.style.display = 'block';

  // Trigger the smooth slide-up animation
  subView.classList.remove('fade-in-up');
  void subView.offsetWidth; 
  subView.classList.add('fade-in-up');

  const grid = document.getElementById('study-sub-grid');
  const title = document.getElementById('study-sub-title');
  
  grid.innerHTML = ''; // Clear previous

  if (type === 'batch') {
    title.textContent = "Net Class";
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: var(--cream); border-radius: var(--radius); border: 2px dashed var(--saffron);">
        <div style="font-size: 3rem; margin-bottom: 16px;">🚧</div>
        <h3 style="color: var(--brown); margin-bottom: 8px;">Live Classes Coming Soon!</h3>
        <p style="color: var(--text-mid);">We are setting up the live streaming and PDF infrastructure for the Complete Batch.</p>
      </div>
    `;
  } else {
    // 🚀 THE CLONE ENGINE!
    // Grab cards directly from the Mock Tests section so you never have to duplicate HTML!
    const premiumTestSection = document.getElementById('Premium-test-section');
    let cardsToClone = [];
    
    if (type === 'paper1') {
      title.textContent = "1st Paper Tests";
      cardsToClone = premiumTestSection.querySelectorAll('.test-cat-card[data-req="general"]');
    } else if (type === 'core') {
      title.textContent = `${CORE_SUBJECTS[currentCoreSubject].name} Tests`;
      cardsToClone = premiumTestSection.querySelectorAll(`.test-cat-card[data-req="core"][data-subject-group="${currentCoreSubject}"]`);
    }

    cardsToClone.forEach(card => {
      const clone = card.cloneNode(true);
      // Ensure cloned card is visible even if it was hidden in the main view
      clone.style.display = ''; 
      grid.appendChild(clone);
    });
  }
}

function closePremiumSubView() {
  const subView = document.getElementById('study-sub-view');
  const gateway = document.getElementById('study-hub-gateway');
  if (subView) subView.style.display = 'none';
  if (gateway) gateway.style.display = 'grid';
}

// Standard Mock Test Loader (For Paid/Main Portal)
async function showSets(cat) {
  // 1. SCENARIO A: No Account (Guest) -> Prompt Sign Up
  if (!currentUser) {
    showToast("⚠️ Please create a free account to unlock practice tests!");
    showAuthModal('signup'); // Opens modal perfectly synced to Sign Up
    return; 
  }

  // 2. SCENARIO B: Logged in, but Missing the Required Pass -> Prompt Upgrade
  const reqPass = (cat === 'paid_p1_full' || cat === 'paid_p1_topic') ? 'general' : 'core'; // 🚀 FIX: Was 'sanskrit'
  if (!hasAccess(reqPass)) {
    document.getElementById('premium-lock-modal').style.display = 'flex';
    return; 
  }

  // 3. SCENARIO C: VIP Access Granted -> Load Tests!
  
  // Hide other screens and show the sets grid to make room for Skeletons
  document.getElementById('test-categories').style.display = 'none';
  document.getElementById('test-interface').style.display = 'none';
  document.getElementById('test-results').style.display = 'none';
  
  // NEW: Hide the Study Sub-View if they launched from the Study Hub!
  const studySubView = document.getElementById('study-sub-view');
  if (studySubView) studySubView.style.display = 'none';

  
  const setsView = document.getElementById('test-sets-view');
  setsView.style.display = 'block';
  window.scrollTo(0, 0);
  setsView.scrollTop = 0; // 🚀 UX FIX: Always start grid at the top!

  // 🚀 FIX: Ensure the descriptive text is visible for normal tests!
  const setsDesc = document.querySelector('#test-sets-view p');
  if (setsDesc) setsDesc.style.display = 'block';

  // INJECT THE SKELETONS
  const grid = document.getElementById('sets-grid');
  grid.innerHTML = getSkeletonGrid(6, 'test');
  document.getElementById('sets-category-title').textContent = "Loading Practice Sets...";

  // 🚀 FIX: Instantly hide the old filter while the new test loads!
  const filterEl = document.getElementById('sets-filter');
  if (filterEl) {
    filterEl.style.display = 'none';
    filterEl.innerHTML = '<option value="all">Loading...</option>';
  }

  // Fetch data + smooth 400ms artificial delay for a premium feel
  const [success] = await Promise.all([fetchQuestions(cat), new Promise(r => setTimeout(r, 400))]);
  
  // 🚀 BUG FIX: If the user clicked "Back" while loading, silently abort!
  if (document.getElementById('test-sets-view').style.display === 'none') return;

  if (success) {
    renderSetsUI(cat);
  } else {
    showToast(`The database for ${catNames[cat]} could not be loaded.`);
    showCategories(); // Go back if failed
  }
}



// --- UPGRADED SMART ENGINE: The Free Services Loader ---
async function openFreeSets(mode) {
  isFreeMode = true; 

  if(document.getElementById('back-to-cat-btn')) {
      document.getElementById('back-to-cat-btn').textContent = '← Back to Free Services';
  }

  document.getElementById('page-free').classList.remove('active');
  document.getElementById('test-sets-view').style.display = 'block';
   
  // 🚀 SKELETON UI PREP
  document.getElementById('sets-filter').style.display = 'none'; 
  const setsDesc = document.querySelector('#test-sets-view p');
  if (setsDesc) setsDesc.style.display = 'none'; // Hide text during skeleton loading
  
  window.scrollTo(0,0);

  const modeConfigs = {
    'free_skt_full': { title: "Free Sanskrit Full Mocks", catTitle: catNames['free_skt_full'], descFallback: "Complete 100-question mock test" },
    'free_skt_topic': { title: "Free Sanskrit Topic-wise", catTitle: catNames['free_skt_topic'], descFallback: "Subject-specific practice" },
    'free_ben_full': { title: "Free Bengali Full Mocks", catTitle: catNames['free_ben_full'], descFallback: "Complete 100-question mock test" },
    'free_ben_topic': { title: "Free Bengali Topic-wise", catTitle: catNames['free_ben_topic'], descFallback: "Subject-specific practice" },
    'free_phil_full': { title: "Free Philosophy Full Mocks", catTitle: catNames['free_phil_full'], descFallback: "Complete 100-question mock test" },
    'free_phil_topic': { title: "Free Philosophy Topic-wise", catTitle: catNames['free_phil_topic'], descFallback: "Subject-specific practice" },
    'free_p1_full': { title: "Free Paper 1 Full Sets", catTitle: catNames['free_p1_full'], descFallback: "Complete 50-question mock test" },
    'free_p1_topic': { title: "Free Paper 1 Topic-wise", catTitle: catNames['free_p1_topic'], descFallback: "General Paper 1 practice" }
  };

  const config = modeConfigs[mode];
  document.getElementById('sets-category-title').textContent = "Loading Free Sets...";
  
  const grid = document.getElementById('sets-grid');
  
  // 🚀 INJECT SKELETONS
  grid.innerHTML = getSkeletonGrid(6, 'test'); 
  
  // Disable the old loading spinner since we have skeletons now
  const loading = document.getElementById('loading-overlay');
  if (loading) loading.style.display = 'none';

  try {
    let availableSets = freeQuestionsCache[mode];
    
    // 🚀 Premium 400ms delay to allow skeletons to breathe smoothly
    const delayPromise = new Promise(r => setTimeout(r, 400));
    let fetchPromise = Promise.resolve();

    if (!availableSets || Object.keys(availableSets).length === 0) {
      let fetchUrl = FREE_DATABASE_URLS[mode]; 
      fetchPromise = fetch(fetchUrl).then(res => res.json());
    }
    
    // Wait for both the fetch (if needed) AND the 400ms delay to finish
    const [data] = await Promise.all([fetchPromise, delayPromise]);
    
    // 🚀 BUG FIX: If the user clicked "Back" while loading, silently abort!
    if (document.getElementById('test-sets-view').style.display === 'none') return;
    
    if (data) {
      availableSets = {};
      
      data.forEach(item => {
        // 🚀 BULLETPROOF DATA EXTRACTION
        let setNum = String(item['Set Number'] || item['set number'] || item['Set'] || item['set'] || "1").trim();
        let topicName = String(item['Category'] || item['category'] || item['Topic'] || item['topic'] || "").trim();
        let tabName = String(item['Tab Name'] || item['tab name'] || item['tabName'] || "").trim();
        
        // Auto-capitalization (safeguarded for English text only)
        if(topicName && /^[a-zA-Z]/.test(topicName)) topicName = topicName.charAt(0).toUpperCase() + topicName.slice(1);
        if(tabName && /^[a-zA-Z]/.test(tabName)) tabName = tabName.charAt(0).toUpperCase() + tabName.slice(1);
        
        let setKey;
        let displayDesc;

        // ==========================================
        // 🎯 RULE 1: Free Full Sets -> Exactly the Tab Name 
        // ==========================================
        if (mode === 'free_p1_full' || mode === 'free_skt_full') {
          if (tabName && !tabName.toLowerCase().startsWith('sheet')) {
            setKey = tabName;
            displayDesc = tabName;
          } else {
            setKey = "Set " + setNum; // Fallback
            displayDesc = config.descFallback;
          }
        } 
        // ==========================================
        // 🎯 RULE 2: Paper 1 Topic -> "Tab Name - Set Number"
        // ==========================================
        else if (mode === 'free_p1_topic') {
          if (tabName && !tabName.toLowerCase().startsWith('sheet')) {
            setKey = tabName + " - Set " + setNum;
            displayDesc = tabName;
          } else {
            setKey = "Set " + setNum; // Fallback
            displayDesc = config.descFallback;
          }
        }
        // ==========================================
        // 🎯 RULE 3: Sanskrit Topic -> "Topic Column - Set Number"
        // ==========================================
        else if (mode === 'free_skt_topic') {
          if (topicName) {
            setKey = topicName + " - Set " + setNum;
          } else {
            setKey = "Set " + setNum; // Fallback
          }
          // Subheader explicitly uses the Tab Name
          displayDesc = (tabName && !tabName.toLowerCase().startsWith('sheet')) ? tabName : config.descFallback;
        }

        // Initialize the grouping container if it's the first question
        if (!availableSets[setKey]) {
          availableSets[setKey] = { desc: displayDesc, questions: [] };
        }
        
        // 🛡️ Safe Question Parsing
        const questionText = item['Question'] || item['question'] || item['q'] || "";
        
        if (questionText) {
          let rawAns = String(item['Correct Option'] || item['correct option'] || item['answer'] || item['Answer'] || "1").trim().toUpperCase();
          let convertedAns = 0;
          if (rawAns === "A" || rawAns === "1") convertedAns = 0;
          else if (rawAns === "B" || rawAns === "2") convertedAns = 1;
          else if (rawAns === "C" || rawAns === "3") convertedAns = 2;
          else if (rawAns === "D" || rawAns === "4") convertedAns = 3;
          else convertedAns = Math.max(0, Number(rawAns) - 1);

          availableSets[setKey].questions.push({
            q: questionText,
            options: [
              item['Option A'] || item['Option a'] || item['Option 1'] || item['option 1'] || item['opta'] || item['opt0'] || item['A'] || item['a'] || "A", 
              item['Option B'] || item['Option b'] || item['Option 2'] || item['option 2'] || item['optb'] || item['opt1'] || item['B'] || item['b'] || "B", 
              item['Option C'] || item['Option c'] || item['Option 3'] || item['option 3'] || item['optc'] || item['opt2'] || item['C'] || item['c'] || "C", 
              item['Option D'] || item['Option d'] || item['Option 4'] || item['option 4'] || item['optd'] || item['opt3'] || item['D'] || item['d'] || "D"
            ],
            answer: convertedAns,
            // Bonus: Added extra fallbacks for the Explanation column just in case!
            explanation: item['Explanation'] || item['explanation'] || item['Exp'] || item['exp'] || "",
            groupId: String(item['groupid'] || item['GroupID'] || item['group'] || "").trim() 
          });
        }
      });

      freeQuestionsCache[mode] = availableSets;
    }

    // 🚀 Restore UI text
    document.getElementById('sets-category-title').textContent = config.title;
    if (setsDesc) setsDesc.style.display = 'block';

    let history = (currentUser && currentUser.dbData && currentUser.dbData.history) ? currentUser.dbData.history : [];
    
    // 🚀 BUG FIX: Merge local storage history so Free Tests get their green checkmarks!
    try {
      const localHistory = JSON.parse(localStorage.getItem('vartika_free_history') || '[]');
      history = history.concat(localHistory);
    } catch(e) {}

    // Clear Skeletons
    grid.innerHTML = '';
    
    if (Object.keys(availableSets).length === 0) {
       grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">No sets available for this topic yet. Please check back later!</p>';
       return;
    }

    // 🚀 BONUS: Filter Dropdown logic brought over to the Free section!
    const filterEl = document.getElementById('sets-filter');
    let uniqueTopics = new Set();
    Object.keys(availableSets).forEach(setKey => {
      let topic = setKey.includes(' - Set') ? setKey.split(' - Set')[0] : 'General';
      uniqueTopics.add(topic);
    });

    if (filterEl) {
      if (uniqueTopics.size > 1) {
        filterEl.style.display = 'block';
        let filterHTML = '<option value="all">All Topics</option>';
        Array.from(uniqueTopics).sort().forEach(t => {
          filterHTML += `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`;
        });
        filterEl.innerHTML = filterHTML;
      } else {
        filterEl.style.display = 'none';
      }
    }

    Object.keys(availableSets).forEach(setKey => {
      const setObj = availableSets[setKey];
      
      // Safety check: Skip empty tests
      if (setObj.questions.length === 0) return;

      if (!allQuestions[mode]) allQuestions[mode] = {};
      allQuestions[mode][setKey] = setObj.questions;
      
      const exactTestName = config.catTitle + " - " + setKey;
      const isCompleted = history.some(h => h.name === exactTestName);
      const checkmark = isCompleted ? '<div style="position:absolute; top:12px; right:12px; background:#4CAF50; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem;">✓</div>' : '';

      let topic = setKey.includes(' - Set') ? setKey.split(' - Set')[0] : 'General';

      grid.innerHTML += `
        <div class="test-cat-card" data-topic="${escapeHTML(topic)}" style="border: ${isCompleted ? '2px solid #4CAF50' : '2px solid transparent'}" onclick="promptStartTest('${mode}', '${setKey}')">
          ${checkmark}
          <div class="test-cat-icon">🎁</div>
          <h3 style="font-size:1.05rem;">${setKey}</h3>
          <p style="font-family: var(--font-skt); font-size: 0.9rem;">${setObj.desc}</p>
          <span class="q-count">${setObj.questions.length} Questions</span>
        </div>
      `;
    });

  } catch(err) {
    console.error(err);
    document.getElementById('sets-category-title').textContent = config.title;
    grid.innerHTML = '<p style="color:#D32F2F; text-align:center; grid-column:1/-1;">Error loading free tests. Please check your internet connection.</p>';
  }
}

// 3. THE UI RENDERER: Builds the grid of Sets after data is loaded
function renderSetsUI(cat) {

  isFreeMode = false;
if(document.getElementById('back-to-cat-btn')) {
    document.getElementById('back-to-cat-btn').textContent = (currentPage === 'study') ? '← Back to Study Hub' : '← Back to Categories';
  }

  document.getElementById('test-categories').style.display = 'none';
  document.getElementById('test-interface').style.display = 'none';
  document.getElementById('test-results').style.display = 'none';
  
  const setsView = document.getElementById('test-sets-view');
  setsView.style.display = 'block';
  window.scrollTo(0, 0);

  // 🚀 FIX: Ensure the descriptive text is visible for normal tests!
  const setsDesc = document.querySelector('#test-sets-view p');
  if (setsDesc) setsDesc.style.display = 'block';
  
  const catTitle = catNames[cat] || cat;
  document.getElementById('sets-category-title').textContent = catTitle + " — Practice Sets";
  
  const grid = document.getElementById('sets-grid');
  grid.innerHTML = '';
  
  const categoryData = allQuestions[cat];
  
  const filterEl = document.getElementById('sets-filter'); // Grab the filter element

  if (!categoryData || Object.keys(categoryData).length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">No sets available for this topic yet. Please check back later!</p>';
    filterEl.style.display = 'none';
    return;
  }

  const history = (currentUser && currentUser.dbData && currentUser.dbData.history) ? currentUser.dbData.history : [];

  // 🚀 NEW: Auto-Extract Unique Tab Names!
  let uniqueTopics = new Set();
  Object.keys(categoryData).forEach(setKey => {
    let topic = setKey.includes(' - Set') ? setKey.split(' - Set')[0] : 'General';
    uniqueTopics.add(topic);
  });

  // 🚀 NEW: Populate the Dropdown (Only show it if there is more than 1 topic!)
  if (uniqueTopics.size > 1) {
    filterEl.style.display = 'block';
    let filterHTML = '<option value="all">All Topics</option>';
    Array.from(uniqueTopics).sort().forEach(t => {
      filterHTML += `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`;
    });
    filterEl.innerHTML = filterHTML;
  } else {
    filterEl.style.display = 'none';
  }

  Object.keys(categoryData).forEach(setKey => {
    const qCount = categoryData[setKey].length;
    const displayTitle = setKey;
    const exactTestName = catTitle + " - " + displayTitle;
    let topic = setKey.includes(' - Set') ? setKey.split(' - Set')[0] : 'General';

    const isCompleted = history.some(h => h.name === exactTestName);
    const checkmark = isCompleted ? '<div style="position:absolute; top:12px; right:12px; background:#4CAF50; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem;">✓</div>' : '';

    // 🚀 NEW: Attach data-topic to the card!
    const cardHTML = `
      <div class="test-cat-card" data-topic="${escapeHTML(topic)}" style="border: ${isCompleted ? '2px solid #4CAF50' : '2px solid transparent'}" onclick="promptStartTest('${cat}', '${setKey}')">
        ${checkmark}
        <div class="test-cat-icon">📑</div>
        <h3 style="font-size:1.05rem;">${displayTitle}</h3>
        <p>${catTitle}</p>
        <span class="q-count">${qCount} Questions</span>
      </div>
    `;
    grid.innerHTML += cardHTML;
  });
}

// --- UPGRADED SMART LOGIC: The "Lock-in-Place" Shuffler ---
function shuffleQuestions(array) {
  const result = new Array(array.length); // Create an empty grid of the same size
  const shufflable = [];

  // 1. Find the anchored questions and lock them into their original seats
  array.forEach((q, index) => {
    if (q.groupId) {
      // If it has a GroupID, freeze it exactly where it was in the Google Sheet!
      result[index] = q; 
    } else {
      // If it's a normal question, put it in the shuffling hat
      shufflable.push(q);
    }
  });

  // 2. Vigorously shuffle the normal questions
  for (let i = shufflable.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shufflable[i], shufflable[j]] = [shufflable[j], shufflable[i]];
  }

  // 3. Drop the shuffled questions back into the empty slots around the locked ones
  let shuffleIndex = 0;
  for (let i = 0; i < result.length; i++) {
    if (result[i] === undefined) {
      result[i] = shufflable[shuffleIndex];
      shuffleIndex++;
    }
  }

  return result;
}

// --- UPDATED LOGIC: Start a specific set ---
function startTest(cat, setKey) {
  testState.category = cat;
  testState.currentSet = setKey;
  testState.questions = shuffleQuestions(allQuestions[cat][setKey] || []);
  testState.current = 0;
  testState.answers = {};
  testState.marked = {};
  testState.finished = false;
  
  // --- NEW DYNAMIC TIMER LOGIC ---
  // Calculates 72 seconds (1.2 minutes) per question
  const totalQuestions = testState.questions.length;
  const totalSeconds = totalQuestions * 72;
  testState.timeLeft = totalSeconds; 
  
  // --- NEW TEST NAMING LOGIC ---
  const catTitle = catNames[cat] || cat;
  const displayTitle = setKey;
  testState.testName = catTitle + " - " + displayTitle;

  document.body.classList.add('test-mode-active'); // Enter immersive mode!
  
  document.getElementById('test-sets-view').style.display = 'none';
  
  const testInterface = document.getElementById('test-interface');
  testInterface.style.display = 'block';
  window.scrollTo(0, 0);
  testInterface.scrollTop = 0; // 🚀 NEW FIX: Start question 1 at the absolute top!
  
  document.getElementById('test-title').textContent = displayTitle;
  
  // Calculates the minutes to show on the subtitle (e.g., 10 questions = 12 Minutes)
  const displayMinutes = Math.ceil(totalSeconds / 60);
  document.getElementById('test-subtitle').textContent = totalQuestions + ' Questions • ' + displayMinutes + ' Minutes';

  buildPalette();
  renderQuestion();
  startTimer();
}

function startTimer() {
  clearInterval(testState.timerInterval);
  updateTimerDisplay();
  testState.timerInterval = setInterval(() => {
    testState.timeLeft--;
    updateTimerDisplay();
    if (testState.timeLeft <= 0) {
      clearInterval(testState.timerInterval);
      showResults();
    }
  }, 1000);
}

function updateTimerDisplay() {
  // 1. Calculate the total original test time (72 seconds per question)
  const totalTestSeconds = testState.questions.length * 72;

  // 2. Calculate Hours, Minutes, and Seconds
  const h = Math.floor(testState.timeLeft / 3600);
  const m = Math.floor((testState.timeLeft % 3600) / 60);
  const s = testState.timeLeft % 60;
  
  const el = document.getElementById('test-timer');
  
  // 3. SMART FORMATTING: Hide the hour block if the total test is under 1 hour
  if (totalTestSeconds < 3600) {
    // Shows MM:SS (e.g., 12:05)
    el.textContent = String(m).padStart(2,'0') + ':' + 
                     String(s).padStart(2,'0');
  } else {
    // Shows HH:MM:SS (e.g., 01:30:45)
    el.textContent = String(h).padStart(2,'0') + ':' + 
                     String(m).padStart(2,'0') + ':' + 
                     String(s).padStart(2,'0');
  }
                   
  // Turns red when less than 5 minutes (300 seconds) remain
  el.classList.toggle('warning', testState.timeLeft < 300);
}

// FIXED: Added "keepScroll" memory so it doesn't jump when selecting an option!
function renderQuestion(keepScroll = false) {
  const qs = testState.questions;
  const idx = testState.current;
  const q = qs[idx];
  if (!q) return;
  
  // Auto-scroll to top ONLY if we are moving to a brand new question
  if (keepScroll === false) {
    const scrollArea = document.getElementById('test-scroll-area');
    if (scrollArea) scrollArea.scrollTop = 0; // Fixes Desktop
    
    // 🚀 NEW FIX: Scroll the actual mobile overlay container to the top!
    const testOverlay = document.getElementById('test-interface');
    if (testOverlay) testOverlay.scrollTop = 0; 
    
    if (window.innerWidth <= 900) window.scrollTo(0, 0); // Failsafe
  }

  // The question text itself is already safely handled!
  document.getElementById('q-number').textContent = `Question ${idx+1} of ${qs.length}`;
  // 🔒 SECURE FIX: Wash the question text before rendering!
  document.getElementById('q-text').innerHTML = DOMPurify.sanitize(q.q); 

  const optList = document.getElementById('options-list');
  optList.innerHTML = '';
  
  q.options.forEach((opt, i) => {
    const div = document.createElement('div');
    div.className = 'option-item' + (testState.answers[idx] === i ? ' selected' : '');
    
    // --- NEW SAFE CODE: Build elements securely instead of injecting raw HTML ---
    const labelDiv = document.createElement('div');
    labelDiv.className = 'option-label';
    labelDiv.textContent = String.fromCharCode(65 + i); // Safely sets A, B, C, or D
    
    const textDiv = document.createElement('div');
    // 🔒 SECURE FIX: Wash the options before rendering!
    textDiv.innerHTML = DOMPurify.sanitize(opt);

    div.appendChild(labelDiv);
    div.appendChild(textDiv);
    // --------------------------------------------------------------------------

    div.onclick = () => selectOption(i);
    optList.appendChild(div);
  });

  document.getElementById('explanation-box').classList.remove('visible');
  document.getElementById('explanation-box').innerHTML = '';

  const markBtn = document.getElementById('mark-btn');
  const isMarked = !!testState.marked[idx];
  markBtn.classList.toggle('marked', isMarked);
  markBtn.innerHTML = isMarked ? '✅ Marked' : '🔖 Mark';

  const nextBtn = document.getElementById('next-btn');
  if (idx === qs.length - 1) {
    nextBtn.textContent = 'Submit ✓';
    nextBtn.className = 'nav-test-btn btn-submit';
    nextBtn.onclick = showResults;
  } else {
    nextBtn.textContent = 'Next ▶';
    nextBtn.className = 'nav-test-btn btn-next';
    nextBtn.onclick = nextQuestion;
  }

  updatePalette();
}

function selectOption(i) {
  if (testState.finished) return;
  const idx = testState.current;
  
  // If the user clicks the currently selected option, deselect it (leave blank)
  if (testState.answers[idx] === i) {
    testState.answers[idx] = undefined;
  } else {
    // Otherwise, select the new option
    testState.answers[idx] = i;
  }
  
  // FIXED: Tell the renderer to keep the scroll position exactly where it is!
  renderQuestion(true); 
}

function nextQuestion() {
  if (testState.current < testState.questions.length - 1) {
    testState.current++;
    renderQuestion();
  }
}
function prevQuestion() {
  if (testState.current > 0) {
    testState.current--;
    renderQuestion();
  }
}
function toggleMark() {
  const idx = testState.current;
  testState.marked[idx] = !testState.marked[idx];

  const markBtn = document.getElementById('mark-btn');
  const isMarked = testState.marked[idx];
  markBtn.classList.toggle('marked', isMarked);
  markBtn.innerHTML = isMarked ? '✅ Marked' : '🔖 Mark';

  updatePalette();
}

function buildPalette() {
  const grid = document.getElementById('palette-grid');
  grid.innerHTML = '';
  testState.questions.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'palette-item';
    btn.id = 'pal-' + i;
    btn.textContent = i + 1;
    btn.onclick = () => { 
      testState.current = i; 
      renderQuestion(); 
      closeMobilePalette(); // Auto-close drawer on mobile
    };
    grid.appendChild(btn);
  });
}
function updatePalette() {
  testState.questions.forEach((_, i) => {
    const el = document.getElementById('pal-' + i);
    if (!el) return;

    // Reset classes
    el.className = 'palette-item';

    // Determine exact status
    const hasAnswer = testState.answers[i] !== undefined;
    const isMarked = testState.marked[i];

    if (hasAnswer && isMarked) {
      el.classList.add('answered-marked'); // Purple with Green Dot
    } else if (isMarked) {
      el.classList.add('marked'); // Pure Purple
    } else if (hasAnswer) {
      el.classList.add('answered'); // Pure Orange
    }

    if (i === testState.current) el.classList.add('current');
  });
}

// --- MOBILE SLIDE-UP PALETTE ---
function toggleMobilePalette() {
  document.getElementById('mobile-palette-drawer').classList.toggle('open');
  document.body.classList.toggle('palette-open');
}
function closeMobilePalette() {
  document.getElementById('mobile-palette-drawer').classList.remove('open');
  document.body.classList.remove('palette-open');
}

// Feature: Test Summary Warning
function showResults() {
  if(typeof closeMobilePalette === 'function') closeMobilePalette(); // FIX: Prevent modal trap

  let unanswered = 0;
  testState.questions.forEach((_, i) => { if (testState.answers[i] === undefined) unanswered++; });

  if (unanswered > 0 && !testState.finished && testState.timeLeft > 0) {
    document.getElementById('submit-modal-text').innerHTML = `You have <strong>${unanswered} unanswered</strong> questions left.<br>Are you sure you want to submit?`;
    document.getElementById('submit-modal').style.display = 'flex';
    return;
  }
  document.body.classList.remove('test-mode-active'); // Exit immersive mode
  confirmSubmit();

  // 🚀 BUSINESS LOGIC FIX: Hide the "Retake" button for AI Boosters to protect limits!
  const retakeBtn = document.querySelector('[onclick="retakeTest()"]');
  if (retakeBtn) {
    retakeBtn.style.display = (testState.category === 'ai_booster') ? 'none' : 'inline-block';
  }
}

function confirmSubmit() {
// Hide the warning modal!
  document.getElementById('submit-modal').style.display = 'none';
  document.body.classList.remove('test-mode-active'); // FIX: Stop the Results Page Glitch!

  clearInterval(testState.timerInterval);
  testState.finished = true;

  document.getElementById('test-interface').style.display = 'none';
  
  const testResults = document.getElementById('test-results');
  testResults.style.display = 'block';
  window.scrollTo(0, 0);
  testResults.scrollTop = 0; // 🚀 NEW FIX: Jumps the Results overlay to the top!

  document.getElementById('results-test-name').textContent = testState.testName;

  const qs = testState.questions;
  let correct = 0, wrong = 0, skipped = 0;
  qs.forEach((q, i) => {
    if (testState.answers[i] === undefined) skipped++;
    else if (testState.answers[i] === q.answer) correct++;
    else wrong++;
  });

  const pct = Math.round((correct / qs.length) * 100);

  // === NEW: GOOGLE ANALYTICS MACRO TRACKING ===
  if (typeof gtag === 'function') {
    const tName = testState.testName || "";
    
    // 1. Detect if it is a Free or Premium test
    const testType = tName.includes("Free") ? "Free" : "Premium";

    // 2. The Categorizer: Figure out the broad subject
    let subjectGroup = "Other Topics";
    
    // 🚀 GA4 DATA FIX: Now catches ALL 10 Units for Bengali & Philosophy!
    if (tName.includes("Full")) subjectGroup = "Full Mocks";
    else if (tName.includes("Unit")) subjectGroup = "Unit Wise Practice"; // Catches Ben/Phil Units!
    else if (tName.includes("वैदिकसाहित्यम्")) subjectGroup = "Vedic Sahitya";
    else if (tName.includes("व्याकरणम्")) subjectGroup = "Grammar";
    else if (tName.includes("दर्शनम्")) subjectGroup = "Darshan";
    else if (tName.includes("साहित्यम्")) subjectGroup = "Sahitya";
    else if (tName.includes("अन्यानि")) subjectGroup = "Anyani";
    else if (tName.includes("1st Paper") || tName.includes("Paper 1")) subjectGroup = "Paper 1";

    // 3. Send all data layers to GA4
    gtag('event', 'mock_test_completed', {
      'test_subject': subjectGroup,      
      'test_name': tName,                
      'test_type': testType,             
      'score_percentage': pct
    });
  }
  // ==========================================
  document.getElementById('score-num').textContent = correct + '/' + qs.length;
  const scoreCircle = document.getElementById('score-circle');
  scoreCircle.style.setProperty('--pct', pct + '%');

  document.getElementById('results-stats').innerHTML = `
    <div class="stat-box"><span class="val" style="color:#4CAF50">${correct}</span><span class="key">Correct</span></div>
    <div class="stat-box"><span class="val" style="color:#F44336">${wrong}</span><span class="key">Wrong</span></div>
    <div class="stat-box"><span class="val" style="color:#9E9E9E">${skipped}</span><span class="key">Skipped</span></div>
    <div class="stat-box"><span class="val" style="color:var(--saffron)">${pct}%</span><span class="key">Score</span></div>
  `;

  let reviewHTML = '<h3>Detailed Review</h3>';
  qs.forEach((q, i) => {
    const userAns = testState.answers[i];
    let cls = 'skipped-ans';
    let status = '⬜ Skipped';
    if (userAns !== undefined) {
      cls = userAns === q.answer ? 'correct-ans' : 'wrong-ans';
      status = userAns === q.answer ? '✅ Correct' : '❌ Wrong';
    }
    // Check if question is already saved in the Cloud
    let savedQs = (currentUser && currentUser.dbData && currentUser.dbData.saved_qs) ? currentUser.dbData.saved_qs : [];
    const isSaved = savedQs.some(sq => sq.q === q.q);
    const btnText = isSaved ? '⭐ Saved' : '☆ Save';
    const btnStyle = isSaved ? 'color:var(--saffron);' : 'color:var(--text-light);';

    reviewHTML += `
      <div class="review-item ${cls}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
          <div class="review-q">Q${i+1}. ${DOMPurify.sanitize(q.q)}</div>
          <div style="display:flex; gap:8px;">
            <button onclick="openReportModal(${i})" style="background:var(--white); border:1px solid #F44336; border-radius:50px; padding:4px 10px; cursor:pointer; font-weight:600; font-size:0.75rem; transition:0.2s; white-space:nowrap; color:#F44336;" title="Report a mistake in this question">🚩 Report</button>
            <button id="save-btn-${i}" onclick="toggleSaveQuestion(${i})" style="background:var(--white); border:1px solid var(--cream-dark); border-radius:50px; padding:4px 10px; cursor:pointer; font-weight:600; font-size:0.75rem; transition:0.2s; white-space:nowrap; ${btnStyle}">${btnText}</button>
          </div>
        </div>
        <div class="review-ans">${status}${userAns !== undefined ? ` — Your answer: <strong>${DOMPurify.sanitize(q.options[userAns])}</strong>` : ''}</div>
        <div class="review-ans">✔ Correct answer: <strong>${DOMPurify.sanitize(q.options[q.answer])}</strong></div>
        ${q.explanation ? `<div class="review-exp">💡 ${DOMPurify.sanitize(q.explanation)}</div>` : ''}
      </div>`;
  });
  document.getElementById('results-review').innerHTML = reviewHTML;

  // Save to localStorage
  saveTestResult(testState.testName, correct, qs.length);
}

function shareOnWhatsApp() {
  const scoreText = document.getElementById('score-num').textContent;
  const testName = testState.testName;
  const currentUrl = window.location.href.split('#')[0]; // Grabs your GitHub URL
  
  const message = `I just scored ${scoreText} on the "${testName}" mock test at संस्कृत-वर्तिका! 🪔\n\nTest your Sanskrit knowledge here: ${currentUrl}`;
  
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
}

function retakeTest() {
  // 🔒 SECURITY FIX: Strictly prevent bypassing AI limits!
  if (testState.category === 'ai_booster') {
    if (typeof showToast === "function") showToast("AI Tests cannot be retaken. Please generate a new test!");
    return; // Instantly stop the function
  }

  // Normal test retake logic
  document.getElementById('test-results').style.display = 'none';
  startTest(testState.category, testState.currentSet);
}
function showCategories() {
  document.body.classList.remove('test-mode-active'); 
  clearInterval(testState.timerInterval);
  document.getElementById('test-sets-view').style.display = 'none';
  document.getElementById('test-interface').style.display = 'none';
  document.getElementById('test-results').style.display = 'none';

  // 🚀 BUG FIX 3: Restore the bottom navigation bar so mobile users don't get trapped!
  const bNav = document.getElementById('bottomNav');
  if (bNav) bNav.style.display = ''; 

  // Smart Routing: Check where the user came from!
  if (isFreeMode) {
    navigate('free'); 
  } else if (currentPage === 'study') {
    // If they are in the Study Hub, simply reveal the sub-view again!
    document.getElementById('study-sub-view').style.display = 'block';
    window.scrollTo(0, 0);
  } else {
    // Otherwise, they are on the normal Test page
    document.getElementById('test-categories').style.display = 'block';
    window.scrollTo(0, 0);
  }
}


// ==========================================
// === THE AI BOOSTER ENGINE ===
// ==========================================

// --- AI BOOSTER POP-UP LOGIC ---
let pendingAITestType = null; 

function showAIBoosterPopup(paperType) {
  pendingAITestType = paperType; 
  document.getElementById('ai-booster-modal').style.display = 'flex'; 
}

function closeAIBoosterPopup() {
  pendingAITestType = null;
  document.getElementById('ai-booster-modal').style.display = 'none'; 
}

function confirmStartAIBooster() {
  document.getElementById('ai-booster-modal').style.display = 'none'; 
  generateAIBooster(pendingAITestType); 
}

// Helper: Basic Array Shuffler
function shuffleArray(array) {
  let curId = array.length;
  while (0 !== curId) {
    let randId = Math.floor(Math.random() * curId);
    curId -= 1;
    let tmp = array[curId];
    array[curId] = array[randId];
    array[randId] = tmp;
  }
  return array;
}

// 1. UI Sync for Daily Limits (0 Firebase Reads)
function updateAIBoosterLimitsUI() {
  const today = new Date().toLocaleDateString('en-IN');
  
  // 🚀 FIX: Automatically grab the student's Core Subject
  ['paper1', currentCoreSubject].forEach(type => {
    let limitData = JSON.parse(localStorage.getItem(`ai_booster_limit_${type}`) || `{"date": "${today}", "count": ${AI_BOOSTER_DAILY_LIMIT}}`);
    
    if (limitData.date !== today) {
      limitData = { date: today, count: AI_BOOSTER_DAILY_LIMIT }; 
      localStorage.setItem(`ai_booster_limit_${type}`, JSON.stringify(limitData));
    }
    
    // 🚀 FIX: Route the ID properly because the HTML ID is 'ai-limit-core'
    let elementId = type === 'paper1' ? 'ai-limit-paper1' : 'ai-limit-core';
    const limitEl = document.getElementById(elementId);
    
    if (limitEl) limitEl.textContent = `Remaining Today: ${limitData.count}/${AI_BOOSTER_DAILY_LIMIT}`;
  });
}

// 2. The Weakness Analyzer (PHASE 1: Tab-Level Aggregation)
function getWeakTopics(paperType) {
  // 🚀 FIX: Default to an empty array instead of short-circuiting!
  const history = (currentUser && currentUser.dbData && currentUser.dbData.history) ? currentUser.dbData.history : [];
  
  let topicStats = {}; 

  const reverseCatNames = {};
  Object.keys(catNames).forEach(k => reverseCatNames[catNames[k]] = k);

  history.forEach(h => {
    // 🚀 FIX: Now safely ignores both "Full Mocks" and "Full sets"
    if (h.name.includes("AI Booster") || h.name.includes("Full") || h.name.includes("Free")) return;

    let parts = h.name.split(" - ");
    if (parts.length < 2) return;

    let catTitle = parts[0].trim();
    let fullSetKey = parts.slice(1).join(" - ").trim();
    let cat = reverseCatNames[catTitle];

    if (!cat) return;

    // Filter out the papers we don't care about right now
    if (paperType === 'paper1' && cat !== 'paid_p1_topic') return;
    
    // 🚀 FIX: Dynamic AI subject targeting!
    if (paperType === 'core') {
        const subjectKeyMap = { 'sanskrit': 'skt', 'bengali': 'ben', 'philosophy': 'phil' };
        const sKey = subjectKeyMap[currentCoreSubject];
        // Only allow topic-wise tests from the current subject
        if (!cat.includes(`paid_${sKey}_`) || cat.includes('_full')) return;
    }

    // 🚀 PHASE 1: Extract the broad tab name! (Slices off " - Set 1")
    let topicName = fullSetKey;
    if (fullSetKey.includes(' - Set')) {
        topicName = fullSetKey.split(' - Set')[0].trim();
    } else if (fullSetKey.startsWith('Set ')) {
        topicName = catNames[cat]; // Fallback if no specific tab name
    }

    let key = cat + "|" + topicName;
    if (!topicStats[key]) topicStats[key] = { sum: 0, count: 0, cat: cat, topicName: topicName };

    topicStats[key].sum += h.pct;
    topicStats[key].count += 1;
  });

  // Calculate averages and sort worst to best
  let averages = Object.values(topicStats).map(t => ({
    cat: t.cat, topicName: t.topicName, avg: t.sum / t.count
  }));

  averages.sort((a, b) => a.avg - b.avg);

  // 🚀 PHASE 1: Dynamic Fallback Prerequisites
  if (paperType === 'paper1') {
    if (averages.length < 2) return { topics: [], error: "⚠️ Not enough data! Take tests in at least 2 DIFFERENT topics (e.g., Teaching Aptitude and Research) to unlock the AI Booster." };
    return { topics: averages.slice(0, 3), error: null }; // Returns 2 or 3 topics
  } else {
    if (averages.length < 4) return { topics: [], error: `⚠️ Not enough data! Take tests in at least 4 DIFFERENT ${CORE_SUBJECTS[currentCoreSubject].name} topics to unlock the AI Booster.` };
    return { topics: averages.slice(0, 6), error: null }; // Returns 4, 5, or 6 topics
  }
}

// 3. The Master Generator (PHASE 2: Dynamic Pool Assembly)
async function generateAIBooster(paperType) {
  // 🚀 FIX: Check dynamic Core Pass Access
  const reqPass = paperType === 'paper1' ? 'general' : 'core';
  if (!hasAccess(reqPass)) {
    document.getElementById('premium-lock-modal').style.display = 'flex';
    return;
  }

  // 🚀 FIX: Check Daily Limits using the actual Subject Name
  const today = new Date().toLocaleDateString('en-IN');
  const storageKeyType = paperType === 'paper1' ? 'paper1' : currentCoreSubject;
  const limitKey = `ai_booster_limit_${storageKeyType}`;
  let limitData = JSON.parse(localStorage.getItem(limitKey) || `{"date": "${today}", "count": ${AI_BOOSTER_DAILY_LIMIT}}`);

  if (limitData.date !== today) limitData = { date: today, count: AI_BOOSTER_DAILY_LIMIT };
  if (limitData.count <= 0) {
    showToast(`⏳ Daily limit reached! You can generate ${AI_BOOSTER_DAILY_LIMIT} AI tests per day.`);
    return;
  }

  // C. Find Weak Topics & Enforce Prerequisites
  const analysis = getWeakTopics(paperType);
  if (analysis.error) {
     showToast(analysis.error);
     return;
  }
  const weakTopics = analysis.topics;

  document.getElementById('loading-overlay').style.display = 'none';

  // D. Transition to AI Engine UI
  document.getElementById('test-categories').style.display = 'none';
  const setsView = document.getElementById('test-sets-view'); 
  setsView.style.display = 'block';
  setsView.scrollTop = 0; 
  document.getElementById('sets-category-title').textContent = "🔒 System Override: AI Active";
  
  const setsDesc = document.querySelector('#test-sets-view p');
  if (setsDesc) setsDesc.style.display = 'none';
  
  document.getElementById('sets-grid').innerHTML = `
    <div class="ai-loader-container">
      <div class="ai-core-scanner">
        <div class="ai-brain-icon">🧠</div>
        <div class="ai-scan-ring"></div>
        <div class="ai-scan-ring delay-1"></div>
      </div>
      <h3 class="ai-loading-title">AI Assembling Test...</h3>
      <div class="ai-loading-steps">
        <div id="ai-step-1" class="ai-step active">Analyzing your weakness areas...</div>
        <div id="ai-step-2" class="ai-step">Extracting targeted questions...</div>
        <div id="ai-step-3" class="ai-step">Applying cognitive shuffle...</div>
      </div>
    </div>
  `;
  window.scrollTo(0, 0);

  setTimeout(() => {
    const s1 = document.getElementById('ai-step-1');
    const s2 = document.getElementById('ai-step-2');
    if(s1 && s2) { s1.className = "ai-step done"; s2.className = "ai-step active"; }
  }, 800);
  
  setTimeout(() => {
    const s2 = document.getElementById('ai-step-2');
    const s3 = document.getElementById('ai-step-3');
    if(s2 && s3) { s2.className = "ai-step done"; s3.className = "ai-step active"; }
  }, 1800);

  // E. Database Download
  let catsToFetch = [...new Set(weakTopics.map(t => t.cat))];
  let fetchPromises = catsToFetch.map(c => fetchQuestions(c));
  fetchPromises.push(new Promise(resolve => setTimeout(resolve, 4000)));
  await Promise.all(fetchPromises);

  // F. Assemble the Custom Test from the Massive Topic Pools
  let assembledQuestions = [];
  
  // 🚀 PHASE 2: Dynamic Question Math (e.g., 30 / 2 topics = 15 questions each. 30 / 6 = 5 each)
  let qsPerTopic = Math.ceil(30 / weakTopics.length);

  weakTopics.forEach(t => {
     let topicPool = [];
     const categoryData = allQuestions[t.cat];
     
     // Find ALL sets inside this broad topic and pool their questions together
     if (categoryData) {
         Object.keys(categoryData).forEach(setKey => {
             if (setKey.includes(t.topicName)) {
                 topicPool.push(...categoryData[setKey]);
             }
         });
     }
     
     if (topicPool.length > 0) {
        let standaloneQs = topicPool.filter(q => !q.groupId);
        let shuffled = shuffleArray([...standaloneQs]);
        assembledQuestions.push(...shuffled.slice(0, qsPerTopic));
     }
  });

  // Cap at exactly 30 questions
  assembledQuestions = assembledQuestions.slice(0, 30);

  if(assembledQuestions.length === 0) {
      showToast("⚠️ Could not assemble questions. Please try again later.");
      showCategories();
      return;
  }

  // G. Final Interleaved Shuffle
  assembledQuestions = shuffleArray(assembledQuestions);

  // H. Deduct Local Limit
  limitData.count -= 1;
  localStorage.setItem(limitKey, JSON.stringify(limitData));
  updateAIBoosterLimitsUI();

  // I. Launch Test
  testState.category = 'ai_booster';
  testState.currentSet = paperType;
  testState.questions = assembledQuestions;
  testState.current = 0;
  testState.answers = {};
  testState.marked = {};
  testState.finished = false;
  
  testState.timeLeft = assembledQuestions.length * 72;
  testState.testName = paperType === 'paper1' ? "AI Booster: Paper 1" : `AI Booster: ${CORE_SUBJECTS[currentCoreSubject].name}`;

  document.body.classList.add('test-mode-active');
  document.getElementById('test-categories').style.display = 'none';
  document.getElementById('test-sets-view').style.display = 'none';
  document.getElementById('test-interface').style.display = 'block';
  window.scrollTo(0, 0);

  document.getElementById('test-title').textContent = testState.testName;
  const displayMinutes = Math.ceil(testState.timeLeft / 60);
  document.getElementById('test-subtitle').textContent = assembledQuestions.length + ' Targeted Questions • ' + displayMinutes + ' Minutes';

  buildPalette();
  renderQuestion();
  startTimer();
}



// ==========================================
// === PDF NOTES ENGINE (STANDALONE) ========
// ==========================================
let allNotes = {};

// PASTE YOUR NEW NOTES SPREADSHEET URL HERE
const GOOGLE_SHEET_URL_NOTES = "https://script.google.com/macros/s/AKfycbwBihYKWdXKOo3bJr8qJK73akKrFULyHC87Ao2ysunEXSVWT6SPYytXAlF24qQtWkN1Jg/exec";

async function loadNotesFromSheet() {
  try {
    const response = await fetch(GOOGLE_SHEET_URL_NOTES);
    const textData = await response.text();
    let data;
    try { 
      data = JSON.parse(textData); 
    } catch (e) { 
      // THE ALARM BELL: If Google sends an HTML error instead of JSON, it pops up!
      showToast("Error: Google did not send the notes. Please check if 'Who has access' is set to 'Anyone' and you deployed a 'New Version'.");
      console.error("Google Error Output:", textData);
      return; 
    }

    allNotes = {}; // Reset notes
    let noteCount = 0;
    
    data.forEach(row => {
      const cat = (row.category || row.Category || "").toString().trim().toLowerCase();
      // The row MUST have a link and a category to show up!
      if (cat && (row.link || row.Link)) {
        if (!allNotes[cat]) allNotes[cat] = [];
        allNotes[cat].push({
          title: row.title || row.Title || "Study Note",
          desc: row.description || row.Description || "",
          link: row.link || row.Link || "#",
          topic: row.topic || row.Topic || "Other" // NEW: Grabs the Topic
        });
        noteCount++;
      }
    });
    
    console.log(`Successfully loaded ${noteCount} notes from Google Sheets!`);
    
  } catch (error) { 
  console.error("Could not load study notes:", error); 
  showToast("⚠️ Could not load notes. Please check your internet connection.");
}
}



// --- PDF NOTES UI LOGIC ---
const notesSubjectNames = {
  'veda': 'वेदः', 'vyakarana': 'व्याकरणम्', 'darshan': 'दर्शनम्',
  'sahitya': 'साहित्यम्', 'other': 'अन्यानि'
};

async function showNotesTopic(subjectKey) {
  // 1. Instantly show the page view
  document.getElementById('notes-main-grid').style.display = 'none';
  document.getElementById('notes-topic-view').style.display = 'block';
  window.scrollTo(0, 0);
  document.getElementById('notes-topic-title').textContent = (notesSubjectNames[subjectKey] || subjectKey) + " — Study Notes";

  const grid = document.getElementById('notes-links-grid');
  const filterSelect = document.getElementById('notes-filter'); 
  
  // 2. Inject Skeletons!
  grid.innerHTML = getSkeletonGrid(6, 'note'); 
  filterSelect.innerHTML = '<option value="all">Loading...</option>'; 

  // 3. Fetch data + 400ms smooth artificial delay
  const delayPromise = new Promise(r => setTimeout(r, 400));
  const fetchPromise = Object.keys(allNotes).length === 0 ? loadNotesFromSheet() : Promise.resolve();
  await Promise.all([fetchPromise, delayPromise]);

  // 4. Render the real data
  grid.innerHTML = ''; 
  filterSelect.innerHTML = '<option value="all">All Topics</option>'; 

  const topics = allNotes[subjectKey];
  if (!topics || topics.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">PDF Notes for this subject are being updated. Check back soon!</p>';
    return;
  }

  const uniqueTopics = [...new Set(topics.map(item => item.topic))];
  uniqueTopics.forEach(t => {
    filterSelect.innerHTML += `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`;
  });

  topics.forEach(note => {
    grid.innerHTML += `
      <div class="note-card" data-topic="${escapeHTML(note.topic)}">
        <h4>${escapeHTML(note.title)}</h4>
        <p>${escapeHTML(note.desc)}</p>
        <a href="${encodeURI(note.link)}" target="_blank" class="btn btn-primary btn-sm" style="display:inline-flex;">📥 Download / View PDF</a>
      </div>
    `;
  });
}

function backToNotesMain() {
  document.getElementById('notes-main-grid').style.display = 'grid';
  document.getElementById('notes-topic-view').style.display = 'none';
  window.scrollTo(0, 0);
}

// ==========================================
// === YOUTUBE VIDEOS ENGINE (STANDALONE) ===
// ==========================================
let allVideos = {};

// PASTE YOUR NEW YOUTUBE VIDEOS SPREADSHEET URL HERE
const GOOGLE_SHEET_URL_VIDEOS = "https://script.google.com/macros/s/AKfycbwm9cDC8EOtCr8hVl0RH0keHVeL4qua1C4fb0Q1UoOY0zRa4MuCUfb0b4I7OULc_NdX/exec";

async function loadVideosFromSheet() {
  try {
    const response = await fetch(GOOGLE_SHEET_URL_VIDEOS);
    const textData = await response.text();
    let data;
    try { data = JSON.parse(textData); } catch (e) { return; }

    allVideos = {}; 
    data.forEach(row => {
      const cat = (row.category || row.Category || "").toString().trim().toLowerCase();
      if (cat && (row.link || row.Link)) {
        if (!allVideos[cat]) allVideos[cat] = [];
        allVideos[cat].push({
          title: row.title || row.Title || "Video Lecture",
          duration: row.duration || row.Duration || "YouTube Video",
          link: row.link || row.Link || "#",
          topic: row.topic || row.Topic || "Other" // NEW: Grabs the Topic
        });
      }
    });
  } catch (error) { 
  console.error("Could not load videos:", error); 
  showToast("⚠️ Could not load videos. Please check your internet connection.");
}
}



// --- HELPER: Extracts the 11-character video ID from any YouTube link (Upgraded for Shorts) ---
function getYouTubeID(url) {
  // FIXED: Added "shorts\/" to the regex so YouTube Shorts thumbnails work perfectly!
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function showVideosTopic(subjectKey) {
  // 1. Instantly show the page view
  document.getElementById('videos-main-grid').style.display = 'none';
  document.getElementById('videos-topic-view').style.display = 'block';
  window.scrollTo(0, 0);
  document.getElementById('videos-topic-title').textContent = (notesSubjectNames[subjectKey] || subjectKey) + " — Video Lectures";

  const grid = document.getElementById('videos-links-grid');
  const filterSelect = document.getElementById('videos-filter'); 
  
  // 2. Inject Video Skeletons!
  grid.innerHTML = getSkeletonGrid(6, 'video'); 
  filterSelect.innerHTML = '<option value="all">Loading...</option>'; 

  // 3. Fetch data + 400ms smooth artificial delay
  const delayPromise = new Promise(r => setTimeout(r, 400));
  const fetchPromise = Object.keys(allVideos).length === 0 ? loadVideosFromSheet() : Promise.resolve();
  await Promise.all([fetchPromise, delayPromise]);

  // 4. Render the real data
  grid.innerHTML = ''; 
  filterSelect.innerHTML = '<option value="all">All Topics</option>'; 

  const topics = allVideos[subjectKey];
  if (!topics || topics.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">Videos for this subject are being updated. Check back soon!</p>';
    return;
  }

  const uniqueTopics = [...new Set(topics.map(item => item.topic))];
  uniqueTopics.forEach(t => {
    filterSelect.innerHTML += `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`;
  });

  topics.forEach(vid => {
    const videoId = getYouTubeID(vid.link);
    const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
    const bgStyle = thumbUrl ? `background-image: url('${thumbUrl}'); background-size: cover; background-position: center;` : '';

    grid.innerHTML += `
      <div class="video-card" data-topic="${escapeHTML(vid.topic)}">
        <div class="video-thumb" style="${bgStyle}" onclick="window.open('${encodeURI(vid.link)}','_blank')">
          <div class="play-btn">▶</div>
        </div>
        <div class="video-info">
          <h4 style="font-family:var(--font-skt); font-size:1.05rem;">${escapeHTML(vid.title)}</h4>
          <p>${escapeHTML(vid.duration)}</p>
        </div>
      </div>
    `;
  });
}

function backToVideosMain() {
  document.getElementById('videos-main-grid').style.display = 'grid';
  document.getElementById('videos-topic-view').style.display = 'none';
  window.scrollTo(0, 0);
}
// ==========================================

// ==========================================
// === PYQs ENGINE (STANDALONE) ===
// ==========================================
// PASTE YOUR NEW PYQ SPREADSHEET URL HERE
const GOOGLE_SHEET_URL_PYQS = "https://script.google.com/macros/s/AKfycbyLgnaxYpzqWLGaTyf7PoYsHT-DJ-4cbWhn5xNdvZ4ynm8RvQaZzhET4ycW1QTXiLs7/exec";

async function loadPYQsFromSheet() {
  const grid = document.getElementById('pyqs-grid');
  // 1. Inject Note Skeletons (they look great for PYQs too!)
  grid.innerHTML = getSkeletonGrid(6, 'note'); 

  try {
    // 2. Fetch data + 400ms delay
    const fetchPromise = fetch(GOOGLE_SHEET_URL_PYQS).then(res => res.text());
    const delayPromise = new Promise(r => setTimeout(r, 400));
    
    const [textData] = await Promise.all([fetchPromise, delayPromise]);
    
    let data;
    try { data = JSON.parse(textData); } catch (e) { return; }

    // 3. Clear skeletons and render real data
    grid.innerHTML = ''; 

    if (!data || data.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">PYQs are being updated. Check back soon!</p>';
      return;
    }

    data.forEach(row => {
      const year = row.year || row.Year || "";
      const desc = row.description || row.Description || row.desc || "";
      const link = row.link || row.Link || "#";
      
      // 🚀 NEW: Grab the Subject from the Google Sheet (Defaults to 'sanskrit' to protect your old data!)
      let subject = String(row.subject || row.Subject || "sanskrit").toLowerCase().trim();

      if (year && link) {
        // 🚀 NEW: If it's Paper 1, it gets no tag so everyone sees it. Otherwise, tag it with the core subject!
        const subjectTag = (subject.includes('paper 1') || subject.includes('paper1') || subject === 'general') 
                           ? '' 
                           : `data-subject-group="${subject}"`;

        grid.innerHTML += `
          <div class="pyq-card" ${subjectTag}>
            <span class="year" style="font-family: var(--font-sans);">${escapeHTML(year)}</span>
            <p>${escapeHTML(desc)}</p>
            <a href="${encodeURI(link)}" target="_blank" class="btn btn-primary btn-sm">📥 Download</a>
          </div>
        `;
      }
    });

    // 🚀 NEW: Instantly hide any PYQs that don't belong to the student's active workspace!
    applyCoreSubjectUI(currentCoreSubject);
  } catch (error) { 
    console.error("Could not load PYQs:", error); 
    showToast("⚠️ Could not load PYQs. Please check your internet connection.");
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#F44336;">Failed to load data. Please refresh the page.</p>';
  }
}

// ==========================================

// ==========================================
// ==========================================
// === DASHBOARD & DATA (Firebase Cloud) ===
// ==========================================

async function saveTestResult(name, correct, total) {
  // Automatically detects ANY test that has "Free" in its official category name
  const isFreeTest = name.includes('Free');
  const today = new Date().toLocaleDateString('en-IN');
  const pct = Math.round((correct/total)*100);
  const resultObj = { name, correct, total, pct, date: today };

  // === NEW: OFFLINE STORAGE FOR FREE TESTS ===
  if (isFreeTest) {
    let localHistory = JSON.parse(localStorage.getItem('vartika_free_history') || '[]');
    localHistory.unshift(resultObj);
    if (localHistory.length > 50) localHistory.pop(); // Keep max 50 free tests in local storage
    localStorage.setItem('vartika_free_history', JSON.stringify(localHistory));
    
    // Refresh the Free UI quietly
    const setsView = document.getElementById('test-sets-view');
    if (setsView && setsView.style.display === 'block') {
      const mode = name.startsWith('Free Full Mock') ? 'full' : 'topic';
      openFreeSets(mode); 
    }
    return; // 🛑 Stop here! 0 Firebase writes consumed.
  }
  // ===========================================

  // Existing Firebase logic for Paid Tests
  if (!currentUser || !currentUser.dbData) {
    showToast("⚠️ Score not saved! Please log in to track your progress.");
    return; 
  }
  
  let history = currentUser.dbData.history || [];
  let streak = currentUser.dbData.streak || { count: 0, lastDate: "" };
  
  const oldUnlocked = BADGE_DEFS.filter(b => b.check(history, streak.count)).map(b => b.id);

  history.unshift(resultObj);
  if (history.length > 100) history.pop(); // Keep max 100 paid tests in Cloud

  if (streak.lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (streak.lastDate === yesterday.toLocaleDateString('en-IN')) {
      streak.count++;
    } else {
      streak.count = 1;
    }
    streak.lastDate = today;
  }

  currentUser.dbData.history = history;
  currentUser.dbData.streak = streak;
  
  await db.collection("users").doc(currentUser.uid).set({ 
    history: history, 
    streak: streak 
  }, { merge: true });
  loadDashboard(); // Redraw UI locally, 0 Cloud Reads!

  const newUnlockedBadges = BADGE_DEFS.filter(b => b.check(history, streak.count));
  setTimeout(() => {
    newUnlockedBadges.forEach(b => {
      if (!oldUnlocked.includes(b.id)) showToast(`🏆 New Badge: ${b.textIcon} ${b.name}!`);
    });
  }, 800);
}

// ==========================================
// === UPGRADED SAVED QUESTIONS ENGINE ===
// ==========================================
let currentSavedQsTab = 'all'; // 🚀 NEW: Tracks which tab is active

function switchSavedQsTab(tab) {
  currentSavedQsTab = tab;
  document.querySelectorAll('.sq-tab').forEach(b => b.classList.remove('active'));
  document.querySelector(`.sq-tab[onclick*="'${tab}'"]`).classList.add('active');
  renderSavedQuestions();
}

async function toggleSaveQuestion(qIndex) {
  if (!currentUser || !currentUser.dbData) {
    showToast("Please Log In to save questions!");
    showAuthModal();
    return;
  }
  
  const q = testState.questions[qIndex];
  let saved = currentUser.dbData.saved_qs || [];
  const existingIdx = saved.findIndex(sq => sq.q === q.q);
  const btn = document.getElementById('save-btn-' + qIndex);

  if (existingIdx >= 0) {
    saved.splice(existingIdx, 1);
    showToast("Removed from saved questions");
    if(btn) { btn.innerHTML = '☆ Save'; btn.style.color = 'var(--text-light)'; }
  } else {
    // Prevent the array from exceeding the safe limit
    if (saved.length >= MAX_SAVED_QUESTIONS) {
      showToast(`⚠️ Cloud Vault Full! You can only save up to ${MAX_SAVED_QUESTIONS} questions. Please remove some old ones first.`);
      return; 
    }
    
    // 🚀 FIX: Dynamically tag saved questions with the active Core Subject
    let currentPaperType = currentCoreSubject;
    const p1Cats = ['paid_p1_full', 'paid_p1_topic', 'free_p1_full', 'free_p1_topic'];
    if (p1Cats.includes(testState.category) || (testState.category === 'ai_booster' && testState.currentSet === 'paper1')) {
        currentPaperType = 'paper1';
    }
    
    // 🚀 IDEA 2 OPTIMIZATION: Only save the correct answer text!
    saved.unshift({ 
      q: q.q, 
      correctAnswerText: q.options[q.answer], // Saves just the right string!
      explanation: q.explanation,
      paperType: currentPaperType 
    });
    
    showToast("⭐ Question Saved to Cloud!");
    if(btn) { btn.innerHTML = '⭐ Saved'; btn.style.color = 'var(--saffron)'; }
  }
  
  currentUser.dbData.saved_qs = saved;
  await db.collection("users").doc(currentUser.uid).update({ saved_qs: saved });
  renderSavedQuestions(); 
}

function renderSavedQuestions() {
  const saved = (currentUser && currentUser.dbData && currentUser.dbData.saved_qs) ? currentUser.dbData.saved_qs : [];
  const statEl = document.getElementById('stat-saved-qs');
  if (statEl) statEl.textContent = saved.length; // Always show Total Count on Dashboard

  const container = document.getElementById('saved-qs-container');
  if(!container) return;
  
  if (saved.length === 0) {
    container.innerHTML = '<div style="background:var(--white); border:2px dashed var(--cream-dark); border-radius:var(--radius-sm); padding:24px; text-align:center; color:var(--text-light); font-size:0.85rem;">No saved questions yet.</div>';
    return;
  }

  let html = '';
  let displayCount = 0;

  // We must loop through all questions to maintain the original ID for deleting them properly
  saved.forEach((sq, originalIndex) => {
    // Backwards Compatibility: If an old question has no paperType, assume it is Sanskrit
    const pType = sq.paperType || 'sanskrit';
    
    // 🚀 FIX: Handle the 'core' tab filter dynamically!
    let matchTab = currentSavedQsTab === 'core' ? currentCoreSubject : currentSavedQsTab;
    if (currentSavedQsTab !== 'all' && pType !== matchTab) return;
    
    displayCount++;
    
    // 🚀 FIX: Dynamic badge names!
    let badgeName = 'Core Subject';
    if (pType === 'paper1') badgeName = 'Paper 1';
    else if (CORE_SUBJECTS[pType]) badgeName = CORE_SUBJECTS[pType].name;
    
    // 🚀 BACKWARD COMPATIBILITY: Handles both new optimized saves and old saves
    const correctText = sq.correctAnswerText || (sq.options ? sq.options[sq.answer] : "N/A");
    
    html += `
      <div style="background:var(--white); padding:16px 20px; border-radius:var(--radius-sm); border-left:4px solid var(--saffron); box-shadow:0 2px 10px rgba(0,0,0,0.05); position:relative;">
        <span style="position:absolute; top:12px; right:16px; font-size:0.65rem; font-weight:bold; color:var(--text-light); background:var(--cream); padding:2px 8px; border-radius:4px;">${badgeName}</span>
        <div style="font-family:var(--font-skt); font-weight:600; color:var(--brown); margin-bottom:10px; font-size:0.95rem; padding-right: 60px;">${sq.q}</div>
        <div style="font-size:0.8rem; color:#1B5E20; background:#E8F5E9; padding:6px 10px; border-radius:4px; display:inline-block; margin-bottom:8px;">✔ Correct: <strong>${correctText}</strong></div>
        ${sq.explanation ? `<div style="font-size:0.8rem; color:#7B1FA2; font-style:italic; margin-bottom:12px; line-height:1.5;">💡 ${sq.explanation}</div>` : ''}
        <div style="text-align:right;"><button onclick="removeSavedQuestion(${originalIndex})" style="background:none; border:none; color:#F44336; cursor:pointer; font-size:0.8rem; font-weight:600;">🗑️ Remove</button></div>
      </div>
    `;
  });
  
  if (displayCount === 0) {
    container.innerHTML = '<div style="background:var(--white); border:2px dashed var(--cream-dark); border-radius:var(--radius-sm); padding:24px; text-align:center; color:var(--text-light); font-size:0.85rem;">No questions found in this category.</div>';
  } else {
    container.innerHTML = html;
  }
}

async function removeSavedQuestion(index) {
  if (!currentUser || !currentUser.dbData) return;
  let saved = currentUser.dbData.saved_qs || [];
  saved.splice(index, 1);
  currentUser.dbData.saved_qs = saved;
  await db.collection("users").doc(currentUser.uid).update({ saved_qs: saved });
  renderSavedQuestions(); 
  showToast("Question removed from Cloud");
}

function openSavedQsModal() {
  if (!currentUser) { showAuthModal(); return; }
  switchSavedQsTab('all'); // 🚀 NEW: Resets to 'All' tab every time it opens!
  document.getElementById('saved-qs-modal').style.display = 'flex';
}

// ==========================================
// === DASHBOARD & DATA (Firebase Cloud) ===
// ==========================================
function loadDashboard() {
        
  // FIXED: Show a TRUE loading spinner while Firebase is booting up!
  if (!isFirebaseReady) {
    document.getElementById('name-setup-box').style.display = 'block';
    document.getElementById('name-setup-box').innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
        <div class="spinner" style="border-top-color: var(--saffron); margin-bottom: 16px;"></div>
        <h3 style="color:var(--brown);">Loading your profile...</h3>
        <p style="color:var(--text-light); font-size: 0.85rem;">Fetching your scores and passes from the cloud.</p>
      </div>
    `;
    document.getElementById('dashboard-hero').style.display = 'none';
    document.querySelector('.stats-grid').style.display = 'none';
    
    const badgesBox = document.getElementById('badges-container');
    if (badgesBox) badgesBox.parentElement.parentElement.style.display = 'none';
    
    // Also hide the analytics chart while loading to prevent visual glitches
    const analyticsBox = document.getElementById('analytics-section');
    if (analyticsBox) analyticsBox.style.display = 'none';
    
    return;
  }

  // GUEST VIEW (Not Logged In)
  if (!currentUser || !currentUser.dbData) {
    document.getElementById('name-setup-box').style.display = 'block';
    document.getElementById('name-setup-box').innerHTML = `
      <h3 style="color:var(--brown); margin-bottom: 12px;">Welcome to your Dashboard!</h3>
      <p style="color:var(--text-light); margin-bottom:20px;">Please create a free account or log in to track your scores, earn badges, and save difficult questions.</p>
      <button class="btn btn-primary" onclick="showAuthModal()" style="margin: 0 auto;">🔒 Log In / Sign Up</button>
    `;
    document.getElementById('dashboard-hero').style.display = 'none';
    document.querySelector('.stats-grid').style.display = 'none';
    
    const badgesBox = document.getElementById('badges-container');
    if (badgesBox) badgesBox.parentElement.parentElement.style.display = 'none';
    return;
  }

  // STUDENT VIEW (Logged In)
  document.getElementById('name-setup-box').style.display = 'none';
  document.getElementById('dashboard-hero').style.display = 'block';
  document.querySelector('.stats-grid').style.display = 'grid';
  
  const badgesBox = document.getElementById('badges-container');
  if (badgesBox) badgesBox.parentElement.parentElement.style.display = 'block';

  // BUG FIX: Unhide the analytics section after the loading spinner finishes!
  const analyticsBox = document.getElementById('analytics-section');
  if (analyticsBox) analyticsBox.style.display = 'block';

  document.getElementById('display-name').textContent = currentUser.dbData.name || "Student";


  
  // --- NEW: RENDER MULTI-PASS WALLET ON DASHBOARD ---
  const vipBadgeContainer = document.getElementById('student-vip-badge');
  if (vipBadgeContainer) {
    const passes = currentUser.dbData.passes || {};
    const now = new Date();
    let activePassesHTML = '';
    let hasAnyPass = false;
    let minDaysLeft = Infinity;
    let expiringPassName = "Premium Pass";

    // 🚀 DYNAMIC WALLET FIX: No more Combo, explicitly shows active Core Subject!
    const activeCore = CORE_SUBJECTS[currentCoreSubject];
    const passDetails = [
      { id: 'batch', name: 'Complete Batch', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>', color: '#E65100', bg: '#FFF3E0' },
      { id: currentCoreSubject, name: activeCore.badge, icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>', color: '#1565C0', bg: '#E3F2FD' },
      { id: 'general', name: 'Paper 1 Mocks', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>', color: '#2E7D32', bg: '#E8F5E9' }
    ];

    passDetails.forEach(p => {
      const expDateStr = passes[p.id];
      if (expDateStr) {
        const expDate = new Date(expDateStr);
        const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysLeft > 0) {
          hasAnyPass = true;
          if (daysLeft < minDaysLeft) {
            minDaysLeft = daysLeft; // Track nearest expiry
            expiringPassName = p.name; // <-- NEW: Remember the exact name of the pass!
          }
          
          // NEW MINIMALIST PILL DESIGN
          activePassesHTML += `
            <div style="display: inline-flex; align-items: center; background: ${p.bg}; border: 1px solid ${p.color}; border-radius: 50px; padding: 6px 14px; margin: 4px; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <span style="color: ${p.color}; display: flex; align-items: center;">${p.icon}</span>
              <span style="color: ${p.color}; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">${p.name}</span>
              <span style="color: var(--brown); font-size: 0.75rem; font-weight: 700; border-left: 1px solid rgba(0,0,0,0.1); padding-left: 8px;">${daysLeft}d left</span>
            </div>
          `;
        }
      }
    });

    if (hasAnyPass) {
      vipBadgeContainer.innerHTML = `
        <div style="margin-top: 20px; margin-bottom: 24px;">
          <p style="font-size: 0.8rem; color: rgba(255,248,231,0.7); margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Active Passes</p>
          <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
            ${activePassesHTML}
          </div>
        </div>
      `;

      // Trigger Expiry Pop-up Logic if ANY pass is expiring within 5 days
      if (minDaysLeft <= 5) {
        if (!sessionStorage.getItem('expiry_warned')) {
          setTimeout(() => {
            document.getElementById('expiry-pass-name').textContent = expiringPassName + " is expiring soon!"; // <-- NEW: Updates the modal title!
            document.getElementById('expiry-days-text').textContent = minDaysLeft;
            document.getElementById('expiry-modal').style.display = 'flex';
            sessionStorage.setItem('expiry_warned', 'true');
          }, 1000); 
        }
      }
    } else {
      // No passes found or all expired
      vipBadgeContainer.innerHTML = `<span style="background: rgba(255,255,255,0.1); color: rgba(255,248,231,0.8); padding: 6px 16px; border-radius: 50px; font-size: 0.85rem; font-weight: 600; border: 1px solid rgba(255,248,231,0.3);">Basic Access</span>`;
    }
  }
  // -------------------------------------------

  const history = currentUser.dbData.history || [];
  document.getElementById('stat-attempted').textContent = history.length;
  document.getElementById('stat-total-qs').textContent = history.reduce((sum, h) => sum + h.total, 0);
  
  if (history.length > 0) {
    const avg = Math.round(history.reduce((a,h) => a + h.pct, 0) / history.length);
    const best = Math.max(...history.map(h => h.pct));
    document.getElementById('stat-avg').textContent = avg + '%';
    
    document.getElementById('stat-best').textContent = best + '%';
  } else {
    document.getElementById('stat-avg').textContent = '—';
    
    document.getElementById('stat-best').textContent = '—';
  }

  const tbody = document.getElementById('history-body');
  const noHistory = document.getElementById('no-history');
  if (history.length === 0) {
    noHistory.style.display = 'block';
    document.getElementById('history-table').style.display = 'none';
  } else {
    noHistory.style.display = 'none';
    document.getElementById('history-table').style.display = 'table';
    tbody.innerHTML = history.map(h => `
      <tr>
        <td>${escapeHTML(h.name)}</td>
        <td>${h.correct}/${h.total}</td>
        <td><span style="color:${h.pct>=60?'#2e7d32':'#b71c1c'};font-weight:700;">${h.pct}%</span></td>
        <td>${h.date}</td>
      </tr>`).join('');
  }
  renderSavedQuestions();
  renderGamification();
  renderAnalytics(); // NEW: Draw the progress bars
}

// Gamification Badges
const iconStyle = 'color: var(--gold); filter: drop-shadow(0 4px 6px rgba(255,215,0,0.5));';
const BADGE_DEFS = [
  { id: 'b1', textIcon: '🌱', icon: `<i class="fa-solid fa-seedling" style="${iconStyle}"></i>`, name: 'First Step', desc: 'Took your first test!', check: (h, s) => h.length >= 1 },
  { id: 'b5', textIcon: '🏃', icon: `<i class="fa-solid fa-medal" style="${iconStyle}"></i>`, name: 'Dedicated', desc: 'Completed 5 tests!', check: (h, s) => h.length >= 5 },
  { id: 'b20', textIcon: '🎯', icon: `<i class="fa-solid fa-bullseye" style="${iconStyle}"></i>`, name: 'Focused', desc: 'Completed 20 tests!', check: (h, s) => h.length >= 20 },
  { id: 'b50', textIcon: '🏹', icon: `<i class="fa-solid fa-shield-halved" style="${iconStyle}"></i>`, name: 'Warrior', desc: 'Completed 50 tests!', check: (h, s) => h.length >= 50 },
  { id: 'b100', textIcon: '💯', icon: `<i class="fa-solid fa-award" style="${iconStyle}"></i>`, name: 'Century', desc: 'Completed 100 tests!', check: (h, s) => h.length >= 100 },
  { id: 'b200', textIcon: '🚀', icon: `<i class="fa-solid fa-rocket" style="${iconStyle}"></i>`, name: 'High Flyer', desc: 'Completed 200 tests!', check: (h, s) => h.length >= 200 },
  { id: 'b500', textIcon: '🦁', icon: `<i class="fa-solid fa-gem" style="${iconStyle}"></i>`, name: 'Legend', desc: 'Completed 500 tests!', check: (h, s) => h.length >= 500 },
  { id: 'b1000', textIcon: '🏛️', icon: `<i class="fa-solid fa-monument" style="${iconStyle}"></i>`, name: 'Immortal', desc: 'Completed 1000 tests!', check: (h, s) => h.length >= 1000 },
  { id: 'b_sch', textIcon: '🏅', icon: `<i class="fa-solid fa-user-graduate" style="${iconStyle}"></i>`, name: 'Scholar', desc: 'Scored 80% or higher!', check: (h, s) => h.some(t => t.pct >= 80) },
  { id: 'b_mas', textIcon: '👑', icon: `<i class="fa-solid fa-crown" style="${iconStyle}"></i>`, name: 'Master', desc: 'Achieved a perfect 100%!', check: (h, s) => h.some(t => t.pct === 100) },
  { id: 'b_str', textIcon: '⭐', icon: `<i class="fa-solid fa-fire-flame-curved" style="${iconStyle}"></i>`, name: 'On Fire', desc: '3-day streak!', check: (h, s) => s >= 3 },
  { id: 'b_str5', textIcon: '☄️', icon: `<i class="fa-solid fa-meteor" style="${iconStyle}"></i>`, name: 'Unstoppable', desc: '5-day streak!', check: (h, s) => s >= 5 }
];

function shareBadges(icons, count) {
  if (count === 0) { showToast("You haven't unlocked any badges yet!"); return; }
  const url = window.location.href.split('#')[0];
  window.open(`https://wa.me/?text=${encodeURIComponent(`I've unlocked ${count} achievement badges ${icons} on संस्कृत-वर्तिका! 🏆\n\nStart your UGC NET Sanskrit preparation for free: ${url}`)}`, '_blank');
}

function renderGamification() {
  if (!currentUser || !currentUser.dbData) return;
  const history = currentUser.dbData.history || [];
  const streak = currentUser.dbData.streak || { count: 0, lastDate: "" };
  
  let currentStreak = streak.count;
  const todayStr = new Date().toLocaleDateString('en-IN');
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (streak.lastDate !== todayStr && streak.lastDate !== yesterday.toLocaleDateString('en-IN')) currentStreak = 0;

  const streakEl = document.getElementById('streak-count');
  if (streakEl) streakEl.textContent = currentStreak;

  const badgesContainer = document.getElementById('badges-container');
  if (!badgesContainer) return;

  let badgesHTML = '';
  let unlockedCount = 0; let unlockedIcons = [];

  BADGE_DEFS.forEach(b => {
    if (b.check(history, currentStreak)) {
      unlockedCount++; unlockedIcons.push(b.textIcon);
      badgesHTML += `<div onclick="showToast('${b.textIcon} ${b.name}: ${b.desc}')" title="${b.name}: ${b.desc}" style="font-size:2rem; cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.2)';" onmouseout="this.style.transform='scale(1)';">${b.icon}</div>`;
    } else {
      badgesHTML += `<div onclick="showToast('🔒 Locked: ${b.desc}')" title="Locked: ${b.desc}" style="font-size:2rem; cursor:help; filter: grayscale(100%) opacity(0.25); transition:0.2s;">${b.icon}</div>`;
    }
  });

  badgesContainer.innerHTML = `
    <div style="display:flex; gap:16px; flex-wrap:wrap; justify-content:center; align-items:center; width:100%;">${badgesHTML}</div>
    <div style="width: 100%; display:flex; flex-wrap:wrap; gap:16px; justify-content:space-between; align-items:center; margin-top:16px; border-top: 1px solid var(--cream-dark); padding-top: 16px;">
      <span style="font-size:0.85rem; color:var(--text-light); font-weight:700; text-align:center; flex: 1 1 auto;">🏆 ${unlockedCount}/${BADGE_DEFS.length} Unlocked</span>
      <button class="btn btn-sm" style="background:#25D366; color:white; padding: 8px 16px; border-radius: 50px; font-weight:600; flex: 1 1 auto; justify-content:center;" onclick="shareBadges('${unlockedIcons.join('')}', ${unlockedCount})">📱 Share via WhatsApp</button>
    </div>
  `;
}

// ==========================================
// === SUBJECT-WISE ANALYTICS ENGINE ===
// ==========================================

// 🚀 NEW: Function to toggle the analytics views
function switchAnalytics(tab) {
  document.querySelectorAll('.a-tab').forEach(b => b.classList.remove('active'));
  document.querySelector(`.a-tab[onclick*="${tab}"]`).classList.add('active');
  
  document.getElementById('analytics-paper1').style.display = tab === 'paper1' ? 'block' : 'none';
  document.getElementById('analytics-core').style.display = tab === 'core' ? 'block' : 'none'; // 🚀 FIX: Dynamic Core ID
  
  // Re-trigger the progress bar animations!
  setTimeout(() => {
    const activeContainer = document.getElementById(`analytics-${tab}`);
    if (activeContainer) { // 🚀 FIX: Failsafe check
      const fills = activeContainer.querySelectorAll('.progress-fill');
      fills.forEach(fill => fill.style.width = fill.getAttribute('data-target'));
    }
  }, 50);
}

function renderAnalytics() {
  const containerP1 = document.getElementById('analytics-paper1');
  const containerCore = document.getElementById('analytics-core'); // 🚀 FIX ID
  if (!containerP1 || !containerCore) return;

  const history = (currentUser && currentUser.dbData && currentUser.dbData.history) ? currentUser.dbData.history : [];
  
  if (history.length === 0) {
    containerP1.innerHTML = '<div style="text-align:center; color:var(--text-light); font-size:0.85rem;">Take Paper 1 tests to generate your analysis.</div>';
    containerCore.innerHTML = `<div style="text-align:center; color:var(--text-light); font-size:0.85rem;">Take ${CORE_SUBJECTS[currentCoreSubject].name} tests to generate your analysis.</div>`;
    return;
  }

  // ===================================
  // 1. BUILD THE CORE SUBJECT TAB (Dynamic)
  // ===================================
  let coreHtml = ''; 
  let hasCoreData = false;
  let coreTopicsStats = {};
  const activeCoreName = CORE_SUBJECTS[currentCoreSubject].name;

  // 🚀 FIX: Build an array of valid test names for THIS workspace only
  const subjectKeyMap = { 'sanskrit': 'skt', 'bengali': 'ben', 'philosophy': 'phil' };
  const activeCode = subjectKeyMap[currentCoreSubject];
  let validPrefixes = [];
  Object.keys(catNames).forEach(k => {
    if (k.includes(`_${activeCode}_`)) {
      validPrefixes.push(catNames[k]);
    }
  });

  // Dynamically group all tests that belong to the ACTIVE workspace
  history.forEach(h => {
    if (!h.name) return;
    if (h.name.includes('1st Paper') || h.name.includes('Paper 1')) return; // Skip P1
    if (h.name.includes('AI Booster')) return; // Skip AI tests for topic analytics

    // Extract the topic name (e.g. from "Sanskrit Full Mocks - Set 1" -> "Sanskrit Full Mocks")
    let parts = h.name.split(' - ');
    let topicName = parts[0].trim();

    // 🚀 FIX: Instantly discard tests from other subjects!
    if (!validPrefixes.includes(topicName)) return;

    if (!coreTopicsStats[topicName]) {
      coreTopicsStats[topicName] = { tests: [], icon: '📚' };
    }
    coreTopicsStats[topicName].tests.push(h);
  });

  // 🚀 FIX: Iterate over validPrefixes to enforce STRICT master syllabus order!
  validPrefixes.forEach(topic => {
    if (coreTopicsStats[topic]) {
      hasCoreData = true;
      const tests = coreTopicsStats[topic].tests;
      const recent = tests.slice(0, ANALYTICS_RECENT_LIMIT);
      const avgPct = Math.round(recent.reduce((sum, t) => sum + t.pct, 0) / recent.length);
      let colorClass = avgPct >= 75 ? 'fill-green' : (avgPct >= 50 ? 'fill-orange' : 'fill-red');
    
    // Assign dynamic icons based on known names, fallback to default
    let icon = '📚';
    if (topic.includes('Full')) icon = '📋';
    else if (topic.includes('वैदिक') || topic.includes('Classical')) icon = '🏛️';
    else if (topic.includes('व्याकरण') || topic.includes('Poetry')) icon = '📖';
    else if (topic.includes('दर्शन') || topic.includes('Logic')) icon = '🧠';
    else if (topic.includes('साहित्य') || topic.includes('Fiction')) icon = '🪷';
    else if (topic.includes('अन्यानि') || topic.includes('Ethics')) icon = '⚖️';

    coreHtml += `
      <div class="analytics-item">
        <div class="analytics-header">
          <span>${icon} <span style="font-family: var(--font-skt);">${topic}</span> <span style="font-size:0.75rem; color:var(--text-light); font-weight:400; margin-left:4px;">(${tests.length} tests)</span></span>
          <span class="pct" title="Last ${ANALYTICS_RECENT_LIMIT} attempts">${avgPct}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill ${colorClass}" style="width: 0%" data-target="${avgPct}%"></div></div>
      </div>`;
    }
  });

  containerCore.innerHTML = hasCoreData ? coreHtml : `<div style="text-align:center; color:var(--text-light); font-size:0.85rem; padding: 10px;">No ${activeCoreName} tests taken yet.</div>`;

  // ===================================
  // 2. BUILD THE PAPER 1 TAB (Sanskrit-Style Order)
  // ===================================
  let p1Html = ''; let hasP1Data = false;

  // A. Process Full Mocks First (Stays at the very top)
  const p1FullTests = history.filter(h => h.name && h.name.startsWith('1st Paper Full sets'));
  if (p1FullTests.length > 0) {
    hasP1Data = true;
    const recent = p1FullTests.slice(0, ANALYTICS_RECENT_LIMIT);
    const avgPct = Math.round(recent.reduce((sum, h) => sum + h.pct, 0) / recent.length);
    let colorClass = avgPct >= 75 ? 'fill-green' : (avgPct >= 50 ? 'fill-orange' : 'fill-red');
    p1Html += `
        <div class="analytics-item">
          <div class="analytics-header">
            <span>📊 <span style="font-family: var(--font-sans); font-weight: 700;">Paper 1 Full Mocks</span> <span style="font-size:0.75rem; color:var(--text-light); font-weight:400; margin-left:4px;">(${p1FullTests.length} tests)</span></span>
            <span class="pct" title="Last ${ANALYTICS_RECENT_LIMIT} attempts">${avgPct}%</span>
          </div>
          <div class="progress-track"><div class="progress-fill ${colorClass}" style="width: 0%" data-target="${avgPct}%"></div></div>
        </div>`;
  }

  // B. Process Topic-Wise Tests (Strict Syllabus Tab Order)
  // 🚀 FIX: This exactly mimics the Sanskrit logic. Order them here exactly how they appear in your Google Sheet tabs!
  const p1Subjects = [
    { name: 'Teaching Aptitude', icon: '👨‍🏫' },
    { name: 'Research Aptitude', icon: '🔍' },
    { name: 'Comprehension', icon: '📄' },
    { name: 'Communication', icon: '💬' },
    { name: 'Mathematical Reasoning', icon: '🧮' },
    { name: 'Logical Reasoning', icon: '🧠' },
    { name: 'Data Interpretation', icon: '📈' },
    { name: 'ICT', icon: '💻' },
    { name: 'People, Development and Environment', icon: '🌍' },
    { name: 'Higher Education System', icon: '🎓' }
  ];

  p1Subjects.forEach(sub => {
    // Look specifically for tests that contain this exact tab name
    const subjectTests = history.filter(h => h.name && h.name.includes(`1st Paper Topic-wise - ${sub.name}`));
    
    if (subjectTests.length > 0) {
      hasP1Data = true;
      const recent = subjectTests.slice(0, ANALYTICS_RECENT_LIMIT);
      const avgPct = Math.round(recent.reduce((sum, h) => sum + h.pct, 0) / recent.length);
      let colorClass = avgPct >= 75 ? 'fill-green' : (avgPct >= 50 ? 'fill-orange' : 'fill-red');
      
      p1Html += `
        <div class="analytics-item">
          <div class="analytics-header">
            <span>${sub.icon} <span style="font-family: var(--font-sans);">${sub.name}</span> <span style="font-size:0.75rem; color:var(--text-light); font-weight:400; margin-left:4px;">(${subjectTests.length} tests)</span></span>
            <span class="pct" title="Last ${ANALYTICS_RECENT_LIMIT} attempts">${avgPct}%</span>
          </div>
          <div class="progress-track"><div class="progress-fill ${colorClass}" style="width: 0%" data-target="${avgPct}%"></div></div>
        </div>`;
    }
  });

  containerP1.innerHTML = hasP1Data ? p1Html : '<div style="text-align:center; color:var(--text-light); font-size:0.85rem; padding: 10px;">No Paper 1 tests taken yet.</div>';

  // Trigger animation for the currently active tab
  setTimeout(() => {
    const activeContainer = document.getElementById('analytics-paper1').style.display !== 'none' ? containerP1 : containerCore;
    const fills = activeContainer.querySelectorAll('.progress-fill');
    fills.forEach(fill => fill.style.width = fill.getAttribute('data-target'));
  }, 100);
}

// Feature: Dropdown Filter Notes & Videos by Topic
function filterNotes() {
  const selected = document.getElementById('notes-filter').value;
  document.querySelectorAll('#notes-links-grid .note-card').forEach(card => {
    if (selected === 'all' || card.getAttribute('data-topic') === selected) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function filterVideos() {
  const selected = document.getElementById('videos-filter').value;
  document.querySelectorAll('#videos-links-grid .video-card').forEach(card => {
    if (selected === 'all' || card.getAttribute('data-topic') === selected) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// 🚀 NEW: Filter Mock Tests by Google Sheet Tab Name!
function filterSets() {
  const selected = document.getElementById('sets-filter').value;
  document.querySelectorAll('#sets-grid .test-cat-card').forEach(card => {
    if (selected === 'all' || card.getAttribute('data-topic') === selected) {
      card.style.display = ''; // Uses flex because your cards use flexbox internally
    } else {
      card.style.display = 'none';
    }
  });
}

// === CONTACT FORM ===
function submitContactForm() {
  const msg = document.getElementById('cf-msg').value.trim();
  
  if (!msg) { 
    showToast('⚠️ Please type a message first.'); 
    return; 
  }
  
  // 1. Dynamically grab the student's name if they are logged in
  let studentName = "a Student";
  if (currentUser && currentUser.dbData && currentUser.dbData.name) {
    studentName = currentUser.dbData.name;
  }

  // 2. Format the final message exactly as requested
  const finalMessage = `Hi, I am ${studentName},\n\n${msg}`;
  
  // 3. Launch WhatsApp using Master Number
  const encodedMessage = encodeURIComponent(finalMessage);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
  
  // Clear the box after sending
  document.getElementById('cf-msg').value = '';
}

// ==========================================
// === COURSES ENGINE (SINGLE SOURCE OF TRUTH) ===
// ==========================================
// ==========================================
// === COURSES ENGINE (SINGLE SOURCE OF TRUTH) ===
// ==========================================
const myCourses = [
  
  {
    title: "Combo Mock Test Pass",
    subtitle: "1st Paper + Sanskrit Paper 2",
    isFree: false,
    duration: "6 Months",
    level: "All Levels",
    videos: "15,000+ Questions",
    desc: "Ultimate practice bundle. Get full access to both General Paper 1 and Sanskrit Paper 2 mock tests, PYQs, and analytics.",
    features: [
      "✅ Unlimited access to ALL 1st Paper Tests, Which includes 5,000+ questions (40+ full sets, 150+ topic-wise sets)",
      "✅ Unlimited access to ALL Sanskrit (Code 25) Tests, Which includes 10,000+ questions (30+ full sets, 350+ topic-wise sets)",
      "🤖 Get access to our special 🧠 AI Booster Mock Engine. Which analyses your weakest topics and generates a set of custom questions targeting your weakest topics.",
      "✅ Save difficult questions to your Cloud Vault",
      "✅ Subject-wise Performance Analytics",
      "✅ Practice Official UGC NET Previous Year Questions",
      "✅ Pass validity- 6 months (180 days)",
      "✅ You will get access to all questions over a period of six months."
    ],
    price: "₹119",
    originalPrice: "₹339",
    btnText: "Get Combo Pass",
    link: "text=Hello! I want to buy the Combo Mock Test Pass."
  },


  {
    title: "General Paper 1 Mock Pass",
    subtitle: "Topic-wise & Full Mock Tests For Sanskrit, Bengali, Philosophy and all other arts subjects",
    isFree: false,
    duration: "6 Months",
    level: "All Levels",
    videos: "5,000+ Questions",
    desc: "Dedicated mock tests for UGC NET Paper 1. For Sanskrit, Bengali, Philosophy and all other arts subjects.",
    features: [
      "✅ Unlimited access to ALL 1st Paper Tests, Which includes 5,000+ questions (40+ full sets, 150+ topic-wise sets)",
      "✅ Topic-wise tests for All 10 Units with explanation.",
      "🤖 Get access to our special 🧠 AI Booster Mock Engine. Which analyses your weakest topics and generates a set of custom questions targeting your weakest topics.",
      "✅ Save difficult questions to your Cloud Vault",
      "✅ Subject-wise Performance Analytics",
      "✅ Practice Official UGC NET Previous Year Questions",
      "✅ Pass validity- 6 months (180 days)",
      "✅ You will get access to all questions over a period of six months."
    ],
    price: "₹59",
    originalPrice: "₹149",
    btnText: "Get General Pass",
    link: "text=Hello! I want to buy the General Paper 1 Mock Pass."
  },


  {
    title: "Sanskrit Mock Test Pass",
    subtitle: "Topic-wise & Full Mock Tests",
    isFree: false,
    duration: "6 Months",
    level: "All Levels",
    videos: "10,000+ Questions",
    desc: "Comprehensive test series covering all 10 units of Paper 2. Includes detailed explanations and performance analytics.",
    features: [
      "✅ Unlimited access to ALL Sanskrit (Code 25) Tests, Which includes 10,000+ questions (30+ full sets, 350+ topic-wise sets)",
      "✅ Topic-wise tests for All 10 Units",
      "🤖 Get access to our special 🧠 AI Booster Mock Engine. Which analyses your weakest topics and generates a set of custom questions targeting your weakest topics.",
      "✅ Save difficult questions to your Cloud Vault",
      "✅ Subject-wise Performance Analytics",
      "✅ Practice Official UGC NET Previous Year Questions",
      "✅ Pass validity- 6 months (180 days)",
      "✅ You will get access to all questions over a period of six months."
    ],
    price: "₹89",
    originalPrice: "₹199",
    btnText: "Get Sanskrit Pass",
    link: "text=Hello! I want to buy the Sanskrit Mock Test Pass."
  },

  // {
  //   title: "NTA NET Sanskrit Complete Batch",
  //   subtitle: "Full syllabus | Live sessions | Doubt clearing",
  //   isFree: false,
  //   duration: "6 Months",
  //   level: "All Levels",
  //   videos: "150+ Videos",
  //   desc: "Complete coverage of all 10 units. Weekly live sessions, 100+ mock tests, and personalized doubt clearing.",
  //   features: [
  //     "✅ Live Interactive Classes & Full Recordings",
  //     "✅ Comprehensive PDF Study Notes (Downloadable)",
  //     "✅ Beginner to Advanced levels",
  //     "✅ 100+ Topic-wise Mock Tests & Full Mocks",
  //     "✅ 24/7 Dedicated WhatsApp Doubt Clearing"
  //   ],
  //   price: "₹x,xxx",
  //   originalPrice: "₹x,xxx",
  //   btnText: "Launching soon",
  //   // link: "text=Hello! I want to buy the Complete Batch Pass."
  // },

  // {
  //   title: "Bengali Mock Test Pass",
  //   subtitle: "Topic-wise & Full Mock Tests",
  //   isFree: false,
  //   duration: "6 Months",
  //   level: "All Levels",
  //   videos: "7,000+ Questions",
  //   desc: "Comprehensive test series covering all 10 units of Paper 2. Includes detailed explanations and performance analytics.",
  //   features: [
  //     "✅ Unlimited access to ALL Bengali (Code 19) Tests, Which includes 7,000+ questions (30+ full sets, 250+ topic-wise sets)",
  //     "✅ Topic-wise tests for All 10 Units",
  //     "🤖 Get access to our special 🧠 AI Booster Mock Engine. Which analyses your weakest topics and generates a set of custom questions targeting your weakest topics.",
  //     "✅ Save difficult questions to your Cloud Vault",
  //     "✅ Subject-wise Performance Analytics",
  //     "✅ Practice Official UGC NET Previous Year Questions",
  //     "✅ Pass validity- 6 months (180 days)",
  //     "✅ You will get access to all questions over a period of six months."
  //   ],
  //   price: "₹89",
  //   originalPrice: "₹149",
  //   btnText: "Launching soon",
  //   //link: "text=Hello! I want to buy the Bengali Mock Test Pass."
  // },


  

  {
    title: "Free Foundation Course",
    subtitle: "Start your journey | No payment needed",
    isFree: true,
    duration: "Self-paced",
    level: "Beginners",
    videos: "YouTube",
    desc: "Access introductory videos on our YouTube channel, free PDF notes, and sample practice tests — completely free.",
    features: [],
    price: "FREE",
    originalPrice: "",
    btnText: "Access Free Content →",
    link: "free" 
  }
];

// --- NEW: SMART PURCHASE ROUTER ---
function purchaseCourse(index) {
  const course = myCourses[index];
  if (!course) return;

  // Extract the original message from your myCourses array
  let baseMsg = `Hello! I want to buy the ${course.title}.`;
  if (course.link.includes('text=')) {
    baseMsg = decodeURIComponent(course.link.split('text=')[1]);
  }

  // If the user is logged in, attach their profile details!
  if (currentUser && currentUser.dbData) {
    const name = currentUser.dbData.name || "Student";
    const email = currentUser.email || "";
    baseMsg += `\n\nMy Details:\nName: ${name}\nEmail: ${email}`;
  }

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(baseMsg)}`, '_blank');
}

function renderCourses() {
  let htmlOutput = '';
  
  myCourses.forEach((course, index) => {
    const badge = course.isFree ? '<span class="badge badge-free">Free</span>' : '<span class="badge badge-paid">Paid</span>';
    const headerBg = course.isFree ? 'background:linear-gradient(135deg,#1B5E20,#2E7D32);' : '';
    
        
    let priceDisplay = '';
    if (course.isFree) {
      priceDisplay = '<div class="course-price free-price">FREE</div>';
    } else {
      let discountTag = '';
      if (course.originalPrice) {
        let p1 = parseInt(course.price.replace(/[^0-9]/g, ''));
        let p2 = parseInt(course.originalPrice.replace(/[^0-9]/g, ''));
        if (p1 && p2 && p2 > p1) {
          let pct = Math.round(((p2 - p1) / p2) * 100);
          discountTag = `<span class="discount">${pct}% OFF</span>`;
        }
      }
      priceDisplay = `<div class="course-price"><span class="current">${course.price}</span> <span class="og">${course.originalPrice}</span> ${discountTag}</div>`;
    }
    
    // --- NEW DUAL BUTTON LOGIC ---
    let buttonHtml = '';
    if (course.isFree) {
      buttonHtml = `<button class="btn btn-gold" style="justify-content:center;width:100%;margin-top:auto;" onclick="navigate('${course.link}')">${course.btnText}</button>`;
    } else {
      buttonHtml = `
        <div style="display: flex; gap: 10px; margin-top: auto;">
          <button class="btn btn-outline" style="flex: 1; justify-content: center; padding: 10px 12px;" onclick="showCourseDetails(${index})">Details</button>
          <button class="btn btn-primary" style="flex: 1.5; justify-content: center; padding: 10px 12px; text-align: center;" onclick="purchaseCourse(${index})">${course.btnText}</button>
        </div>
      `;
    }

    htmlOutput += `
      <div class="course-card">
        <div class="course-header" style="${headerBg}">
          <h3>${course.title}</h3>
          <p>${course.subtitle}</p>
          <div class="course-badge">${badge}</div>
        </div>
        <div class="course-body">
          <div class="course-meta">
            <span>📅 ${course.duration}</span>
            <span>🎯 ${course.level}</span>
            <span>📹 ${course.videos}</span>
          </div>
          <p style="font-size:0.84rem;color:var(--text-mid);line-height:1.6;margin-bottom:16px;">${course.desc}</p>
          ${priceDisplay}
          ${buttonHtml}
        </div>
      </div>
    `;
  });

  const homeGrid = document.getElementById('home-courses-grid');
  const allGrid = document.getElementById('all-courses-grid');
  if (homeGrid) homeGrid.innerHTML = htmlOutput;
  if (allGrid) allGrid.innerHTML = htmlOutput;
}

// --- NEW MODAL INJECTOR ENGINE ---
function showCourseDetails(index) {
  const course = myCourses[index];
  if (!course) return;

  // 1. Populate Header
  document.getElementById('cd-title').textContent = course.title;
  document.getElementById('cd-subtitle').textContent = course.subtitle;
  
  // 2. Populate Meta Tags
  document.getElementById('cd-meta').innerHTML = `
    <span style="background: #E3F2FD; color: #1565C0; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 700;">📅 ${course.duration}</span>
    <span style="background: #E8F5E9; color: #2E7D32; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 700;">🎯 ${course.level}</span>
    <span style="background: #FFF3E0; color: #E65100; padding: 4px 12px; border-radius: 50px; font-size: 0.75rem; font-weight: 700;">📹 ${course.videos}</span>
  `;

  // 3. Populate Description & Features
  document.getElementById('cd-desc').textContent = course.desc;

  const featuresList = document.getElementById('cd-features');
  featuresList.innerHTML = '';
  if (course.features && course.features.length > 0) {
    course.features.forEach(f => {
      // Split the emoji from the text for a cleaner layout
      featuresList.innerHTML += `
        <li style="font-size: 0.9rem; color: var(--brown); display: flex; gap: 10px; align-items: flex-start;">
          <span style="flex-shrink:0;">${f.substring(0,2)}</span>
          <span style="line-height: 1.5;">${f.substring(2)}</span>
        </li>`;
    });
  }

  // 4. Build the Dynamic Pricing UI for the Sticky Footer
  let priceDisplay = '';
  if (course.originalPrice) {
    let p1 = parseInt(course.price.replace(/[^0-9]/g, ''));
    let p2 = parseInt(course.originalPrice.replace(/[^0-9]/g, ''));
    let pct = Math.round(((p2 - p1) / p2) * 100);
    priceDisplay = `
      <div style="color: var(--text-light); text-decoration: line-through; font-size: 0.9rem; font-weight: 600;">${course.originalPrice}</div>
      <div style="color: var(--saffron); font-size: 1.6rem; font-weight: 800; line-height: 1;">${course.price} <span style="font-size: 0.75rem; background: #FFEBEE; color: #D32F2F; padding: 2px 6px; border-radius: 4px; vertical-align: middle; margin-left: 4px;">${pct}% OFF</span></div>
    `;
  } else {
    priceDisplay = `<div style="color: var(--saffron); font-size: 1.6rem; font-weight: 800;">${course.price}</div>`;
  }
  document.getElementById('cd-price-box').innerHTML = priceDisplay;

  // 5. Connect the Smart Buy Button
  const buyBtn = document.getElementById('cd-buy-btn');
  buyBtn.href = "#"; // Prevent page jump
  buyBtn.onclick = function(e) {
    e.preventDefault();
    purchaseCourse(index);
  };

  // 6. Show the Modal
  document.getElementById('course-details-modal').style.display = 'flex';
}

// ==========================================
// === EXAM SAFETY NET (PREVENT REFRESH) ====
// ==========================================
window.addEventListener('beforeunload', function (e) {
  // If a test is actively running (timer exists, not finished, and test screen is visible)
  if (testState.timerInterval && !testState.finished && document.getElementById('test-interface').style.display === 'block') {
    // This triggers the browser's standard "Changes you made may not be saved" warning
    e.preventDefault();
    e.returnValue = ''; 
  }
});


// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  // 1. Check if user loaded the site with a direct link (e.g., #study)
  let initialPage = window.location.hash.replace('#', '');
  const validPages = ['home', 'study', 'mocktest', 'courses', 'free', 'dashboard', 'about', 'contact'];
  
  if (!initialPage || !validPages.includes(initialPage)) {
    initialPage = 'home';
  }
  
  // 2. Initialize the very first history state so the back button knows where it started
  history.replaceState({ page: initialPage }, '', '#' + initialPage);
  navigate(initialPage, false);
  
  loadDashboard();
  renderCourses();

  // 3. NEW: Start watching all pop-ups to lock the background when they open!
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modalObserver.observe(modal, { attributes: true, attributeFilter: ['style'] });
  });
});


if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('PWA Engine Active!', reg.scope))
        .catch((err) => console.error('PWA Engine Failed!', err));
    });

    // 🚀 NEW: The Integer Engine Receiver
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NEW_VERSION_ACTIVATED') {
        // Get the student's current version (default to 0 if brand new)
        const studentVersion = parseInt(localStorage.getItem('vartika_app_version') || '0');
        const criticalVersion = event.data.criticalVersion;
        const latestVersion = event.data.latestVersion;

        // Upgrade the student's tracker to the newest version
        localStorage.setItem('vartika_app_version', latestVersion.toString());

        // The Engine Check
        if (studentVersion > 0 && studentVersion < criticalVersion) {
          console.log("🔥 CRITICAL UPDATE DETECTED! Forcing screen refresh...");
          window.location.reload();
        } else {
          console.log("✅ Minor background update complete. Will apply naturally.");
        }
      }
    });
}

// ==========================================
// === REPORT ERROR ENGINE ===
// ==========================================
let reportingQuestionIndex = null; // Store which question is being reported

function openReportModal(qIndex) {
  if (!currentUser) {
    showToast("⚠️ Please log in to report questions.");
    return;
  }
  reportingQuestionIndex = qIndex; // Remember the specific question!
  
  // Reset the form
  document.getElementById('report-reason').value = 'Wrong Answer';
  document.getElementById('report-comment').value = '';
  document.getElementById('report-modal').style.display = 'flex';
}

async function submitReport() {
  if (!currentUser || reportingQuestionIndex === null) return;
  const btn = document.getElementById('submit-report-btn');
  btn.textContent = "Sending...";
  btn.disabled = true;

  const reason = document.getElementById('report-reason').value;
  const comment = document.getElementById('report-comment').value.trim();
  const currentQuestion = testState.questions[reportingQuestionIndex]; // Grab the right question

  try {
    await db.collection("reported_errors").add({
      testName: testState.testName,
      questionText: currentQuestion.q,
      options: currentQuestion.options,
      markedAnswer: currentQuestion.answer, 
      reason: reason,
      comment: comment,
      reportedBy: currentUser.email,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: "Pending Review"
    });
    
    showToast("🚩 Report sent! Thank you for helping us improve.");
    document.getElementById('report-modal').style.display = 'none';
  } catch (error) {
    showToast("Error submitting report: " + error.message);
  } finally {
    btn.textContent = "Submit Report";
    btn.disabled = false;
    reportingQuestionIndex = null; // Clear memory after sending
  }
}


// ==========================================
// === 📡 GITHUB CDN NOTIFICATIONS ENGINE ===
// ==========================================

const GITHUB_NOTIFICATIONS_URL = "https://raw.githubusercontent.com/sanskrit-vartika/net/main/notifications.json";
let globalAnnouncements = [];

// Advanced Relative Time Calculator (e.g., "5 mins ago", "Yesterday")
function timeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  if (isNaN(past.getTime())) return dateString; // Fallback for bad data

  const diffInSeconds = Math.floor((now - past) / 1000);
  if (diffInSeconds < 60) return "Just now";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  // Older than a week? Show the exact date
  return past.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// 1. Fetch & Auto-Expire Logic (Run when dashboard loads)
async function initializeNotifications() {
  try {
    // ?t=time bypasses the browser cache so students always see immediate updates
    const response = await fetch(GITHUB_NOTIFICATIONS_URL + "?t=" + new Date().getTime());
    if (!response.ok) throw new Error("Failed to load notifications");
    
    let rawData = await response.json();
    const now = new Date();
    
    // Filter out expired & mistargeted notifications automatically!
    globalAnnouncements = rawData.filter(notif => {
      // 1. Expiry Check
      if (notif.expiresAt && new Date(notif.expiresAt) < now) return false;
      
      // 2. 🚀 Target Audience Check
      if (notif.target && notif.target !== 'all' && notif.target !== currentCoreSubject) return false;
      
      return true; // Keep if it passes both checks!
    });

    checkRedDot();
  } catch (error) {
    console.error("GitHub notification sync failed:", error);
  }
}

// 2. Logic to show/hide the Red Dot (Zero Firebase Reads!)
function checkRedDot() {
  const bellDot = document.getElementById('bell-dot');
  if (!bellDot || globalAnnouncements.length === 0) return;
  
  // Use the exact timestamp of the newest post as the Unique ID
  const newestNotifTime = globalAnnouncements[0].id; 
  const lastReadTimestamp = localStorage.getItem('vartika_last_read_notif') || "1970-01-01T00:00:00.000Z";
  
  // If the newest post is newer than the last time they opened the bell, show the dot!
  if (new Date(newestNotifTime) > new Date(lastReadTimestamp)) {
    bellDot.style.display = 'block';
  } else {
    bellDot.style.display = 'none';
  }
}

// 3. Render the UI when the user clicks the Bell
function openNotifications() {
  document.getElementById('notification-modal').style.display = 'flex';
  const feed = document.getElementById('announcement-feed');
  feed.innerHTML = '';

  if (globalAnnouncements.length === 0) {
    feed.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 30px;">📭 No recent announcements.</p>';
    return;
  }

  // Hide the red dot and save the timestamp so it stays hidden
  const newestNotifTime = globalAnnouncements[0].id;
  localStorage.setItem('vartika_last_read_notif', newestNotifTime);
  document.getElementById('bell-dot').style.display = 'none';

  // Priority color tags
  const tagStyles = {
    'update': 'background: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9;',
    'offer': 'background: #FFF3E0; color: #E65100; border: 1px solid #FFE0B2;',
    'alert': 'background: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2;'
  };

  // Build the beautiful UI feed
  globalAnnouncements.forEach(notif => {
    const style = tagStyles[notif.type] || tagStyles['update'];
    const displayTime = timeAgo(notif.id);
    
    // Action Button Logic
    let btnHtml = '';
    if (notif.btnText && notif.btnLink) {
      btnHtml = `<a href="${escapeHTML(notif.btnLink)}" target="_blank" class="btn btn-sm" style="background: var(--saffron); color: white; display: inline-block; margin-top: 10px; text-decoration: none; font-size: 0.8rem; padding: 6px 14px; border-radius: 4px;">${escapeHTML(notif.btnText)}</a>`;
    }

    // 🎨 Template 1: Modern Minimalist
  let accentColor = notif.type === 'alert' ? '#D32F2F' : (notif.type === 'offer' ? '#E65100' : '#2E7D32');
  
  feed.innerHTML += `
    <div style="padding: 16px 20px; background: #fff; border-radius: 8px; margin-bottom: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border-left: 5px solid ${accentColor}; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size:0.7rem; color: ${accentColor}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${notif.type || 'Update'}</span>
        <span style="font-size:0.75rem; color:#9E9E9E; font-weight: 500;">${displayTime}</span>
      </div>
      <h4 style="color: var(--text-dark); margin-bottom: 6px; font-size: 1.05rem; font-weight: 700;">${escapeHTML(notif.title)}</h4>
      <p style="font-size: 0.85rem; color: var(--text-mid); white-space: pre-wrap; line-height: 1.5;">${escapeHTML(notif.desc)}</p>
      ${btnHtml}
    </div>
  `;
  });
}

// ==========================================
// === EXPIRY RENEWAL ACTION ===
// ==========================================
function claimRenewalDiscount() {
  document.getElementById('expiry-modal').style.display = 'none';
  if (!currentUser) return;
  
  const studentName = currentUser.dbData.name || "Student";
  const studentEmail = currentUser.email;
  
  // NEW: Read the exact pass name from the pop-up title!
  let passName = "Premium Pass";
  const titleEl = document.getElementById('expiry-pass-name');
  if (titleEl) {
    passName = titleEl.textContent.replace(' Expiring!', '');
  }
  
  // Create a pre-filled WhatsApp message dynamically
  const message = `Hello! I am ${studentName} (${studentEmail}). My ${passName}  and I saw the special renewal discount pop-up. I would like to renew my account!`;
  
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
}

// ==========================================
// === MANUAL DATA REFRESH (Cost: 1 Read) ===
// ==========================================
async function refreshStudentProfile() {
  if (!currentUser || !currentUser.uid) return;
  try {
    const doc = await db.collection("users").doc(currentUser.uid).get();
    if (doc.exists) {
      currentUser.dbData = doc.data();
      loadDashboard(); // Redraw the UI with the fresh data
    }
  } catch (error) {
    console.error("Failed to refresh profile:", error);
  }
}

// ==========================================
// === SMART TEST CONFIRMATION ENGINE ===
// ==========================================
let pendingTestToStart = null;

function promptStartTest(cat, setKey) {
  // 1. Save the details of the test they clicked
  pendingTestToStart = { cat, setKey };
  
  // 2. Format the beautiful title (e.g., "ऋग्वेदः - Set 3")
  const catTitle = catNames ? (catNames[cat] || cat) : cat;
  const fullName = catTitle + " — " + setKey;

  // --- NEW: CALCULATE TIME & QUESTIONS ---
  const targetQuestions = allQuestions[cat][setKey] || [];
  const qCount = targetQuestions.length;
  // Calculate minutes based on your 72 seconds per question rule
  const totalMins = Math.ceil((qCount * 72) / 60); 
  // ---------------------------------------
  
  // 3. Update the UI and show the modal
  document.getElementById('start-test-name').textContent = fullName;
  document.getElementById('start-test-meta').textContent = `${qCount} Questions • ${totalMins} Minutes`;
  
  document.getElementById('start-test-modal').style.display = 'flex';
}

function executeStartTest() {
  // 4. Hide the modal and actually launch the test!
  document.getElementById('start-test-modal').style.display = 'none';
  if (pendingTestToStart) {
    startTest(pendingTestToStart.cat, pendingTestToStart.setKey);
    pendingTestToStart = null; // Clear memory
  }
}

// ==========================================
// === PREMIUM UI INTERACTIONS ===
// ==========================================

// Helper: Converts raw database dates into friendly "Time Ago" text
function timeAgo(dateString) {
  const date = new Date(dateString);
  // If the sheet just has plain text like "Monday", just return that
  if (isNaN(date.getTime())) return dateString; 

  const now = new Date();
  const secondsPast = Math.floor((now - date) / 1000);

  if (secondsPast < 60) return 'Just now';
  if (secondsPast < 3600) return Math.floor(secondsPast / 60) + ' mins ago';
  if (secondsPast < 86400) {
    const hours = Math.floor(secondsPast / 3600);
    return hours === 1 ? '1 hour ago' : hours + ' hrs ago';
  }
  if (secondsPast < 604800) {
    const days = Math.floor(secondsPast / 86400);
    return days === 1 ? 'Yesterday' : days + ' days ago';
  }
  
  // If it's older than 7 days, show a clean date (e.g., "Apr 6, 2026")
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// 1. Dropdown Toggle Logic
function toggleUserDropdown() {
  document.getElementById("user-dropdown").classList.toggle("show");
}

// Close dropdown if user clicks anywhere else on the screen
window.onclick = function(event) {
  if (!event.target.matches('#nav-user-name-btn') && !event.target.closest('#nav-user-name-btn')) {
    const dropdown = document.getElementById("user-dropdown");
    if (dropdown && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  }
}

// 2. Custom Logout Logic
function openCustomLogout() {
  document.getElementById('logout-modal').style.display = 'flex';
  document.getElementById("user-dropdown").classList.remove("show"); // Hide dropdown
}

function executeLogout() {
  document.getElementById('logout-modal').style.display = 'none';
  auth.signOut().then(() => {
    currentUser = null;
    showToast("Logged out successfully");
    navigate('home');
  }).catch(error => {
    console.error("Logout error", error);
    showToast("Error logging out");
  });
}

// 3. Placeholder Dropdown Actions
function showMyProfile() {
  document.getElementById("user-dropdown").classList.remove("show");
  navigate('dashboard');
}

function contactSupport() {
  document.getElementById("user-dropdown").classList.remove("show");
  navigate('contact'); 
}

// ==========================================
// === PWA INSTALLATION ENGINE ===
// ==========================================
let deferredPrompt;

// 1. Catch the browser's native install event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the default browser mini-infobar from appearing automatically
  e.preventDefault();
  // Stash the event so we can trigger it later
  deferredPrompt = e;
  
  // Show our custom "Install App" button in the dropdown
  const installBtn = document.getElementById('install-app-btn');
  if (installBtn) {
    installBtn.style.display = 'block';
  }
});

// 2. The function that runs when they click our custom button
async function installApp() {
  document.getElementById("user-dropdown").classList.remove("show"); // Close dropdown

  if (deferredPrompt) {
    // Show the native browser install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to accept or dismiss
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation response: ${outcome}`);
    
    // We've used the prompt, it cannot be used again
    deferredPrompt = null;
    
    // Hide our custom button since they made a choice
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) installBtn.style.display = 'none';
  }
}

// 3. Listen for successful installation to clean up
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  const installBtn = document.getElementById('install-app-btn');
  if (installBtn) installBtn.style.display = 'none';
  showToast("✅ App installed successfully!");
});

function openHistoryModal() {
  if (!currentUser) { showAuthModal(); return; }
  document.getElementById('history-modal').style.display = 'flex';
}

// ==========================================
// === ⚙️ ACCOUNT SETTINGS ENGINE ===
// ==========================================

function openSettingsModal() {
  if (!currentUser || !currentUser.dbData) {
    showToast("⚠️ Please log in to access settings.");
    showAuthModal();
    return;
  }
  document.getElementById('user-dropdown').classList.remove('show');
  
  const data = currentUser.dbData;
  
  // 1. Populate Account Data
  document.getElementById('set-name').value = data.name || '';
  
  // 🚀 FIX: Pull the saved Core Subject from Firebase
  document.getElementById('set-core-subject').value = data.coreSubject || currentCoreSubject;
  
  // 🚀 FIX: Apply the 1-Day Lock UI to the Subject Dropdown
  const subjMsg = document.getElementById('subject-lock-msg');
  const subjBtn = document.getElementById('btn-edit-subject');
  
  if (data.core_subject_last_updated) {
    const lastEditTime = new Date(data.core_subject_last_updated).getTime();
    const daysPassed = (Date.now() - lastEditTime) / (1000 * 60 * 60 * 24);
    
    if (daysPassed < 1) {
      const daysLeft = Math.ceil(1 - daysPassed);
      subjMsg.innerHTML = `🔒 <strong>Locked:</strong> You can change this again in ${daysLeft} days.`;
      subjMsg.style.display = 'block';
      subjBtn.disabled = true;
      subjBtn.style.opacity = '0.5';
      subjBtn.style.cursor = 'not-allowed';
    } else {
      subjMsg.style.display = 'none';
      subjBtn.disabled = false;
      subjBtn.style.opacity = '1';
      subjBtn.style.cursor = 'pointer';
    }
  } else {
      subjMsg.style.display = 'none';
      subjBtn.disabled = false;
      subjBtn.style.opacity = '1';
  }

  const pd = data.personalDetails || {}; // The Single JSON Object
  document.getElementById('set-dob').value = pd.dob || '';
  document.getElementById('set-gender').value = pd.gender || '';
  document.getElementById('set-address').value = pd.address || '';
  document.getElementById('set-college').value = pd.college || '';

  // 1A. Profile 30-Day Lock Logic
  const profMsg = document.getElementById('profile-lock-msg');
  const profBtn = document.getElementById('btn-edit-profile');
  
  if (data.personal_details_last_updated) {
    // 🚀 FIX: Converts both old numbers and new ISO strings into exact math!
    const lastEditTime = new Date(data.personal_details_last_updated).getTime();
    const daysPassed = (Date.now() - lastEditTime) / (1000 * 60 * 60 * 24);
    
    if (daysPassed < 30) {
      const daysLeft = Math.ceil(30 - daysPassed);
      profMsg.innerHTML = `🔒 <strong>Locked:</strong> You can change this again in ${daysLeft} days.`;
      profMsg.style.display = 'block';
      profBtn.disabled = true;
      profBtn.style.opacity = '0.5';
      profBtn.style.cursor = 'not-allowed';
    } else {
      profMsg.style.display = 'none';
      profBtn.disabled = false;
      profBtn.style.opacity = '1';
      profBtn.style.cursor = 'pointer';
    }
  } else {
      profMsg.style.display = 'none';
      profBtn.disabled = false;
      profBtn.style.opacity = '1';
  }
  
  // 2. WhatsApp 30-Day Lock Logic
  document.getElementById('set-whatsapp').value = data.whatsapp || '';
  const waMsg = document.getElementById('whatsapp-lock-msg');
  const waBtn = document.getElementById('btn-update-wa');
  
  if (data.whatsapp_last_updated) {
    // 🚀 FIX: Converts both old numbers and new ISO strings into exact math!
    const lastEditTime = new Date(data.whatsapp_last_updated).getTime();
    const daysPassed = (Date.now() - lastEditTime) / (1000 * 60 * 60 * 24);
    
    if (daysPassed < 30) {
      const daysLeft = Math.ceil(30 - daysPassed);
      waMsg.innerHTML = `🔒 <strong>Locked:</strong> You can change this again in ${daysLeft} days.`;
      waMsg.style.display = 'block';
      waBtn.disabled = true;
      waBtn.style.opacity = '0.5';
      waBtn.style.cursor = 'not-allowed';
    } else {
      waMsg.style.display = 'none';
      waBtn.disabled = false;
      waBtn.style.opacity = '1';
      waBtn.style.cursor = 'pointer';
    }
  } else {
      waMsg.style.display = 'none';
      waBtn.disabled = false;
      waBtn.style.opacity = '1';
  }

    // 🚀 NEW: Load Email and check the 30-Day Email Lock
  document.getElementById('set-email').value = currentUser.email || '';
  
  const lastEmailUpdate = currentUser.dbData.email_last_updated;
  if (lastEmailUpdate) {
    const daysSinceEmailUpdate = (new Date() - new Date(lastEmailUpdate)) / (1000 * 60 * 60 * 24);
    if (daysSinceEmailUpdate < 30) {
      document.getElementById('btn-edit-email').style.display = 'none';
      const emailMsg = document.getElementById('email-lock-msg');
      emailMsg.textContent = `Locked for ${Math.ceil(30 - daysSinceEmailUpdate)} more days.`;
      emailMsg.style.display = 'block';
    } else {
      document.getElementById('btn-edit-email').style.display = 'block';
      document.getElementById('email-lock-msg').style.display = 'none';
    }
  }

  // 3. Populate Data Vault Status
  const savedLength = data.saved_qs ? data.saved_qs.length : 0;
  document.getElementById('set-vault-text').textContent = `${savedLength} / ${MAX_SAVED_QUESTIONS}`;
  const pct = Math.min(100, Math.round((savedLength / MAX_SAVED_QUESTIONS) * 100));
  document.getElementById('set-vault-bar').style.width = pct + '%';
  
  // 4. Reset Danger Zone
  document.getElementById('wipe-confirm-box').style.display = 'none';
  document.getElementById('wipe-confirm-input').value = '';

  switchSettingsTab('account');
  
  // 🚀 Add these two lines here to ensure it opens locked!
  toggleProfileEdit(false);
  toggleWhatsAppEdit(false);

  document.getElementById('settings-modal').style.display = 'flex';
}

// Mini-Tab Switcher
function switchSettingsTab(tab) {
  document.querySelectorAll('.s-tab').forEach(b => b.classList.remove('active'));
  document.querySelector(`.s-tab[onclick*="${tab}"]`).classList.add('active');
  document.getElementById('set-tab-account').style.display = tab === 'account' ? 'block' : 'none';
  document.getElementById('set-tab-data').style.display = tab === 'data' ? 'block' : 'none';
}

// Save Profile to Cloud
async function savePersonalDetails() {
  const name = document.getElementById('set-name').value.trim();
  const dob = document.getElementById('set-dob').value;
  const gender = document.getElementById('set-gender').value;
  const address = document.getElementById('set-address').value.trim();
  const college = document.getElementById('set-college').value.trim();
  
  if(!name) return showToast("⚠️ Display name cannot be empty");

  try {
    const updates = {
      name: name,
      personalDetails: { dob, gender, address, college },
      personal_details_last_updated: new Date().toISOString() // 🚀 FIX: ISO String format
    };
    await db.collection('users').doc(currentUser.uid).update(updates);
    
    // Update local memory so we don't have to spend a Firebase Read!
    currentUser.dbData.name = name;
    currentUser.dbData.personalDetails = updates.personalDetails;
    currentUser.dbData.personal_details_last_updated = updates.personal_details_last_updated;
    
    updateNavUI(currentUser, name);
    if (currentPage === 'dashboard') document.getElementById('display-name').textContent = name;
    
    showToast("✅ Profile details saved successfully!");
    toggleProfileEdit(false);
    openSettingsModal(); // 🚀 Refresh modal to instantly trigger the 30-day UI lock
  } catch (e) {
    showToast("Error saving details: " + e.message);
  }
}

// Update WhatsApp with Timestamp
async function updateWhatsAppNumber() {
  const newWA = document.getElementById('set-whatsapp').value.trim();
  if(!newWA) return showToast("⚠️ WhatsApp number cannot be empty");
  
  // 🚀 NEW: Protect the Settings Page from fake numbers too!
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(newWA)) {
    return showToast("⚠️ Please enter a valid 10-digit WhatsApp number.");
  }
  
  try {
    const updates = {
      whatsapp: newWA,
      whatsapp_last_updated: new Date().toISOString() // 🚀 FIX: ISO String format
    };
    await db.collection('users').doc(currentUser.uid).update(updates);
    
    currentUser.dbData.whatsapp = newWA;
    currentUser.dbData.whatsapp_last_updated = updates.whatsapp_last_updated;
    
    showToast("✅ WhatsApp number updated securely!");
    openSettingsModal(); // Refresh modal to instantly trigger the 30-day UI lock
  } catch(e) {
    showToast("Error updating WhatsApp: " + e.message);
  }
}

// ==========================================
// === 🚀 NEW: SECURE EMAIL UPDATE ENGINE ===
// ==========================================

function toggleEmailEdit(isEditing) {
  const input = document.getElementById('set-email');
  input.readOnly = !isEditing;
  input.style.background = isEditing ? '#fff' : '#f9f9f9';
  if (isEditing) input.focus();
  
  document.getElementById('btn-edit-email').style.display = isEditing ? 'none' : 'block';
  document.getElementById('btn-update-email').style.display = isEditing ? 'block' : 'none';
  document.getElementById('btn-cancel-email').style.display = isEditing ? 'block' : 'none';
}

async function updateLoginEmail() {
  const newEmail = document.getElementById('set-email').value.trim().toLowerCase();
  
  if (!newEmail || !newEmail.includes('@')) {
    return showToast("⚠️ Please enter a valid email address.");
  }
  if (newEmail === currentUser.email) {
    return toggleEmailEdit(false);
  }

  // Double check our Strict Whitelist
  const allowedDomains = ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com', '@icloud.com'];
  if (!allowedDomains.some(domain => newEmail.endsWith(domain))) {
    return showToast("⚠️ Please use a valid Google, Yahoo, Microsoft, or Apple email.");
  }

  const btn = document.getElementById('btn-update-email');
  btn.textContent = "Saving..."; btn.disabled = true;

  try {
    // 1. Tell Firebase Auth to change the core login identity
    await auth.currentUser.updateEmail(newEmail);
    
    // 2. If successful, lock it for 30 days in the database
    const updates = { email_last_updated: new Date().toISOString() };
    await db.collection('users').doc(currentUser.uid).update(updates);
    
    currentUser.dbData.email_last_updated = updates.email_last_updated;
    showToast("✅ Login Email updated securely!");
    
    openSettingsModal(); // Refresh UI to trigger the lock
  } catch(e) {
    // 🛑 THE SECURITY TRAP: If their login session is too old, Firebase blocks it!
    if (e.code === 'auth/requires-recent-login') {
      showToast("🔒 Security Alert: Please Log Out and Log Back In to change your email.");
    } else {
      showToast("Error updating email: " + e.message);
    }
  }
  
  btn.textContent = "Save"; btn.disabled = false;
  toggleEmailEdit(false);
}

async function sendPasswordResetFromSettings() {
  try {
    // Sends the reset link safely without forcing them to log out first
    await auth.sendPasswordResetEmail(currentUser.email);
    showToast("📧 Password reset link sent to your email!");
  } catch(e) {
    showToast("Error: " + e.message);
  }
}

// Clear local storage
function clearSettingsDeviceCache() {
  localStorage.removeItem('vartika_free_history');
  showToast("🧹 Device Cache Cleared! Free tests have been reset locally.");
}

// Danger Zone Confirm
function triggerHistoryWipe() {
  document.getElementById('wipe-confirm-box').style.display = 'block';
}

// Danger Zone Execute
async function executeHistoryWipe() {
  const input = document.getElementById('wipe-confirm-input').value.trim();
  if (input !== "DELETE") {
    showToast("⚠️ Type DELETE exactly to confirm.");
    return;
  }
  
  try {
    const updates = {
      history: [],
      streak: { count: 0, lastDate: "" }
    };
    await db.collection('users').doc(currentUser.uid).update(updates);
    
    currentUser.dbData.history = [];
    currentUser.dbData.streak = updates.streak;
    
    document.getElementById('settings-modal').style.display = 'none';
    showToast("🗑️ All test history and analytics have been permanently wiped.");
    
    if (currentPage === 'dashboard') loadDashboard(); // Redraw UI locally
  } catch (e) {
    showToast("Error deleting history: " + e.message);
  }
}

// 🚀 Toggle Profile Edit Mode
function toggleProfileEdit(isEditing) {
  const fields = ['set-name', 'set-dob', 'set-address', 'set-college'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (isEditing) { el.removeAttribute('readonly'); el.style.background = '#fff'; }
    else { el.setAttribute('readonly', 'true'); el.style.background = '#f9f9f9'; }
  });
  
  const gender = document.getElementById('set-gender');
  gender.disabled = !isEditing;
  gender.style.background = isEditing ? '#fff' : '#f9f9f9';

  document.getElementById('profile-view-actions').style.display = isEditing ? 'none' : 'flex';
  document.getElementById('profile-edit-actions').style.display = isEditing ? 'flex' : 'none';

  // If they click cancel, revert changes back to database values
  if (!isEditing && currentUser && currentUser.dbData) {
    document.getElementById('set-name').value = currentUser.dbData.name || '';
    const pd = currentUser.dbData.personalDetails || {};
    document.getElementById('set-dob').value = pd.dob || '';
    document.getElementById('set-gender').value = pd.gender || '';
    document.getElementById('set-address').value = pd.address || '';
    document.getElementById('set-college').value = pd.college || '';
  }
}

// 🚀 Toggle WhatsApp Edit Mode
function toggleWhatsAppEdit(isEditing) {
  const wa = document.getElementById('set-whatsapp');
  if (isEditing) { wa.removeAttribute('readonly'); wa.style.background = '#fff'; wa.focus(); }
  else { wa.setAttribute('readonly', 'true'); wa.style.background = '#f9f9f9'; }

  document.getElementById('btn-edit-wa').style.display = isEditing ? 'none' : 'block';
  document.getElementById('btn-update-wa').style.display = isEditing ? 'block' : 'none';
  document.getElementById('btn-cancel-wa').style.display = isEditing ? 'block' : 'none';

  // If they click cancel, revert to DB value
  if (!isEditing && currentUser && currentUser.dbData) {
    document.getElementById('set-whatsapp').value = currentUser.dbData.whatsapp || '';
  }
}

// 🚀 Toggle Core Subject Edit Mode
function toggleSubjectEdit(isEditing) {
  const subj = document.getElementById('set-core-subject');
  if (isEditing) { subj.removeAttribute('disabled'); subj.style.background = '#fff'; subj.focus(); }
  else { subj.setAttribute('disabled', 'true'); subj.style.background = '#f9f9f9'; }

  document.getElementById('btn-edit-subject').style.display = isEditing ? 'none' : 'block';
  document.getElementById('btn-update-subject').style.display = isEditing ? 'block' : 'none';
  document.getElementById('btn-cancel-subject').style.display = isEditing ? 'block' : 'none';

  if (!isEditing && currentUser && currentUser.dbData) {
    document.getElementById('set-core-subject').value = currentUser.dbData.coreSubject || currentCoreSubject;
  }
}

// 🚀 Update Core Subject & Lock it!
async function updateCoreSubject() {
  const newSubject = document.getElementById('set-core-subject').value;
  if (!newSubject) return;

  try {
    const updates = {
      coreSubject: newSubject,
      core_subject_last_updated: new Date().toISOString()
    };
    await db.collection('users').doc(currentUser.uid).update(updates);

    currentUser.dbData.coreSubject = newSubject;
    currentUser.dbData.core_subject_last_updated = updates.core_subject_last_updated;

    currentCoreSubject = newSubject;
    localStorage.setItem('vartika_core_subject', newSubject);
    
    applyCoreSubjectUI(newSubject); // Instantly rebuild website UI!
    
    // 🚀 DASHBOARD FIX: Force the Analytics chart to recalculate for the new subject instantly!
    if (currentPage === 'dashboard') loadDashboard(); 
    
    showToast(`✅ Workspace changed to ${CORE_SUBJECTS[newSubject].name}!`);
    openSettingsModal(); // Refresh the modal to trigger the 30-day lock
  } catch(e) {
    showToast("Error updating subject: " + e.message);
  }
}

// ==========================================
// === 🛡️ GATEKEEPER & SECURITY ENGINE ===
// ==========================================

function getDeviceUUID() {
  let uuid = localStorage.getItem('vartika_device_uuid');
  if (!uuid) {
    uuid = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('vartika_device_uuid', uuid);
  }
  return uuid;
}

function getBrowserSummary() {
  const ua = navigator.userAgent;
  let browser = "Web Browser"; let os = "Unknown OS";
  if (ua.includes("Firefox")) browser = "Firefox"; 
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "Mac";
  return `${os} | ${browser}`;
}

// 🚀 NEW: Helper to classify the device
function getDeviceCategory() {
  const ua = navigator.userAgent;
  if (ua.includes("Android") || ua.includes("iPhone") || ua.includes("iPad")) return "mobile";
  return "desktop";
}

async function logDeviceActivity() {
  if (!currentUser || !currentUser.dbData) return;
  const uuid = getDeviceUUID();
  const info = getBrowserSummary();
  const category = getDeviceCategory(); // "mobile" or "desktop"
  const now = new Date().toISOString();

  let updates = {};
  
  // 🚀 BOUNCER: Claim this device slot in the database!
  if (!currentUser.dbData.activeDevices || currentUser.dbData.activeDevices[category] !== uuid) {
     updates[`activeDevices.${category}`] = uuid;
     if (!currentUser.dbData.activeDevices) currentUser.dbData.activeDevices = {};
     currentUser.dbData.activeDevices[category] = uuid;
  }

  let logs = currentUser.dbData.deviceLogs || [];
  
  // Anti-Spam: Don't log history if the same device was logged less than 60 mins ago
  let shouldLogHistory = true;
  if (logs.length > 0 && logs[0].uuid === uuid) {
     const diff = (new Date() - new Date(logs[0].timestamp)) / 1000 / 60;
     if (diff < 60) shouldLogHistory = false;
  }

  if (shouldLogHistory) {
     logs.unshift({ uuid, info, timestamp: now });
     if (logs.length > 10) logs.pop(); // Keep array light (Max 10 logs)
     currentUser.dbData.deviceLogs = logs;
     updates.deviceLogs = logs;
  }

  // Only ping Firebase if something actually changed! (Protects Free Tier)
  if (Object.keys(updates).length > 0) {
     try { await db.collection("users").doc(currentUser.uid).update(updates); } catch(e) {}
  }
}

async function dismissWarning() {
  const btn = document.getElementById('warning-dismiss-btn');
  btn.textContent = "Clearing..."; btn.disabled = true;
  try {
     await db.collection("users").doc(currentUser.uid).update({ warningMessage: firebase.firestore.FieldValue.delete() });
     document.getElementById('warning-modal').style.display = 'none';
     if(currentUser && currentUser.dbData) delete currentUser.dbData.warningMessage;
  } catch(e) {
     alert("Error clearing warning: " + e.message);
  } finally {
     btn.textContent = "I Understand"; btn.disabled = false;
  }
}

// ==========================================
// 🚀 NEW: PASSWORD VISIBILITY TOGGLE
// ==========================================
const togglePasswordBtn = document.getElementById('toggle-password');
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener('click', function () {
    const passwordInput = document.getElementById('auth-password');
    
    // If it's a password (dots), change it to text. Otherwise, change it back to password.
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      this.textContent = '🙈'; // Change icon to the "hide" monkey
    } else {
      passwordInput.type = 'password';
      this.textContent = '👁️'; // Change icon back to the eye
    }
  });
}

// ==========================================
// 🚀 NEW: AUTO-UPDATE WHATSAPP IN HTML
// ==========================================
// This grabs your Master WhatsApp number from the top of the file and puts it on the Contact page
const waDisplay = document.getElementById('ui-whatsapp-display');
if (waDisplay) {
  // Adds a plus sign for formatting: +918172063129
  waDisplay.textContent = "+" + WHATSAPP_NUMBER; 
}

// ==========================================
// 🚀 NEW: AUTO-UPDATE FREE TRIAL DAYS IN HTML
// ==========================================
const trialDisplay = document.getElementById('ui-trial-days-display');
if (trialDisplay) {
  trialDisplay.textContent = FREE_TRIAL_DAYS;
}

// ==========================================
// 🚀 NEW: SUSPENDED ACCOUNT SUPPORT (SMART MESSAGE)
// ==========================================
function contactSupportSuspended() {
  let userDetails = "\n\nMy Details:\nName: N/A\nEmail: N/A\nReg. Phone: N/A";
  
  // Grab the exact details we saved in the vault right before kicking them out!
  if (window.tempSuspendedUser) {
    userDetails = `\n\nMy Details:\nName: ${window.tempSuspendedUser.name}\nEmail: ${window.tempSuspendedUser.email}\nReg. Phone: ${window.tempSuspendedUser.phone}`;
  } 
  // Backup fallback just in case
  else if (currentUser) {
    const name = (currentUser.dbData && currentUser.dbData.name) ? currentUser.dbData.name : "N/A";
    const email = currentUser.email || "N/A";
    const phone = (currentUser.dbData && currentUser.dbData.whatsapp) ? currentUser.dbData.whatsapp : "N/A";
    userDetails = `\n\nMy Details:\nName: ${name}\nEmail: ${email}\nReg. Phone: ${phone}`;
  }
  
  const baseMsg = "Hello, my account has been suspended. I would like to request a review." + userDetails;
  
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(baseMsg)}`, '_blank');
}