/**
 * Complete Theme Manager for ThePegeArts Portfolio
 * Version: 2.0 - Full Featured with Advanced Animations
 * Features: Dark/Light mode, System preference detection, 
 *          Advanced animations, Component integration, Accessibility
 */

class ThemeManager {
    constructor() {
        // Core properties
        this.currentTheme = 'light';
        this.toggleBtn = null;
        this.themeIcon = null;
        this.isTransitioning = false;
        this.observers = [];
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            storageKey: 'thepegearts-theme',
            transitionDuration: 400,
            animationDuration: 600,
            debounceDelay: 100,
            autoDetectSystem: true,
            enableAnimations: true,
            enableSounds: false, // Future feature
            enableHaptics: false // Future feature
        };
        
        // Theme definitions
        this.themes = {
            light: {
                name: 'Light Mode',
                icon: 'fas fa-moon',
                label: 'Switch to dark mode',
                ariaLabel: 'Currently in light mode, switch to dark mode',
                colors: {
                    primary: '#A78BFA',
                    secondary: '#F9A8D4',
                    accent: '#6EE7B7',
                    background: '#F8FAFC',
                    surface: '#FFFFFF',
                    text: '#2D3748',
                    textSecondary: '#718096',
                    border: 'rgba(167, 139, 250, 0.2)'
                },
                particles: ['#A78BFA', '#F9A8D4', '#6EE7B7'],
                waveform: {
                    primary: '#A78BFA',
                    secondary: '#F9A8D4',
                    background: 'rgba(167, 139, 250, 0.1)'
                }
            },
            dark: {
                name: 'Dark Mode',
                icon: 'fas fa-sun',
                label: 'Switch to light mode',
                ariaLabel: 'Currently in dark mode, switch to light mode',
                colors: {
                    primary: '#C4B5FD',
                    secondary: '#FBBF24',
                    accent: '#34D399',
                    background: '#0F172A',
                    surface: '#1E293B',
                    text: '#F8FAFC',
                    textSecondary: '#CBD5E0',
                    border: 'rgba(196, 181, 253, 0.3)'
                },
                particles: ['#C4B5FD', '#FBBF24', '#34D399'],
                waveform: {
                    primary: '#C4B5FD',
                    secondary: '#FBBF24',
                    background: 'rgba(196, 181, 253, 0.1)'
                }
            }
        };
        
        // Animation configurations
        this.animations = {
            buttonClick: {
                scale: 0.8,
                duration: 0.15,
                ease: "power2.in"
            },
            buttonRelease: {
                scale: 1,
                duration: 0.2,
                ease: "back.out(1.7)"
            },
            iconRotation: {
                entry: {
                    rotation: -180,
                    scale: 0,
                    duration: 0.2,
                    ease: "power2.in"
                },
                exit: {
                    rotation: 360,
                    scale: 1,
                    duration: 0.3,
                    ease: "back.out(1.7)"
                }
            },
            themeTransition: {
                duration: 0.6,
                ease: "power2.inOut"
            }
        };
        
        // Performance monitoring
        this.performance = {
            startTime: 0,
            endTime: 0,
            transitionCount: 0,
            averageTransitionTime: 0
        };
        
        // Error handling
        this.errors = [];
        this.warnings = [];
        
