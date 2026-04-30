// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDy5PXHDOWEASIxRd2bukF5FRscxFy9ZwQ",
    authDomain: "navithya-e33ae.firebaseapp.com",
    databaseURL: "https://navithya-e33ae-default-rtdb.firebaseio.com",
    projectId: "navithya-e33ae",
    storageBucket: "navithya-e33ae.firebasestorage.app",
    messagingSenderId: "753981072296",
    appId: "1:753981072296:web:a92cb922b52fcd1fabb39d",
    measurementId: "G-7YKLBE203D"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

// App State
let users = [];
let requests = [];
let homeData = { title: "Welcome to Navithya", sub: "Cloud-Based Service Portal" };
let storeItems = [];
let galleryItems = [];
let currentUser = null;
let globalPlans = [];

// Persistence Initialization
function restoreSession() {
    const saved = localStorage.getItem('navithya_session');
    if (saved) {
        try {
            const user = JSON.parse(saved);
            loginSuccess(user, true); // Pass true to avoid re-saving
        } catch (e) {
            localStorage.removeItem('navithya_session');
        }
    }
}

// Realtime listeners
db.ref('users').on('value', (snapshot) => {
    const data = snapshot.val();
    users = data ? Object.values(data) : [];
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
});
db.ref('requests').on('value', (snapshot) => {
    const data = snapshot.val();
    requests = data ? Object.values(data) : [];
    if (currentUser) {
        if (currentUser.role === 'admin' || currentUser.role === 'developer') updateAdminPanel();
        if (currentUser.role === 'provider') updateProviderDashboard();
        if (currentUser.role === 'customer') updateCustomerDashboard();
    }
});

// Constants
const ADMIN_USER = { username: 'ADITHYA', role: 'admin', name: 'Adithya Admin' };
const ADMIN_PASS = '19980307';
let WHATSAPP_NUM = '94769929453';

db.ref('platformSettings').on('value', snap => {
    const data = snap.val();
    if (data) {
        if (data.whatsapp) WHATSAPP_NUM = data.whatsapp;
        
        // Update Footer and other displays
        const phoneDisplay = document.getElementById('footer-phone-display');
        const emailDisplay = document.getElementById('footer-email-display');
        
        if (phoneDisplay) phoneDisplay.innerHTML = `<i class="fas fa-phone"></i> ${data.phone1 || ''} / ${data.phone2 || ''} / ${data.whatsapp || ''}`;
        if (emailDisplay) emailDisplay.innerHTML = `<i class="fas fa-envelope"></i> ${data.email || 'SNAVITHYA@GMAIL.COM'}`;
        
        // Update Admin inputs if they exist
        const adminWa = document.getElementById('admin-setting-wa');
        if (adminWa) {
            document.getElementById('admin-setting-phone1').value = data.phone1 || '';
            document.getElementById('admin-setting-phone2').value = data.phone2 || '';
            document.getElementById('admin-setting-wa').value = data.whatsapp || '';
            document.getElementById('admin-setting-email').value = data.email || '';
        }
    } else {
        // Setup defaults
        db.ref('platformSettings').set({
            phone1: '0729929453',
            phone2: '0719929453',
            whatsapp: '94769929453',
            email: 'SNAVITHYA@GMAIL.COM'
        });
    }
});

// Sidebar Roles Configuration
const ROLE_MENUS = {
    admin: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'admin-jobs', label: 'Provider Jobs', icon: 'fas fa-briefcase' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'admin', label: 'Admin Dashboard', icon: 'fas fa-user-shield' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'broadcast', label: 'Global Broadcast', icon: 'fas fa-bullhorn' },
        { id: 'plans-edit', label: 'Provider Plans', icon: 'fas fa-money-bill-wave' }
    ],
    developer: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'admin-jobs', label: 'Provider Jobs', icon: 'fas fa-briefcase' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'admin', label: 'Admin Dashboard', icon: 'fas fa-user-shield' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'plans-edit', label: 'Provider Plans', icon: 'fas fa-money-bill-wave' }
    ],
    provider: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'provider-jobs', label: 'Received Jobs', icon: 'fas fa-inbox' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'provider-dashboard', label: 'Provider Dashboard', icon: 'fas fa-tachometer-alt' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'plans', label: 'Provider Plans', icon: 'fas fa-money-bill-wave' }
    ],
    customer: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'services', label: 'Request Job', icon: 'fas fa-file-signature' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Stores', icon: 'fas fa-shopping-bag' },
        { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' },
        { id: 'rate-us', label: 'Rate Us', icon: 'fas fa-thumbs-up' },
        { id: 'customer-dashboard', label: 'Customer Dashboard', icon: 'fas fa-user' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
        { id: 'tracking', label: 'Tracking Job', icon: 'fas fa-map-marker-alt' }
    ],
    sales: [
        { id: 'home', label: 'Home', icon: 'fas fa-home' },
        { id: 'gallery', label: 'Gallery', icon: 'fas fa-images' },
        { id: 'store', label: 'Target Store', icon: 'fas fa-shopping-bag' },
        { id: 'sales-dashboard', label: 'Sales Dashboard', icon: 'fas fa-ad' },
        { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' }
    ]
};

// DOM Elements
const authOverlay = document.getElementById('auth-overlay');

// Tabs setup
function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const btns = document.querySelectorAll('.tab-btn');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;

    if (username === ADMIN_USER.username && pass === ADMIN_PASS) {
        loginSuccess(ADMIN_USER);
        return;
    }

    const foundUser = users.find(u => u.username === username || u.phone === username || u.idNumber === username || u.name === username);
    if (foundUser) {
        if (foundUser.pass !== pass) return alert('Invalid Password!');
        if (foundUser.status === 'pending') return alert('Your account is pending admin approval.');
        loginSuccess(foundUser);
    } else {
        alert('User not found. Please sign up.');
    }
}

function handleForgetPassword() {
    const phone = prompt("Enter your registered Phone Number:");
    if (!phone) return;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=Reset%20Password%20for%20${phone}`, '_blank');
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const username = document.getElementById('signup-username').value;
    const phone = document.getElementById('signup-phone').value;
    const whatsapp = document.getElementById('signup-whatsapp').value;
    const age = document.getElementById('signup-age').value;
    const gender = document.getElementById('signup-gender').value;
    const skills = document.getElementById('signup-skills').value;
    const country = document.getElementById('signup-country').value;
    const province = document.getElementById('signup-province').value;
    const district = document.getElementById('signup-district').value;
    const village = document.getElementById('signup-village').value;
    const dob = document.getElementById('signup-dob').value;
    const idNumber = document.getElementById('signup-id-number').value;
    const pass = document.getElementById('signup-password').value;
    const profilePic = document.getElementById('signup-profile-pic').value;

    const newUser = { 
        id: Date.now(), 
        name, 
        username,
        phone, 
        whatsapp,
        age,
        gender,
        skills,
        country, 
        province,
        district, 
        village,
        dob,
        idNumber,
        pass, 
        profilePic,
        role: 'unassigned', 
        status: 'pending', 
        timestamp: Date.now() 
    };
    db.ref('users/' + newUser.id).set(newUser);

    window.open(`https://wa.me/${WHATSAPP_NUM}?text=New%20Signup%3A%20${name}%20(${phone})`, '_blank');

    alert('Signup successful! Wait for Admin approval.');
    switchAuthTab('login');
}

function showAuthOverlay() { authOverlay.classList.remove('hidden'); }
function hideAuthOverlay() { authOverlay.classList.add('hidden'); }

// UI Control
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    sidebar.classList.toggle('hidden');
}

