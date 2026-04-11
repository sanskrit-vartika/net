
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

// 3. Global App Data
let currentUser = null;
let isSignUpMode = false;

// 4. The "Master Launch Switch" (Change this date to your actual Launch Day + 7 days)
const LAUNCH_PROMO_END_DATE = new Date("2030-05-01T00:00:00Z"); 

// 5. THE MASTER ADMIN EMAIL
const ADMIN_EMAIL = "enquiry.sanskritvartika@gmail.com";

// 6. TESTING SWITCH: Require Email Verification?
const REQUIRE_EMAIL_VERIFICATION = false; // Change to true before official public launch!

// 7. TRIAL SETTINGS: How many days free?
const FREE_TRIAL_DAYS = 5; // Change this single number to update the entire website


// --- AUTHENTICATION UI LOGIC ---
function showAuthModal() {
  document.getElementById('auth-modal').style.display = 'flex';
  document.getElementById('auth-error').style.display = 'none';
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
  const actionBtn = document.getElementById('auth-action-btn');
  const switchText = document.getElementById('auth-switch-text');
  const forgotPassBox = document.getElementById('forgot-password-box');
  
  if (isSignUpMode) {
    title.textContent = "Create Account";
    subtitle.textContent = `Start your ${FREE_TRIAL_DAYS}-Day Vartika Param Trial!`;
    nameInput.style.display = 'block';
    if(whatsappInput) whatsappInput.style.display = 'block';
    if(forgotPassBox) forgotPassBox.style.display = 'none';
    actionBtn.textContent = "Sign Up";
    switchText.innerHTML = "Already have an account? <a href='#' onclick='toggleAuthMode()' style='color: var(--saffron); font-weight: bold;'>Log In</a>";
  } else {
    title.textContent = "Welcome Back";
    subtitle.textContent = "Log in to track your scores.";
    nameInput.style.display = 'none';
    if(whatsappInput) whatsappInput.style.display = 'none';
    if(forgotPassBox) forgotPassBox.style.display = 'block';
    actionBtn.textContent = "Log In";
    switchText.innerHTML = "New here? <a href='#' onclick='toggleAuthMode()' style='color: var(--saffron); font-weight: bold;'>Create an account</a>";
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
async function handleAuthAction() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value.trim();
  const whatsapp = document.getElementById('auth-whatsapp').value.trim();
  const errorBox = document.getElementById('auth-error');
  
  if (!email || !password || (isSignUpMode && (!name || !whatsapp))) {
    errorBox.textContent = "Please fill in all fields.";
    errorBox.style.display = 'block';
    return;
  }

  const btn = document.getElementById('auth-action-btn');
  btn.textContent = "Please wait...";
  btn.disabled = true;

  try {
    if (isSignUpMode) {
      // Create Account
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // We always send the email, but we won't strictly enforce clicking it if testing
      try { await user.sendEmailVerification(); } catch(e) {}
      
      // VIP Trial Logic
      let expiryDate = null;
      let isPremium = false;
      if (new Date() < LAUNCH_PROMO_END_DATE) {
        isPremium = true;
        let d = new Date();
        d.setDate(d.getDate() + FREE_TRIAL_DAYS);
        expiryDate = d.toISOString();
      }

      // Create Firestore Profile
      await db.collection("users").doc(user.uid).set({
        name: name,
        email: email,
        whatsapp: whatsapp,
        isPremium: isPremium,
        premiumExpiry: expiryDate,
        createdAt: new Date().toISOString()
      });
      
      // DEV SWITCH LOGIC: Force logout only if verification is strictly required
      if (REQUIRE_EMAIL_VERIFICATION) {
        await auth.signOut(); 
        showToast("Account created! 📧 Please check your email to verify before logging in.");
      } else {
        showToast("Account created! Welcome to the platform.");
      }
      
      document.getElementById('auth-modal').style.display = 'none';
      
    } else {
      // Log In
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      await user.reload(); 
      
      // DEV SWITCH LOGIC: Check verification only if required
      if (REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
        await auth.signOut();
        errorBox.textContent = "⚠️ Please verify your email before logging in. Check your inbox!";
        errorBox.style.display = 'block';
        return;
      }
      
      showToast("Welcome back!");
      document.getElementById('auth-modal').style.display = 'none';
    }
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.style.display = 'block';
  } finally {
    btn.textContent = isSignUpMode ? "Sign Up" : "Log In";
    btn.disabled = false;
  }
}

// --- LISTEN FOR LOGIN CHANGES (REAL-TIME SYNC) ---
let userDocUnsubscribe = null; 
let isFirebaseReady = false; // NEW: Prevents dashboard glitches

// Helper to instantly force the Nav button to update
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
        loginBtn.onclick = showAuthModal;
    }
    if (userMenuBtn) userMenuBtn.style.display = 'none';
    if (bellBtn) bellBtn.style.display = 'none';
  }
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Check verification safely on page load
    try { await user.reload(); } catch(e) {}
    
    // DEV SWITCH LOGIC: Only kick them out if verification is strictly required
    if (REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
      await auth.signOut();
      return; 
    }

    currentUser = user;
    updateNavUI(user, "..."); // Instant UI feedback
    
    // NEW ARCHITECTURE: Fetch once, do not stay connected.
    db.collection("users").doc(user.uid).get().then((doc) => {
      if (doc.exists) {
        currentUser.dbData = doc.data();
        
        // 1. Tell the app Firebase is ready!
        isFirebaseReady = true;

        // 2. Update the Navbar with their real name
        updateNavUI(user, currentUser.dbData.name);
        
        // 3. Unlock Admin Button if they are the boss
        if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          const adminBtn = document.getElementById('nav-admin-link');
          if (adminBtn) adminBtn.style.display = 'block';
        }

        // 4. Update Lock Icons on Mock Tests
        updateTestCardLocks();

        // 5. Finally, load the dashboard if they are on it
        if (currentPage === 'dashboard') loadDashboard(); 
        
      } else {
        // BUG FIX: Catch the race condition for brand new sign-ups!
        setTimeout(() => {
           refreshStudentProfile(); // Try again 1.5 seconds later
           isFirebaseReady = true; 
        }, 1500);
      }
    }).catch(err => console.error("Error fetching profile:", err));

  } else {
    // User is completely logged out (Guest)
    currentUser = null;
    isFirebaseReady = true; 
    
    if (userDocUnsubscribe) {
      userDocUnsubscribe(); 
      userDocUnsubscribe = null;
    }
    
    updateNavUI(null); // Set to "Log In"
    if (currentPage === 'dashboard') loadDashboard();
    
    // FIX: This must be OUTSIDE the if-statement so it runs for brand new guests!
    updateTestCardLocks(); 
  }
});

// ==========================================
// 🚀 FIREBASE CLOUD ENGINE & VIP LOGIC ends

// ==========================================



// === NAVIGATION & UI ===
let isFreeMode = false;
let currentPage = 'home';
let pendingNavigation = null; // NEW: Remembers where the user wanted to go

