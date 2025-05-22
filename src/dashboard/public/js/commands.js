// Commands Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Initialize command search
    initCommandSearch();
    
    // Initialize category navigation
    initCategoryNavigation();
    
    // Initialize mobile menu
    initMobileMenu();
});

/**
 * Initialize command search functionality
 */
function initCommandSearch() {
    const searchInput = document.getElementById('command-search');
    const commandItems = document.querySelectorAll('.command-item');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        commandItems.forEach(item => {
            const commandName = item.querySelector('.command-header h3').textContent.toLowerCase();
            const commandDescription = item.querySelector('.command-body > p').textContent.toLowerCase();
            const commandAliases = item.querySelector('.command-aliases .detail-value')?.textContent.toLowerCase() || '';
            
            if (commandName.includes(searchTerm) || 
                commandDescription.includes(searchTerm) || 
                commandAliases.includes(searchTerm)) {
                item.style.display = 'block';
                
                // Also show the parent category
                const category = item.closest('.command-category');
                if (category) {
                    category.style.display = 'block';
                }
            } else {
                item.style.display = 'none';
            }
        });
        
        // Hide categories with no visible commands
        document.querySelectorAll('.command-category').forEach(category => {
            const visibleCommands = category.querySelectorAll('.command-item[style="display: block"]').length;
            if (visibleCommands === 0 && searchTerm !== '') {
                category.style.display = 'none';
            } else {
                category.style.display = 'block';
            }
        });
    });
}

/**
 * Initialize category navigation
 */
function initCategoryNavigation() {
    const categoryLinks = document.querySelectorAll('.commands-categories a');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            categoryLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Get target category ID
            const targetId = link.getAttribute('href').substring(1);
            const targetCategory = document.getElementById(targetId);
            
            if (targetCategory) {
                // Scroll to category with offset for header
                const headerHeight = document.querySelector('.landing-header').offsetHeight;
                const targetPosition = targetCategory.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Highlight active category based on scroll position
    window.addEventListener('scroll', () => {
        const categories = document.querySelectorAll('.command-category');
        const headerHeight = document.querySelector('.landing-header').offsetHeight;
        
        let currentCategory = null;
        
        categories.forEach(category => {
            const rect = category.getBoundingClientRect();
            
            if (rect.top <= headerHeight + 100 && rect.bottom >= headerHeight + 100) {
                currentCategory = category.id;
            }
        });
        
        if (currentCategory) {
            categoryLinks.forEach(link => {
                const targetId = link.getAttribute('href').substring(1);
                
                if (targetId === currentCategory) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    });
}

/**
 * Initialize mobile menu
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.landing-header nav');
    
    if (!menuToggle || !nav) return;
    
    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        
        // Toggle icon
        const icon = menuToggle.querySelector('i');
        if (icon.classList.contains('fa-bars')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}
