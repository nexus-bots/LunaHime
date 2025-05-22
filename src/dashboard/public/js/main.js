// Main JavaScript file for LunaHime Dashboard

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize any components
    initializeComponents();
    
    // Add event listeners
    addEventListeners();
});

/**
 * Initialize dashboard components
 */
function initializeComponents() {
    // Add any initialization code here
}

/**
 * Add event listeners
 */
function addEventListeners() {
    // Add any event listeners here
}

/**
 * Handle API errors
 * @param {Error} error - Error object
 */
function handleApiError(error) {
    console.error('API Error:', error);
    // You could show a toast notification or alert here
}

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Create a toast notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        
        // Remove from DOM after animation
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