function populateSidebar(role) {
    const sidebar = document.getElementById('main-sidebar');
    const linksList = document.getElementById('sidebar-links');
    const roleDisplay = sidebar.querySelector('.role-display');
    
    linksList.innerHTML = '';
    roleDisplay.innerText = role.toUpperCase() + ' PANEL';

    const menu = ROLE_MENUS[role] || [];
    menu.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<button onclick="navigate('${item.id}')"><i class="${item.icon}"></i> ${item.label}</button>`;
        linksList.appendChild(li);
    });
}

function loginSuccess(user, isRestoration = false) {
    currentUser = user;
    if (!isRestoration) {
        localStorage.setItem('navithya_session', JSON.stringify(user));
    }
    authOverlay.classList.add('hidden');

    // Show Sidebar Toggle
    document.getElementById('sidebar-toggle').classList.remove('hidden');
    
    // UI toggles
    document.getElementById('nav-login-btn').classList.add('hidden');
    document.getElementById('nav-logout-btn').classList.remove('hidden');

    // Populate Sidebar based on role
    populateSidebar(user.role);

    // Welcome Message with RGB Name
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `Welcome back, <span class="rgb-text">${user.name}</span>!`;
        welcomeMsg.classList.remove('hidden');
    }

    if (user.role === 'admin' || user.role === 'developer' || user.role === 'provider') {
        document.getElementById('gallery-upload-section').classList.remove('hidden');
        updateAdminPanel();
    } else {
        document.getElementById('gallery-upload-section').classList.add('hidden');
    }

    if (user.role === 'provider') {
        updateProviderPanel();
    }

    if (user.role === 'sales') {
        updateSalesPanel();
    }

    alert(`Welcome back, ${user.name}!`);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('navithya_session');

    // UI toggles
    document.getElementById('nav-login-btn').classList.remove('hidden');
    document.getElementById('nav-logout-btn').classList.add('hidden');
    document.getElementById('sidebar-toggle').classList.add('hidden');
    document.getElementById('main-sidebar').classList.add('hidden');

    // Clear forms
    document.getElementById('login-form').reset();
    document.getElementById('signup-form').reset();

    // Go back home
    navigate('home');
}

// Navigation
function navigate(pageId) {
    // Note: No more aliases here, each menu item targets its own dedicated page ID
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add('hidden'));
    
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.style.animation = 'fadeIn 0.6s ease-out forwards';
    } else {
        console.warn(`Page page-${pageId} not found!`);
        const home = document.getElementById('page-home');
        home.classList.remove('hidden');
        home.style.animation = 'fadeIn 0.6s ease-out forwards';
    }

    // Update active state in sidebar
    const sidebarButtons = document.querySelectorAll('.sidebar-links button');
    sidebarButtons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${pageId}'`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Auto-hide sidebar on mobile or when navigating
    const sidebar = document.getElementById('main-sidebar');
    if (sidebar && !sidebar.classList.contains('hidden')) {
        sidebar.classList.add('hidden');
    }

    if (pageId === 'admin' && (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer'))) {
        alert('Access Denied. Admins/Developers Only.');
        navigate('home');
        return;
    }

    if (pageId === 'admin' || pageId === 'admin-jobs' || pageId === 'plans-edit') {
        updateAdminPanel();
        if (pageId === 'admin') {
            document.getElementById('admin-home-title').value = homeData.title;
            document.getElementById('admin-home-sub').value = homeData.sub;
        }
    }

    if (pageId === 'provider-dashboard' || pageId === 'provider-jobs' || pageId === 'plans') {
        updateProviderDashboard();
    }

    if (pageId === 'gallery') {
        renderGallery();
    }

    if (pageId === 'store') {
        renderStoreItems();
    }

    if (pageId === 'customer-dashboard' || pageId === 'tracking') {
        updateCustomerDashboard();
    }

    if (pageId === 'sales-dashboard') {
        updateSalesPanel();
    }

    if (pageId === 'reviews' || pageId === 'rate-us') {
        // Reviews update via listener, but we can trigger a manual check if needed
    }
}


// Job Flow Handling
window.showStep1 = function() {
    document.getElementById('step-1').classList.remove('hidden');
    document.getElementById('step-2').classList.add('hidden');
};

window.showStep2 = function() {
    const isOther = document.querySelector('input[name="request-for"]:checked').value === 'other';
    const dist = document.getElementById('req-district').value;
    const village = document.getElementById('req-village').value;
    const serv = document.getElementById('req-service').value;

    if (isOther) {
        const otherName = document.getElementById('req-other-name').value;
        const otherPhone = document.getElementById('req-other-phone').value;
        if (!otherName || !otherPhone) return alert("Please fill other person's details.");
    }

    if (!dist || !village || !serv) return alert("Please fill all details first.");

    document.getElementById('step-1').classList.add('hidden');
    document.getElementById('step-2').classList.remove('hidden');
    filterProviders();
};

window.toggleOtherFields = function(show) {
    const fields = document.getElementById('other-fields');
    if (show) fields.classList.remove('hidden');
    else fields.classList.add('hidden');
};

function filterProviders() {
    const dist = document.getElementById('req-district').value;
    const serv = document.getElementById('req-service').value;

    const list = document.getElementById('provider-list');
    list.innerHTML = '';

    const matched = users.filter(u => {
        const isProvider = u.role === 'provider' && u.status === 'approved';
        const hasService = u.providerService === serv;
        const matchesDistrict = dist ? u.district === dist : true;
        return isProvider && hasService && matchesDistrict;
    });

    if (matched.length > 0) {
        matched.forEach(p => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.innerHTML = `
                <div class="glass" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-radius:10px; border: 1px solid var(--border);">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <img src="${p.logo || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; border-radius:50%; object-fit:cover;">
                        <div>
                            <span style="font-weight:600; font-size:1.1rem; color:var(--text);">${p.shopName || p.name}</span><br>
                            <small style="color:var(--text-muted);"><i class="fas fa-certificate"></i> Verified Provider</small>
                        </div>
                    </div>
                    <button type="button" id="btn-select-${p.id}" onclick="selectProvider('${p.id}', '${p.shopName || p.name}')" class="btn-outline" style="padding:8px 16px; font-size:0.9rem;">Select</button>
                </div>
            `;
            list.appendChild(li);
        });
    } else {
        list.innerHTML = `<li style="color:var(--text-muted); text-align:center; padding:20px;">No verified providers in this area. Admin will assign one.</li>`;
    }
}

window.selectProvider = function (id, name) {
    document.getElementById('selected-provider-id').value = id;
    const btns = document.querySelectorAll('.provider-list button');
    btns.forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
        b.innerText = 'Select';
    });
    
    const targetBtn = document.getElementById(`btn-select-${id}`);
    if (targetBtn) {
        targetBtn.classList.remove('btn-outline');
        targetBtn.classList.add('btn-primary');
        targetBtn.innerText = 'Selected ✓';
    }
};

function handleServiceRequest(e) {
    e.preventDefault();
    if (!currentUser) {
        alert('Please login to continue.');
        showAuthOverlay();
        return;
    }

    const isOther = document.querySelector('input[name="request-for"]:checked').value === 'other';
    const custName = isOther ? document.getElementById('req-other-name').value : currentUser.name;
    const custPhone = isOther ? document.getElementById('req-other-phone').value : currentUser.phone;
    
    const district = document.getElementById('req-district').value;
    const village = document.getElementById('req-village').value;
    const service = document.getElementById('req-service').value;
    const desc = document.getElementById('req-desc').value;

    const reqId = "NAV-" + Math.floor(1000 + Math.random() * 9000);
    
    const providerId = document.getElementById('selected-provider-id').value;
    let providerName = null;
    let providerPhone = null;
    let assignedStatus = 'pending_admin';

    if (providerId && providerId !== 'null') {
        const p = users.find(u => u.id == providerId);
        if (p) {
            providerName = p.shopName || p.name;
            providerPhone = p.phone;
            assignedStatus = 'assigned';
        }
    }

    const reqData = {
        id: reqId,
        userId: currentUser.id,
        customerName: custName,
        customerPhone: custPhone,
        district,
        village,
        service,
        desc,
        status: assignedStatus,
        providerId: providerId || null,
        providerName: providerName || null,
        providerPhone: providerPhone || null,
        timestamp: Date.now(),
        isForOther: isOther
    };

    db.ref('requests/' + reqId).set(reqData);

    alert(`Request ${reqId} submitted! Opening WhatsApp...`);
    
    if (providerId && providerPhone) {
        const waMsg = `*NAVITHYA NEW SERVICE REQUEST*\n\nID: ${reqId}\nCustomer: ${custName}\nPhone: ${custPhone}\nLocation: ${village}, ${district}\nService: ${service}\nIssue: ${desc}\n\n*Please confirm this job!*`;
        const waUrl = `https://wa.me/${providerPhone}?text=${encodeURIComponent(waMsg)}`;
        window.open(waUrl, '_blank');
    } else {
        const waMsg = `*NEW SERVICE REQUEST (ADMIN ASSIGN)*\nID: ${reqId}\nCustomer: ${custName}\nPhone: ${custPhone}\nLocation: ${village}, ${district}\nService: ${service}\nIssue: ${desc}`;
        const waUrl = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(waMsg)}`;
        window.open(waUrl, '_blank');
    }

    navigate('home');
    document.getElementById('service-request-form').reset();
    showStep1();
}

// Provider Logic
// Consolidated Provider Dashboard logic below (see window.updateProviderDashboard)


window.requestPlanUpgrade = function(planName) {
    const msg = `*PLAN UPGRADE REQUEST*\nProvider: ${currentUser.shopName || currentUser.name}\nPhone: ${currentUser.phone}\nRequested Plan: ${planName}`;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`, '_blank');
    alert("Request sent to Admin via WhatsApp!");
};

window.handleAddEmployee = function(e) {
    e.preventDefault();
    const name = document.getElementById('new-employee-name').value;
    const id = Date.now();
    db.ref(`users/${currentUser.id}/employees/${id}`).set({ id, name });
    document.getElementById('new-employee-name').value = '';
    alert('Employee added!');
};

window.deleteEmployee = function(id) {
    if (confirm('Delete employee?')) {
        db.ref(`users/${currentUser.id}/employees/${id}`).remove();
    }
};