        // Bind methods
        this.handleToggleClick = this.handleToggleClick.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleResize = this.debounce(this.handleResize.bind(this), this.config.debounceDelay);
    }
    
    /**
     * Initialize the theme manager
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        console.log('🎨 Initializing Complete Theme Manager...');
        this.performance.startTime = performance.now();
        
        try {
            // Check browser compatibility
            if (!this.checkCompatibility()) {
                throw new Error('Browser not compatible with theme system');
            }
            
            // Create or find toggle button
            await this.createToggleButton();
            
            // Load saved theme preference
            this.loadSavedTheme();
            
            // Setup all event listeners
            this.setupEventListeners();
            
            // Apply initial theme
            await this.applyTheme(this.currentTheme, false);
            
            // Initialize component integrations
            this.initializeIntegrations();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            // Mark as initialized
            this.isInitialized = true;
            
            this.performance.endTime = performance.now();
            const initTime = this.performance.endTime - this.performance.startTime;
            
            console.log(`✅ Theme Manager initialized successfully in ${initTime.toFixed(2)}ms`);
            console.log(`📊 Current theme: ${this.currentTheme}`);
            console.log(`🎯 Auto-detect system: ${this.config.autoDetectSystem}`);
            
            // Dispatch initialization event
            this.dispatchEvent('themeManagerReady', {
                theme: this.currentTheme,
                initTime,
                features: this.getFeatures()
            });
            
            return true;
            
        } catch (error) {
            this.logError('Initialization failed', error);
            console.error('❌ Theme Manager initialization failed:', error);
            return false;
        }
    }
    
    /**
     * Check browser compatibility
     * @returns {boolean} Compatibility status
     */
    checkCompatibility() {
        const required = [
            'localStorage',
            'addEventListener',
            'querySelector',
            'classList',
            'matchMedia'
        ];
        
        const missing = required.filter(feature => {
            if (feature === 'localStorage') return !window.localStorage;
            if (feature === 'matchMedia') return !window.matchMedia;
            return !document[feature] && !Element.prototype[feature];
        });
        
        if (missing.length > 0) {
            this.logWarning(`Missing browser features: ${missing.join(', ')}`);
            return false;
        }
        
        // Check CSS custom properties support
        if (!window.CSS || !CSS.supports || !CSS.supports('color', 'var(--test)')) {
            this.logWarning('CSS custom properties not supported');
            return false;
        }
        
        return true;
    }
    
    /**
     * Create or locate theme toggle button
     * @returns {Promise<void>}
     */
    async createToggleButton() {
        // First, try to find existing button
        this.toggleBtn = document.getElementById('themeToggle');
        
        if (!this.toggleBtn) {
            // Create button if it doesn't exist
            const navbar = document.querySelector('.navbar-nav.ms-auto');
            if (!navbar) {
                throw new Error('Navbar not found - cannot create theme toggle');
            }
            
            const themeWrapper = document.createElement('li');
            themeWrapper.className = 'nav-item theme-toggle-wrapper';
            themeWrapper.innerHTML = `
                <button class="theme-toggle-btn" id="themeToggle" 
                        aria-label="Toggle theme" 
                        aria-pressed="false"
                        type="button"
                        title="Switch theme">
                    <i class="fas fa-moon theme-icon" aria-hidden="true"></i>
                    <span class="sr-only">Toggle between light and dark mode</span>
                </button>
            `;
            
            navbar.appendChild(themeWrapper);
            this.toggleBtn = document.getElementById('themeToggle');
            
            console.log('🔘 Theme toggle button created');
        } else {
            console.log('🔘 Theme toggle button found');
        }
        
        // Get theme icon
        this.themeIcon = this.toggleBtn?.querySelector('.theme-icon');
        
        if (!this.themeIcon) {
            throw new Error('Theme icon not found in toggle button');
        }
        
        // Add GSAP timeline if available
        if (window.gsap) {
            this.buttonTimeline = gsap.timeline({ paused: true });
            console.log('✨ GSAP animations enabled');
        }
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Button interactions
        this.toggleBtn.addEventListener('click', this.handleToggleClick);
        this.toggleBtn.addEventListener('keydown', this.handleKeydown);
        
        // Touch events for mobile
        this.toggleBtn.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.toggleBtn.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // System theme changes
        if (window.matchMedia && this.config.autoDetectSystem) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener(this.handleSystemThemeChange);
            
            // Also listen for contrast preferences
            const contrastQuery = window.matchMedia('(prefers-contrast: high)');
            contrastQuery.addListener(this.handleContrastChange.bind(this));
            
            // Motion preference
            const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            motionQuery.addListener(this.handleMotionChange.bind(this));
        }
        
        // Page visibility for performance
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Window resize for responsive adjustments
        window.addEventListener('resize', this.handleResize);
        
        // Storage changes (for multi-tab sync)
        window.addEventListener('storage', this.handleStorageChange.bind(this));
        
        // Before unload for cleanup
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        console.log('👂 Event listeners attached');
    }
    
    /**
     * Handle toggle button click
     * @param {Event} event - Click event
     */
    handleToggleClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.isTransitioning) {
            console.log('⏳ Theme transition in progress, ignoring click');
            return;
        }
        
        // Add haptic feedback if supported
        if (this.config.enableHaptics && 'vibrate' in navigator) {
            navigator.vibrate(50);
        }
        
        this.toggleTheme();
    }
    
    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!this.isTransitioning) {
                this.toggleTheme();
            }
        }
        
        // Easter egg: Konami code for special themes
        this.handleKonamiCode(event);
    }
    
    /**
     * Handle touch events for mobile
     * @param {TouchEvent} event - Touch event
     */
    handleTouchStart(event) {
        if (this.config.enableAnimations) {
            this.toggleBtn.style.transform = 'scale(0.95)';
        }
    }
    
    /**
     * Handle touch end for mobile
     * @param {TouchEvent} event - Touch event
     */
    handleTouchEnd(event) {
        if (this.config.enableAnimations) {
            setTimeout(() => {
                this.toggleBtn.style.transform = '';
            }, 150);
        }
    }
    
    /**
     * Handle system theme changes
     * @param {MediaQueryListEvent} event - Media query event
     */
    handleSystemThemeChange(event) {
        // Only auto-switch if user hasn't manually set a preference
        const hasManualPreference = localStorage.getItem(this.config.storageKey);
        
        if (!hasManualPreference && this.config.autoDetectSystem) {
            const newTheme = event.matches ? 'dark' : 'light';
            console.log(`🖥️ System theme changed to: ${newTheme}`);
            this.setTheme(newTheme, true);
        }
    }
    
    /**
     * Handle contrast preference changes
     * @param {MediaQueryListEvent} event - Media query event
     */
    handleContrastChange(event) {
        document.documentElement.toggleClass('high-contrast', event.matches);
        console.log(`🔍 High contrast mode: ${event.matches ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Handle motion preference changes
     * @param {MediaQueryListEvent} event - Media query event
     */
    handleMotionChange(event) {
        this.config.enableAnimations = !event.matches;
        document.documentElement.toggleClass('reduce-motion', event.matches);
        console.log(`🎬 Animations: ${this.config.enableAnimations ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Handle page visibility changes
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause animations when tab is hidden
            this.pauseAnimations();
        } else {
            // Resume animations when tab is visible
            this.resumeAnimations();
        }
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust button size for mobile
        const isMobile = window.innerWidth < 768;
        this.toggleBtn.classList.toggle('mobile', isMobile);
    }
    
    /**
     * Handle storage changes for multi-tab sync
     * @param {StorageEvent} event - Storage event
     */
    handleStorageChange(event) {
        if (event.key === this.config.storageKey && event.newValue !== this.currentTheme) {
            console.log('🔄 Theme changed in another tab, syncing...');
            this.currentTheme = event.newValue || 'light';
            this.applyTheme(this.currentTheme, true);
        }
    }
    
    /**
     * Handle before unload for cleanup
     */
    handleBeforeUnload() {
        this.destroy();
    }
    
    /**
     * Toggle between themes
     * @returns {Promise<void>}
     */
    async toggleTheme() {
        if (this.isTransitioning) return;
        
        this.performance.transitionCount++;
        const startTime = performance.now();
        
        this.isTransitioning = true;
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        console.log(`🔄 Toggling theme: ${this.currentTheme} → ${newTheme}`);
        
        try {
            // Animate button click
            await this.animateButtonClick();
            
            // Change theme
            await this.setTheme(newTheme, true);
            
            // Track performance
            const endTime = performance.now();
            const transitionTime = endTime - startTime;
            this.updatePerformanceMetrics(transitionTime);
            
            console.log(`✅ Theme toggle completed in ${transitionTime.toFixed(2)}ms`);
            
        } catch (error) {
            this.logError('Theme toggle failed', error);
        } finally {
            setTimeout(() => {
                this.isTransitioning = false;
            }, this.config.transitionDuration);
        }
    }
    
    /**
     * Set specific theme
     * @param {string} theme - Theme to set
     * @param {boolean} animated - Whether to animate
     * @returns {Promise<void>}
     */
    async setTheme(theme, animated = true) {
        if (!this.themes[theme]) {
            throw new Error(`Invalid theme: ${theme}`);
        }
        
        const oldTheme = this.currentTheme;
        this.currentTheme = theme;
        
        console.log(`🎨 Setting theme: ${theme}${animated ? ' (animated)' : ''}`);
        
        try {
            // Apply theme
            await this.applyTheme(theme, animated);
            
            // Save preference
            this.saveTheme(theme);
            
            // Update accessibility
            this.updateAccessibility(theme);
            
            // Update integrations
            await this.updateIntegrations(theme);
            
            // Dispatch change event
            this.dispatchEvent('themeChanged', {
                theme,
                oldTheme,
                animated,
                colors: this.themes[theme].colors,
                timestamp: Date.now()
            });
            
        } catch (error) {
            // Rollback on error
            this.currentTheme = oldTheme;
            throw error;
        }
    }
    
    /**
     * Apply theme to document
     * @param {string} theme - Theme to apply
     * @param {boolean} animated - Whether to animate
     * @returns {Promise<void>}
     */
    async applyTheme(theme, animated = true) {
        const themeConfig = this.themes[theme];
        
        if (animated && this.config.enableAnimations) {
            document.body.classList.add('theme-switching');
            document.body.classList.add('theme-transition-active');
        }
        
        // Apply theme attribute
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update CSS custom properties programmatically for fallback
        this.updateCSSProperties(themeConfig.colors);
        
        // Update meta theme-color
        this.updateMetaThemeColor(theme);
        
        // Update favicon if needed
        this.updateFavicon(theme);
        
        // Update theme icon
        if (animated) {
            await this.animateThemeIcon(theme);
        } else {
            this.updateThemeIcon(theme);
        }
        
        // Clean up animation classes
        if (animated) {
            setTimeout(() => {
                document.body.classList.remove('theme-switching');
                document.body.classList.remove('theme-transition-active');
            }, this.config.transitionDuration);
        }
        
        console.log(`🎯 Theme applied: ${theme}`);
    }
    
    /**
     * Update CSS custom properties
     * @param {Object} colors - Color configuration
     */
    updateCSSProperties(colors) {
        const root = document.documentElement;
        
        Object.entries(colors).forEach(([key, value]) => {
            const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}-color`;
            root.style.setProperty(cssVar, value);
        });
    }
    
    /**
     * Update theme icon with animation
     * @param {string} theme - Current theme
     * @returns {Promise<void>}
     */
    async animateThemeIcon(theme) {
        const themeConfig = this.themes[theme];
        
        if (window.gsap && this.config.enableAnimations) {
            return new Promise((resolve) => {
                const tl = gsap.timeline({
                    onComplete: resolve
                });
                
                tl.to(this.themeIcon, {
                    ...this.animations.iconRotation.entry,
                    onComplete: () => {
                        this.themeIcon.className = `theme-icon ${themeConfig.icon}`;
                    }
                })
                .to(this.themeIcon, this.animations.iconRotation.exit);
            });
        } else {
            // CSS fallback animation
            return new Promise((resolve) => {
                this.themeIcon.style.transform = 'rotate(180deg) scale(0)';
                this.themeIcon.style.transition = 'transform 0.2s ease-in';
                
                setTimeout(() => {
                    this.themeIcon.className = `theme-icon ${themeConfig.icon}`;
                    this.themeIcon.style.transform = 'rotate(360deg) scale(1)';
                    this.themeIcon.style.transition = 'transform 0.3s ease-out';
                    
                    setTimeout(resolve, 300);
                }, 200);
            });
        }
    }
    
    /**
     * Update theme icon without animation
     * @param {string} theme - Current theme
     */
    updateThemeIcon(theme) {
        const themeConfig = this.themes[theme];
        this.themeIcon.className = `theme-icon ${themeConfig.icon}`;
        this.toggleBtn.setAttribute('aria-label', themeConfig.ariaLabel);
        this.toggleBtn.setAttribute('title', themeConfig.label);
    }
    
    /**
     * Animate button click
     * @returns {Promise<void>}
     */
    async animateButtonClick() {
        if (window.gsap && this.config.enableAnimations) {
            return new Promise((resolve) => {
                const tl = gsap.timeline({
                    onComplete: resolve
                });
                
                tl.to(this.toggleBtn, this.animations.buttonClick)
                  .to(this.toggleBtn, this.animations.buttonRelease);
            });
        } else {
            // CSS fallback
            return new Promise((resolve) => {
                this.toggleBtn.style.transform = 'scale(0.8)';
                this.toggleBtn.style.transition = 'transform 0.15s ease-in';
                
                setTimeout(() => {
                    this.toggleBtn.style.transform = 'scale(1)';
                    this.toggleBtn.style.transition = 'transform 0.2s ease-out';
                    setTimeout(resolve, 200);
                }, 150);
            });
        }
    }
    
    /**
     * Update meta theme color
     * @param {string} theme - Current theme
     */
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        metaThemeColor.content = this.themes[theme].colors.background;
        
        // Also update Apple status bar
        let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (!appleStatusBar) {
            appleStatusBar = document.createElement('meta');
            appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
            document.head.appendChild(appleStatusBar);
        }
        
        appleStatusBar.content = theme === 'dark' ? 'black-translucent' : 'default';
    }
    
    /**
     * Update favicon based on theme
     * @param {string} theme - Current theme
     */
    updateFavicon(theme) {
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
            const currentHref = favicon.href;
            const newHref = theme === 'dark' 
                ? currentHref.replace('.ico', '-dark.ico')
                : currentHref.replace('-dark.ico', '.ico');
            
            if (newHref !== currentHref) {
                favicon.href = newHref;
            }
        }
    }
    
    /**
     * Update accessibility attributes
     * @param {string} theme - Current theme
     */
    updateAccessibility(theme) {
        // Update ARIA attributes
        this.toggleBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        this.toggleBtn.setAttribute('aria-label', this.themes[theme].ariaLabel);
        
        // Update body classes for screen readers
        document.body.classList.toggle('dark-theme', theme === 'dark');
        document.body.classList.toggle('light-theme', theme === 'light');
        
        // Announce theme change to screen readers
        this.announceThemeChange(theme);
    }
    
    /**
     * Announce theme change to screen readers
     * @param {string} theme - New theme
     */
    announceThemeChange(theme) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = `Switched to ${this.themes[theme].name}`;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    /**
     * Initialize component integrations
     */
    initializeIntegrations() {
        // Initialize particle system integration
        this.particleIntegration = new ParticleIntegration(this);
        
        // Initialize waveform integration
        this.waveformIntegration = new WaveformIntegration(this);
        
        // Initialize animation integration
        this.animationIntegration = new AnimationIntegration(this);
        
        console.log('🔗 Component integrations initialized');
    }
    
    /**
     * Update integrations when theme changes
     * @param {string} theme - New theme
     * @returns {Promise<void>}
     */
    async updateIntegrations(theme) {
        const themeConfig = this.themes[theme];
        
        try {
            // Update particles
            if (this.particleIntegration) {
                this.particleIntegration.updateColors(themeConfig.particles);
            }
            
            // Update waveforms
            if (this.waveformIntegration) {
                this.waveformIntegration.updateTheme(themeConfig.waveform);
            }
            
            // Update animations
            if (this.animationIntegration) {
                this.animationIntegration.updateTheme(themeConfig);
            }
            
            // Update external components
            await this.updateExternalComponents(theme);
            
        } catch (error) {
            this.logWarning('Integration update failed', error);
        }
    }
    
    /**
     * Update external components
     * @param {string} theme - New theme
     * @returns {Promise<void>}
     */
    async updateExternalComponents(theme) {
        // Update any external libraries or components
        if (window.portfolioApp?.components) {
            const components = window.portfolioApp.components;
            
            for (const [name, component] of components) {
                if (component && typeof component.updateTheme === 'function') {
                    try {
                        await component.updateTheme(theme, this.themes[theme]);
                    } catch (error) {
                        this.logWarning(`Failed to update component: ${name}`, error);
                    }
                }
            }
        }
    }
    
    /**
     * Load saved theme from storage
     */
    loadSavedTheme() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            
            if (saved && this.themes[saved]) {
                this.currentTheme = saved;
                console.log(`💾 Loaded saved theme: ${saved}`);
            } else if (this.config.autoDetectSystem) {
                // Auto-detect from system preference
                const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
                this.currentTheme = prefersDark ? 'dark' : 'light';
                console.log(`🖥️ Auto-detected system theme: ${this.currentTheme}`);
            }
        } catch (error) {
            this.logWarning('Failed to load saved theme', error);
            this.currentTheme = 'light'; // Fallback
        }
    }
    
    /**
     * Save theme to storage
     * @param {string} theme - Theme to save
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.config.storageKey, theme);
            console.log(`💾 Theme saved: ${theme}`);
        } catch (error) {
            this.logWarning('Failed to save theme preference', error);
        }
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor theme transition performance
        this.performanceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name.includes('theme')) {
                    console.log(`⚡ Theme performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                }
            }
        });
        
        if (window.PerformanceObserver) {
            try {
                this.performanceObserver.observe({ entryTypes: ['measure'] });
            } catch (error) {
                this.logWarning('Performance monitoring not available', error);
            }
        }
    }
    
    /**
     * Update performance metrics
     * @param {number} transitionTime - Time taken for transition
     */
    updatePerformanceMetrics(transitionTime) {
        const count = this.performance.transitionCount;
        const avgTime = this.performance.averageTransitionTime;
        
        this.performance.averageTransitionTime = ((avgTime * (count - 1)) + transitionTime) / count;
        
        // Log performance warning if transitions are slow
        if (transitionTime > 1000) {
            this.logWarning(`Slow theme transition: ${transitionTime.toFixed(2)}ms`);
        }
    }
    
    /**
     * Pause animations for performance
     */
    pauseAnimations() {
        document.documentElement.style.setProperty('--theme-transition', 'none');
    }
    
    /**
     * Resume animations
     */
    resumeAnimations() {
        document.documentElement.style.removeProperty('--theme-transition');
    }
    
    /**
     * Handle Konami code for easter eggs
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKonamiCode(event) {
        // Konami code: ↑↑↓↓←→←→BA
        if (!this.konamiSequence) {
            this.konamiSequence = [];
        }
        
        const konamiCode = [
            'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
            'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
            'KeyB', 'KeyA'
        ];
        
        this.konamiSequence.push(event.code);
        
        if (this.konamiSequence.length > konamiCode.length) {
            this.konamiSequence.shift();
        }
        
             if (this.konamiSequence.length === konamiCode.length &&
            this.konamiSequence.every((key, index) => key === konamiCode[index])) {
            
            this.activateEasterEgg();
            this.konamiSequence = [];
        }
    }
    
    /**
     * Activate easter egg
     */
    activateEasterEgg() {
        console.log('🎉 Konami code activated!');
        
        // Add rainbow theme toggle animation
        this.toggleBtn.classList.add('rainbow-mode');
        
        // Create particle burst effect
        this.createParticleBurst();
        
        // Play sound if enabled
        if (this.config.enableSounds) {
            this.playSound('easter-egg');
        }
        
        // Remove effect after 3 seconds
        setTimeout(() => {
            this.toggleBtn.classList.remove('rainbow-mode');
        }, 3000);
    }
    
    /**
     * Create particle burst effect
     */
    createParticleBurst() {
        const rect = this.toggleBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create 20 particles
        for (let i = 0; i < 20; i++) {
            this.createParticle(centerX, centerY, i);
        }
    }
    
    /**
     * Create individual particle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} index - Particle index
     */
    createParticle(x, y, index) {
        const particle = document.createElement('div');
        particle.className = 'theme-particle';
        particle.style.cssText = `
            position: fixed;
            top: ${y}px;
            left: ${x}px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: hsl(${index * 18}, 70%, 60%);
            pointer-events: none;
            z-index: 10000;
        `;
        
        document.body.appendChild(particle);
        
        const angle = (index / 20) * 2 * Math.PI;
        const velocity = 100 + Math.random() * 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        let currentX = 0;
        let currentY = 0;
        let opacity = 1;
        
        const animate = () => {
            currentX += vx * 0.016;
            currentY += vy * 0.016 + 50 * 0.016; // Gravity
            opacity -= 0.016;
            
            particle.style.transform = `translate(${currentX}px, ${currentY}px)`;
            particle.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(particle);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Play sound effect
     * @param {string} soundName - Sound to play
     */
    playSound(soundName) {
        if (!this.config.enableSounds) return;
        
        const sounds = {
            'click': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCT2a4vLFdSEHLn/L8N2QQgQSXLPn66hWEQtAm+DyvWshCTyZ4PLEcyAHL4DM7+KAQA',
            'easter-egg': 'data:audio/wav;base64,UklGRm4EAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUoEAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCT2a4vLFdSEHLn/L8N2QQgQSXLPn66hWEQtAm+DyvWwhCTyZ4PLEcyAHL4DM7+GFQQMS'
        };
        
        if (sounds[soundName]) {
            try {
                const audio = new Audio(sounds[soundName]);
                audio.volume = 0.3;
                audio.play().catch(error => {
                    this.logWarning('Failed to play sound', error);
                });
            } catch (error) {
                this.logWarning('Sound not supported', error);
            }
        }
    }
    
    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    /**
     * Get theme configuration
     * @param {string} theme - Theme name
     * @returns {Object|null} Theme configuration
     */
    getThemeConfig(theme = this.currentTheme) {
        return this.themes[theme] || null;
    }
    
    /**
     * Get available themes
     * @returns {string[]} Array of theme names
     */
    getAvailableThemes() {
        return Object.keys(this.themes);
    }
    
    /**
     * Check if system prefers dark mode
     * @returns {boolean} True if system prefers dark
     */
    isSystemDark() {
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
    }
    
    /**
     * Get current performance metrics
     * @returns {Object} Performance data
     */
    getPerformanceMetrics() {
        return {
            ...this.performance,
            isTransitioning: this.isTransitioning,
            isInitialized: this.isInitialized,
            errorCount: this.errors.length,
            warningCount: this.warnings.length
        };
    }
    
    /**
     * Get supported features
     * @returns {Object} Feature support
     */
    getFeatures() {
        return {
            gsapAnimations: !!window.gsap,
            webAnimations: 'animate' in Element.prototype,
            customProperties: window.CSS && CSS.supports && CSS.supports('color', 'var(--test)'),
            matchMedia: !!window.matchMedia,
            localStorage: !!window.localStorage,
            performanceObserver: !!window.PerformanceObserver,
            vibration: 'vibrate' in navigator,
            webAudio: !!(window.AudioContext || window.webkitAudioContext),
            intersectionObserver: !!window.IntersectionObserver
        };
    }
    
    /**
     * Add theme change observer
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    addObserver(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Observer callback must be a function');
        }
        
        this.observers.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.observers.indexOf(callback);
            if (index > -1) {
                this.observers.splice(index, 1);
            }
        };
    }
    
    /**
     * Remove theme change observer
     * @param {Function} callback - Callback to remove
     */
    removeObserver(callback) {
        const index = this.observers.indexOf(callback);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }
    
    /**
     * Notify all observers
     * @param {Object} data - Event data
     */
    notifyObservers(data) {
        this.observers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                this.logError('Observer callback failed', error);
            }
        });
    }
    
    /**
     * Dispatch custom event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    dispatchEvent(eventName, detail) {
        try {
            const event = new CustomEvent(eventName, {
                detail,
                bubbles: false,
                cancelable: false
            });
            
            window.dispatchEvent(event);
            this.notifyObservers(detail);
            
        } catch (error) {
            this.logError('Failed to dispatch event', error);
        }
    }
    
    /**
     * Update configuration
     * @param {Object} newConfig - New configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ Configuration updated:', newConfig);
        
        // Apply configuration changes
        if ('enableAnimations' in newConfig) {
            document.documentElement.classList.toggle('no-animations', !newConfig.enableAnimations);
        }
    }
    
    /**
     * Reset to default theme
     */
    reset() {
        console.log('🔄 Resetting theme to default');
        
        try {
            localStorage.removeItem(this.config.storageKey);
            this.setTheme('light', true);
        } catch (error) {
            this.logError('Reset failed', error);
        }
    }
    
    /**
     * Log error
     * @param {string} message - Error message
     * @param {Error} error - Error object
     */
    logError(message, error) {
        const errorData = {
            message,
            error: error?.message || error,
            stack: error?.stack,
            timestamp: new Date().toISOString(),
            theme: this.currentTheme,
            url: window.location.href
        };
        
        this.errors.push(errorData);
        console.error(`❌ ThemeManager: ${message}`, error);
        
        // Dispatch error event
        this.dispatchEvent('themeError', errorData);
    }
    
    /**
     * Log warning
     * @param {string} message - Warning message
     * @param {any} details - Warning details
     */
    logWarning(message, details) {
        const warningData = {
            message,
            details,
            timestamp: new Date().toISOString(),
            theme: this.currentTheme
        };
        
        this.warnings.push(warningData);
        console.warn(`⚠️ ThemeManager: ${message}`, details);
        
        // Dispatch warning event
        this.dispatchEvent('themeWarning', warningData);
    }
    
    /**
     * Debounce utility function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Destroy theme manager and cleanup
     */
    destroy() {
        console.log('🗑️ Destroying Theme Manager...');
        
        try {
            // Remove event listeners
            if (this.toggleBtn) {
                this.toggleBtn.removeEventListener('click', this.handleToggleClick);
                this.toggleBtn.removeEventListener('keydown', this.handleKeydown);
                this.toggleBtn.removeEventListener('touchstart', this.handleTouchStart);
                this.toggleBtn.removeEventListener('touchend', this.handleTouchEnd);
            }
            
            // Remove system listeners
            if (window.matchMedia) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.removeListener(this.handleSystemThemeChange);
            }
            
            // Remove other listeners
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            window.removeEventListener('resize', this.handleResize);
            window.removeEventListener('storage', this.handleStorageChange);
            window.removeEventListener('beforeunload', this.handleBeforeUnload);
            
            // Cleanup performance observer
            if (this.performanceObserver) {
                this.performanceObserver.disconnect();
            }
            
            // Cleanup integrations
            if (this.particleIntegration) {
                this.particleIntegration.destroy?.();
            }
            
            if (this.waveformIntegration) {
                this.waveformIntegration.destroy?.();
            }
            
            if (this.animationIntegration) {
                this.animationIntegration.destroy?.();
            }
            
            // Clear observers and data
            this.observers = [];
            this.errors = [];
            this.warnings = [];
            this.isInitialized = false;
            
            console.log('✅ Theme Manager destroyed successfully');
            
        } catch (error) {
            console.error('❌ Error during Theme Manager destruction:', error);
        }
    }
}

