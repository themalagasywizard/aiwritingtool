// Redirect handling script for Kalligram

// Function to redirect authenticated users directly to the editor
function redirectToEditor() {
    // Check local storage or cookies for authentication status
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (isAuthenticated) {
        window.location.href = 'editor.html';
    }
}

// Function to handle subscription form submission
function handleSubscription(email) {
    // In a real app, you'd send this to your backend
    alert(`Thanks for subscribing with email: ${email}`);
    
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
    // Prevent redirect loops by checking URL params
    const urlParams = new URLSearchParams(window.location.search);
    const isRedirected = urlParams.has('redirected');
    
    // Auto-redirect authenticated users for direct visits to landing page
    // but only if we haven't been redirected already
    if (!isRedirected &&
        (window.location.pathname === '/' || 
        window.location.pathname === '/index.html' || 
        window.location.pathname.endsWith('/index.html'))) {
        
        // Check if user is authenticated
        if (localStorage.getItem('isAuthenticated') === 'true') {
            console.log("User is authenticated, redirecting to editor");
            window.location.href = 'editor.html?redirected=true';
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