window.markJobStatus = function(rid, status) {
    db.ref(`requests/${rid}`).update({ status });
    alert(`Job ${status}!`);
};

window.showJobCompletionModal = function(rid) {
    const img = prompt("Upload Completion Photo (URL):");
    const payMode = prompt("Payment Mode (Cash / Card / Bank Advance):");
    let advAmount = "";
    if (payMode && payMode.toLowerCase() === 'bank advance') {
        advAmount = prompt("Enter Advance Amount:");
    }

    if (img && payMode) {
        db.ref(`requests/${rid}`).update({ 
            status: 'completed', 
            completionImage: img,
            paymentMode: payMode,
            advance: advAmount
        });

        // If Bank selected, send WhatsApp to customer (Via Admin)
        if (payMode.toLowerCase().includes('bank')) {
            const msg = `*BANK PAYMENT DETAILS*\nJob: ${rid}\nProvider: ${currentUser.shopName}\nBank: ${currentUser.bankName}\nACC: ${currentUser.accNumber}\nBrach: ${currentUser.bankBranch}\nAmount: ${advAmount || 'Full'}`;
            const waUrl = `https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank');
        }
        alert('Job marked as completed!');
    }
};

// Customer Tracking & Dashboard
window.trackJob = function() {
    const tid = document.getElementById('track-number-input').value;
    const resDiv = document.getElementById('tracking-result');
    const job = requests.find(r => r.id === tid);
    if (job) {
        resDiv.innerHTML = `
            <div class="card glass" style="margin-top:10px;">
                <h4>Status: <span style="color:var(--primary);">${job.status.toUpperCase()}</span></h4>
                <p><strong>Service:</strong> ${job.service}</p>
                <p><strong>Provider:</strong> ${job.providerName || 'Assigning...'}</p>
                ${job.completionImage ? `<a href="${job.completionImage}" target="_blank" class="btn-outline w-100 mt-2">View Completion Proof</a>` : ''}
            </div>
        `;
    } else {
        resDiv.innerHTML = '<p style="color:red;">Invalid Tracking Number.</p>';
    }
};

// Consolidated Customer Dashboard logic below (see window.updateCustomerDashboard)


// Plans logic
const DEFAULT_PLANS = [
    { name: "Free Trial", duration: "2.5 Weeks", price: 0 },
    { name: "Weekly", duration: "1 Week", price: 250 },
    { name: "Monthly", duration: "1 Month", price: 1000 },
    { name: "Annual", duration: "1 Year", price: 12000 }
];

// Final Init
db.ref('homeData').on('value', (snapshot) => {
    if (snapshot.val()) {
        homeData = snapshot.val();
        const t = document.getElementById('home-title-display');
        const s = document.getElementById('home-sub-display');
        if (t) t.innerHTML = homeData.title;
        if (s) s.innerHTML = homeData.sub;
    }
});

db.ref('storeItems').on('value', snap => {
    storeItems = snap.val() ? Object.values(snap.val()) : [];
    renderStoreItems();
});

db.ref('gallery').on('value', snap => {
    galleryItems = snap.val() ? Object.values(snap.val()) : [];
    renderGallery();
});

// AI Bot Logic
window.toggleChat = function () {
    const win = document.getElementById('ai-chat-window');
    win.classList.toggle('hidden');
};

window.sendMessage = function () {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    appendMessage(msg, 'user-msg');
    input.value = '';

    // Show typing indicator
    const body = document.getElementById('chat-body');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-msg typing';
    typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    body.appendChild(typingDiv);
    body.scrollTop = body.scrollHeight;

    setTimeout(() => {
        body.removeChild(typingDiv);
        const lowerMsg = msg.toLowerCase();
        let reply = "I'm sorry, I don't understand. Can you rephrase? I can help with CCTV, Solar, Plumbing, and PC repairs. (මට සමාවෙන්න, මට ඒක තේරුණේ නැහැ. ඔබට CCTV, සූර්ය බලශක්ති, ජලනල හෝ පරිගණක අලුත්වැඩියාවන් ගැන මගෙන් අහන්න පුළුවන්.)";

        if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('හලෝ')) {
            reply = "Hello! Welcome to Navithya. How can I help you with our premium services today? (ආයුබෝවන්! නවීත්‍ය වෙත ඔබව සාදරයෙන් පිළිගනිමු. අද මම ඔබට උදව් කරන්නේ කොහොමද?)";
        } else if (lowerMsg.includes('service') || lowerMsg.includes('offer') || lowerMsg.includes('සේවා')) {
            reply = "We offer CCTV Installation, House Wiring, Networking, Solar Panels, Plumbing, and PC/Software repairs. All by verified pros! (අපි CCTV, නිවාස වයරින්, සූර්ය පැනල, ජලනල සහ පරිගණක අලුත්වැඩියාවන් ඇතුළු සියලුම සේවාවන් ලබා දෙනවා.)";
        } else if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('ගණන්')) {
            reply = "Prices vary by service. You can check our 'Store' page for products or request a service for a custom quote. (මිල ගණන් සේවාව අනුව වෙනස් වෙනවා. ඔබට අපගේ 'Store' එකෙන් බඩු බලන්න පුළුවන්, නැත්නම් quotation එකක් ඉල්ලන්න.)";
        } else if (lowerMsg.includes('contact') || lowerMsg.includes('phone') || lowerMsg.includes('කෝල්')) {
            reply = "You can contact us at 0729929453 / 0769929453 or email SNAVITHYA@GMAIL.COM. We are here 24/7!";
        } else if (lowerMsg.includes('location') || lowerMsg.includes('town') || lowerMsg.includes('කොහේද')) {
            reply = "We operate island-wide in Sri Lanka, specifically focusing on your district selected in the app! (අපි ලංකාව පුරාම සේවා සපයනවා.)";
        }

        appendMessage(reply, 'bot-msg');
    }, 1200);
};

function appendMessage(text, className) {
    const body = document.getElementById('chat-body');
    if(!body) return;
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

// Global Features Logic
window.sendBroadcast = function() {
    const msg = document.getElementById('broadcast-msg').value;
    if (!msg) return alert("Enter a message");
    
    const id = Date.now();
    db.ref('notifications/' + id).set({
        id,
        msg,
        type: 'global',
        timestamp: id
    });
    
    alert("Global broadcast sent!");
    document.getElementById('broadcast-msg').value = '';
    navigate('home');
};

db.ref('notifications').on('value', snap => {
    const data = snap.val();
    const list = data ? Object.values(data) : [];
    renderNotifications(list);
});

function renderNotifications(notifs) {
    const listDiv = document.getElementById('notifications-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    notifs.slice().reverse().forEach(n => {
        const div = document.createElement('div');
        div.className = 'card mt-2 glass';
        div.style.borderLeft = '4px solid var(--primary)';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <div>
                <p>${n.msg}</p>
                <small>${new Date(n.timestamp).toLocaleString()}</small>
            </div>
            ${currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer') ? `<button onclick="deleteNotification('${n.id}')" style="color:red; background:none; border:none; cursor:pointer; font-size:1.2rem;"><i class="fas fa-trash"></i></button>` : ''}
        `;
        listDiv.appendChild(div);
    });
}

window.deleteNotification = function(id) {
    if (confirm('Delete notification?')) {
        db.ref('notifications/' + id).remove();
    }
};

// Plan Management logic
window.showNewPlanModal = function() {
    const name = prompt("Plan Name:");
    const dur = prompt("Duration (e.g. 1 Month):");
    const price = prompt("Price (Rs.):");
    if (name && dur && price) {
        db.ref('plans/' + Date.now()).set({ name, duration: dur, price });
        alert("Plan added!");
    }
};

db.ref('plans').on('value', snap => {
    const data = snap.val();
    globalPlans = data ? Object.values(data) : DEFAULT_PLANS;
    renderPlans(globalPlans);
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
});

function renderPlans(plans) {
    const adminList = document.getElementById('admin-plans-list');
    if (adminList) {
        adminList.innerHTML = '';
        plans.forEach(p => {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            div.innerHTML = `<strong>${p.name}</strong> - Rs. ${p.price} / ${p.duration} <button onclick="deletePlan('${p.name}')" style="color:red; background:none; border:none; cursor:pointer; margin-left:10px;">🗑️</button>`;
            adminList.appendChild(div);
        });
    }
}

window.deletePlan = function(name) {
    if (confirm(`Delete plan "${name}"?`)) {
        db.ref('plans').once('value', snap => {
            const data = snap.val();
            for (let key in data) {
                if (data[key].name === name) {
                    db.ref('plans/' + key).remove();
                    break;
                }
            }
        });
    }
};

// Gallery Logic
function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if(!grid) return;
    grid.innerHTML = '';
    galleryItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        if (item.type === 'video') {
            div.innerHTML = `<video src="${item.url}" controls></video>`;
        } else {
            div.innerHTML = `<img src="${item.url}" alt="Gallery Item">`;
        }
        if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) {
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = 'Delete';
            delBtn.onclick = () => db.ref('gallery/' + item.id).remove();
            div.appendChild(delBtn);
        }
        grid.appendChild(div);
    });
}

