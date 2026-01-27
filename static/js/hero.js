// ==================== HERO ANIMATION CONTROLLER ====================

class HeroAnimation {
    constructor() {
        this.heroContainer = document.getElementById('heroContainer');
        this.mainContent = document.getElementById('mainContent');
        this.skipButton = document.getElementById('skipButton');
        this.heroImage = document.getElementById('heroImage');
        
        this.animationDuration = 6000; // 6 seconds
        this.hasSkipped = false;
        
        this.init();
    }
    
    init() {
        // Check if user has seen hero animation before
        const hasSeenHero = sessionStorage.getItem('hasSeenHero');
        
        if (hasSeenHero) {
            this.skipAnimation();
            return;
        }
        
        // Preload image
        this.preloadImage();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Auto-transition after animation completes
        setTimeout(() => {
            if (!this.hasSkipped) {
                this.completeAnimation();
            }
        }, this.animationDuration + 1000);
    }
    
    preloadImage() {
        const img = new Image();
        img.src = this.heroImage.src;
        
        img.onload = () => {
            console.log('✅ Hero image loaded successfully');
        };
        
        img.onerror = () => {
            console.error('❌ Failed to load hero image');
            this.skipAnimation();
        };
    }
    
    setupEventListeners() {
        // Skip button click
        this.skipButton.addEventListener('click', () => {
            this.skipAnimation();
        });
        
        // Keyboard shortcut (ESC or SPACE)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === ' ') {
                e.preventDefault();
                this.skipAnimation();
            }
        });
    }
    
    skipAnimation() {
        if (this.hasSkipped) return;
        
        this.hasSkipped = true;
        
        // Fade out hero container
        this.heroContainer.classList.add('fade-out');
        
        // Show main content
        setTimeout(() => {
            this.heroContainer.style.display = 'none';
            this.mainContent.classList.add('show');
            sessionStorage.setItem('hasSeenHero', 'true');
        }, 1000);
    }
    
    completeAnimation() {
        this.skipAnimation();
    }
}

// ==================== INITIALIZE ON DOM READY ====================
document.addEventListener('DOMContentLoaded', () => {
    new HeroAnimation();
});

// ==================== PERFORMANCE MONITORING ====================
if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('⏱️ Hero page load time:', Math.round(perfData.loadEventEnd - perfData.fetchStart), 'ms');
    });
}
