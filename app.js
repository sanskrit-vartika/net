
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
const LAUNCH_PROMO_END_DATE = new Date("2026-05-01T00:00:00Z"); 

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
    subtitle.textContent = `Start your ${FREE_TRIAL_DAYS}-Day Free Premium Trial!`;
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
    switchText.innerHTML = "New here? <a href='#' onclick='toggleAuthMode()' style='color: var(--saffron); font-weight: bold;'>Sign Up</a>";
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
function updateNavUI(user, nameStr) {
  const navBtn = document.getElementById('nav-auth-btn');
  if (!navBtn) return;
  
  if (user) {
    const firstName = (nameStr || "Student").split(' ')[0];
    navBtn.innerHTML = `Hi, ${firstName}`;
    navBtn.style.background = "rgba(255,215,0,0.15)"; 
    navBtn.style.color = "var(--gold)";
    navBtn.style.border = "1px solid var(--gold)";
    navBtn.onclick = () => { if(confirm("Do you want to log out?")) logoutUser(); };
  } else {
    navBtn.innerHTML = `🔒 Log In`;
    navBtn.style.background = "transparent";
    navBtn.style.color = "var(--gold)";
    navBtn.style.border = "1px solid var(--gold)";
    navBtn.onclick = showAuthModal;
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
    
    // Start Cloud Sync
    userDocUnsubscribe = db.collection("users").doc(user.uid).onSnapshot((doc) => {
      if (doc.exists) {
        currentUser.dbData = doc.data();
      } else {
        currentUser.dbData = { name: "Student", history: [], saved_qs: [], streak: {count:0, lastDate:""} };
      }
      
      updateNavUI(user, currentUser.dbData.name);
      isFirebaseReady = true; 
      
      if (currentPage === 'dashboard') loadDashboard();
      // --- NEW: UNLOCK ADMIN DASHBOARD ---
      if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        const adminBtn = document.getElementById('nav-admin-link');
        if (adminBtn) adminBtn.style.display = 'block'; // Unhide the button!
      }
      // FIX: Instantly unlock/lock test cards in real-time!
      updateTestCardLocks();
    });

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

function logoutUser() {
  auth.signOut();
  showToast("Logged out successfully.");
  navigate('home', false); 
}
// ==========================================
// 🚀 FIREBASE CLOUD ENGINE & VIP LOGIC ends

// ==========================================



// === NAVIGATION & UI ===
let isFreeMode = false;
let currentPage = 'home';
let pendingNavigation = null; // NEW: Remembers where the user wanted to go

function navigate(page, addToHistory = true) {
  // --- NEW: INTERCEPT NAVIGATION IF TEST IS RUNNING ---
  if (testState.timerInterval && !testState.finished && document.getElementById('test-interface').style.display === 'block') {
    pendingNavigation = { page, addToHistory };
    document.getElementById('exit-modal').style.display = 'flex';
    return; // Stop the navigation instantly!
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Browser History Integration
    if (addToHistory) {
      history.pushState({ page: page }, '', '#' + page);
    }

    // Dynamic Tab Titles
    const titles = { 'home': 'Home', 'study': 'Study Materials', 'mocktest': 'Mock Tests', 'courses': 'Courses', 'free': 'Free Services', 'dashboard': 'Student Dashboard', 'about': 'About Us', 'contact': 'Contact' };
    document.title = (titles[page] || 'Welcome') + ' | संस्कृत-वर्तिका';

    // Update Mobile Bottom Nav Active State
    document.querySelectorAll('.mat-item').forEach(el => el.classList.remove('active'));
    const activeNavBtn = document.getElementById('bnav-' + page);
    if (activeNavBtn) activeNavBtn.classList.add('active');
  }
  
  if (page === 'dashboard') loadDashboard();
  if (page === 'mocktest') { 
    isFreeMode = false; 
    showCategories(); 
    updateTestCardLocks(); // <--- NEW: Forces visual locks to render instantly for guests
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

  // 5. If the screen is clear, do normal navigation!
  if (event.state && event.state.page) {
    navigate(event.state.page, false);
  } else {
    navigate('home', false);
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

  // NEW: Lazy Load PYQs
  if (tab === 'pyqs' && !window.pyqsLoaded) {
    window.pyqsLoaded = true; // Mark as loaded so it doesn't fetch again
    document.getElementById('loading-overlay').style.display = 'flex';
    loadPYQsFromSheet().then(() => {
      document.getElementById('loading-overlay').style.display = 'none';
    });
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
  darshan: 'दर्शनम्', sahitya: 'साहित्यम्', other: 'अन्यानि'
};

// 2. THE CENTRAL DATA FETCHER (Upgraded with Free Filters & TIMEOUT)
async function fetchQuestions(cat) {
  if (allQuestions[cat]) return true; // Already loaded in memory!

  const targetURL = TEST_DATABASE_URLS[cat];
  if (!targetURL || targetURL.includes('PASTE_')) return false;

  try {
    // --- NEW CODE: The 10-Second Stopwatch ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 10000 ms = 10 seconds

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
    
    // Force the modal into Sign-Up mode smoothly
    isSignUpMode = true; 
    document.getElementById('auth-title').textContent = "Create Account";
    document.getElementById('auth-subtitle').textContent = `Start your ${FREE_TRIAL_DAYS}-Day Free Premium Trial!`;
    document.getElementById('auth-name').style.display = 'block';
    const wa = document.getElementById('auth-whatsapp'); if(wa) wa.style.display = 'block';
    const fp = document.getElementById('forgot-password-box'); if(fp) fp.style.display = 'none';
    document.getElementById('auth-action-btn').textContent = "Sign Up";
    document.getElementById('auth-switch-text').innerHTML = "Already have an account? <a href='#' onclick='toggleAuthMode()' style='color: var(--saffron); font-weight: bold;'>Log In</a>";
    
    showAuthModal();
    return; // STOP the code
  }

  // 2. SCENARIO B: Logged in, but Free/Expired -> Prompt Upgrade
  if (!hasPremiumAccess()) {
    document.getElementById('premium-lock-modal').style.display = 'flex';
    return; // STOP the code
  }

  // 3. SCENARIO C: VIP Access Granted -> Load Tests!
  document.getElementById('loading-overlay').style.display = 'flex';
  const success = await fetchQuestions(cat);
  document.getElementById('loading-overlay').style.display = 'none';

  if (success) renderSetsUI(cat);
  else showToast(`The database for ${catNames[cat]} could not be loaded.`);
}

// --- NEW SMART ENGINE: The Free Services Loader ---
async function openFreeSets(mode) {
  
  document.getElementById('loading-overlay').style.display = 'flex';
  
  // Determine which databases to download (Array order dictates display order!)
  let catsToLoad = mode === 'full' ? ['full'] : ['vedic', 'grammar', 'darshan', 'sahitya', 'other'];
  
  // Download all needed databases simultaneously for blazing fast speed
  await Promise.all(catsToLoad.map(cat => fetchQuestions(cat)));
  
  document.getElementById('loading-overlay').style.display = 'none';

  // Take the user to the Mock Test interface
  navigate('mocktest');
  document.getElementById('test-categories').style.display = 'none';
  document.getElementById('test-interface').style.display = 'none';
  document.getElementById('test-results').style.display = 'none';
  
  const setsView = document.getElementById('test-sets-view');
  setsView.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

isFreeMode = true;
if(document.getElementById('back-to-cat-btn')) document.getElementById('back-to-cat-btn').textContent = '← Back to Free Services';

  document.getElementById('sets-category-title').textContent = mode === 'full' ? "Free Full Mock Tests" : "Free Topic-wise Tests";

  const grid = document.getElementById('sets-grid');
  grid.innerHTML = '';
  let hasFreeSets = false;
  const history = (currentUser && currentUser.dbData && currentUser.dbData.history) ? currentUser.dbData.history : [];

  catsToLoad.forEach(cat => {
    if (!allQuestions[cat]) return;
    
    Object.keys(allQuestions[cat]).forEach(setKey => {
      const qs = allQuestions[cat][setKey];
      // If ANY question in this set has type "free", display the whole set!
      const isFreeSet = qs.some(q => q.isFree);

      if (isFreeSet) {
        hasFreeSets = true;
        const catTitle = catNames[cat];
        const exactTestName = catTitle + " - " + setKey;
        const isCompleted = history.some(h => h.name === exactTestName);
        const checkmark = isCompleted ? '<div style="position:absolute; top:12px; right:12px; background:#4CAF50; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem;">✓</div>' : '';

        // Add subject name (e.g., वैदिकसाहित्यम्) to description for topic-wise tests
        const desc = mode === 'topic' ? catTitle : "Complete practice set";

        grid.innerHTML += `
          <div class="test-cat-card" style="border: ${isCompleted ? '2px solid #4CAF50' : '2px solid transparent'}" onclick="startTest('${cat}', '${setKey}')">
            ${checkmark}
            <div class="test-cat-icon">🎁</div>
            <h3 style="font-size:1.05rem;">${setKey}</h3>
            <p style="font-family: var(--font-skt); font-size: 0.9rem;">${desc}</p>
            <span class="q-count">${qs.length} Questions</span>
          </div>
        `;
      }
    });
  });

  if (!hasFreeSets) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">Free sets are being updated. Check back soon!</p>';
  }
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  const catTitle = catNames[cat] || cat;
  document.getElementById('sets-category-title').textContent = catTitle + " — Practice Sets";
  
  const grid = document.getElementById('sets-grid');
  grid.innerHTML = '';
  
  const categoryData = allQuestions[cat];
  
  if (!categoryData || Object.keys(categoryData).length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">No sets available for this topic yet. Please check back later!</p>';
    return;
  }

  const history = (currentUser && currentUser.dbData && currentUser.dbData.history) ? currentUser.dbData.history : [];em('sp_history') || '[]');

  Object.keys(categoryData).forEach(setKey => {
    const qCount = categoryData[setKey].length;
    
    // Use the perfectly formatted setKey directly
    const displayTitle = setKey;
    const exactTestName = catTitle + " - " + displayTitle;
    
    const isCompleted = history.some(h => h.name === exactTestName);
    const checkmark = isCompleted ? '<div style="position:absolute; top:12px; right:12px; background:#4CAF50; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem;">✓</div>' : '';

    const cardHTML = `
      <div class="test-cat-card" style="border: ${isCompleted ? '2px solid #4CAF50' : '2px solid transparent'}" onclick="startTest('${cat}', '${setKey}')">
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
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
  const m = Math.floor(testState.timeLeft / 60);
  const s = testState.timeLeft % 60;
  const el = document.getElementById('test-timer');
  el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
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
  document.getElementById('explanation-box').textContent = '';

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
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const qs = testState.questions;
  let correct = 0, wrong = 0, skipped = 0;
  qs.forEach((q, i) => {
    if (testState.answers[i] === undefined) skipped++;
    else if (testState.answers[i] === q.answer) correct++;
    else wrong++;
  });

  const pct = Math.round((correct / qs.length) * 100);
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
          <div class="review-q">Q${i+1}. ${q.q}</div>
          <button id="save-btn-${i}" onclick="toggleSaveQuestion(${i})" style="background:var(--white); border:1px solid var(--cream-dark); border-radius:50px; padding:4px 10px; cursor:pointer; font-weight:600; font-size:0.75rem; transition:0.2s; white-space:nowrap; ${btnStyle}">${btnText}</button>
        </div>
        <div class="review-ans">${status}${userAns !== undefined ? ` — Your answer: <strong>${q.options[userAns]}</strong>` : ''}</div>
        <div class="review-ans">✔ Correct answer: <strong>${q.options[q.answer]}</strong></div>
        ${q.explanation ? `<div class="review-exp">💡 ${q.explanation}</div>` : ''}
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  // NEW: Check if notes are empty. If they are, show the loader and download them!
  if (Object.keys(allNotes).length === 0) {
    document.getElementById('loading-overlay').style.display = 'flex';
    await loadNotesFromSheet();
    document.getElementById('loading-overlay').style.display = 'none';
  }

  document.getElementById('notes-main-grid').style.display = 'none';
  document.getElementById('notes-topic-view').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('notes-topic-title').textContent = (notesSubjectNames[subjectKey] || subjectKey) + " — Study Notes";

  const grid = document.getElementById('notes-links-grid');
  const filterSelect = document.getElementById('notes-filter'); 
  
  grid.innerHTML = '';
  filterSelect.innerHTML = '<option value="all">All Topics</option>'; 

  const topics = allNotes[subjectKey];
  if (!topics || topics.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">PDF Notes for this subject are being updated. Check back soon!</p>';
    return;
  }

  // Extract unique topics for the dropdown
  const uniqueTopics = [...new Set(topics.map(item => item.topic))];
  uniqueTopics.forEach(t => {
    filterSelect.innerHTML += `<option value="${t}">${t}</option>`;
  });

  topics.forEach(note => {
    grid.innerHTML += `
      <div class="note-card" data-topic="${note.topic}">
        <h4>${note.title}</h4>
        <p>${note.desc}</p>
        <a href="${note.link}" target="_blank" class="btn btn-primary btn-sm" style="display:inline-flex;">📥 Download / View PDF</a>
      </div>
    `;
  });
}

function backToNotesMain() {
  document.getElementById('notes-main-grid').style.display = 'grid';
  document.getElementById('notes-topic-view').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  // NEW: Check if videos are empty. If they are, show the loader and download them!
  if (Object.keys(allVideos).length === 0) {
    document.getElementById('loading-overlay').style.display = 'flex';
    await loadVideosFromSheet();
    document.getElementById('loading-overlay').style.display = 'none';
  }

  document.getElementById('videos-main-grid').style.display = 'none';
  document.getElementById('videos-topic-view').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('videos-topic-title').textContent = (notesSubjectNames[subjectKey] || subjectKey) + " — Video Lectures";

  const grid = document.getElementById('videos-links-grid');
  const filterSelect = document.getElementById('videos-filter'); 
  
  grid.innerHTML = '';
  filterSelect.innerHTML = '<option value="all">All Topics</option>'; 

  const topics = allVideos[subjectKey];
  if (!topics || topics.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-light);">Videos for this subject are being updated. Check back soon!</p>';
    return;
  }

  // Extract unique topics for the dropdown
  const uniqueTopics = [...new Set(topics.map(item => item.topic))];
  uniqueTopics.forEach(t => {
    filterSelect.innerHTML += `<option value="${t}">${t}</option>`;
  });

  topics.forEach(vid => {
    const videoId = getYouTubeID(vid.link);
    const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
    const bgStyle = thumbUrl ? `background-image: url('${thumbUrl}'); background-size: cover; background-position: center;` : '';

    grid.innerHTML += `
      <div class="video-card" data-topic="${vid.topic}">
        <div class="video-thumb" style="${bgStyle}" onclick="window.open('${vid.link}','_blank')">
          <div class="play-btn">▶</div>
        </div>
        <div class="video-info">
          <h4 style="font-family:var(--font-skt); font-size:1.05rem;">${vid.title}</h4>
          <p>${vid.duration}</p>
        </div>
      </div>
    `;
  });
}

function backToVideosMain() {
  document.getElementById('videos-main-grid').style.display = 'grid';
  document.getElementById('videos-topic-view').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
// ==========================================

// ==========================================
// === PYQs ENGINE (STANDALONE) ===
// ==========================================
// PASTE YOUR NEW PYQ SPREADSHEET URL HERE
const GOOGLE_SHEET_URL_PYQS = "https://script.google.com/macros/s/AKfycbyLgnaxYpzqWLGaTyf7PoYsHT-DJ-4cbWhn5xNdvZ4ynm8RvQaZzhET4ycW1QTXiLs7/exec";

async function loadPYQsFromSheet() {
  try {
    const response = await fetch(GOOGLE_SHEET_URL_PYQS);
    const textData = await response.text();
    let data;
    try { data = JSON.parse(textData); } catch (e) { return; }

    const grid = document.getElementById('pyqs-grid');
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
            <span class="year" style="font-family: var(--font-sans);">${year}</span>
            <p>${desc}</p>
            <a href="${link}" target="_blank" class="btn btn-primary btn-sm">📥 Download</a>
          </div>
        `;
      }
    });
  } catch (error) { 
  console.error("Could not load PYQs:", error); 
  showToast("⚠️ Could not load PYQs. Please check your internet connection.");
  document.getElementById('pyqs-grid').innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#F44336;">Failed to load data. Please refresh the page.</p>';
}
}