window.trackJobDirect = function() {
    const tid = document.getElementById('track-number-direct').value;
    const resDiv = document.getElementById('tracking-result-direct');
    if(!resDiv) return;
    const job = requests.find(r => r.id === tid);
    if (job) {
        resDiv.innerHTML = `
            <div class="card" style="background:#f1f5f9; border-left: 5px solid var(--primary);">
                <h4>Status: <span style="color:var(--primary);">${job.status.toUpperCase().replace('_', ' ')}</span></h4>
                <p><strong>Service:</strong> ${job.service}</p>
                <p><strong>Provider:</strong> ${job.providerName || 'Pending Assignment'}</p>
                <p><strong>Location:</strong> ${job.town || job.village || 'N/A'}, ${job.district || ''}</p>
                ${job.status === 'completed' ? `
                    <div style="margin-top:15px; border-top:1px solid var(--border); padding-top:15px;">
                        <p style="color:#10b981; font-weight:bold; font-size:1.2rem;">Job Completed ✓</p>
                        <p><strong>Total Price:</strong> Rs. ${job.completionPrice}</p>
                        <p><strong>Payment Method:</strong> ${job.paymentMethod}</p>
                        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; margin-top:10px;">
                            ${(job.completionPhotos || []).map(p => `<img src="${p}" style="width:100%; height:80px; object-fit:cover; border-radius:8px; cursor:pointer;" onclick="window.open('${p}', '_blank')">`).join('')}
                        </div>
                    </div>
                ` : ''}
                ${job.completionImage ? `<div class="mt-2"><img src="${job.completionImage}" style="max-width:100%; border-radius:8px;"></div>` : ''}
            </div>
        `;
    } else {
        resDiv.innerHTML = '<p style="color:red; font-weight:600;">Invalid Tracking Number.</p>';
    }
};

window.setRating = function(n) {
    document.getElementById('selected-rating').value = n;
    const stars = document.querySelectorAll('.rating-stars span');
    stars.forEach((s, idx) => {
        if (idx < n) s.classList.add('active');
        else s.classList.remove('active');
    });
};

window.submitReview = function() {
    const rat = document.getElementById('selected-rating').value;
    const txt = document.getElementById('review-text').value;
    if (rat == 0) return alert("Please select a rating");
    
    const id = Date.now();
    db.ref('reviews/' + id).set({
        id,
        user: currentUser ? currentUser.name : 'Guest',
        rating: parseInt(rat),
        text: txt,
        timestamp: id
    });
    
    alert("Public review submitted!");
    document.getElementById('review-text').value = '';
    setRating(0);
};

// User to User Ratings
window.openRatingModal = function(targetId, targetName, type) {
    if (!targetId || targetId === 'null') return alert("Target user not found.");
    document.getElementById('rating-target-id').value = targetId;
    document.getElementById('rating-target-type').value = type;
    document.getElementById('rating-modal-title').innerText = `Rate ${type === 'provider' ? 'Provider' : 'Customer'}`;
    document.getElementById('rating-modal-subtitle').innerText = `How was your experience with ${targetName}?`;
    document.getElementById('user-rating-modal').classList.remove('hidden');
};

window.setUserRating = function(n) {
    document.getElementById('selected-user-rating').value = n;
    const stars = document.querySelectorAll('#user-stars span');
    stars.forEach((s, idx) => {
        if (idx < n) s.style.color = '#f6ad55';
        else s.style.color = '#444';
    });
};

window.submitUserRating = function() {
    const targetId = document.getElementById('rating-target-id').value;
    const type = document.getElementById('rating-target-type').value;
    const rating = document.getElementById('selected-user-rating').value;
    const comment = document.getElementById('user-rating-comment').value;

    if (rating == 0) return alert("Please select a star rating.");

    const id = Date.now();
    const ratingData = {
        id,
        fromId: currentUser.id,
        fromName: currentUser.name,
        targetId,
        rating: parseInt(rating),
        comment,
        timestamp: id
    };

    db.ref(`ratings/${type}s/${targetId}/${id}`).set(ratingData);
    
    // Update user average rating
    updateUserAverageRating(targetId, type);

    alert("Rating submitted! Thank you.");
    document.getElementById('user-rating-modal').classList.add('hidden');
    document.getElementById('user-rating-comment').value = '';
    setUserRating(0);
};

function updateUserAverageRating(uid, type) {
    db.ref(`ratings/${type}s/${uid}`).once('value', snap => {
        const ratings = snap.val() ? Object.values(snap.val()) : [];
        if (ratings.length > 0) {
            const avg = ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length;
            db.ref(`users/${uid}`).update({ rating: Math.round(avg) });
        }
    });
}