function navigate(page, addToHistory = true, keepFreeMode = false) {
  // --- NEW: INTERCEPT NAVIGATION IF TEST IS RUNNING ---
  if (testState.timerInterval && !testState.finished && document.getElementById('test-interface').style.display === 'block') {
    pendingNavigation = { page, addToHistory, keepFreeMode };
    document.getElementById('exit-modal').style.display = 'flex';
    return; // Stop the navigation instantly!
  }

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
    
    // Browser History Integration (Saves the Free state!)
    if (addToHistory) {
      history.pushState({ page: page, isFree: isFreeMode }, '', '#' + page);
    }

    // Dynamic Tab Titles
    const titles = { 'home': 'Home', 'study': 'Study Materials', 'mocktest': 'Mock Tests', 'courses': 'Courses', 'free': 'Free Services', 'dashboard': 'Student Dashboard', 'about': 'About Us', 'contact': 'Contact' };
    const pageTitle = (titles[page] || 'Welcome') + ' | संस्कृत-वर्तिका';
    document.title = pageTitle;

    // === NEW: GOOGLE ANALYTICS SPA TRACKING ===
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: '/' + page
      });
    }

    // Update Mobile Bottom Nav
    document.querySelectorAll('.mat-item').forEach(el => el.classList.remove('active'));
    const activeNavBtn = document.getElementById('bnav-' + page);
    if (activeNavBtn) activeNavBtn.classList.add('active');
  }

  // === UPDATE DESKTOP TOP NAV ACTIVE STATE ===
  document.querySelectorAll('.nav-links .nav-btn').forEach(btn => btn.classList.remove('active'));
  
  const topNavMap = {
    'home': 'Home', 'study': 'Study Materials', 'mocktest': 'Study Materials',
    'courses': 'Courses', 'free': 'Free Services', 'dashboard': 'Student Dashboard',
    'about': 'About Us', 'contact': 'Contact', 'admin': '👑 Admin'
  };
  
  let activeText = topNavMap[page];

  // SMART OVERRIDE: If we are on Mock Tests but it's Free Mode, trick the nav bar!
  if (page === 'mocktest' && isFreeMode) {
    activeText = 'Free Services';
  }

  if (activeText) {
    document.querySelectorAll('.nav-links .nav-btn').forEach(btn => {
      if (btn.textContent.trim() === activeText) btn.classList.add('active');
    });
  }
  // ===============================================
  
  if (page === 'dashboard') loadDashboard();
  if (page === 'mocktest') {
    // ONLY show paid categories if we are NOT in free mode
    if (!isFreeMode) showCategories();
    updateTestCardLocks();
  }
  if (page === 'study') {
    if (typeof backToNotesMain === 'function') backToNotesMain();
    if (typeof backToVideosMain === 'function') backToVideosMain();
  }
}

