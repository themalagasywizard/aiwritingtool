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

// Utility function to check if we have a valid user session
function hasValidSession() {
    try {
        // Check for token in localStorage
        const tokenJson = localStorage.getItem('supabase_auth_token');
        if (!tokenJson) return false;
        
        // Parse token and check if it has user data
        const token = JSON.parse(tokenJson);
        return !!token?.user?.id;
    } catch (e) {
        console.warn('Error checking session:', e);
        return false;
    }
}

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
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const hasSession = hasValidSession();
        
        // If authenticated with a valid session and not redirected, go to editor
        if (isAuthenticated && hasSession && !redirected) {
            console.log("User is authenticated with valid session, redirecting to editor");
            window.location.href = 'editor.html?redirected=true&from_landing=true';
            return;
        } 
        // If authenticated but no valid session, clear auth state
        else if (isAuthenticated && !hasSession) {
            console.log("Invalid session detected, clearing auth state");
            localStorage.removeItem('isAuthenticated');
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