db.ref('reviews').on('value', snap => {
    const data = snap.val();
    const reviews = data ? Object.values(data) : [];
    const display = document.getElementById('reviews-display');
    if (!display) return;
    display.innerHTML = '';
    reviews.slice().reverse().forEach(r => {
        const div = document.createElement('div');
        div.className = 'card mt-2 glass';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <div>
                <strong>${r.user}</strong><br>
                <span style="color:#f6ad55;">${'⭐'.repeat(r.rating)}</span>
                <p>${r.text}</p>
            </div>
            ${currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer') ? `<button onclick="deleteReview('${r.id}')" style="color:red; background:none; border:none; cursor:pointer; font-size:1.2rem;"><i class="fas fa-trash"></i></button>` : ''}
        `;
        display.appendChild(div);
    });
});

window.deleteReview = function(id) {
    if (confirm('Delete review?')) {
        db.ref('reviews/' + id).remove();
    }
};

let orders = [];
db.ref('orders').on('value', snap => {
    orders = snap.val() ? Object.values(snap.val()) : [];
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
});

let services = [];
db.ref('services').on('value', snap => {
    const data = snap.val();
    if (!data) {
        // Auto-setup default services
        const defaultServices = [
            { id: 1, name: 'CCTV Installation', desc: 'High-quality CCTV setup.', image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=600' },
            { id: 2, name: 'House Wiring', desc: 'Safe electrical house wiring.', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600' },
            { id: 3, name: 'Computer Networking', desc: 'LAN and Wi-Fi networking.', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600' },
            { id: 4, name: 'Hardware', desc: 'PC & Laptop repairs.', image: 'https://images.unsplash.com/photo-1593640495253-23a96b225308?q=80&w=600' },
            { id: 5, name: 'Software', desc: 'OS and software installation.', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600' },
            { id: 6, name: 'Plumbing', desc: 'Water line and pump repairs.', image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=600' },
            { id: 7, name: 'Solar System', desc: 'Solar panel installation.', image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=600' },
            { id: 8, name: 'TV Radio Repair', desc: 'Electronics repair services.', image: 'https://images.unsplash.com/photo-1592833159155-c62df1b65634?q=80&w=600' }
        ];
        defaultServices.forEach(s => db.ref(`services/${s.id}`).set(s));
        return;
    }
    services = Object.values(data);
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer')) updateAdminPanel();
    updateDynamicServices();
});

function updateDynamicServices() {
    // 1. Update Home Screen Services Grid
    const homeGrid = document.querySelector('#page-home .services-grid');
    if (homeGrid && services.length > 0) {
        homeGrid.innerHTML = '';
        services.forEach(s => {
            const div = document.createElement('div');
            div.className = 'service-card';
            div.innerHTML = `
                <img src="${s.image || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=600&auto=format&fit=crop'}" alt="${s.name}">
                <div class="service-info">
                    <h3><i class="fas fa-tools"></i> ${s.name}</h3>
                    <p>${s.desc || 'Professional ' + s.name + ' services.'}</p>
                    <button class="btn-card" onclick="navigate('services'); document.getElementById('req-service').value='${s.name}'; updateServiceDetails('${s.name}');">Book Now <i class="fas fa-arrow-right"></i></button>
                </div>
            `;
            homeGrid.appendChild(div);
        });
    }

    // 2. Update Service Request Dropdown
    const reqSelect = document.getElementById('req-service');
    if (reqSelect) {
        const currentVal = reqSelect.value;
        reqSelect.innerHTML = '<option value="" disabled selected>Select Issue (Service)</option>';
        services.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.name;
            opt.textContent = s.name;
            reqSelect.appendChild(opt);
        });
        if (currentVal && services.find(s => s.name === currentVal)) {
            reqSelect.value = currentVal;
            updateServiceDetails(currentVal);
        }
    }
}

window.updateServiceDetails = function(serviceName) {
    const service = services.find(s => s.name === serviceName);
    if (!service) return;

    const img = document.getElementById('service-main-image');
    const title = document.getElementById('service-main-title');
    const desc = document.getElementById('service-main-desc');
    const breadcrumb = document.getElementById('breadcrumb-service-name');

    if (img) img.src = service.image || 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800';
    if (title) title.innerHTML = `${service.name} <span class="highlight">Solutions</span>`;
    if (breadcrumb) breadcrumb.innerText = service.name;
    if (desc) {
        desc.innerHTML = `
            <p>${service.desc || 'Professional ' + service.name + ' services provided by verified technicians.'}</p>
            <ul style="margin-top:15px; margin-left:20px;">
                <li>24/7 Availability for emergency repairs.</li>
                <li>Certified professionals with verified backgrounds.</li>
                <li>Standardized pricing and genuine spare parts.</li>
                <li>Digital warranty and job tracking enabled.</li>
            </ul>
        `;
    }

    renderRelatedProducts(serviceName);
};

function renderRelatedProducts(serviceName) {
    const section = document.getElementById('related-products-section');
    const grid = document.getElementById('related-products-grid');
    if (!section || !grid) return;

    // Simple keyword matching for related products
    const related = storeItems.filter(item => {
        const keywords = serviceName.toLowerCase().split(' ');
        const itemText = (item.name + ' ' + (item.desc || '')).toLowerCase();
        return keywords.some(k => k.length > 3 && itemText.includes(k));
    });

    if (related.length > 0) {
        section.classList.remove('hidden');
        grid.innerHTML = '';
        related.forEach(item => {
            const div = document.createElement('div');
            div.className = 'service-card glass';
            div.style.paddingBottom = '1rem';
            div.innerHTML = `
                <img src="${item.image || 'https://images.unsplash.com/photo-1550009158-9ebf6d250406?q=80&w=400'}" style="height:150px;">
                <div class="service-info" style="padding:1rem;">
                    <h4 style="font-size:1rem; margin-bottom:0.5rem;">${item.name}</h4>
                    <div style="color:var(--primary); font-weight:bold; margin-bottom:1rem;">Rs. ${item.price}</div>
                    <button class="btn-primary" style="padding:8px 15px; font-size:0.8rem; width:100%;" onclick="buyStoreItem('${item.id}', '${item.name}')">Buy</button>
                </div>
            `;
            grid.appendChild(div);
        });
    } else {
        section.classList.add('hidden');
    }
}

window.updateTowns = function() {
    const dist = document.getElementById('req-district').value;
    const townInput = document.getElementById('req-town');
    if (!dist || !townInput) return;

    // Optional: You could turn this into a select too, but for now we'll just log
    console.log(`District updated to ${dist}. Town input is ready.`);
};

// ====== MISSING ADMIN AND PROVIDER FUNCTIONS ======

window.updateAdminPanel = function() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'developer')) return;

    // Stats
    const validUsers = users.filter(u => u && u.name);
    document.getElementById('stat-users').innerText = validUsers.length;
    document.getElementById('stat-pending').innerText = validUsers.filter(u => u.status === 'pending').length;

    // User Management
    const usersList = document.getElementById('admin-users-list');
    if (usersList) {
        usersList.innerHTML = '';
        const sortedUsers = validUsers.sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0));
        sortedUsers.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.name}<br><small style="color:var(--text-muted)">${u.phone}</small></td>
                <td>${u.district || 'N/A'}<br><small>${u.country || u.province || ''}</small></td>
                <td>
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; background: ${u.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${u.status === 'approved' ? '#10b981' : '#f59e0b'};">
                        ${u.status ? u.status.toUpperCase() : 'UNKNOWN'}
                    </span>
                </td>
                <td>
                    <select onchange="assignRole('${u.id}', this.value)" style="margin-bottom: 5px; padding: 5px; background: #fff; color: #000; border: 1px solid var(--border);">
                        <option value="unassigned" ${u.role === 'unassigned' ? 'selected' : ''}>Unassigned</option>
                        <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
                        <option value="provider" ${u.role === 'provider' ? 'selected' : ''}>Provider</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    <select onchange="assignService('${u.id}', this.value)" style="padding: 5px; background: #fff; color: #000; border: 1px solid var(--border);" ${u.role !== 'provider' ? 'disabled' : ''}>
                        <option value="">No Service</option>
                        ${services.map(s => `<option value="${s.name}" ${u.providerService === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}
                    </select>
                </td>
                <td>
                    ${u.status !== 'approved' ? `
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <select id="plan-select-${u.id}" style="padding: 4px; font-size: 0.75rem; background: #fff; color: #000; border: 1px solid var(--border);">
                                ${globalPlans.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                            </select>
                            <button class="btn-primary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="approveUser('${u.id}', document.getElementById('plan-select-${u.id}').value)">Approve</button>
                        </div>
                    ` : (u.role === 'provider' ? `
                        <div id="plan-display-${u.id}">
                            <span class="glass-bright" style="padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; border: 1px solid var(--primary); color: var(--primary);">
                                ${u.planStatus || 'Free Trial'}
                            </span>
                            <button onclick="togglePlanEdit('${u.id}')" style="background:none; border:none; color:var(--text-muted); cursor:pointer; margin-left:5px;"><i class="fas fa-edit"></i></button>
                        </div>
                        <div id="plan-edit-${u.id}" class="hidden" style="margin-top:5px;">
                            <select id="plan-select-${u.id}" style="padding: 4px; font-size: 0.75rem; background: #fff; color: #000; border: 1px solid var(--border); width: 100%;">
                                ${globalPlans.map(p => `<option value="${p.name}" ${u.planStatus === p.name ? 'selected' : ''}>${p.name}</option>`).join('')}
                            </select>
                            <div style="display:flex; gap:5px; margin-top:5px;">
                                <button class="btn-primary" style="padding: 4px 8px; font-size: 0.75rem; flex:1;" onclick="updateUserPlan('${u.id}', document.getElementById('plan-select-${u.id}').value)">Save</button>
                                <button class="btn-outline" style="padding: 4px 8px; font-size: 0.75rem; flex:1;" onclick="togglePlanEdit('${u.id}')">Cancel</button>
                            </div>
                        </div>
                    ` : '<span style="color:var(--text-dim); font-size:0.8rem;">N/A</span>')}
                    <button class="btn-outline" style="padding: 4px 8px; font-size: 0.75rem; border-color: #ef4444; color: #ef4444; margin-top: 5px; width: 100%;" onclick="rejectUser('${u.id}')">Remove</button>
                </td>
            `;
            usersList.appendChild(tr);
        });
    }

    // Full Job Visibility for Admin
    const allJobsList = document.getElementById('admin-all-jobs-list');
    if (allJobsList) {
        allJobsList.innerHTML = '';
        const allReqs = requests.slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (allReqs.length === 0) allJobsList.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">No jobs found.</td></tr>';
        allReqs.forEach(req => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${req.id}</td>
                <td>${req.service}<br><small>${req.village}, ${req.district}</small></td>
                <td>${req.customerName}</td>
                <td>${req.providerName || '<span style="color:#f59e0b">Pending</span>'}</td>
                <td>
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; background: ${req.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${req.status === 'completed' ? '#10b981' : '#f59e0b'};">
                        ${req.status.toUpperCase().replace('_', ' ')}
                    </span>
                    <button onclick="deleteRequest('${req.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; margin-left:10px;"><i class="fas fa-trash"></i></button>
                </td>
            `;
            allJobsList.appendChild(tr);
        });
    }

    // System Requests (Pending Admin) & Assigned Requests
    const sysReqList = document.getElementById('admin-system-requests');
    if (sysReqList) {
        sysReqList.innerHTML = '';
        const visibleReqs = requests.filter(r => r && (r.status === 'pending_admin' || r.status === 'assigned')).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (visibleReqs.length === 0) sysReqList.innerHTML = '<li style="color:var(--text-muted)">No pending or assigned requests.</li>';
        visibleReqs.forEach(req => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.style.paddingBottom = '10px';
            li.style.borderBottom = '1px solid var(--border)';
            
            if (req.status === 'assigned') {
                li.innerHTML = `
                    <strong>${req.id}</strong> - ${req.service} in ${req.district} <span style="color:var(--primary)">(Assigned to ${req.providerName})</span><br>
                    <small>Customer: ${req.customerName} (${req.customerPhone})</small><br>
                    <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; margin-top: 5px;" onclick="adminNotifyProviderWA('${req.id}')"><i class="fab fa-whatsapp"></i> Notify Provider</button>
                `;
            } else {
                li.innerHTML = `
                    <strong>${req.id}</strong> - ${req.service} in ${req.district} <span style="color:#f59e0b">(Pending Admin)</span><br>
                    <small>Customer: ${req.customerName} (${req.customerPhone})</small><br>
                    <select id="assign-provider-${req.id}" style="padding: 5px; margin-top: 5px; width: auto; display: inline-block; background: #fff; color: #000; border: 1px solid var(--border);">
                        <option value="">Select Provider to Assign</option>
                        ${users.filter(u => u.role === 'provider' && u.status === 'approved' && (!req.service || u.providerService === req.service)).map(u => `<option value="${u.id}">${u.shopName || u.name} (${u.district})</option>`).join('')}
                    </select>
                    <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="assignProviderToJob('${req.id}')">Assign</button>
                `;
            }
            sysReqList.appendChild(li);
        });
    }

    // Provider Completed Jobs
    const compJobsList = document.getElementById('admin-completed-jobs');
    if (compJobsList) {
        compJobsList.innerHTML = '';
        const completedReqs = requests.filter(r => r && r.status === 'completed').sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (completedReqs.length === 0) compJobsList.innerHTML = '<li style="color:var(--text-muted)">No completed jobs yet.</li>';
        completedReqs.forEach(req => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.innerHTML = `
                <div class="glass" style="padding:10px; border-radius:8px;">
                    <strong>${req.id}</strong> - ${req.service} by ${req.providerName || 'Unknown'}<br>
                    <small>Price: Rs. ${req.completionPrice || 'N/A'} | Payment: ${req.paymentMethod || 'N/A'}</small><br>
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        ${(req.completionPhotos || []).map(p => `<img src="${p}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">`).join('')}
                    </div>
                </div>
            `;
            compJobsList.appendChild(li);
        });
    }

    // Admin Store Orders
    const ordersList = document.getElementById('admin-store-orders');
    if (ordersList) {
        ordersList.innerHTML = '';
        if (orders.length === 0) ordersList.innerHTML = '<li style="color:var(--text-muted)">No orders yet.</li>';
        orders.forEach(o => {
            const li = document.createElement('li');
            li.style.marginBottom = '10px';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.innerHTML = `
                <div>
                    <strong>${o.id}</strong> - ${o.itemName}<br>
                    <small>By: ${o.userName} (${o.phone})</small>
                </div>
                <button onclick="deleteOrder('${o.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fas fa-trash"></i></button>
            `;
            ordersList.appendChild(li);
        });
    }

    // Admin Services List
    const servicesList = document.getElementById('admin-services-list');
    if (servicesList) {
        servicesList.innerHTML = '';
        services.forEach(s => {
            const li = document.createElement('li');
            li.style.marginBottom = '5px';
            li.innerHTML = `${s.name} <button onclick="db.ref('services/${s.id}').remove()" style="color:red; background:none; border:none; cursor:pointer; float:right;">✖</button>`;
            servicesList.appendChild(li);
        });
    }

    // Admin Store Items Edit
    const storeEditList = document.getElementById('admin-store-items-list');
    if (storeEditList) {
        storeEditList.innerHTML = '';
        storeItems.forEach(item => {
            const div = document.createElement('div');
            div.style.marginBottom = '5px';
            div.innerHTML = `<strong>${item.name}</strong> - Rs.${item.price} <button onclick="deleteStoreItem('${item.id}')" style="color:red; background:none; border:none; cursor:pointer; float:right;">✖</button>`;
            storeEditList.appendChild(div);
        });
    }
};