// --- NEW: Modal Control Functions ---
function confirmExitTest() {
  document.getElementById('exit-modal').style.display = 'none';
  clearInterval(testState.timerInterval); // Kill the test timer
  testState.finished = true; // Mark test as finished so it doesn't trigger again
  
  // Resume the navigation they originally requested
  if (pendingNavigation) {
    navigate(pendingNavigation.page, pendingNavigation.addToHistory);
    pendingNavigation = null;
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

// --- NEW: Smart Browser Back Button Listener ---
window.addEventListener('popstate', function(event) {
  
  // 1. Check if the Mobile "More" Drawer is open
  const drawer = document.getElementById('mobileDrawer');
  if (drawer && drawer.classList.contains('open')) {
    toggleMobileDrawer(); // Close the drawer
    history.pushState({ page: currentPage }, '', '#' + currentPage); // Trap the back button
    return; // Stop here!
  }

  // 2. Check if the "Saved Questions" modal is open
  const savedModal = document.getElementById('saved-qs-modal');
  if (savedModal && savedModal.style.display === 'flex') {
    savedModal.style.display = 'none';
    history.pushState({ page: currentPage }, '', '#' + currentPage);
    return;
  }

  // 3. Check if the "Submit Warning" modal is open
  const submitModal = document.getElementById('submit-modal');
  if (submitModal && submitModal.style.display === 'flex') {
    submitModal.style.display = 'none';
    history.pushState({ page: currentPage }, '', '#' + currentPage);
    return;
  }

  // 4. Check if the "Leave Test" warning is already open
  const exitModal = document.getElementById('exit-modal');
  if (exitModal && exitModal.style.display === 'flex') {
    cancelExitTest(); // Run your existing cancel function
    return;
  }

  // 5. Check if the Notification modal is open
  const notifyModal = document.getElementById('notification-modal');
  if (notifyModal && notifyModal.style.display === 'flex') {
    notifyModal.style.display = 'none';
    history.pushState({ page: currentPage }, '', '#' + currentPage);
    return;
  }

  // 6. Check if the Logout modal is open
  const logoutModal = document.getElementById('logout-modal');
  if (logoutModal && logoutModal.style.display === 'flex') {
    logoutModal.style.display = 'none';
    history.pushState({ page: currentPage }, '', '#' + currentPage);
    return;
  }

  // 7. If the screen is clear, do normal navigation!
  if (event.state && event.state.page) {
    // Retrieve the free mode flag from the browser's history
    const wasFree = event.state.isFree || false;
    navigate(event.state.page, false, wasFree);
  } else {
    navigate('home', false);
  }

  // Check if the Start Test modal is open
  const startTestModal = document.getElementById('start-test-modal');
  if (startTestModal && startTestModal.style.display === 'flex') {
    startTestModal.style.display = 'none';
    const wasFree = (event.state && event.state.isFree) || false;
    history.pushState({ page: currentPage, isFree: wasFree }, '', '#' + currentPage);
    return;
  }
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
  document.getElementById('mobileDrawer').classList.toggle('open');
  document.getElementById('mobileDrawerOverlay').classList.toggle('open');
}

// === STUDY TABS ===
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const btn = document.querySelector(`.tab-btn[onclick*="${tab}"]`);
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

// 1. THE PHONEBOOK: Paste your individual Google Sheet URLs here
const TEST_DATABASE_URLS = {
  'vedic': 'https://script.google.com/macros/s/AKfycby2KLerDt9aHOKPU2PT3ugptNxoaslcgrmbR0REDn2OMSyVXdV_qpS2fKCuNROmDbQKZA/exec',
  'grammar': 'https://script.google.com/macros/s/AKfycbyZItA0HY3SpL_d5QRJ3aoqWvOQ6W29MFmlSHBTJiX-kflkEe6bdiyuA1eJGMpSNgbb/exec',
  'darshan': 'https://script.google.com/macros/s/AKfycbz99sKN9db97mj3uXgERz-Tzv2bWCuwGKTSGi5WU905OgEOYXGIr4OVR5qtisK8fgCx/exec',
  'sahitya': 'https://script.google.com/macros/s/AKfycbx84ZIVDvvNG4yX9nOYBaU_GSKYIjtxflfEke5gbBWIr-Uidwa6Vt4yrSajoE13PGJiPw/exec',
  'full': 'https://script.google.com/macros/s/AKfycbyikVGeVJijVnekPuqULdIQwzLGYFWPEm-bJmGMQviqf1ehUQJp-VfYGZ03SBvnjfHt4A/exec',
  'other': 'https://script.google.com/macros/s/AKfycbwgzQw9hZPBNOznWJUCobVyjN7LYU9-Tf93fZgm4VxWQfKo9Lo9vdYP4HnaqBEgHPU/exec'
};

// NEW: The Dedicated Free Databases
const FREE_DATABASE_URLS = {
  'topic': 'https://script.google.com/macros/s/AKfycbwsDVEqgnkrJNcc8BXg3roqQ7tL5p9trxC-Eu8rtD-hTtfOo64WPTwax7ql6uitgFbXJg/exec',
  'full': 'https://script.google.com/macros/s/AKfycbyzEJOaAOHBalQESrUx3vDyvnPHijXL_6RfLTxu2iy4BAIUeLzagkE-c7_nHMKrDOf1/exec'
};
let freeQuestionsCache = { 'topic': {}, 'full': {} }; // Caches them so they load instantly

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
  full: 'Full Mock Test', vedic: 'वैदिकसाहित्यम्', grammar: 'व्याकरणम्',
  darshan: 'दर्शनम्', sahitya: 'साहित्यम्', other: 'अन्यानि',
  // NEW: Distinct names for the free database
  free_topic: 'Free Topic Test', free_full: 'Free Full Mock'
};

// 2. THE CENTRAL DATA FETCHER (Upgraded with Free Filters & TIMEOUT)
async function fetchQuestions(cat) {
  if (allQuestions[cat]) return true; // Already loaded in memory!

  const targetURL = TEST_DATABASE_URLS[cat];
  if (!targetURL || targetURL.includes('PASTE_')) return false;

  try {
    // --- NEW CODE: The 10-Second Stopwatch ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30000 ms = 30 seconds

    // We pass the "stopwatch" to the fetch request
    const response = await fetch(targetURL, { signal: controller.signal });
    
    // If it succeeds before 10 seconds, we stop the stopwatch!
    clearTimeout(timeoutId); 
    // ----------------------------------------

    const textData = await response.text();
    let data;
    try { data = JSON.parse(textData); } catch (e) { return false; }

    allQuestions[cat] = {};

    data.forEach(row => {
      const originalSet = String(row.set || row.Set || "1").trim();
      const questionText = row.question || row.Question;
      let sheetName = String(row.category || row.Category || "").trim();
      sheetName = sheetName.charAt(0).toUpperCase() + sheetName.slice(1);

      let setKey;
      if (cat === 'full') {
        setKey = (sheetName && !sheetName.toLowerCase().startsWith('sheet')) ? sheetName : "Set " + originalSet;
      } else {
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

        // --- THE MAGIC FILTER: Check if this question is marked as free ---
        const isFreeQuestion = String(row.type || row.Type || "").trim().toLowerCase() === "free";

        allQuestions[cat][setKey].push({
          q: questionText,
          options: [row.opta || row.opt0 || "A", row.optb || row.opt1 || "B", row.optc || row.opt2 || "C", row.optd || row.opt3 || "D"],
          answer: convertedAns,
          explanation: row.explanation || "",
          isFree: isFreeQuestion // Attach the flag!
        });
      }
    });
    return true;
  } catch (error) { 
    // --- NEW CODE: Handle the timeout error silently ---
    if (error.name === 'AbortError') {
      console.warn("Connection timed out. Took longer than 10 seconds.");
    } else {
      console.error("Fetch error:", error); 
    }
    return false; // Returning false tells your UI to hide the spinner and show the error toast
    // ----------------------------------------
  }
}

// --- NEW: THE BOUNCER (Checks VIP Status) ---
function hasPremiumAccess() {
  if (!currentUser || !currentUser.dbData) return false; 
  if (!currentUser.dbData.isPremium) return false; 

  if (currentUser.dbData.premiumExpiry) {
    const expDate = new Date(currentUser.dbData.premiumExpiry);
    if (new Date() > expDate) {
      return false; // Expired
    }
  }
  return true; // Active
}

// Dynamically adds or removes the lock icon from the Mock Test cards
function updateTestCardLocks() {
  const cards = document.querySelectorAll('#test-categories .test-cat-card');
  const isPremium = hasPremiumAccess(); // Evaluates status instantly

  cards.forEach(card => {
    if (isPremium) {
      card.classList.remove('locked-card');
    } else {
      card.classList.add('locked-card');
    }
  });
}

// Standard Mock Test Loader (For Paid/Main Portal)
async function showSets(cat) {
  // 1. SCENARIO A: No Account (Guest) -> Prompt Sign Up
  if (!currentUser) {
    showToast("⚠️ Please create a free account to unlock practice tests!");
    
    isSignUpMode = true; 
    document.getElementById('auth-title').textContent = "Create Account";
    document.getElementById('auth-subtitle').textContent = `Start your ${FREE_TRIAL_DAYS}-Day Free Premium Trial!`;
    document.getElementById('auth-name').style.display = 'block';
    const wa = document.getElementById('auth-whatsapp'); if(wa) wa.style.display = 'block';
    const fp = document.getElementById('forgot-password-box'); if(fp) fp.style.display = 'none';
    document.getElementById('auth-action-btn').textContent = "Sign Up";
    document.getElementById('auth-switch-text').innerHTML = "Already have an account? <a href='#' onclick='toggleAuthMode()' style='color: var(--saffron); font-weight: bold;'>Log In</a>";
    
    showAuthModal();
    return; 
  }

  // 2. SCENARIO B: Logged in, but Free/Expired -> Prompt Upgrade
  if (!hasPremiumAccess()) {
    document.getElementById('premium-lock-modal').style.display = 'flex';
    return; 
  }

  // 3. SCENARIO C: VIP Access Granted -> Load Tests!
  
  // Hide other screens and show the sets grid to make room for Skeletons
  document.getElementById('test-categories').style.display = 'none';
  document.getElementById('test-interface').style.display = 'none';
  document.getElementById('test-results').style.display = 'none';
  
  const setsView = document.getElementById('test-sets-view');
  setsView.style.display = 'block';
  window.scrollTo(0, 0);

  // INJECT THE SKELETONS
  const grid = document.getElementById('sets-grid');
  grid.innerHTML = getSkeletonGrid(6, 'test');
  document.getElementById('sets-category-title').textContent = "Loading Practice Sets...";

  // Fetch data + smooth 400ms artificial delay for a premium feel
  const fetchPromise = fetchQuestions(cat);
  const delayPromise = new Promise(r => setTimeout(r, 400));
  
  await Promise.all([fetchPromise, delayPromise]);
  const success = await fetchPromise;

  if (success) {
    renderSetsUI(cat);
  } else {
    showToast(`The database for ${catNames[cat]} could not be loaded.`);
    showCategories(); // Go back if failed
  }
}

// --- UPGRADED SMART ENGINE: The Free Services Loader ---
async function openFreeSets(mode) {
  // 1. Immediately switch the view & preserve Free Mode
  navigate('mocktest', true, true); 
  
  document.getElementById('test-categories').style.display = 'none';
  document.getElementById('test-interface').style.display = 'none';
  document.getElementById('test-results').style.display = 'none';
  
  const setsView = document.getElementById('test-sets-view');
  setsView.style.display = 'block';
  window.scrollTo(0, 0);

  // 2. Inject Skeletons
  const grid = document.getElementById('sets-grid');
  grid.innerHTML = getSkeletonGrid(6, 'test'); 
  document.getElementById('sets-category-title').textContent = mode === 'full' ? "Free Full Mock Tests" : "Free Topic-wise Tests";
  
  const backBtn = document.getElementById('back-to-cat-btn');
  if(backBtn) backBtn.textContent = '← Back to Free Services';

  // 3. Fetch data from the isolated Free Sheets (if not already cached)
  if (Object.keys(freeQuestionsCache[mode]).length === 0) {
    try {
      const response = await fetch(FREE_DATABASE_URLS[mode]);
      const data = await response.json();
      
      // Organize the incoming data
      data.forEach(row => {
        let setKey = "";
        let displayDesc = "";

        if (mode === 'topic') {
          // E.g., "Rigveda - Set 1"
          setKey = `${row.topic} - Set ${row.set}`;
          displayDesc = row.category; // E.g., वैदिकसाहित्यम्
        } else {
          // E.g., "Free Full Mock - 1"
          setKey = row.set;
          displayDesc = "Complete 100-question mock test";
        }

        if (!freeQuestionsCache[mode][setKey]) {
          freeQuestionsCache[mode][setKey] = { desc: displayDesc, questions: [], catName: mode === 'full' ? 'Free Full' : row.category };
        }

        // Convert answer letter to index
        let rawAns = String(row.answer || "1").trim().toUpperCase();
        let convertedAns = 0;
        if (rawAns === "A" || rawAns === "1") convertedAns = 0;
        else if (rawAns === "B" || rawAns === "2") convertedAns = 1;
        else if (rawAns === "C" || rawAns === "3") convertedAns = 2;
        else if (rawAns === "D" || rawAns === "4") convertedAns = 3;
        else convertedAns = Math.max(0, Number(rawAns) - 1);

        freeQuestionsCache[mode][setKey].questions.push({
          q: row.question,
          options: [row.opt0, row.opt1, row.opt2, row.opt3],
          answer: convertedAns,
          explanation: row.explanation
        });
      });
    } catch (error) {
      console.error("Failed to load free sets:", error);
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:red;">Failed to connect to the free database.</p>';
      return;
    }
  }

  // 4. Render the UI
  grid.innerHTML = '';
  // Read any old Firebase history + the new Local Storage history
  const cloudHistory = (currentUser && currentUser.dbData && currentUser.dbData.history) ? currentUser.dbData.history : [];
  const localHistory = JSON.parse(localStorage.getItem('vartika_free_history') || '[]');
  const history = [...cloudHistory, ...localHistory];
  const availableSets = freeQuestionsCache[mode];

  if (Object.keys(availableSets).length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">Free sets are being updated. Check back soon!</p>';
    return;
  }

  Object.keys(availableSets).forEach(setKey => {
    const setObj = availableSets[setKey];
    
    // Make sure we inject these dynamically into the global 'allQuestions' 
    // so the test engine can find them when the user clicks "Start"
    if (!allQuestions['free_' + mode]) allQuestions['free_' + mode] = {};
    allQuestions['free_' + mode][setKey] = setObj.questions;
    
    // Check if completed
    // Check if completed (Using the unique Free names to prevent mixing with Paid tests)
    const catTitle = mode === 'full' ? catNames['free_full'] : catNames['free_topic'];
    const exactTestName = catTitle + " - " + setKey;
    const isCompleted = history.some(h => h.name === exactTestName);
    const checkmark = isCompleted ? '<div style="position:absolute; top:12px; right:12px; background:#4CAF50; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem;">✓</div>' : '';

    grid.innerHTML += `
      <div class="test-cat-card" style="border: ${isCompleted ? '2px solid #4CAF50' : '2px solid transparent'}" onclick="promptStartTest('free_${mode}', '${setKey}')">
        ${checkmark}
        <div class="test-cat-icon">🎁</div>
        <h3 style="font-size:1.05rem;">${setKey}</h3>
        <p style="font-family: var(--font-skt); font-size: 0.9rem;">${setObj.desc}</p>
        <span class="q-count">${setObj.questions.length} Questions</span>
      </div>
    `;
  });
}

// 3. THE UI RENDERER: Builds the grid of Sets after data is loaded
function renderSetsUI(cat) {

  isFreeMode = false;
if(document.getElementById('back-to-cat-btn')) document.getElementById('back-to-cat-btn').textContent = '← Back to Categories';

  document.getElementById('test-categories').style.display = 'none';
  document.getElementById('test-interface').style.display = 'none';
  document.getElementById('test-results').style.display = 'none';
  
  const setsView = document.getElementById('test-sets-view');
  setsView.style.display = 'block';
  window.scrollTo(0, 0);
  
  const catTitle = catNames[cat] || cat;
  document.getElementById('sets-category-title').textContent = catTitle + " — Practice Sets";
  
  const grid = document.getElementById('sets-grid');
  grid.innerHTML = '';
  
  const categoryData = allQuestions[cat];
  
  if (!categoryData || Object.keys(categoryData).length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">No sets available for this topic yet. Please check back later!</p>';
    return;
  }

  const history = (currentUser && currentUser.dbData && currentUser.dbData.history) ? currentUser.dbData.history : [];

  Object.keys(categoryData).forEach(setKey => {
    const qCount = categoryData[setKey].length;
    
    // Use the perfectly formatted setKey directly
    const displayTitle = setKey;
    const exactTestName = catTitle + " - " + displayTitle;
    
    const isCompleted = history.some(h => h.name === exactTestName);
    const checkmark = isCompleted ? '<div style="position:absolute; top:12px; right:12px; background:#4CAF50; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem;">✓</div>' : '';

    const cardHTML = `
      <div class="test-cat-card" style="border: ${isCompleted ? '2px solid #4CAF50' : '2px solid transparent'}" onclick="promptStartTest('${cat}', '${setKey}')">
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

// --- NEW LOGIC: The Shuffler Brain ---
function shuffleQuestions(array) {
  let shuffled = [...array]; 
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

  document.getElementById('test-sets-view').style.display = 'none';
  document.getElementById('test-interface').style.display = 'block';
  window.scrollTo(0, 0);
  
  document.getElementById('test-title').textContent = testState.testName;
  
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
  // Calculate Hours, Minutes, and Seconds
  const h = Math.floor(testState.timeLeft / 3600);
  const m = Math.floor((testState.timeLeft % 3600) / 60);
  const s = testState.timeLeft % 60;
  
  const el = document.getElementById('test-timer');
  
  // Format to HH:MM:SS with leading zeros
  el.textContent = String(h).padStart(2,'0') + ':' + 
                   String(m).padStart(2,'0') + ':' + 
                   String(s).padStart(2,'0');
                   
  el.classList.toggle('warning', testState.timeLeft < 300);
}

function renderQuestion() {
  const qs = testState.questions;
  const idx = testState.current;
  const q = qs[idx];
  if (!q) return;

  // The question text itself is already safely handled!
  document.getElementById('q-number').textContent = `Question ${idx+1} of ${qs.length}`;
  document.getElementById('q-text').textContent = q.q; 

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
    textDiv.textContent = opt; // Forces the browser to treat your sheet data ONLY as text!

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
  markBtn.innerHTML = isMarked ? '✅ Marked' : '🔖 Mark for Review';

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
  
  renderQuestion();
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
  markBtn.innerHTML = isMarked ? '✅ Marked' : '🔖 Mark for Review';

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
    btn.onclick = () => { testState.current = i; renderQuestion(); };
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

// Feature: Test Summary Warning
function showResults() {
  let unanswered = 0;
  testState.questions.forEach((_, i) => { if (testState.answers[i] === undefined) unanswered++; });

  if (unanswered > 0 && !testState.finished && testState.timeLeft > 0) {
    document.getElementById('submit-modal-text').innerHTML = `You have <strong>${unanswered} unanswered</strong> questions left.<br>Are you sure you want to submit?`;
    document.getElementById('submit-modal').style.display = 'flex';
    return;
  }
  confirmSubmit();
}

function confirmSubmit() {
// Hide the warning modal!
  document.getElementById('submit-modal').style.display = 'none';

  clearInterval(testState.timerInterval);
  testState.finished = true;

  document.getElementById('test-interface').style.display = 'none';
  document.getElementById('test-results').style.display = 'block';
  window.scrollTo(0, 0);

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
    
    if (tName.includes("Full Mock")) subjectGroup = "Full Mocks";
    else if (tName.includes("वैदिकसाहित्यम्")) subjectGroup = "Vedic Sahitya";
    else if (tName.includes("व्याकरणम्")) subjectGroup = "Grammar";
    else if (tName.includes("दर्शनम्")) subjectGroup = "Darshan";
    else if (tName.includes("साहित्यम्")) subjectGroup = "Sahitya";
    else if (tName.includes("अन्यानि")) subjectGroup = "Anyani"; // Fixed!

    // 3. Send all data layers to GA4
    gtag('event', 'mock_test_completed', {
      'test_subject': subjectGroup,      
      'test_name': tName,                
      'test_type': testType,             // Logs "Free" or "Premium"
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
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
          <div class="review-q">Q${i+1}. ${escapeHTML(q.q)}</div>
          <div style="display:flex; gap:8px;">
            <button onclick="openReportModal(${i})" style="background:var(--white); border:1px solid #F44336; border-radius:50px; padding:4px 10px; cursor:pointer; font-weight:600; font-size:0.75rem; transition:0.2s; white-space:nowrap; color:#F44336;" title="Report a mistake in this question">🚩 Report</button>
            <button id="save-btn-${i}" onclick="toggleSaveQuestion(${i})" style="background:var(--white); border:1px solid var(--cream-dark); border-radius:50px; padding:4px 10px; cursor:pointer; font-weight:600; font-size:0.75rem; transition:0.2s; white-space:nowrap; ${btnStyle}">${btnText}</button>
          </div>
        </div>
        <div class="review-ans">${status}${userAns !== undefined ? ` — Your answer: <strong>${escapeHTML(q.options[userAns])}</strong>` : ''}</div>
        <div class="review-ans">✔ Correct answer: <strong>${escapeHTML(q.options[q.answer])}</strong></div>
        ${q.explanation ? `<div class="review-exp">💡 ${escapeHTML(q.explanation)}</div>` : ''}
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
  document.getElementById('test-results').style.display = 'none';
  startTest(testState.category, testState.currentSet);
}
function showCategories() {
  clearInterval(testState.timerInterval);
  document.getElementById('test-sets-view').style.display = 'none';
  document.getElementById('test-interface').style.display = 'none';
  document.getElementById('test-results').style.display = 'none';

  // Smart Routing: Check where the user came from!
  if (isFreeMode) {
    navigate('free'); 
  } else {
    document.getElementById('test-categories').style.display = 'block';
    window.scrollTo(0, 0);
  }
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
  'sahitya': 'साहित्यम्', 'purana': 'पुराणम्', 'dharma': 'धर्मशास्त्रम्', 'other': 'अन्यानि'
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



// --- HELPER: Extracts the 11-character video ID from any YouTube link ---
function getYouTubeID(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
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

      if (year && link) {
        grid.innerHTML += `
          <div class="pyq-card">
            <span class="year" style="font-family: var(--font-sans);">${escapeHTML(year)}</span>
            <p>${escapeHTML(desc)}</p>
            <a href="${encodeURI(link)}" target="_blank" class="btn btn-primary btn-sm">📥 Download</a>
          </div>
        `;
      }
    });
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
  const isFreeTest = name.startsWith('Free Topic Test') || name.startsWith('Free Full Mock');
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
    saved.unshift({ q: q.q, options: q.options, answer: q.answer, explanation: q.explanation });
    showToast("⭐ Question Saved to Cloud!");
    if(btn) { btn.innerHTML = '⭐ Saved'; btn.style.color = 'var(--saffron)'; }
  }
  
  currentUser.dbData.saved_qs = saved;
  await db.collection("users").doc(currentUser.uid).update({ saved_qs: saved });
  renderSavedQuestions(); // Redraw UI locally, 0 Cloud Reads!
}

function renderSavedQuestions() {
  const saved = (currentUser && currentUser.dbData && currentUser.dbData.saved_qs) ? currentUser.dbData.saved_qs : [];
  const statEl = document.getElementById('stat-saved-qs');
  if (statEl) statEl.textContent = saved.length;

  const container = document.getElementById('saved-qs-container');
  if(!container) return;
  
  if (saved.length === 0) {
    container.innerHTML = '<div style="background:var(--white); border:2px dashed var(--cream-dark); border-radius:var(--radius-sm); padding:24px; text-align:center; color:var(--text-light); font-size:0.85rem;">No saved questions yet.</div>';
    return;
  }

  let html = '';
  saved.forEach((sq, i) => {
    html += `
      <div style="background:var(--white); padding:16px 20px; border-radius:var(--radius-sm); border-left:4px solid var(--saffron); box-shadow:0 2px 10px rgba(0,0,0,0.05);">
        <div style="font-family:var(--font-skt); font-weight:600; color:var(--brown); margin-bottom:10px; font-size:0.95rem;">${escapeHTML(sq.q)}</div>
        <div style="font-size:0.8rem; color:#1B5E20; background:#E8F5E9; padding:6px 10px; border-radius:4px; display:inline-block; margin-bottom:8px;">✔ Correct: <strong>${escapeHTML(sq.options[sq.answer])}</strong></div>
        ${sq.explanation ? `<div style="font-size:0.8rem; color:#7B1FA2; font-style:italic; margin-bottom:12px; line-height:1.5;">💡 ${escapeHTML(sq.explanation)}</div>` : ''}
        <div style="text-align:right;"><button onclick="removeSavedQuestion(${i})" style="background:none; border:none; color:#F44336; cursor:pointer; font-size:0.8rem; font-weight:600;">🗑️ Remove</button></div>
      </div>
    `;
  });
  container.innerHTML = html;
}

async function removeSavedQuestion(index) {
  if (!currentUser || !currentUser.dbData) return;
  let saved = currentUser.dbData.saved_qs || [];
  saved.splice(index, 1);
  currentUser.dbData.saved_qs = saved;
  await db.collection("users").doc(currentUser.uid).update({ saved_qs: saved });
  renderSavedQuestions(); // Redraw UI locally, 0 Cloud Reads!
  showToast("Question removed from Cloud");
}

function openSavedQsModal() {
  if (!currentUser) { showAuthModal(); return; }
  renderSavedQuestions();
  document.getElementById('saved-qs-modal').style.display = 'flex';
}

// ==========================================
// === DASHBOARD & DATA (Firebase Cloud) ===
// ==========================================
function loadDashboard() {
        
  // NEW: If Firebase is still booting up, show a loading state!
  if (!isFirebaseReady) {
    document.getElementById('name-setup-box').style.display = 'block';
    document.getElementById('name-setup-box').innerHTML = `
      <div class="spinner" style="margin: 0 auto;"></div>
      <p style="color:var(--text-light); margin-top:16px;">Connecting securely to Cloud...</p>
    `;
    document.getElementById('dashboard-hero').style.display = 'none';
    document.querySelector('.stats-grid').style.display = 'none';
    document.getElementById('history-container').parentElement.style.display = 'none';
    const badgesBox = document.getElementById('badges-container');
    if (badgesBox) badgesBox.parentElement.parentElement.style.display = 'none';
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
    document.getElementById('history-container').parentElement.style.display = 'none';
    const badgesBox = document.getElementById('badges-container');
    if (badgesBox) badgesBox.parentElement.parentElement.style.display = 'none';
    return;
  }

  // STUDENT VIEW (Logged In)
  document.getElementById('name-setup-box').style.display = 'none';
  document.getElementById('dashboard-hero').style.display = 'block';
  document.querySelector('.stats-grid').style.display = 'grid';
  document.getElementById('history-container').parentElement.style.display = 'block';
  
  const badgesBox = document.getElementById('badges-container');
  if (badgesBox) badgesBox.parentElement.parentElement.style.display = 'block';

  document.getElementById('display-name').textContent = currentUser.dbData.name || "Student";


  // --- NEW: UNHIDE DEV SANDBOX FOR ADMIN ---
  const devSandbox = document.getElementById('dev-sandbox');
  if (devSandbox) {
    if (currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      devSandbox.style.display = 'block';
    } else {
      devSandbox.style.display = 'none';
    }
  }

  // --- NEW: RENDER VIP STATUS ON DASHBOARD ---
  const vipBadgeContainer = document.getElementById('student-vip-badge');
  if (vipBadgeContainer) {
    if (currentUser.dbData.isPremium) {
      if (currentUser.dbData.premiumExpiry) {
        const expDate = new Date(currentUser.dbData.premiumExpiry);
        const daysLeft = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft > 0) {
          vipBadgeContainer.innerHTML = `<span style="background: rgba(255,215,0,0.15); color: var(--gold); padding: 6px 16px; border-radius: 50px; font-size: 0.85rem; font-weight: 700; border: 1px solid var(--gold); box-shadow: 0 2px 10px rgba(255,215,0,0.1);">👑 Vartika Param • ${daysLeft} Days Left</span>`;
          // --- NEW: Trigger Expiry Pop-up (Only once per session) ---
          if (daysLeft <= 5) {
            if (!sessionStorage.getItem('expiry_warned')) {
              setTimeout(() => {
                document.getElementById('expiry-days-text').textContent = daysLeft;
                document.getElementById('expiry-modal').style.display = 'flex';
                sessionStorage.setItem('expiry_warned', 'true');
              }, 1000); // 1-second delay so it feels natural after dashboard loads
            }
          }
          // ---------------------------------------------------------
        } else {
          vipBadgeContainer.innerHTML = `<span style="background: rgba(255,82,82,0.15); color: #FF5252; padding: 6px 16px; border-radius: 50px; font-size: 0.85rem; font-weight: 700; border: 1px solid #FF5252;">⚠️ Param Access Expired</span>`;
        }
      } else {
        // Lifetime access (no expiry date set)
        vipBadgeContainer.innerHTML = `<span style="background: rgba(255,215,0,0.15); color: var(--gold); padding: 6px 16px; border-radius: 50px; font-size: 0.85rem; font-weight: 700; border: 1px solid var(--gold); box-shadow: 0 2px 10px rgba(255,215,0,0.1);">👑 Vartika Param • Lifetime Access</span>`;
      }
    } else {
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
    document.getElementById('stat-last').textContent = history[0].date;
    document.getElementById('stat-best').textContent = best + '%';
  } else {
    document.getElementById('stat-avg').textContent = '—';
    document.getElementById('stat-last').textContent = '—';
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
function renderAnalytics() {
  const container = document.getElementById('analytics-container');
  if (!container) return;

  const history = (currentUser && currentUser.dbData && currentUser.dbData.history) ? currentUser.dbData.history : [];
  
  if (history.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:var(--text-light); font-size:0.85rem;">Take a few tests to generate your performance analysis.</div>';
    return;
  }

  // The exact names of your test categories
  const subjects = [
    { name: 'Full Mock Test', icon: '📋' },
    { name: 'वैदिकसाहित्यम्', icon: '🔱' },
    { name: 'व्याकरणम्', icon: '📖' },
    { name: 'दर्शनम्', icon: '🧘' },
    { name: 'साहित्यम्', icon: '🪷' },
    { name: 'अन्यानि', icon: '🌺' }
  ];

  let html = '';
  let hasData = false;

  subjects.forEach(sub => {
    // Find all tests the student took that start with this subject's name
    const subjectTests = history.filter(h => h.name && h.name.startsWith(sub.name));
    
    if (subjectTests.length > 0) {
      hasData = true;
      
      const totalTaken = subjectTests.length;
      
      // THE ROLLING AVERAGE: Take ONLY the 25 most recent tests for the math
      const recentTests = subjectTests.slice(0, 25);
      
      // Calculate the average percentage based ONLY on those 25
      const totalPct = recentTests.reduce((sum, h) => sum + h.pct, 0);
      const avgPct = Math.round(totalPct / recentTests.length);
      
      // Determine the color based on performance
      let colorClass = 'fill-red'; // Under 50%
      if (avgPct >= 75) colorClass = 'fill-green'; // 75% or higher
      else if (avgPct >= 50) colorClass = 'fill-orange'; // 50% to 74%

      html += `
        <div class="analytics-item">
          <div class="analytics-header">
            <span>${sub.icon} <span style="font-family: var(--font-skt);">${sub.name}</span> <span style="font-size:0.75rem; color:var(--text-light); font-weight:400; margin-left:4px;">(${totalTaken} tests)</span></span>
            <span class="pct" title="Based on your last 25 attempts">${avgPct}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${colorClass}" style="width: 0%" data-target="${avgPct}%"></div>
          </div>
        </div>
      `;
    }
  });

  if (!hasData) {
    container.innerHTML = '<div style="text-align:center; color:var(--text-light); font-size:0.85rem;">Take a few topic-wise tests to generate your performance analysis.</div>';
    return;
  }

  container.innerHTML = html;

  // Premium Animation: Wait 100ms, then slide all the progress bars to their targets!
  setTimeout(() => {
    const fills = container.querySelectorAll('.progress-fill');
    fills.forEach(fill => {
      fill.style.width = fill.getAttribute('data-target');
    });
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

// === CONTACT FORM ===
// === CONTACT FORM (WhatsApp Integration) ===
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
  
  // 3. EDIT THIS: Put your actual WhatsApp business number here
  const phone = "918172063129"; 
  
  // 4. Launch WhatsApp
  const encodedMessage = encodeURIComponent(finalMessage);
  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  
  // Clear the box after sending
  document.getElementById('cf-msg').value = '';
}

// ==========================================
// === COURSES ENGINE (SINGLE SOURCE OF TRUTH) ===
// ==========================================
const myCourses = [
  {
    title: "NTA NET Sanskrit — Complete Batch",
    subtitle: "Full syllabus | Live sessions | Doubt clearing",
    isFree: false,
    duration: "6 Months",
    level: "All Levels",
    videos: "150+ Videos",
    desc: "Complete coverage of all 10 units. Weekly live sessions, 100+ MCQs, mock tests, and personalized doubt clearing.",
    price: "₹2,499",
    originalPrice: "₹4,999",
    btnText: "Enroll Now →",
    link: "https://wa.me/YOUR_PHONE_NUMBER?text=Hello! I want to enroll in the Complete Batch." // EDIT THIS LINK
  },
  {
    title: "UGC NET Sanskrit Mock Test Series",
    subtitle: "Topic-wise & Full Mock Tests",
    isFree: false,
    duration: "6 Months",
    level: "All Levels",
    videos: "10,000+ Questions",
    desc: "At less then ₹10 in a month you get- Comprehensive test series covering all 10 units. Includes detailed explanations, performance analytics, and all previous year papers.",
    price: "₹59",
    originalPrice: "₹89",
    btnText: "Enroll Now →",
    link: "https://wa.me/YOUR_PHONE_NUMBER?text=Hello! I want to enroll in the Mock Test Series." 
  },
  
  {
    title: "Free Foundation Course",
    subtitle: "Start your journey | No payment needed",
    isFree: true,
    duration: "Self-paced",
    level: "Beginners",
    videos: "YouTube",
    desc: "Access introductory videos on our YouTube channel, free PDF notes, and sample practice tests — completely free.",
    price: "FREE",
    originalPrice: "",
    btnText: "Access Free Content →",
    link: "free" // Tells the site to navigate to the Free page
  }
];

function renderCourses() {
  let htmlOutput = '';
  
  myCourses.forEach(course => {
    // Styling logic for Free vs Paid courses
    const badge = course.isFree ? '<span class="badge badge-free">Free</span>' : '<span class="badge badge-paid">Paid</span>';
    const headerBg = course.isFree ? 'background:linear-gradient(135deg,#1B5E20,#2E7D32);' : '';
    
    // SMART PRICING ENGINE
    let priceDisplay = '';
    if (course.isFree) {
      priceDisplay = '<div class="course-price free-price">FREE</div>';
    } else {
      let discountTag = '';
      if (course.originalPrice) {
        // Auto-extract numbers from strings like "₹2,499" to calculate the %
        let p1 = parseInt(course.price.replace(/[^0-9]/g, ''));
        let p2 = parseInt(course.originalPrice.replace(/[^0-9]/g, ''));
        
        if (p1 && p2 && p2 > p1) {
          let pct = Math.round(((p2 - p1) / p2) * 100);
          discountTag = `<span class="discount">${pct}% OFF</span>`;
        }
      }
      priceDisplay = `<div class="course-price"><span class="current">${course.price}</span> <span class="og">${course.originalPrice}</span> ${discountTag}</div>`;
    }
    
    // Button logic
    let buttonHtml = '';
    if (course.isFree) {
      buttonHtml = `<button class="btn btn-gold" style="justify-content:center;width:100%;" onclick="navigate('${course.link}')">${course.btnText}</button>`;
    } else {
      buttonHtml = `<a href="${course.link}" target="_blank" class="btn btn-primary" style="justify-content:center;text-align:center;">${course.btnText}</a>`;
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
          <p style="font-size:0.84rem;color:var(--text-mid);line-height:1.6;flex:1;">${course.desc}</p>
          ${priceDisplay}
          ${buttonHtml}
        </div>
      </div>
    `;
  });

  // Inject into both the Homepage and the Courses page!
  const homeGrid = document.getElementById('home-courses-grid');
  const allGrid = document.getElementById('all-courses-grid');
  
  if (homeGrid) homeGrid.innerHTML = htmlOutput;
  if (allGrid) allGrid.innerHTML = htmlOutput;
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
});

// ==========================================
// === UPGRADED ADMIN DASHBOARD ENGINE (Search/Sort/Bulk) ===
// ==========================================
let adminUserList = []; // Master list from Firebase
let currentFilteredUsers = [];

// 1. Fetch data from Firebase ONCE
async function loadAdminDashboard() {
  if (!currentUser || currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    document.getElementById('admin-users-body').innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">⚠️ Access Denied.</td></tr>';
    return;
  }

  document.getElementById('admin-users-body').innerHTML = '<tr><td colspan="7" style="text-align: center;">Fetching data from Cloud...</td></tr>';

  try {
    const snapshot = await db.collection("users").get(); // Get ALL users (we will sort in JS)
    
    adminUserList = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      data.uid = doc.id;
      
      // Calculate Exact Status for Filtering
      data.computedStatus = "free";
      if (data.isPremium) {
        if (data.premiumExpiry) {
          if (new Date(data.premiumExpiry) > new Date()) data.computedStatus = "vip";
          else data.computedStatus = "expired";
        } else {
          data.computedStatus = "vip"; // Lifetime
        }
      }
      adminUserList.push(data);
    });

    filterAndRenderAdminTable(); // Push to the screen!
  } catch (error) {
    document.getElementById('admin-users-body').innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error: ${error.message}</td></tr>`;
  }
}

// 2. The Universal Search, Filter, and Sort Engine
function filterAndRenderAdminTable() {
  const searchQuery = document.getElementById('admin-search').value.toLowerCase();
  const statusFilter = document.getElementById('admin-filter-status').value;
  const sortBy = document.getElementById('admin-sort-by').value;

  // A. Filter the Data
  let filteredList = adminUserList.filter(user => {
    // Search match
    const nameStr = (user.name || "").toLowerCase();
    const emailStr = (user.email || "").toLowerCase();
    const waStr = (user.whatsapp || "").toLowerCase();
    const matchesSearch = nameStr.includes(searchQuery) || emailStr.includes(searchQuery) || waStr.includes(searchQuery);
    
    // Status match
    const matchesStatus = (statusFilter === "all") || (user.computedStatus === statusFilter);

    return matchesSearch && matchesStatus;
  });

  // B. Sort the Data
  filteredList.sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === "oldest") {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    } else if (sortBy === "expiring") {
      // Put lifetime (null expiry) at the bottom, sort dates properly
      let dateA = (a.isPremium && a.premiumExpiry) ? new Date(a.premiumExpiry).getTime() : 9999999999999;
      let dateB = (b.isPremium && b.premiumExpiry) ? new Date(b.premiumExpiry).getTime() : 9999999999999;
      return dateA - dateB;
    }
  });

  currentFilteredUsers = filteredList;

  // C. Render to Screen
  document.getElementById('admin-user-count').textContent = filteredList.length;
  const tbody = document.getElementById('admin-users-body');
  
  if (filteredList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-light);">No students match this criteria.</td></tr>';
    return;
  }

  let html = '';
  filteredList.forEach(data => {
    const dateJoined = data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN') : 'Unknown';
    let vipBadge = '', validityText = '';

    if (data.computedStatus === "free") {
      vipBadge = '<span style="background: #E0E0E0; color: #757575; padding: 4px 8px; border-radius: 50px; font-size: 0.75rem; font-weight: bold;">Free</span>';
      validityText = '<span style="color: #9E9E9E;">—</span>';
    } else if (data.computedStatus === "vip") {
      vipBadge = '<span style="background: #FFF3E0; color: #E65100; padding: 4px 8px; border-radius: 50px; font-size: 0.75rem; font-weight: bold;">👑 Param</span>';
      if (data.premiumExpiry) {
        const daysLeft = Math.ceil((new Date(data.premiumExpiry) - new Date()) / (1000 * 60 * 60 * 24));
        validityText = `<span style="color: #2E7D32; font-weight: 600;">${daysLeft} days left</span><br><span style="font-size:0.7rem; color:var(--text-light);">${new Date(data.premiumExpiry).toLocaleDateString('en-IN')}</span>`;
      } else {
        validityText = `<span style="color: #1976D2; font-weight: 600;">Lifetime Access</span>`;
      }
    } else if (data.computedStatus === "expired") {
      vipBadge = '<span style="background: #FFEBEE; color: #D32F2F; padding: 4px 8px; border-radius: 50px; font-size: 0.75rem; font-weight: bold;">Expired Param</span>';
      validityText = `<span style="color: #D32F2F; font-weight: 600;">Expired</span>`;
    }

    let waLink = data.whatsapp ? `<a href="https://wa.me/${data.whatsapp.replace(/\D/g,'')}" target="_blank" style="color: #25D366; font-weight: bold; text-decoration: underline;">${data.whatsapp}</a>` : '<span style="color: #ccc;">—</span>';

    html += `
      <tr style="border-bottom: 1px solid var(--cream-dark); background: var(--white);">
        <td style="padding: 14px 16px; font-weight: 600; color: var(--brown);">${escapeHTML(data.name || 'Unknown')}</td>
        <td style="padding: 14px 16px; color: var(--text-mid); font-size: 0.85rem;">${escapeHTML(data.email)}</td>
        <td style="padding: 14px 16px;">${waLink}</td>
        <td style="padding: 14px 16px; color: var(--text-light); font-size: 0.85rem;">${dateJoined}</td>
        <td style="padding: 14px 16px;">${vipBadge}</td>
        <td style="padding: 14px 16px; font-size: 0.85rem;">${validityText}</td>
        <td style="padding: 14px 16px; text-align: right;">
          <button class="btn btn-sm btn-outline" style="padding: 4px 12px;" onclick="openAdminEdit('${data.uid}')">⚙️ Manage</button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// 3. Individual Management
function openAdminEdit(uid) {
  const user = adminUserList.find(u => u.uid === uid);
  if (!user) return;

  document.getElementById('admin-edit-name').textContent = `${user.name} (${user.email})`;
  document.getElementById('admin-edit-status').value = user.isPremium ? "true" : "false";

  if (user.premiumExpiry) {
    document.getElementById('admin-edit-expiry').value = new Date(user.premiumExpiry).toISOString().split('T')[0];
  } else {
    document.getElementById('admin-edit-expiry').value = '';
  }

  document.getElementById('admin-edit-save-btn').onclick = () => saveAdminEdit(uid);
  document.getElementById('admin-edit-modal').style.display = 'flex';
}

async function saveAdminEdit(uid) {
  const btn = document.getElementById('admin-edit-save-btn');
  btn.textContent = "Saving..."; btn.disabled = true;

  const isPremium = document.getElementById('admin-edit-status').value === "true";
  const expiryVal = document.getElementById('admin-edit-expiry').value;
  const expiryDate = (isPremium && expiryVal) ? new Date(expiryVal).toISOString() : null;

  try {
    await db.collection('users').doc(uid).update({ isPremium: isPremium, premiumExpiry: expiryDate });
    showToast("✅ Student account updated!");
    document.getElementById('admin-edit-modal').style.display = 'none';
    loadAdminDashboard(); // Refresh full data
  } catch (error) { alert(error.message); } 
  finally { btn.textContent = "Save Changes"; btn.disabled = false; }
}

// 4. BULK MANAGE SCRIPT (The safe chunking algorithm)
async function executeBulkUpdate() {
  const targetGroup = document.getElementById('bulk-target-group').value;
  const daysToAdd = parseInt(document.getElementById('bulk-days').value);
  
  if (!daysToAdd || daysToAdd <= 0) {
    alert("Please enter a valid number of days.");
    return;
  }

  // Filter which users to actually update based on dropdown
  const usersToUpdate = adminUserList.filter(u => targetGroup === "all" || u.computedStatus === targetGroup);
  
  if (usersToUpdate.length === 0) {
    alert("No users found in this category.");
    return;
  }

  if (!confirm(`Are you sure you want to add ${daysToAdd} VIP days to ${usersToUpdate.length} students?`)) return;

  const btn = document.getElementById('bulk-execute-btn');
  btn.textContent = "Processing..."; btn.disabled = true;

  try {
    // Firestore limits batch writes to 500 operations at a time.
    // We break our list into safe chunks of 200.
    const chunkSize = 200;
    for (let i = 0; i < usersToUpdate.length; i += chunkSize) {
      const chunk = usersToUpdate.slice(i, i + chunkSize);
      const batch = db.batch();

      chunk.forEach(user => {
        const userRef = db.collection("users").doc(user.uid);
        let newExpiry = new Date(); // Default starting point is today

        // If they are already an Active VIP, add to their existing date
        if (user.computedStatus === "vip" && user.premiumExpiry) {
          newExpiry = new Date(user.premiumExpiry);
        }
        
        // Skip Lifetime users
        if (user.computedStatus === "vip" && !user.premiumExpiry) return; 

        // Add the extra days
        newExpiry.setDate(newExpiry.getDate() + daysToAdd);

        batch.update(userRef, {
          isPremium: true,
          premiumExpiry: newExpiry.toISOString()
        });
      });

      await batch.commit(); // Execute this chunk
    }

    showToast(`✅ Successfully updated ${usersToUpdate.length} students!`);
    document.getElementById('bulk-manage-modal').style.display = 'none';
    document.getElementById('bulk-days').value = '';
    loadAdminDashboard(); // Refresh UI
    
  } catch (error) {
    alert("Error during bulk update: " + error.message);
  } finally {
    btn.textContent = "Execute Update"; btn.disabled = false;
  }
}

// ==========================================
// === EXPORT TO CSV ENGINE ===
// ==========================================
function exportToCSV() {
  if (!currentFilteredUsers || currentFilteredUsers.length === 0) {
    showToast("⚠️ No students found to export!");
    return;
  }

  // 1. Create the CSV Column Headers
  let csvContent = "Name,Email,WhatsApp,Date Joined,Param Status,Validity Date\n";

  // 2. Loop through the currently filtered students and add their data
  currentFilteredUsers.forEach(user => {
    // We remove any accidental commas from names so it doesn't break the CSV columns
    const name = (user.name || "Unknown").replace(/,/g, ""); 
    const email = (user.email || "").replace(/,/g, "");
    const whatsapp = (user.whatsapp || "").replace(/,/g, "");
    const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : "Unknown";
    
    // Format Status cleanly for the spreadsheet
    let status = "Basic Access";
    if (user.computedStatus === "vip") status = "Active Param";
    if (user.computedStatus === "expired") status = "Expired Param";

    const validity = user.premiumExpiry ? new Date(user.premiumExpiry).toLocaleDateString('en-IN') : (status === "Active Param" ? "Lifetime" : "N/A");

    // Add the row to the file
    csvContent += `${name},${email},${whatsapp},${joined},${status},${validity}\n`;
  });

  // 3. Force the Browser to Download the File
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  // Name the file dynamically based on today's date
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `Sanskrit_Vartika_Students_${today}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast("✅ CSV Exported Successfully!");
}

// ==========================================
// === DEVELOPER SANDBOX LOGIC ===
// ==========================================
async function setTestState(state) {
  if (!currentUser) return;
  
  let isPremium = false;
  let expiryDate = null;
  
  if (state === 'vip') {
    isPremium = true;
    let d = new Date();
    d.setDate(d.getDate() + FREE_TRIAL_DAYS);
    expiryDate = d.toISOString();
  } else if (state === 'expired') {
    isPremium = true;
    let d = new Date();
    d.setDate(d.getDate() - 2); // Expired 2 days ago
    expiryDate = d.toISOString();
  }
  
  try {
    await db.collection("users").doc(currentUser.uid).update({
      isPremium: isPremium,
      premiumExpiry: expiryDate
    });
    showToast(`✅ Test State Applied: ${state.toUpperCase()}`);
    // You don't even need to call loadDashboard() here, because the onSnapshot listener 
    // will detect this cloud update and instantly refresh the UI for you!
  } catch(error) {
    alert("Error changing test state: " + error.message);
  }
}



if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('PWA Engine Active!', reg.scope))
        .catch((err) => console.error('PWA Engine Failed!', err));
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
// === ADMIN: FETCH & RESOLVE REPORTS ===
// ==========================================
async function loadAdminReports() {
  const tbody = document.getElementById('admin-reports-body');
  if (!tbody) return;

  if (!currentUser || currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">⚠️ Access Denied.</td></tr>';
    return;
  }

  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Fetching reports...</td></tr>';

  try {
    const snapshot = await db.collection("reported_errors").orderBy("timestamp", "desc").get();
    document.getElementById('admin-reports-count').textContent = snapshot.size;

    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-light);">No reported errors! 🎉</td></tr>';
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString('en-IN') : 'Just now';
      
      html += `
        <tr style="border-bottom: 1px solid var(--cream-dark);">
          <td style="padding: 14px 16px; max-width: 300px;">
            <strong style="color: var(--brown); font-size: 0.85rem;">${data.testName}</strong><br>
            <span style="font-family: var(--font-skt); font-size: 0.95rem;">${escapeHTML(data.questionText)}</span>
          </td>
          <td style="padding: 14px 16px;">
            <span style="background: #FFEBEE; color: #D32F2F; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">${data.reason}</span><br>
            <span style="font-size: 0.85rem; color: var(--text-mid); display: block; margin-top: 4px;">${escapeHTML(data.comment || 'No additional comment')}</span>
          </td>
          <td style="padding: 14px 16px; font-size: 0.85rem; color: var(--text-light);">${data.reportedBy}</td>
          <td style="padding: 14px 16px; font-size: 0.85rem; color: var(--text-light);">${date}</td>
          <td style="padding: 14px 16px; text-align: right;">
            <button class="btn btn-sm" style="background: #4CAF50; color: white; padding: 6px 12px;" onclick="resolveReport('${doc.id}')">✅ Resolve</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (error) {
    console.error("Error fetching reports:", error);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error fetching data: ${error.message}</td></tr>`;
  }
}

async function resolveReport(reportId) {
  if (!confirm("Are you sure you want to resolve this? Make sure you fixed the error in your Google Sheet first!")) return;
  
  try {
    await db.collection("reported_errors").doc(reportId).delete();
    showToast("✅ Report resolved and cleared.");
    loadAdminReports(); // Automatically refresh the table
  } catch (error) {
    alert("Error resolving report: " + error.message);
  }
}

// ==========================================
// === LAG-FREE GOOGLE SHEETS NOTIFICATIONS ===
// ==========================================

// ⚠️ PASTE YOUR GOOGLE SCRIPT WEB APP URL HERE:
const NOTIFICATION_API_URL = "https://script.google.com/macros/s/AKfycbwvyI0ArlPcqoD-WQG0Pm2O1OHf_uwYr_PQbS7rc-2q9HvwlOYFjXBl-W_3SbQ20UX3/exec"; 

let globalAnnouncements = [];

// 1. Run this immediately when the dashboard loads
async function initializeNotifications() {
  // A. Load instantly from cache (0 lag)
  const cached = localStorage.getItem('vartika_notifications');
  if (cached) {
    globalAnnouncements = JSON.parse(cached);
    checkRedDot();
  }

  // B. Silently fetch from Google Sheets in the background
  try {
    const response = await fetch(NOTIFICATION_API_URL);
    const freshData = await response.json();
    
    if (freshData && freshData.length > 0) {
      globalAnnouncements = freshData;
      // Save the fresh data to cache for next time
      localStorage.setItem('vartika_notifications', JSON.stringify(globalAnnouncements));
      checkRedDot();
    }
  } catch (error) {
    console.error("Silent notification sync failed:", error);
  }
}

// 2. Logic to show/hide the Red Dot
function checkRedDot() {
  if (globalAnnouncements.length === 0) return;
  
  // We use the Title + Date of the newest item as its unique ID
  const latestId = globalAnnouncements[0].title + globalAnnouncements[0].date;
  const lastReadId = localStorage.getItem('vartika_last_read_id');
  
  if (latestId !== lastReadId) {
    document.getElementById('bell-dot').style.display = 'block';
  }
}

// 3. Render the UI when the user clicks the Bell
function openNotifications() {
  document.getElementById('notification-modal').style.display = 'flex';
  const feed = document.getElementById('announcement-feed');
  feed.innerHTML = '';

  if (globalAnnouncements.length === 0) {
    feed.innerHTML = '<p style="text-align: center; color: #A1887F;">No recent announcements.</p>';
    return;
  }

  // Hide the red dot and remember that they read the newest item
  const latestId = globalAnnouncements[0].title + globalAnnouncements[0].date;
  localStorage.setItem('vartika_last_read_id', latestId);
  document.getElementById('bell-dot').style.display = 'none';

  // Build the "Soft & Elegant" HTML
  globalAnnouncements.forEach(ann => {
    const linkHtml = ann.link ? `<a href="${escapeHTML(ann.link)}" target="_blank" class="elegant-notify-link">View Details</a>` : '';
    
    feed.innerHTML += `
      <div class="elegant-notify-card">
        <h4 class="elegant-notify-title">${escapeHTML(ann.title)}</h4>
        <p class="elegant-notify-msg">${escapeHTML(ann.message)}</p>
        ${linkHtml}
        <div class="elegant-notify-date">${escapeHTML(timeAgo(ann.date))}</div>
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
  
  // Create a pre-filled WhatsApp message
  const message = `नमस्ते! I am ${studentName} (${studentEmail}). My Vartika Param access is expiring soon, and I saw the special renewal discount pop-up. I would like to renew my account!`;
  
  // EDIT THIS: Put your actual WhatsApp business number here (include country code, no + or spaces)
  const phone = "918172063129"; 
  
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
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
  
  // 3. Update the UI and show the modal
  document.getElementById('start-test-name').textContent = fullName;
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