// ==========================================

// ==========================================
// ==========================================
// === DASHBOARD & DATA (Firebase Cloud) ===
// ==========================================

async function saveTestResult(name, correct, total) {
  if (!currentUser || !currentUser.dbData) {
    showToast("⚠️ Score not saved! Please log in to track your progress.");
    return; 
  }
  
  let history = currentUser.dbData.history || [];
  let streak = currentUser.dbData.streak || { count: 0, lastDate: "" };
  const today = new Date().toLocaleDateString('en-IN');
  
  const oldUnlocked = BADGE_DEFS.filter(b => b.check(history, streak.count)).map(b => b.id);

  history.unshift({ name, correct, total, pct: Math.round((correct/total)*100), date: today });
  if (history.length > 1000) history.pop();

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
  renderSavedQuestions();
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
        <div style="font-family:var(--font-skt); font-weight:600; color:var(--brown); margin-bottom:10px; font-size:0.95rem;">${sq.q}</div>
        <div style="font-size:0.8rem; color:#1B5E20; background:#E8F5E9; padding:6px 10px; border-radius:4px; display:inline-block; margin-bottom:8px;">✔ Correct: <strong>${sq.options[sq.answer]}</strong></div>
        ${sq.explanation ? `<div style="font-size:0.8rem; color:#7B1FA2; font-style:italic; margin-bottom:12px; line-height:1.5;">💡 ${sq.explanation}</div>` : ''}
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
  renderSavedQuestions();
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
          vipBadgeContainer.innerHTML = `<span style="background: rgba(255,215,0,0.15); color: var(--gold); padding: 6px 16px; border-radius: 50px; font-size: 0.85rem; font-weight: 700; border: 1px solid var(--gold); box-shadow: 0 2px 10px rgba(255,215,0,0.1);">👑 VIP Premium • ${daysLeft} Days Left</span>`;
        } else {
          vipBadgeContainer.innerHTML = `<span style="background: rgba(255,82,82,0.15); color: #FF5252; padding: 6px 16px; border-radius: 50px; font-size: 0.85rem; font-weight: 700; border: 1px solid #FF5252;">⚠️ VIP Trial Expired</span>`;
        }
      } else {
        // Lifetime access (no expiry date set)
        vipBadgeContainer.innerHTML = `<span style="background: rgba(255,215,0,0.15); color: var(--gold); padding: 6px 16px; border-radius: 50px; font-size: 0.85rem; font-weight: 700; border: 1px solid var(--gold); box-shadow: 0 2px 10px rgba(255,215,0,0.1);">👑 VIP Premium • Lifetime Access</span>`;
      }
    } else {
      vipBadgeContainer.innerHTML = `<span style="background: rgba(255,255,255,0.1); color: rgba(255,248,231,0.8); padding: 6px 16px; border-radius: 50px; font-size: 0.85rem; font-weight: 600; border: 1px solid rgba(255,248,231,0.3);">Free Account</span>`;
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
        <td>${h.name}</td>
        <td>${h.correct}/${h.total}</td>
        <td><span style="color:${h.pct>=60?'#2e7d32':'#b71c1c'};font-weight:700;">${h.pct}%</span></td>
        <td>${h.date}</td>
      </tr>`).join('');
  }
  renderSavedQuestions();
  renderGamification();
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
function submitContactForm() {
  const name = document.getElementById('cf-name').value.trim();
  const email = document.getElementById('cf-email').value.trim();
  const subject = document.getElementById('cf-subject').value.trim();
  const msg = document.getElementById('cf-msg').value.trim();
  if (!name || !email || !msg) { showToast('Please fill all required fields.'); return; }
  const mailto = `mailto:enquiry.sanskritvartika@gmail.com?subject=${encodeURIComponent(subject||'Query from website')}&body=${encodeURIComponent('Name: '+name+'\nEmail: '+email+'\n\n'+msg)}`;
  window.location.href = mailto;
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
    title: "Quick Revision Crash Course",
    subtitle: "High-yield topics | Exam strategies",
    isFree: false,
    duration: "3 Weeks",
    level: "Intermediate+",
    videos: "40+ Videos",
    desc: "Intensive exam-focused revision. Key points, mnemonics, and mock tests designed to maximize score in minimum time.",
    price: "₹999",
    originalPrice: "₹1,999",
    btnText: "Enroll Now →",
    link: "https://wa.me/YOUR_PHONE_NUMBER?text=Hello! I want to enroll in the Crash Course." // EDIT THIS LINK
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
    const priceDisplay = course.isFree ? '<div class="course-price free-price">FREE</div>' : `<div class="course-price">${course.price} <span class="og">${course.originalPrice}</span></div>`;
    
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
// === SECRET ADMIN DASHBOARD LOGIC ===
// ==========================================
let adminUserList = []; // Saves the downloaded list

async function loadAdminDashboard() {
  if (!currentUser || currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    document.getElementById('admin-users-body').innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">⚠️ Access Denied.</td></tr>';
    return;
  }

  const tbody = document.getElementById('admin-users-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Fetching data from Cloud...</td></tr>';

  try {
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
    document.getElementById('admin-user-count').textContent = snapshot.size;
    
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No students found yet.</td></tr>';
      return;
    }

    adminUserList = [];
    let html = '';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      data.uid = doc.id; // Save their secret folder ID
      adminUserList.push(data);
      
      const dateJoined = data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN') : 'Unknown';
      
      // Calculate Status & Validity
      let vipBadge = '<span style="background: #E0E0E0; color: #757575; padding: 4px 8px; border-radius: 50px; font-size: 0.75rem; font-weight: bold;">Free</span>';
      let validityText = '<span style="color: #9E9E9E;">—</span>';
      
      if (data.isPremium) {
        vipBadge = '<span style="background: #FFF3E0; color: #E65100; padding: 4px 8px; border-radius: 50px; font-size: 0.75rem; font-weight: bold;">👑 VIP</span>';
        
        if (data.premiumExpiry) {
          const expDate = new Date(data.premiumExpiry);
          const daysLeft = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
          
          if (daysLeft > 0) {
            validityText = `<span style="color: #2E7D32; font-weight: 600;">${daysLeft} days left</span><br><span style="font-size:0.7rem; color:var(--text-light);">${expDate.toLocaleDateString('en-IN')}</span>`;
          } else {
            validityText = `<span style="color: #D32F2F; font-weight: 600;">Expired</span>`;
            vipBadge = '<span style="background: #FFEBEE; color: #D32F2F; padding: 4px 8px; border-radius: 50px; font-size: 0.75rem; font-weight: bold;">Expired VIP</span>';
          }
        } else {
          validityText = `<span style="color: #1976D2; font-weight: 600;">Lifetime Access</span>`;
        }
      }

      let waLink = data.whatsapp ? `<a href="https://wa.me/${data.whatsapp.replace(/\D/g,'')}" target="_blank" style="color: #25D366; font-weight: bold; text-decoration: underline;">${data.whatsapp}</a>` : '<span style="color: #ccc;">N/A</span>';

      html += `
        <tr style="border-bottom: 1px solid var(--cream-dark);">
          <td style="padding: 14px 16px; font-weight: 600; color: var(--brown);">${data.name || 'Unknown'}</td>
          <td style="padding: 14px 16px;"><div style="color: var(--text-mid); margin-bottom:4px;">${data.email}</div>${waLink}</td>
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

  } catch (error) {
    console.error("Admin fetch error:", error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error fetching data: ${error.message}</td></tr>`;
  }
}

// Open the Edit Modal
function openAdminEdit(uid) {
  const user = adminUserList.find(u => u.uid === uid);
  if (!user) return;

  document.getElementById('admin-edit-name').textContent = `${user.name} (${user.email})`;
  document.getElementById('admin-edit-status').value = user.isPremium ? "true" : "false";

  // Format Date for HTML Input (YYYY-MM-DD)
  if (user.premiumExpiry) {
    const d = new Date(user.premiumExpiry);
    document.getElementById('admin-edit-expiry').value = d.toISOString().split('T')[0];
  } else {
    document.getElementById('admin-edit-expiry').value = '';
  }

  document.getElementById('admin-edit-save-btn').onclick = () => saveAdminEdit(uid);
  document.getElementById('admin-edit-modal').style.display = 'flex';
}

// Save Changes to Cloud
async function saveAdminEdit(uid) {
  const btn = document.getElementById('admin-edit-save-btn');
  btn.textContent = "Saving...";
  btn.disabled = true;

  const isPremium = document.getElementById('admin-edit-status').value === "true";
  const expiryVal = document.getElementById('admin-edit-expiry').value;

  let expiryDate = null;
  if (isPremium && expiryVal) {
    expiryDate = new Date(expiryVal).toISOString(); // Converts back to cloud format
  }

  try {
    await db.collection('users').doc(uid).update({
      isPremium: isPremium,
      premiumExpiry: expiryDate
    });
    showToast("✅ Student account updated successfully!");
    document.getElementById('admin-edit-modal').style.display = 'none';
    loadAdminDashboard(); // Refresh the table automatically
  } catch (error) {
    alert("Error updating student: " + error.message);
  } finally {
    btn.textContent = "Save Changes";
    btn.disabled = false;
  }
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

// Ensure the page updates when navigated to
const originalNavigate = navigate; 
navigate = function(page, addToHistory = true) {
  originalNavigate(page, addToHistory); 
  if (page === 'admin') {
    loadAdminDashboard(); 
  }
};

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('PWA Engine Active!', reg.scope))
        .catch((err) => console.error('PWA Engine Failed!', err));
    });
  }