window.approveUser = function(uid, planName) {
    db.ref(`users/${uid}`).update({ status: 'approved', planStatus: planName || 'Free Trial' });
    alert('User approved & plan assigned!');
};

window.updateUserPlan = function(uid, planName) {
    db.ref(`users/${uid}`).update({ planStatus: planName });
    alert('Provider plan updated!');
};

window.rejectUser = function(uid) {
    if (confirm('Remove this user?')) {
        db.ref(`users/${uid}`).remove();
    }
};

window.assignRole = function(uid, role) {
    db.ref(`users/${uid}`).update({ role });
    if (currentUser && currentUser.id == uid) {
        currentUser.role = role;
        populateSidebar(role);
    }
};

window.assignService = function(uid, service) {
    db.ref(`users/${uid}`).update({ providerService: service });
};

window.assignProviderToJob = function(jobId) {
    const providerId = document.getElementById(`assign-provider-${jobId}`).value;
    if (!providerId) return alert('Select a provider first.');
    const provider = users.find(u => u.id == providerId);
    db.ref(`requests/${jobId}`).update({
        providerId,
        providerName: provider.shopName || provider.name,
        providerPhone: provider.phone,
        status: 'assigned'
    });
    // Send WhatsApp to Provider via Admin Number
    const msg = `*NEW JOB ASSIGNED*\nID: ${jobId}\nPlease check your provider dashboard on Navithya!`;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`, '_blank');
    alert('Job assigned to provider!');
};

window.adminNotifyProviderWA = function(reqId) {
    const req = requests.find(r => r.id === reqId);
    if (!req || !req.providerPhone) return alert('No provider assigned or missing phone number.');
    
    const waMsg = `*NAVITHYA NEW JOB ASSIGNMENT*\nHi ${req.providerName}, you have been assigned a new job!\n\nID: ${req.id}\nCustomer: ${req.customerName}\nCustomer Phone: ${req.customerPhone}\nLocation: ${req.town}, ${req.district}\nService: ${req.service}\nIssue Details: ${req.desc}\n\nPlease login to your Navithya dashboard to update the status.`;
    const waUrl = `https://wa.me/${req.providerPhone}?text=${encodeURIComponent(waMsg)}`;
    window.open(waUrl, '_blank');
};

window.togglePlanEdit = function(uid) {
    const display = document.getElementById(`plan-display-${uid}`);
    const edit = document.getElementById(`plan-edit-${uid}`);
    if (display && edit) {
        display.classList.toggle('hidden');
        edit.classList.toggle('hidden');
    }
};