/**
 * Integration Classes
 */

// Particle System Integration
class ParticleIntegration {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.particleSystem = null;
        this.init();
    }
    
    init() {
        // Find particle system
        if (window.portfolioApp?.components?.get('particles')) {
            this.particleSystem = window.portfolioApp.components.get('particles');
        }
    }
    
    updateColors(colors) {
        if (this.particleSystem && typeof this.particleSystem.updateColors === 'function') {
            this.particleSystem.updateColors(colors);
        }
    }
    
    destroy() {
        this.particleSystem = null;
    }
}

// Waveform Integration
class WaveformIntegration {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.waveforms = [];
        this.init();
    }
    
    init() {
        this.waveforms = Array.from(document.querySelectorAll('.waveform-canvas'));
    }
    
    updateTheme(waveformConfig) {
        this.waveforms.forEach(canvas => {
            if (canvas.waveformInstance?.updateTheme) {
                canvas.waveformInstance.updateTheme(waveformConfig);
            }
        });
    }
    
    destroy() {
        this.waveforms = [];
    }
}

// Animation Integration
class AnimationIntegration {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.animations = new Map();
        this.init();
    }
    
    init() {
        // Initialize theme-aware animations
        this.setupScrollAnimations();
        this.setupHoverAnimations();
    }
    
    setupScrollAnimations() {
        if (window.gsap && window.ScrollTrigger) {
            // Theme-aware scroll animations
            gsap.registerPlugin(ScrollTrigger);
            
            const cards = document.querySelectorAll('.glass-card, .service-card, .portfolio-item');
            cards.forEach((card, index) => {
                const animation = gsap.fromTo(card, 
                    {
                        opacity: 0,
                        y: 50
                    },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        delay: index * 0.1,
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 80%',
                            end: 'bottom 20%',
                            toggleActions: 'play none none reverse'
                        }
                    }
                );
                
                this.animations.set(card, animation);
            });
        }
    }
    
    setupHoverAnimations() {
        // Enhanced hover animations based on theme
        const interactiveElements = document.querySelectorAll('.cta-button, .service-card, .portfolio-item');
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
            element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        });
    }
    
    handleMouseEnter(event) {
        const element = event.target;
        const theme = this.themeManager.getCurrentTheme();
        const colors = this.themeManager.getThemeConfig(theme).colors;
        
        if (window.gsap) {
            gsap.to(element, {
                scale: 1.05,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            gsap.to(element, {
                boxShadow: `0 10px 30px ${colors.primary}40`,
                duration: 0.3
            });
        }
    }
    
    handleMouseLeave(event) {
        const element = event.target;
        
        if (window.gsap) {
            gsap.to(element, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            gsap.to(element, {
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                duration: 0.3
            });
        }
    }
    
    updateTheme(themeConfig) {
        // Update animation colors based on theme
        const { colors } = themeConfig;
        
        this.animations.forEach((animation, element) => {
            // Update colors if animation uses theme colors
            if (animation.vars && animation.vars.backgroundColor) {
                gsap.set(element, {
                    '--animation-primary': colors.primary,
                    '--animation-secondary': colors.secondary
                });
            }
        });
    }
    
    destroy() {
        this.animations.forEach(animation => {
            animation.kill();
        });
        this.animations.clear();
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeManager, ParticleIntegration, WaveformIntegration, AnimationIntegration };
} else {
    // Global exports
    window.ThemeManager = ThemeManager;
    window.ParticleIntegration = ParticleIntegration;
    window.WaveformIntegration = WaveformIntegration;
    window.AnimationIntegration = AnimationIntegration;
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🎨 DOM loaded, ThemeManager ready for initialization');
    });
} else {
    console.log('🎨 DOM already loaded, ThemeManager ready for initialization');
}

