// Redirect handling script for Kalligram

// Function to redirect authenticated users directly to the editor
function redirectToEditor() {
    // Check local storage or cookies for authentication status
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const redirected = new URLSearchParams(window.location.search).has('redirected');
    const fromAuth = new URLSearchParams(window.location.search).has('from_auth');
    
    if (isAuthenticated && !redirected) {
        console.log('User is authenticated, redirecting to editor');
        // Add redirected and from parameters to prevent loops
        window.location.href = 'editor.html?redirected=true&from_landing=true';
    }
}

// Function to handle subscription form submission
function handleSubscription(email) {
    // Store email in localStorage for demo purposes
    localStorage.setItem('pendingEmail', email);
    
    // Redirect to the authentication page
    window.location.href = 'auth/auth.html';
}

// Expose functions globally
window.redirectApp = {
    toEditor: redirectToEditor,
    subscribe: handleSubscription
};

// Check if we should redirect on page load
document.addEventListener('DOMContentLoaded', function() {
    // Get current page path
    const currentPath = window.location.pathname;
    const isLandingPage = currentPath === '/' || 
                         currentPath === '/index.html' || 
                         currentPath.endsWith('/index.html');
    
    // Only handle redirects on landing page
    if (isLandingPage) {
        // Check for login success parameter
        const urlParams = new URLSearchParams(window.location.search);
        const loginSuccess = urlParams.has('login_success');
        const redirected = urlParams.has('redirected');
        const fromEditor = urlParams.has('from_editor');
        
        // If we just logged in successfully, go to editor
        if (loginSuccess) {
            console.log('Login success, redirecting to editor');
            window.location.href = 'editor.html?redirected=true&from_auth=true';
            return;
        }
        
        // Prevent redirect loops - don't redirect if we came from the editor
        if (fromEditor) {
            console.log('Coming from editor, not redirecting back');
            // Clear the redirected flag to allow manual navigation later
            history.replaceState(null, '', window.location.pathname);
            return;
        }
        
        // Check if user is authenticated and not already redirected
        if (localStorage.getItem('isAuthenticated') === 'true' && !redirected) {
            console.log("User is authenticated, redirecting to editor");
            window.location.href = 'editor.html?redirected=true&from_landing=true';
            return;
        }
        
        // Check if there's a pending email and auto-fill the subscription form
        const pendingEmail = localStorage.getItem('pendingEmail');
        const emailInput = document.getElementById('emailInput');
        if (pendingEmail && emailInput) {
            emailInput.value = pendingEmail;
        }
    }
    
    // Setup event listeners for the subscribe form if it exists
    const subscribeForm = document.getElementById('subscribeForm');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = document.getElementById('emailInput');
            if (emailInput && emailInput.value) {
                handleSubscription(emailInput.value.trim());
            }
        });
    }
    
    // Update Get Started button links to go to auth page
    document.querySelectorAll('a[href="#signup"]').forEach(link => {
        link.href = 'auth/auth.html';
    });
}); 