window.updateProviderDashboard = function() {
    if (!currentUser || currentUser.role !== 'provider') return;

    // 1. Update Jobs List - CRITICAL: Using loose equality (==) because IDs can be mixed string/number
    const jobsList = document.getElementById('provider-jobs-list');
    if (jobsList) {
        jobsList.innerHTML = '';
        const myJobs = requests.filter(r => r.providerId == currentUser.id).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
        if (myJobs.length === 0) {
            jobsList.innerHTML = '<p style="color:var(--text-muted); padding:2rem; text-align:center;">No jobs assigned to you yet.</p>';
        } else {
            myJobs.forEach(job => {
                const div = document.createElement('div');
                div.className = 'card glass';
                div.style.marginBottom = '1rem';
                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h4 style="color:var(--primary);">${job.id}</h4>
                            <p><strong>Service:</strong> ${job.service}</p>
                            <p><strong>Customer:</strong> ${job.customerName}</p>
                            <p><strong>Phone:</strong> ${job.customerPhone}</p>
                            <p><strong>Location:</strong> ${job.village || job.town || 'N/A'}, ${job.district || ''}</p>
                            <p><strong>Issue:</strong> ${job.desc || ''}</p>
                            <p><strong>Status:</strong> <span class="badge" style="background: ${job.status==='completed' ? '#10b981' : '#f59e0b'}; color:#000;">${job.status.toUpperCase()}</span></p>
                        </div>
                        <div style="text-align:right; display:flex; flex-direction:column; gap:10px;">
                            <button class="btn-primary" style="padding:8px 12px; font-size:0.85rem;" onclick="window.open('https://wa.me/${job.customerPhone}', '_blank')"><i class="fab fa-whatsapp"></i> Chat Customer</button>
                            ${job.status !== 'completed' ? `
                                <button class="btn-outline" style="padding:8px 12px; font-size:0.85rem;" onclick="markJobComplete('${job.id}')">Mark Complete ✅</button>
                            ` : `
                                <div style="display:flex; flex-direction:column; gap:5px;">
                                    <button class="btn-outline" style="padding:8px 12px; font-size:0.85rem;" onclick="openRatingModal('${job.userId}', '${job.customerName}', 'customer')">Rate Customer ⭐</button>
                                    <span style="font-size:0.8rem; color:#10b981; font-weight:bold;">Total: Rs. ${job.completionPrice || '0'}</span>
                                </div>
                            `}
                        </div>
                    </div>
                `;
                jobsList.appendChild(div);
            });
        }
    }

    // 2. Update Plans Display
    const plansDisplay = document.getElementById('provider-plans-display');
    if (plansDisplay) {
        plansDisplay.innerHTML = '';
        globalPlans.forEach(plan => {
            const isActive = currentUser.planStatus === plan.name;
            const div = document.createElement('div');
            div.className = `card glass ${isActive ? 'active-plan' : ''}`;
            if (isActive) div.style.border = '2px solid var(--primary)';
            div.innerHTML = `
                <h4>${plan.name}</h4>
                <div style="font-size:1.5rem; font-weight:800; margin:1rem 0; color:var(--primary);">Rs. ${plan.price}</div>
                <p style="color:var(--text-muted); font-size:0.8rem;">Duration: ${plan.duration}</p>
                <button class="btn-primary w-100 mt-2" ${isActive ? 'disabled' : ''} onclick="requestPlanUpgrade('${plan.name}')">${isActive ? 'Current Plan' : 'Select Plan'}</button>
            `;
            plansDisplay.appendChild(div);
        });
    }

    // 3. Update Profile Info in Dashboard
    const profileDisplay = document.getElementById('provider-profile-display');
    if (profileDisplay) {
        profileDisplay.innerHTML = `
            <div style="padding:15px; border:1px solid var(--border); border-radius:10px; background:rgba(255,255,255,0.02);">
                <h3 style="color:var(--primary); margin-bottom:10px;">Professional Profile</h3>
                <p><strong>Shop:</strong> ${currentUser.shopName || currentUser.name}</p>
                <p><strong>Phone:</strong> ${currentUser.phone}</p>
                <p><strong>Service:</strong> ${currentUser.providerService || 'Unassigned'}</p>
                <p><strong>Plan:</strong> <span style="color:#10b981; font-weight:bold;">${currentUser.planStatus || 'Free Trial'}</span></p>
                <p><strong>Bank:</strong> ${currentUser.bankName || 'N/A'} - ${currentUser.accNumber || 'N/A'}</p>
                <p><strong>Rating:</strong> ${'⭐'.repeat(currentUser.rating || 5)}</p>
            </div>
        `;
    }

    // 4. Update Employee List
    const empList = document.getElementById('employee-list');
    if (empList) {
        empList.innerHTML = '';
        const myEmps = currentUser.employees ? Object.values(currentUser.employees) : [];
        if (myEmps.length === 0) empList.innerHTML = '<p style="color:var(--text-muted)">No employees added.</p>';
        myEmps.forEach(emp => {
            const div = document.createElement('div');
            div.className = 'log-item glass';
            div.style.padding = '10px';
            div.style.marginBottom = '5px';
            div.style.borderRadius = '5px';
            div.innerHTML = `${emp.name} <button onclick="deleteEmployee('${emp.id}')" style="color:red; float:right; border:none; background:none; cursor:pointer;">✖</button>`;
            empList.appendChild(div);
        });
    }
};

window.updateCustomerDashboard = function() {
    if (!currentUser || currentUser.role !== 'customer') return;

    const profileDisplay = document.getElementById('customer-profile-display');
    if (profileDisplay) {
        profileDisplay.innerHTML = `
            <div class="glass" style="padding:15px; border-radius:10px;">
                <p><strong>Name:</strong> ${currentUser.name}</p>
                <p><strong>Phone:</strong> ${currentUser.phone}</p>
                <p><strong>District:</strong> ${currentUser.district || 'N/A'}</p>
            </div>
        `;
    }

    // Job Tracking List
    const myJobs = requests.filter(r => r.userId == currentUser.id).sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
    const trackingRes = document.getElementById('tracking-result');
    if (trackingRes) {
        trackingRes.innerHTML = '<h4>My Recent Jobs</h4>';
        if (myJobs.length === 0) {
            trackingRes.innerHTML += '<p style="color:var(--text-muted); padding:1rem; text-align:center;">No jobs requested yet.</p>';
        } else {
            myJobs.forEach(job => {
                const div = document.createElement('div');
                div.className = 'card glass mt-2';
                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <strong>${job.service}</strong>
                        <small class="badge" style="background:var(--primary); color:#000; font-size:0.7rem;">${job.id}</small>
                    </div>
                    <p>Status: <span style="color:var(--primary); font-weight:bold;">${job.status.toUpperCase().replace('_', ' ')}</span></p>
                    <p>Provider: ${job.providerName || 'Pending Assignment'}</p>
                    <div class="mt-2">
                        ${job.status === 'completed' ? `
                            <div style="margin-top:10px; border-top:1px solid var(--border); padding-top:10px;">
                                <p style="color:#10b981; font-weight:bold;">Job Completed ✓</p>
                                <p><strong>Price:</strong> Rs. ${job.completionPrice}</p>
                                <p><strong>Payment:</strong> ${job.paymentMethod}</p>
                                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:5px; margin-top:5px;">
                                    ${(job.completionPhotos || []).map(p => `<img src="${p}" style="width:100%; height:60px; object-fit:cover; border-radius:4px; cursor:pointer;" onclick="window.open('${p}', '_blank')">`).join('')}
                                </div>
                                <button onclick="openRatingModal('${job.providerId}', '${job.providerName}', 'provider')" class="btn-primary w-100 mt-2">Rate Provider ⭐</button>
                            </div>
                        ` : `
                            <button class="btn-outline w-100" onclick="document.getElementById('track-number-input').value='${job.id}'; trackJob();">View Progress</button>
                        `}
                    </div>
                `;
                trackingRes.appendChild(div);
            });
        }
    }
};

window.markJobComplete = function(id) {
    document.getElementById('completion-job-id').value = id;
    document.getElementById('job-completion-modal').classList.remove('hidden');
};

window.previewJobPhoto = function(input, index) {
    const label = document.getElementById(`preview-${index}`);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            label.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.handleJobCompletionSubmit = async function(e) {
    e.preventDefault();
    const id = document.getElementById('completion-job-id').value;
    const price = document.getElementById('completion-price').value;
    const method = document.getElementById('completion-payment-method').value;
    const submitBtn = document.getElementById('completion-submit-btn');
    
    submitBtn.innerText = "Uploading & Submitting... Please Wait";
    submitBtn.disabled = true;

    const photos = [];
    for (let i = 1; i <= 6; i++) {
        const file = document.getElementById(`job-photo-${i}`).files[0];
        if (file) {
            const photoId = Date.now() + "_" + i;
            const storageRef = storage.ref(`jobs/${id}/${photoId}`);
            try {
                await storageRef.put(file);
                const url = await storageRef.getDownloadURL();
                photos.push(url);
            } catch (err) {
                console.error("Error uploading photo:", err);
            }
        }
    }

    const updates = {
        status: 'completed',
        completionPrice: price,
        paymentMethod: method,
        completionPhotos: photos,
        completionTimestamp: Date.now()
    };

    db.ref(`requests/${id}`).update(updates);
    
    alert('Job Completed! Customer has been notified.');
    document.getElementById('job-completion-modal').classList.add('hidden');
    document.getElementById('job-completion-form').reset();
    
    // Clear previews
    for (let i = 1; i <= 6; i++) {
        document.getElementById(`preview-${i}`).innerHTML = `<i class="fas fa-camera"></i>`;
    }
    
    submitBtn.innerText = "Submit & Complete Job";
    submitBtn.disabled = false;

    // Send WhatsApp to Customer (Optional but good)
    const job = requests.find(r => r.id === id);
    if (job) {
        const waMsg = `*JOB COMPLETED*\nID: ${id}\nService: ${job.service}\nFinal Price: Rs. ${price}\nPayment: ${method}\n\nThank you for choosing Navithya!`;
        const waUrl = `https://wa.me/${job.customerPhone}?text=${encodeURIComponent(waMsg)}`;
        window.open(waUrl, '_blank');
    }
};

window.requestPlanUpgrade = function(planName) {
    const msg = `*PLAN UPGRADE REQUEST*\nUser: ${currentUser.name} (${currentUser.phone})\nRequested Plan: ${planName}`;
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${encodeURIComponent(msg)}`, '_blank');
    alert('Upgrade request sent to admin via WhatsApp!');
};

window.updateProviderPanel = function() {
    updateProviderDashboard();
};

window.renderStoreItems = function() {
    const grid = document.querySelector('.store-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (storeItems.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); padding:3rem; text-align:center;">No items available right now.</p>';
        return;
    }
    storeItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'service-card glass'; // Reuse styling
        div.innerHTML = `
            <img src="${item.image || 'https://images.unsplash.com/photo-1550009158-9ebf6d250406?q=80&w=600&auto=format&fit=crop'}" alt="${item.name}">
            <div class="service-info">
                <h3>${item.name}</h3>
                <p>${item.desc || 'Premium quality product.'}</p>
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin-bottom: 1rem;">Rs. ${item.price}</div>
                <button class="btn-primary w-100" onclick="buyStoreItem('${item.id}', '${item.name}')"><i class="fas fa-shopping-cart"></i> Buy Now</button>
            </div>
        `;
        grid.appendChild(div);
    });
};

window.buyStoreItem = function(id, name) {
    if (!currentUser) {
        alert("Please login to purchase items.");
        showAuthOverlay();
        return;
    }
    const reqId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
    db.ref(`orders/${reqId}`).set({
        id: reqId,
        itemId: id,
        itemName: name,
        userId: currentUser.id,
        userName: currentUser.name,
        phone: currentUser.phone,
        timestamp: Date.now(),
        status: 'pending'
    });
    alert(`Order placed successfully! Order ID: ${reqId}`);
};

window.handleAddService = function(e) {
    e.preventDefault();
    const name = document.getElementById('new-service-name').value;
    const id = Date.now();
    
    // Auto-generate image URL using Unsplash Source (based on name)
    const genImage = `https://source.unsplash.com/600x400/?${encodeURIComponent(name)}`;
    
    db.ref(`services/${id}`).set({ 
        id, 
        name, 
        image: genImage,
        desc: `Professional ${name} services provided by verified experts.`
    });
    document.getElementById('new-service-name').value = '';
    alert('Service added with auto-generated image!');
};

window.adminUpdateHomeInfo = function(e) {
    e.preventDefault();
    const title = document.getElementById('admin-home-title').value;
    const sub = document.getElementById('admin-home-sub').value;
    db.ref('homeData').set({ title, sub });
    alert('Home info updated!');
};

window.adminAddStoreItem = function(e) {
    e.preventDefault();
    const name = document.getElementById('admin-store-name').value;
    const price = document.getElementById('admin-store-price').value;
    const desc = document.getElementById('admin-store-desc').value;
    const id = Date.now();
    db.ref(`storeItems/${id}`).set({ id, name, price, desc, image: 'https://images.unsplash.com/photo-1550009158-9ebf6d250406?q=80&w=600&auto=format&fit=crop' });
    e.target.reset();
    alert('Store item added!');
};

window.deleteStoreItem = function(id) {
    if (confirm('Delete this store item?')) {
        db.ref(`storeItems/${id}`).remove();
    }
};

window.adminAddUser = function(e) {
    e.preventDefault();
    const name = document.getElementById('adm-new-name').value;
    const phone = document.getElementById('adm-new-phone').value;
    const pass = document.getElementById('adm-new-pass').value;
    const role = document.getElementById('adm-new-role').value;
    const district = document.getElementById('adm-new-district').value;
    const id = Date.now();

    const newUser = { id, name, phone, pass, role, district, status: 'approved', timestamp: id };
    db.ref('users/' + id).set(newUser);
    e.target.reset();
    alert('User created successfully and auto-approved!');
};

window.deleteRequest = function(id) {
    if (confirm('Delete this job request permanently?')) {
        db.ref('requests/' + id).remove();
    }
};

window.deleteOrder = function(id) {
    if (confirm('Delete this order?')) {
        db.ref('orders/' + id).remove();
    }
};

window.adminUpdateSettings = function(e) {
    e.preventDefault();
    const updates = {
        phone1: document.getElementById('admin-setting-phone1').value,
        phone2: document.getElementById('admin-setting-phone2').value,
        whatsapp: document.getElementById('admin-setting-wa').value,
        email: document.getElementById('admin-setting-email').value
    };
    db.ref('platformSettings').update(updates);
    alert('Platform Settings Saved!');
};

window.handleGalleryUpload = function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('gallery-file');
    const type = document.getElementById('gallery-type').value;
    const file = fileInput.files[0];
    
    if (!file) return alert("Select a file first.");

    // Limit size for RTDB storage (Base64) - ~1MB is pushing it, but let's try
    if (file.size > 2 * 1024 * 1024) return alert("File too large. Max 2MB for direct upload. Use links for larger videos.");

    const reader = new FileReader();
    reader.onload = function(event) {
        const dataUrl = event.target.result;
        const id = Date.now();
        db.ref(`gallery/${id}`).set({ 
            id, 
            url: dataUrl, 
            type, 
            timestamp: id,
            uploadedBy: currentUser.name
        });
        alert('Uploaded to gallery!');
        e.target.reset();
    };
    reader.readAsDataURL(file);
};

