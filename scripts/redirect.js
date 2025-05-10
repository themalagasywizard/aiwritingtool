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
    // Auto-redirect authenticated users for direct visits to landing page
    // Check if the user is on the landing page (index.html)
    if (window.location.pathname === '/' || 
        window.location.pathname === '/index.html' || 
        window.location.pathname.endsWith('/index.html')) {
        
        // Check if user is authenticated via Supabase
        try {
            // If using Supabase auth
            const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
            const supabaseKey = document.querySelector('meta[name="supabase-anon-key"]')?.content;
            
            if (supabaseUrl && supabaseKey && typeof supabase !== 'undefined') {
                const { data: { user } } = supabase.auth.getUser();
                if (user) {
                    // User is authenticated, redirect to editor
                    window.location.href = 'editor.html';
                }
            } else {
                // Fallback to localStorage check if Supabase is not available
                if (localStorage.getItem('isAuthenticated') === 'true') {
                    window.location.href = 'editor.html';
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
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