window.showProfileEdit = function() {
    if (!currentUser) return;
    let modal = document.getElementById('profile-modal');
    if (!modal) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'profile-modal';
        modalDiv.className = 'auth-overlay';
        modalDiv.innerHTML = `
            <div class="auth-box">
                <button class="close-auth" type="button" onclick="document.getElementById('profile-modal').classList.add('hidden')">&times;</button>
                <h2>Edit Profile</h2>
                <form onsubmit="handleProfileUpdate(event)" style="margin-top: 1rem;">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="prof-name" value="${currentUser.name || ''}" required>
                    </div>
                    ${currentUser.role === 'provider' ? `
                    <div class="form-group">
                        <label>Bank Name</label>
                        <input type="text" id="prof-bank" value="${currentUser.bankName || ''}">
                    </div>
                    <div class="form-group">
                        <label>Account Number</label>
                        <input type="text" id="prof-acc" value="${currentUser.accNumber || ''}">
                    </div>
                    <div class="form-group">
                        <label>Branch</label>
                        <input type="text" id="prof-branch" value="${currentUser.bankBranch || ''}">
                    </div>
                    ` : ''}
                    <button type="submit" class="btn-primary w-100 mt-4">Save Profile</button>
                </form>
            </div>
        `;
        document.body.appendChild(modalDiv);
        modal = modalDiv;
    }
    modal.classList.remove('hidden');
};

window.handleProfileUpdate = function(e) {
    e.preventDefault();
    const updates = {
        name: document.getElementById('prof-name').value,
    };
    if (currentUser.role === 'provider') {
        updates.bankName = document.getElementById('prof-bank') ? document.getElementById('prof-bank').value : '';
        updates.accNumber = document.getElementById('prof-acc') ? document.getElementById('prof-acc').value : '';
        updates.bankBranch = document.getElementById('prof-branch') ? document.getElementById('prof-branch').value : '';
    }
    db.ref(`users/${currentUser.id}`).update(updates);
    alert('Profile updated successfully!');
    document.getElementById('profile-modal').classList.add('hidden');
    currentUser = { ...currentUser, ...updates };
    localStorage.setItem('navithya_session', JSON.stringify(currentUser));
    if (currentUser.role === 'provider') updateProviderDashboard();
};

// ====== SALES & SPONSOR ADS LOGIC ======
let sponsors = [];
let currentSponsorIndex = 0;

db.ref('sponsors').on('value', snap => {
    sponsors = snap.val() ? Object.values(snap.val()) : [];
    updateSponsorCycle();
});

function updateSponsorCycle() {
    const adContainer = document.getElementById('sponsor-ad-container');
    if (!adContainer || sponsors.length === 0) {
        if (adContainer) adContainer.innerHTML = '';
        return;
    }

    function showNextAd() {
        if (sponsors.length === 0) return;
        const ad = sponsors[currentSponsorIndex];
        adContainer.innerHTML = `
            <div class="sponsor-ad glass" style="animation: slideInRight 0.8s ease-out; margin-bottom: 2rem;">
                <div style="display:flex; align-items:center; gap:20px; padding: 20px;">
                    <img src="${ad.image}" style="width:80px; height:80px; border-radius:12px; object-fit:cover; border: 2px solid var(--primary);">
                    <div style="flex:1;">
                        <h4 style="color:var(--primary); font-size:1.2rem; margin-bottom:5px; font-weight:700;">${ad.name}</h4>
                        <p style="font-size:0.95rem; color:var(--text-muted); line-height:1.4;">${ad.tagline}</p>
                    </div>
                    <a href="${ad.link || '#'}" target="_blank" class="btn-primary" style="padding: 10px 20px; font-size:0.9rem; border-radius: 30px;">Visit Partner <i class="fas fa-external-link-alt"></i></a>
                </div>
            </div>
        `;
        currentSponsorIndex = (currentSponsorIndex + 1) % sponsors.length;
    }

    showNextAd();
    if (window.sponsorInterval) clearInterval(window.sponsorInterval);
    window.sponsorInterval = setInterval(showNextAd, 6000); // Cycle every 6 seconds
}

window.updateSalesPanel = function() {
    if (!currentUser || currentUser.role !== 'sales') return;

    const sponsorList = document.getElementById('sales-sponsors-list');
    if (sponsorList) {
        sponsorList.innerHTML = '';
        if (sponsors.length === 0) sponsorList.innerHTML = '<p style="color:var(--text-muted)">No active sponsors.</p>';
        sponsors.forEach(s => {
            const div = document.createElement('div');
            div.className = 'log-item glass';
            div.style.marginBottom = '10px';
            div.style.borderRadius = '8px';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${s.image}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
                        <div>
                            <strong style="color:var(--text)">${s.name}</strong><br>
                            <small style="color:var(--text-muted)">${s.tagline}</small>
                        </div>
                    </div>
                    <button onclick="deleteSponsor('${s.id}')" style="color:#ef4444; background:none; border:none; cursor:pointer; font-size:1.2rem;"><i class="fas fa-trash"></i></button>
                </div>
            `;
            sponsorList.appendChild(div);
        });
    }
};

window.handleAddSponsor = function(e) {
    e.preventDefault();
    const name = document.getElementById('sponsor-name').value;
    const tagline = document.getElementById('sponsor-tagline').value;
    const image = document.getElementById('sponsor-image').value;
    const link = document.getElementById('sponsor-link').value;
    const id = Date.now();

    db.ref(`sponsors/${id}`).set({ id, name, tagline, image, link });
    e.target.reset();
    alert('Sponsor Advertisement successfully published!');
};

window.deleteSponsor = function(id) {
    if (confirm('Are you sure you want to remove this sponsor?')) {
        db.ref(`sponsors/${id}`).remove();
    }
};

navigate('home');
restoreSession();

// PWA & Push Notifications Setup
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
            
            // Request push notification permission
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log('Notification permission granted.');
                        // In a full FCM setup, you would request a token here and save it to db.ref(`users/${currentUser.id}/fcmToken`)
                    }
                });
            }
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}


