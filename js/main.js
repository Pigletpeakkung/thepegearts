/**
 * Main JavaScript file for Pegearts Portfolio
 * Author: Thanatsitt Santisamranwilai
 * Version: 2.0.0
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        animation: {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            staggerDelay: 100
        },
        scroll: {
            threshold: 100,
            smooth: true
        },
        performance: {
            debounceDelay: 16,
            throttleDelay: 100
        },
        audio: {
            fadeTime: 0.5,
            crossfadeTime: 0.3
        }
    };

    // Utility Functions
    const Utils = {
        // Debounce function
        debounce(func, wait, immediate) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func.apply(this, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(this, args);
            };
        },

        // Throttle function
        throttle(func, limit) {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Get element by ID safely
        $(id) {
            return document.getElementById(id);
        },

        // Query selector with error handling
        qs(selector, context = document) {
            try {
                return context.querySelector(selector);
            } catch (error) {
                console.warn(`Invalid selector: ${selector}`);
                return null;
            }
        },

        // Query selector all with error handling
        qsa(selector, context = document) {
            try {
                return context.querySelectorAll(selector);
            } catch (error) {
                console.warn(`Invalid selector: ${selector}`);
                return [];
            }
        },

        // Add multiple event listeners
        addEvents(element, events, handler) {
            if (!element) return;
            events.split(' ').forEach(event => {
                element.addEventListener(event, handler);
            });
        },

        // Remove multiple event listeners
        removeEvents(element, events, handler) {
            if (!element) return;
            events.split(' ').forEach(event => {
                element.removeEventListener(event, handler);
            });
        },

        // Check if element is in viewport
        isInViewport(element, threshold = 0) {
            if (!element) return false;
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 - threshold &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        // Smooth scroll to element
        scrollTo(element, offset = 0) {
            if (!element) return;
            const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
            
            if ('scrollBehavior' in document.documentElement.style) {
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            } else {
                // Fallback for browsers without smooth scroll support
                this.animateScrollTo(targetPosition);
            }
        },

        // Animate scroll for fallback
        animateScrollTo(targetPosition, duration = 500) {
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            let startTime = null;

            const animation = (currentTime) => {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            };

            requestAnimationFrame(animation);
        },

        // Easing function
        easeInOutQuad(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        },

        // Format time for audio players
        formatTime(seconds) {
            if (isNaN(seconds)) return '0:00';
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        },

        // Generate unique ID
        generateId(prefix = 'id') {
            return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        },

        // Local storage helpers
        storage: {
            get(key, defaultValue = null) {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : defaultValue;
                } catch (error) {
                    console.warn(`Error reading from localStorage: ${error}`);
                    return defaultValue;
                }
            },

            set(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (error) {
                    console.warn(`Error writing to localStorage: ${error}`);
                    return false;
                }
            },

            remove(key) {
                try {
                    localStorage.removeItem(key);
                    return true;
                } catch (error) {
                    console.warn(`Error removing from localStorage: ${error}`);
                    return false;
                }
            }
        },

        // Performance monitoring
        performance: {
            mark(name) {
                if ('performance' in window && 'mark' in performance) {
                    performance.mark(name);
                }
            },

            measure(name, startMark, endMark) {
                if ('performance' in window && 'measure' in performance) {
                    try {
                        performance.measure(name, startMark, endMark);
                    } catch (error) {
                        console.warn(`Performance measurement failed: ${error}`);
                    }
                }
            }
        }
    };

    // App State Management
    const AppState = {
        isLoading: false,
        currentSection: '',
        audioPlayers: new Map(),
        activeModals: [],
        scrollPosition: 0,
        viewportSize: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        userPreferences: {
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            highContrast: window.matchMedia('(prefers-contrast: high)').matches,
            theme: Utils.storage.get('theme', 'dark'),
            volume: Utils.storage.get('audioVolume', 0.8),
            autoplay: Utils.storage.get('audioAutoplay', false)
        },

        // Update state
        setState(key, value) {
            this[key] = value;
            this.notifyStateChange(key, value);
        },

        // State change notifications
        stateListeners: new Map(),

        addStateListener(key, callback) {
            if (!this.stateListeners.has(key)) {
                this.stateListeners.set(key, []);
            }
            this.stateListeners.get(key).push(callback);
        },

        notifyStateChange(key, value) {
            if (this.stateListeners.has(key)) {
                this.stateListeners.get(key).forEach(callback => {
                    try {
                        callback(value);
                    } catch (error) {
                        console.error(`State listener error for ${key}:`, error);
                    }
                });
            }
        }
    };

    // Preloader Management
    class PreloaderManager {
        constructor() {
            this.preloader = Utils.qs('.preloader');
            this.progressBar = Utils.qs('.loader-progress-fill');
            this.percentageEl = Utils.qs('.loader-percentage');
            this.resources = [];
            this.loadedCount = 0;
            this.isComplete = false;
        }

        init() {
            if (!this.preloader) return;

            this.collectResources();
            this.startLoading();
            
            // Fallback timeout
            setTimeout(() => {
                if (!this.isComplete) {
                    this.complete();
                }
            }, 10000);
        }

        collectResources() {
            // Collect images
            const images = Utils.qsa('img[src]');
            images.forEach(img => {
                if (img.src && !img.complete) {
                    this.resources.push({
                        type: 'image',
                        element: img,
                        src: img.src
                    });
                }
            });

            // Collect background images
            const bgElements = Utils.qsa('[style*="background-image"]');
            bgElements.forEach(el => {
                const bgImage = getComputedStyle(el).backgroundImage;
                const matches = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/);
                if (matches) {
                    this.resources.push({
                        type: 'background',
                        element: el,
                        src: matches[1]
                    });
                }
            });

            // Collect audio files
            const audioElements = Utils.qsa('audio[src], audio source[src]');
            audioElements.forEach(audio => {
                const src = audio.src || (audio.querySelector('source') && audio.querySelector('source').src);
                if (src) {
                    this.resources.push({
                        type: 'audio',
                        element: audio,
                        src: src
                    });
                }
            });

            // Collect critical CSS/JS (if dynamically loaded)
            const criticalResources = Utils.qsa('[data-critical-resource]');
            criticalResources.forEach(resource => {
                this.resources.push({
                    type: resource.tagName.toLowerCase(),
                    element: resource,
                    src: resource.src || resource.href
                });
            });
        }

        startLoading() {
            if (this.resources.length === 0) {
                this.complete();
                return;
            }

            this.updateProgress(0);

            this.resources.forEach((resource, index) => {
                this.loadResource(resource).then(() => {
                    this.loadedCount++;
                    const progress = (this.loadedCount / this.resources.length) * 100;
                    this.updateProgress(progress);

                    if (this.loadedCount === this.resources.length) {
                        setTimeout(() => this.complete(), 500);
                    }
                }).catch(error => {
                    console.warn(`Failed to load resource: ${resource.src}`, error);
                    this.loadedCount++;
                    const progress = (this.loadedCount / this.resources.length) * 100;
                    this.updateProgress(progress);

                    if (this.loadedCount === this.resources.length) {
                        setTimeout(() => this.complete(), 500);
                    }
                });
            });
        }

        loadResource(resource) {
            return new Promise((resolve, reject) => {
                switch (resource.type) {
                    case 'image':
                    case 'background':
                        const img = new Image();
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = resource.src;
                        break;

                    case 'audio':
                        const audio = new Audio();
                        audio.addEventListener('canplaythrough', resolve, { once: true });
                        audio.addEventListener('error', reject, { once: true });
                        audio.src = resource.src;
                        audio.load();
                        break;

                    default:
                        // For other resources, just resolve after a short delay
                        setTimeout(resolve, 100);
                }
            });
        }

        updateProgress(percentage) {
            if (this.progressBar) {
                this.progressBar.style.width = `${percentage}%`;
            }
            if (this.percentageEl) {
                this.percentageEl.textContent = `${Math.round(percentage)}%`;
            }
        }

        complete() {
            if (this.isComplete) return;
            this.isComplete = true;

            this.updateProgress(100);

            setTimeout(() => {
                if (this.preloader) {
                    this.preloader.classList.add('hidden');
                    
                    setTimeout(() => {
                        this.preloader.style.display = 'none';
                        document.body.classList.add('loaded');
                        
                        // Trigger page loaded event
                        document.dispatchEvent(new CustomEvent('pageLoaded'));
                    }, 500);
                }
            }, 300);
        }
    }

    // Navigation Management
    class NavigationManager {
        constructor() {
            this.navbar = Utils.qs('.navbar');
            this.navToggler = Utils.qs('.navbar-toggler');
            this.navCollapse = Utils.qs('.navbar-collapse');
            this.navLinks = Utils.qsa('.nav-link');
            this.sections = Utils.qsa('section[id]');
            this.isMenuOpen = false;
            this.lastScrollY = 0;
            this.scrollThreshold = 100;

            this.handleScroll = Utils.throttle(this.onScroll.bind(this), CONFIG.performance.throttleDelay);
            this.handleResize = Utils.debounce(this.onResize.bind(this), CONFIG.performance.debounceDelay);
        }

        init() {
            this.setupEventListeners();
            this.updateActiveSection();
            this.onScroll(); // Initial call
        }

        setupEventListeners() {
            // Mobile menu toggle
            if (this.navToggler) {
                this.navToggler.addEventListener('click', this.toggleMobileMenu.bind(this));
            }

            // Navigation links
            this.navLinks.forEach(link => {
                link.addEventListener('click', this.handleNavClick.bind(this));
            });

            // Scroll events
            window.addEventListener('scroll', this.handleScroll, { passive: true });
            window.addEventListener('resize', this.handleResize);

            // Close mobile menu on outside click
            document.addEventListener('click', (e) => {
                if (this.isMenuOpen && !this.navbar.contains(e.target)) {
                    this.closeMobileMenu();
                }
            });

            // Close mobile menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isMenuOpen) {
                    this.closeMobileMenu();
                }
            });
        }

        toggleMobileMenu() {
            this.isMenuOpen = !this.isMenuOpen;
            
            if (this.navToggler) {
                this.navToggler.setAttribute('aria-expanded', this.isMenuOpen);
            }
            
            if (this.navCollapse) {
                this.navCollapse.classList.toggle('show', this.isMenuOpen);
            }

            // Prevent body scroll when menu is open
            document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
        }

        closeMobileMenu() {
            this.isMenuOpen = false;
            
            if (this.navToggler) {
                this.navToggler.setAttribute('aria-expanded', false);
            }
            
            if (this.navCollapse) {
                this.navCollapse.classList.remove('show');
            }

            document.body.style.overflow = '';
        }

        handleNavClick(e) {
            const link = e.currentTarget;
            const href = link.getAttribute('href');

            // Handle hash links
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = Utils.$(targetId);

                if (targetElement) {
                    const headerHeight = this.navbar ? this.navbar.offsetHeight : 0;
                    Utils.scrollTo(targetElement, headerHeight + 20);
                }

                // Close mobile menu
                if (this.isMenuOpen) {
                    this.closeMobileMenu();
                }
            }
        }

        onScroll() {
            const currentScrollY = window.pageYOffset;

            // Update navbar appearance
            if (this.navbar) {
                if (currentScrollY > this.scrollThreshold) {
                    this.navbar.classList.add('scrolled');
                } else {
                    this.navbar.classList.remove('scrolled');
                }
            }

            // Update active section
            this.updateActiveSection();

            // Store scroll position
            AppState.scrollPosition = currentScrollY;
            this.lastScrollY = currentScrollY;
        }

        onResize() {
            // Close mobile menu on large screens
            if (window.innerWidth >= 992 && this.isMenuOpen) {
                this.closeMobileMenu();
            }

            // Update viewport size
            AppState.viewportSize = {
                width: window.innerWidth,
                height: window.innerHeight
            };
        }

        updateActiveSection() {
            const headerHeight = this.navbar ? this.navbar.offsetHeight : 0;
            const scrollPosition = window.pageYOffset + headerHeight + 100;

            let activeSection = '';

            this.sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    activeSection = section.id;
                }
            });

            // Update active nav links
            this.navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const targetId = href.substring(1);
                    link.classList.toggle('active', targetId === activeSection);
                }
            });

            // Update app state
            if (activeSection !== AppState.currentSection) {
                AppState.setState('currentSection', activeSection);
            }
        }
    }

    // Audio Player Management
    class AudioPlayerManager {
        constructor() {
            this.players = new Map();
            this.currentlyPlaying = null;
            this.globalVolume = AppState.userPreferences.volume;
        }

        init() {
            this.initializePlayers();
            this.setupGlobalEventListeners();
        }

        initializePlayers() {
            const audioContainers = Utils.qsa('.audio-player');
            
            audioContainers.forEach(container => {
                const audioElement = container.querySelector('audio');
                if (audioElement) {
                    const player = new AudioPlayer(container, audioElement, this);
                    this.players.set(container.id || this.generatePlayerId(), player);
                }
            });
        }

        generatePlayerId() {
            return `audio-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        setupGlobalEventListeners() {
            // Global keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                switch (e.key) {
                    case ' ':
                        e.preventDefault();
                        if (this.currentlyPlaying) {
                            this.currentlyPlaying.togglePlayPause();
                        }
                        break;
                    case 'ArrowLeft':
                        if (this.currentlyPlaying) {
                            e.preventDefault();
                            this.currentlyPlaying.seek(-10);
                        }
                        break;
                    case 'ArrowRight':
                        if (this.currentlyPlaying) {
                            e.preventDefault();
                            this.currentlyPlaying.seek(10);
                        }
                        break;
                }
            });

            // Handle visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && this.currentlyPlaying) {
                    // Optionally pause when tab becomes hidden
                    if (!AppState.userPreferences.playInBackground) {
                        this.currentlyPlaying.pause();
                    }
                }
            });
        }

        setCurrentlyPlaying(player) {
            // Pause other players
            if (this.currentlyPlaying && this.currentlyPlaying !== player) {
                this.currentlyPlaying.pause();
            }
            this.currentlyPlaying = player;
        }

        setGlobalVolume(volume) {
            this.globalVolume = Math.max(0, Math.min(1, volume));
            AppState.userPreferences.volume = this.globalVolume;
            Utils.storage.set('audioVolume', this.globalVolume);

            // Update all players
            this.players.forEach(player => {
                player.updateVolume();
            });
        }
    }

    // Individual Audio Player
    class AudioPlayer {
        constructor(container, audioElement, manager) {
            this.container = container;
            this.audio = audioElement;
            this.manager = manager;
            this.isPlaying = false;
            this.duration = 0;
            this.currentTime = 0;
            this.volume = 1;
            this.playbackRate = 1;
            this.isLoading = false;
            
            this.initializeElements();
            this.setupEventListeners();
            this.initializeVisualizer();
        }

        initializeElements() {
            // Control elements
            this.playBtn = this.container.querySelector('.large-play-btn');
            this.progressBar = this.container.querySelector('.progress-bar');
            this.progressFill = this.container.querySelector('.progress-fill');
            this.progressHandle = this.container.querySelector('.progress-handle');
            this.currentTimeEl = this.container.querySelector('.current-time');
            this.durationEl = this.container.querySelector('.duration');
            this.volumeSlider = this.container.querySelector('.volume-slider');
            this.volumeFill = this.container.querySelector('.volume-fill');
            this.volumePercentage = this.container.querySelector('.volume-percentage');
            this.speedControl = this.container.querySelector('.speed-control');
            this.downloadBtn = this.container.querySelector('.download-btn');
            this.waveformContainer = this.container.querySelector('.waveform-container');
            this.waveformCanvas = this.container.querySelector('.waveform-canvas');
            this.visualizer = this.container.querySelector('.audio-visualizer');

            // Initialize waveform canvas if present
            if (this.waveformCanvas) {
                this.waveformCtx = this.waveformCanvas.getContext('2d');
                this.resizeCanvas();
            }
        }

        setupEventListeners() {
            // Audio element events
            this.audio.addEventListener('loadedmetadata', () => {
                this.duration = this.audio.duration;
                this.updateDurationDisplay();
                this.generateWaveform();
            });

            this.audio.addEventListener('timeupdate', () => {
                this.currentTime = this.audio.currentTime;
                this.updateProgress();
                this.updateTimeDisplay();
            });

            this.audio.addEventListener('play', () => {
                this.isPlaying = true;
                this.updatePlayButton();
                this.manager.setCurrentlyPlaying(this);
                this.startVisualizer();
            });

            this.audio.addEventListener('pause', () => {
                this.isPlaying = false;
                this.updatePlayButton();
                this.stopVisualizer();
            });

            this.audio.addEventListener('ended', () => {
                this.isPlaying = false;
                this.updatePlayButton();
                this.stopVisualizer();
                this.currentTime = 0;
                this.updateProgress();
            });

            this.audio.addEventListener('loadstart', () => {
                this.isLoading = true;
                this.updateLoadingState();
            });

            this.audio.addEventListener('canplay', () => {
                this.isLoading = false;
                this.updateLoadingState();
            });

            this.audio.addEventListener('error', (e) => {
                console.error('Audio loading error:', e);
                this.handleError();
            });

            // Control events
            if (this.playBtn) {
                this.playBtn.addEventListener('click', () => this.togglePlayPause());
            }

            if (this.progressBar) {
                this.progressBar.addEventListener('click', (e) => this.handleProgressClick(e));
                this.progressBar.addEventListener('mousedown', (e) => this.startProgressDrag(e));
            }

            if (this.volumeSlider) {
                this.volumeSlider.addEventListener('input', (e) => {
                    this.setVolume(e.target.value / 100);
                });
            }

            if (this.speedControl) {
                this.speedControl.addEventListener('click', () => this.cyclePlaybackRate());
            }

            if (this.downloadBtn) {
                this.downloadBtn.addEventListener('click', () => this.downloadAudio());
            }

            // Window resize for canvas
            window.addEventListener('resize', Utils.debounce(() => {
                if (this.waveformCanvas) {
                    this.resizeCanvas();
                    this.generateWaveform();
                }
            }, 300));
        }

        togglePlayPause() {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        }

        play() {
            if (this.audio.readyState >= 2) {
                const playPromise = this.audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error('Play failed:', error);
                        this.handleError();
                    });
                }
            }
        }

        pause() {
            this.audio.pause();
        }

        seek(seconds) {
            const newTime = Math.max(0, Math.min(this.duration, this.currentTime + seconds));
            this.audio.currentTime = newTime;
        }

        setVolume(volume) {
            this.volume = Math.max(0, Math.min(1, volume));
            this.updateVolume();
            this.updateVolumeDisplay();
        }

        updateVolume() {
            const finalVolume = this.volume * this.manager.globalVolume;
            this.audio.volume = finalVolume;
        }

        cyclePlaybackRate() {
            const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
            const currentIndex = rates.indexOf(this.playbackRate);
            const nextIndex = (currentIndex + 1) % rates.length;
            this.playbackRate = rates[nextIndex];
            this.audio.playbackRate = this.playbackRate;
            
            if (this.speedControl) {
                this.speedControl.textContent = `${this.playbackRate}x`;
            }
        }

        handleProgressClick(e) {
            if (!this.duration) return;
            
            const rect = this.progressBar.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            const newTime = percentage * this.duration;
            this.audio.currentTime = newTime;
        }

        startProgressDrag(e) {
            e.preventDefault();
            const handleDrag = (e) => this.handleProgressDrag(e);
            const stopDrag = () => {
                document.removeEventListener('mousemove', handleDrag);
                document.removeEventListener('mouseup', stopDrag);
            };

            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
        }

        handleProgressDrag(e) {
            if (!this.duration) return;
            
            const rect = this.progressBar.getBoundingClientRect();
            const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const newTime = percentage * this.duration;
            this.audio.currentTime = newTime;
        }

        updateProgress() {
            if (!this.duration) return;
            
            const percentage = (this.currentTime / this.duration) * 100;
            
            if (this.progressFill) {
                this.progressFill.style.width = `${percentage}%`;
            }
            
            if (this.progressHandle) {
                this.progressHandle.style.left = `${percentage}%`;
            }

            // Update waveform progress
            this.updateWaveformProgress(percentage);
        }

        updateTimeDisplay() {
            if (this.currentTimeEl) {
                this.currentTimeEl.textContent = Utils.formatTime(this.currentTime);
            }
        }

        updateDurationDisplay() {
            if (this.durationEl) {
                this.durationEl.textContent = Utils.formatTime(this.duration);
            }
        }

        updatePlayButton() {
            if (!this.playBtn) return;
            
            const icon = this.playBtn.querySelector('i');
            if (icon) {
                if (this.isPlaying) {
                    icon.className = 'fas fa-pause';
                    this.playBtn.setAttribute('aria-label', 'Pause');
                } else {
                    icon.className = 'fas fa-play';
                    this.playBtn.setAttribute('aria-label', 'Play');
                }
            }
        }

        updateVolumeDisplay() {
            const percentage = Math.round(this.volume * 100);
            
            if (this.volumeFill) {
                this.volumeFill.style.width = `${percentage}%`;
            }
            
            if (this.volumePercentage) {
                this.volumePercentage.textContent = `${percentage}%`;
            }
            
            if (this.volumeSlider) {
                this.volumeSlider.value = percentage;
            }
        }

        updateLoadingState() {
            this.container.classList.toggle('loading', this.isLoading);
            
            if (this.playBtn) {
                this.playBtn.disabled = this.isLoading;
            }
        }

        handleError() {
            this.container.classList.add('error');
            NotificationManager.show('Audio playback error', 'error');
        }

        downloadAudio() {
            if (!this.audio.src) return;
            
            const a = document.createElement('a');
            a.href = this.audio.src;
            a.download = this.audio.getAttribute('data-title') || 'audio';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        // Waveform Generation
        resizeCanvas() {
            if (!this.waveformCanvas) return;
            
            const container = this.waveformCanvas.parentElement;
            const rect = container.getBoundingClientRect();
            
            this.waveformCanvas.width = rect.width * window.devicePixelRatio;
            this.waveformCanvas.height = rect.height * window.devicePixelRatio;
            this.waveformCanvas.style.width = rect.width + 'px';
            this.waveformCanvas.style.height = rect.height + 'px';
            
            this.waveformCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        async generateWaveform() {
            if (!this.waveformCanvas || !this.audio.src) return;
            
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const response = await fetch(this.audio.src);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                this.drawWaveform(audioBuffer);
            } catch (error) {
                console.warn('Waveform generation failed:', error);
                this.drawPlaceholderWaveform();
            }
        }

        drawWaveform(audioBuffer) {
            const ctx = this.waveformCtx;
            const canvas = this.waveformCanvas;
            const width = canvas.width / window.devicePixelRatio;
            const height = canvas.height / window.devicePixelRatio;
            
            ctx.clearRect(0, 0, width, height);
            
            const data = audioBuffer.getChannelData(0);
            const step = Math.ceil(data.length / width);
            const amp = height / 2;
            
            ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.moveTo(0, amp);
            
            for (let i = 0; i < width; i++) {
                let min = 1.0;
                let max = -1.0;
                
                for (let j = 0; j < step; j++) {
                    const datum = data[(i * step) + j];
                    if (datum < min) min = datum;
                    if (datum > max) max = datum;
                }
                
                const yMin = (1 + min) * amp;
                const yMax = (1 + max) * amp;
                
                ctx.fillRect(i, yMin, 1, yMax - yMin);
            }
            
            ctx.stroke();
        }

        drawPlaceholderWaveform() {
            const ctx = this.waveformCtx;
            const canvas = this.waveformCanvas;
            const width = canvas.width / window.devicePixelRatio;
            const height = canvas.height / window.devicePixelRatio;
            
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
            
            // Generate random waveform pattern
            for (let i = 0; i < width; i += 2) {
                const barHeight = Math.random() * height * 0.8 + height * 0.1;
                const y = (height - barHeight) / 2;
                ctx.fillRect(i, y, 1, barHeight);
            }
        }

        updateWaveformProgress(percentage) {
            // This would update the waveform progress indicator
            // Implementation depends on specific design requirements
        }

        // Audio Visualizer
        initializeVisualizer() {
            if (!this.visualizer) return;
            
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.source = this.audioContext.createMediaElementSource(this.audio);
                
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                this.analyser.fftSize = 64;
                this.bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(this.bufferLength);
                
                this.setupVisualizerBars();
            } catch (error) {
                console.warn('Audio visualizer initialization failed:', error);
            }
        }

        setupVisualizerBars() {
            if (!this.visualizer) return;
            
            // Clear existing bars
            this.visualizer.innerHTML = '';
            
            // Create frequency bars
            for (let i = 0; i < 12; i++) {
                const bar = document.createElement('div');
                bar.className = 'freq-bar';
                bar.style.setProperty('--delay', `${i * 0.1}s`);
                this.visualizer.appendChild(bar);
            }
            
            this.visualizerBars = this.visualizer.querySelectorAll('.freq-bar');
        }

        startVisualizer() {
            if (!this.analyser || !this.visualizerBars) return;
            
            this.visualizer.classList.add('playing');
            this.animateVisualizer();
        }

        stopVisualizer() {
            if (this.visualizer) {
                this.visualizer.classList.remove('playing');
            }
            
            if (this.visualizerAnimationId) {
                cancelAnimationFrame(this.visualizerAnimationId);
            }
        }

        animateVisualizer() {
            if (!this.isPlaying) return;
            
            this.analyser.getByteFrequencyData(this.dataArray);
            
            this.visualizerBars.forEach((bar, index) => {
                const value = this.dataArray[index * 2] || 0;
                const height = (value / 255) * 100;
                bar.style.height = `${Math.max(10, height)}%`;
            });
            
            this.visualizerAnimationId = requestAnimationFrame(() => this.animateVisualizer());
        }
    }

    // Notification System
    class NotificationManager {
        constructor() {
            this.container = null;
            this.notifications = [];
            this.maxNotifications = 5;
            this.defaultDuration = 5000;
            
            this.createContainer();
        }

        createContainer() {
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-label', 'Notifications');
            document.body.appendChild(this.container);
        }

        show(message, type = 'info', duration = this.defaultDuration, options = {}) {
            const notification = this.createNotification(message, type, options);
            
            // Remove excess notifications
            while (this.notifications.length >= this.maxNotifications) {
                this.remove(this.notifications[0]);
            }
            
            this.notifications.push(notification);
            this.container.appendChild(notification.element);
            
            // Trigger animation
            requestAnimationFrame(() => {
                notification.element.style.transform = 'translateX(0)';
                notification.element.style.opacity = '1';
            });

            // Auto remove
            if (duration > 0) {
                notification.timeout = setTimeout(() => {
                    this.remove(notification);
                }, duration);
            }

            return notification;
        }

        createNotification(message, type, options) {
            const id = Utils.generateId('notification');
            const element = document.createElement('div');
            
            element.className = `notification notification-${type}`;
            element.setAttribute('role', type === 'error' ? 'alert' : 'status');
            element.setAttribute('id', id);
            
            const iconMap = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            };

            element.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon">
                        <i class="${iconMap[type] || iconMap.info}"></i>
                    </div>
                    <div class="notification-message">${message}</div>
                    <button class="notification-close" aria-label="Close notification">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            const notification = {
                id,
                element,
                type,
                message,
                timeout: null
            };

            // Close button event
            const closeBtn = element.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => this.remove(notification));

            // Click to dismiss (optional)
            if (options.clickToDismiss !== false) {
                element.addEventListener('click', () => this.remove(notification));
            }

            return notification;
        }

        remove(notification) {
            if (!notification || !notification.element) return;

            // Clear timeout
            if (notification.timeout) {
                clearTimeout(notification.timeout);
            }

            // Remove from array
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }

            // Animate out
            notification.element.style.transform = 'translateX(100%)';
            notification.element.style.opacity = '0';

            setTimeout(() => {
                if (notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
            }, 300);
        }

        clear() {
            [...this.notifications].forEach(notification => {
                this.remove(notification);
            });
        }

        // Static methods for easy access
        static success(message, duration, options) {
            return app.notificationManager.show(message, 'success', duration, options);
        }

        static error(message, duration, options) {
            return app.notificationManager.show(message, 'error', duration, options);
        }

        static warning(message, duration, options) {
            return app.notificationManager.show(message, 'warning', duration, options);
        }

        static info(message, duration, options) {
            return app.notificationManager.show(message, 'info', duration, options);
        }
    }

    // Form Management
    class FormManager {
        constructor() {
            this.forms = new Map();
            this.validationRules = new Map();
            this.autoSaveDelay = 2000;
        }

        init() {
            this.initializeForms();
        }

        initializeForms() {
            const formElements = Utils.qsa('form[data-form-handler]');
            
            formElements.forEach(form => {
                const formId = form.id || Utils.generateId('form');
                const handler = new FormHandler(form, this);
                this.forms.set(formId, handler);
            });
        }

        registerValidationRule(name, rule) {
            this.validationRules.set(name, rule);
        }

        getValidationRule(name) {
            return this.validationRules.get(name);
        }
    }

    // Individual Form Handler
    class FormHandler {
        constructor(form, manager) {
            this.form = form;
            this.manager = manager;
            this.fields = new Map();
            this.isSubmitting = false;
            this.autoSaveTimeout = null;
            this.progressTracker = null;

            this.initializeFields();
            this.setupEventListeners();
            this.setupAutoSave();
            this.setupProgressTracker();
        }

        initializeFields() {
            const fieldElements = this.form.querySelectorAll(
                'input, textarea, select'
            );

            fieldElements.forEach(field => {
                if (field.name) {
                    const fieldHandler = new FieldHandler(field, this);
                    this.fields.set(field.name, fieldHandler);
                }
            });
        }

        setupEventListeners() {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });

            // Real-time validation
            this.form.addEventListener('input', Utils.debounce((e) => {
                if (e.target.name && this.fields.has(e.target.name)) {
                    this.validateField(e.target.name);
                    this.updateProgress();
                    this.scheduleAutoSave();
                }
            }, 300));

            this.form.addEventListener('change', (e) => {
                if (e.target.name && this.fields.has(e.target.name)) {
                    this.validateField(e.target.name);
                    this.updateProgress();
                    this.scheduleAutoSave();
                }
            });
        }

        setupAutoSave() {
            const autoSaveKey = `autosave_${this.form.id || 'form'}`;
            
            // Load saved data
            const savedData = Utils.storage.get(autoSaveKey);
            if (savedData) {
                this.loadFormData(savedData);
                this.showAutoSaveStatus('Data restored from auto-save', 'info');
            }
        }

        setupProgressTracker() {
            const progressEl = this.form.querySelector('.form-progress .progress-fill');
            const progressText = this.form.querySelector('.progress-text');
            
            if (progressEl || progressText) {
                this.progressTracker = { progressEl, progressText };
                this.updateProgress();
            }
        }

        scheduleAutoSave() {
            if (this.autoSaveTimeout) {
                clearTimeout(this.autoSaveTimeout);
            }

            this.autoSaveTimeout = setTimeout(() => {
                this.performAutoSave();
            }, this.manager.autoSaveDelay);
        }

        performAutoSave() {
            const formData = this.getFormData();
            const autoSaveKey = `autosave_${this.form.id || 'form'}`;
            
            if (Utils.storage.set(autoSaveKey, formData)) {
                this.showAutoSaveStatus('Draft saved', 'success');
            }
        }

        loadFormData(data) {
            Object.entries(data).forEach(([name, value]) => {
                const field = this.form.querySelector(`[name="${name}"]`);
                if (field) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = value;
                    } else {
                        field.value = value;
                    }
                }
            });
        }

        getFormData() {
            const data = {};
            this.fields.forEach((fieldHandler, name) => {
                data[name] = fieldHandler.getValue();
            });
            return data;
        }

        async handleSubmit() {
            if (this.isSubmitting) return;

            // Validate all fields
            const isValid = this.validateForm();
            if (!isValid) {
                this.showFormMessage('Please correct the errors above.', 'error');
                return;
            }

            this.isSubmitting = true;
            this.updateSubmitButton(true);

            try {
                const formData = this.getFormData();
                const endpoint = this.form.getAttribute('action') || '/api/contact';
                const method = this.form.getAttribute('method') || 'POST';

                const response = await this.submitForm(endpoint, method, formData);
                
                if (response.success) {
                    this.handleSubmitSuccess(response);
                } else {
                    this.handleSubmitError(response.message || 'Submission failed');
                }
            } catch (error) {
                this.handleSubmitError(error.message);
            } finally {
                this.isSubmitting = false;
                this.updateSubmitButton(false);
            }
        }

        async submitForm(endpoint, method, data) {
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        }

        handleSubmitSuccess(response) {
            this.showFormMessage(
                response.message || 'Thank you! Your message has been sent.',
                'success'
            );
            
            // Clear form
            this.form.reset();
            this.fields.forEach(fieldHandler => fieldHandler.clearValidation());
            
            // Clear auto-save
            const autoSaveKey = `autosave_${this.form.id || 'form'}`;
            Utils.storage.remove(autoSaveKey);
            
            // Reset progress
            this.updateProgress();
            
            // Show success notification
            NotificationManager.success('Message sent successfully!');
        }

        handleSubmitError(message) {
            this.showFormMessage(
                `Error: ${message}. Please try again.`,
                'error'
            );
            
            NotificationManager.error('Failed to send message');
        }

        validateForm() {
            let isValid = true;
            
            this.fields.forEach((fieldHandler, name) => {
                if (!fieldHandler.validate()) {
                    isValid = false;
                }
            });

            return isValid;
        }

        validateField(fieldName) {
            const fieldHandler = this.fields.get(fieldName);
            return fieldHandler ? fieldHandler.validate() : true;
        }

        updateProgress() {
            if (!this.progressTracker) return;

            const totalFields = this.fields.size;
            let completedFields = 0;

            this.fields.forEach((fieldHandler) => {
                if (fieldHandler.isValid() && fieldHandler.getValue()) {
                    completedFields++;
                }
            });

            const percentage = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

            if (this.progressTracker.progressEl) {
                this.progressTracker.progressEl.style.width = `${percentage}%`;
            }

            if (this.progressTracker.progressText) {
                this.progressTracker.progressText.textContent = 
                    `${Math.round(percentage)}% Complete`;
            }
        }

        updateSubmitButton(isLoading) {
            const submitBtn = this.form.querySelector('[type="submit"]');
            if (!submitBtn) return;

            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');

            if (isLoading) {
                submitBtn.disabled = true;
                if (btnText) btnText.style.opacity = '0';
                if (btnLoading) btnLoading.style.opacity = '1';
            } else {
                submitBtn.disabled = false;
                if (btnText) btnText.style.opacity = '1';
                if (btnLoading) btnLoading.style.opacity = '0';
            }
        }

        showFormMessage(message, type) {
            let messageContainer = this.form.querySelector('.form-messages');
            
            if (!messageContainer) {
                messageContainer = document.createElement('div');
                messageContainer.className = 'form-messages';
                this.form.appendChild(messageContainer);
            }

            messageContainer.innerHTML = `
                <div class="alert alert-${type}">
                    <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
                    <span>${message}</span>
                </div>
            `;

            const alert = messageContainer.querySelector('.alert');
            setTimeout(() => alert.classList.add('show'), 10);

            // Auto-hide after delay
            setTimeout(() => {
                if (alert && alert.parentNode) {
                    alert.classList.remove('show');
                    setTimeout(() => {
                        if (alert.parentNode) {
                            alert.parentNode.removeChild(alert);
                        }
                    }, 300);
                }
            }, 5000);
        }

        showAutoSaveStatus(message, type) {
            const statusEl = this.form.querySelector('.auto-save-status');
            if (!statusEl) return;

            statusEl.textContent = message;
            statusEl.className = `auto-save-status ${type} show`;

            setTimeout(() => {
                statusEl.classList.remove('show');
            }, 2000);
        }
    }

    // Individual Field Handler
    class FieldHandler {
        constructor(field, formHandler) {
            this.field = field;
            this.formHandler = formHandler;
            this.validationRules = [];
            this.isValidField = true;
            this.errorMessage = '';

            this.parseValidationRules();
            this.setupFieldEventListeners();
        }

        parseValidationRules() {
            // Required
            if (this.field.hasAttribute('required')) {
                this.validationRules.push({
                    type: 'required',
                    message: `${this.getFieldLabel()} is required.`
                });
            }

            // Email
            if (this.field.type === 'email') {
                this.validationRules.push({
                    type: 'email',
                    message: 'Please enter a valid email address.'
                });
            }

            // Pattern
            if (this.field.hasAttribute('pattern')) {
                this.validationRules.push({
                    type: 'pattern',
                    pattern: new RegExp(this.field.getAttribute('pattern')),
                    message: this.field.getAttribute('data-pattern-message') || 
                             'Please match the required format.'
                });
            }

            // Length constraints
            if (this.field.hasAttribute('minlength')) {
                const minLength = parseInt(this.field.getAttribute('minlength'));
                this.validationRules.push({
                    type: 'minlength',
                    value: minLength,
                    message: `Must be at least ${minLength} characters.`
                });
            }

            if (this.field.hasAttribute('maxlength')) {
                const maxLength = parseInt(this.field.getAttribute('maxlength'));
                this.validationRules.push({
                    type: 'maxlength',
                    value: maxLength,
                    message: `Must be no more than ${maxLength} characters.`
                });
            }

            // Custom validation rules
            const customRules = this.field.getAttribute('data-validation');
            if (customRules) {
                customRules.split(' ').forEach(ruleName => {
                    const rule = this.formHandler.manager.getValidationRule(ruleName);
                    if (rule) {
                        this.validationRules.push(rule);
                    }
                });
            }
        }

        setupFieldEventListeners() {
            // Character count for textareas
            if (this.field.tagName === 'TEXTAREA') {
                const charCount = this.field.parentNode.querySelector('.character-count');
                if (charCount) {
                    this.updateCharacterCount();
                    this.field.addEventListener('input', () => this.updateCharacterCount());
                }
            }

            // Real-time validation feedback
            this.field.addEventListener('blur', () => {
                this.validate();
            });

            this.field.addEventListener('input', Utils.debounce(() => {
                if (this.field.value.length > 0) {
                    this.validate();
                }
            }, 500));
        }

        validate() {
            this.isValidField = true;
            this.errorMessage = '';

            const value = this.getValue();

            for (const rule of this.validationRules) {
                if (!this.validateRule(rule, value)) {
                    this.isValidField = false;
                    this.errorMessage = rule.message;
                    break;
                }
            }

            this.updateFieldUI();
            return this.isValidField;
        }

        validateRule(rule, value) {
            switch (rule.type) {
                case 'required':
                    return value.trim().length > 0;

                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return !value || emailRegex.test(value);

                case 'pattern':
                    return !value || rule.pattern.test(value);

                case 'minlength':
                    return !value || value.length >= rule.value;

                case 'maxlength':
                    return !value || value.length <= rule.value;

                case 'custom':
                    return rule.validator(value, this.field);

                default:
                    return true;
            }
        }

        updateFieldUI() {
            // Update field classes
            this.field.classList.toggle('valid', this.isValidField && this.getValue());
            this.field.classList.toggle('invalid', !this.isValidField);

            // Update error message
            this.updateErrorMessage();

            // Update success icon
            this.updateSuccessIcon();
        }

        updateErrorMessage() {
            const errorEl = this.field.parentNode.querySelector('.form-error');
            
            if (!this.isValidField && this.errorMessage) {
                if (errorEl) {
                    errorEl.textContent = this.errorMessage;
                    errorEl.classList.add('show');
                } else {
                    const newErrorEl = document.createElement('small');
                    newErrorEl.className = 'form-error show';
                    newErrorEl.textContent = this.errorMessage;
                    this.field.parentNode.appendChild(newErrorEl);
                }
            } else if (errorEl) {
                errorEl.classList.remove('show');
            }
        }

        updateSuccessIcon() {
            const iconEl = this.field.parentNode.querySelector('.form-success-icon');
            const shouldShow = this.isValidField && this.getValue().trim().length > 0;
            
            if (shouldShow && !iconEl) {
                const newIconEl = document.createElement('i');
                newIconEl.className = 'fas fa-check form-success-icon';
                this.field.parentNode.appendChild(newIconEl);
            }
            
            if (iconEl) {
                this.field.parentNode.classList.toggle('valid', shouldShow);
            }
        }

        updateCharacterCount() {
            const charCount = this.field.parentNode.querySelector('.character-count');
            if (!charCount) return;

            const current = this.field.value.length;
            const max = this.field.getAttribute('maxlength');
            
            if (max) {
                charCount.textContent = `${current}/${max}`;
                charCount.classList.toggle('warning', current > max * 0.8);
                charCount.classList.toggle('error', current >= max);
            } else {
                charCount.textContent = `${current} characters`;
            }
        }

        getValue() {
            if (this.field.type === 'checkbox') {
                return this.field.checked;
            } else if (this.field.type === 'radio') {
                const checked = this.formHandler.form.querySelector(`[name="${this.field.name}"]:checked`);
                return checked ? checked.value : '';
            } else {
                return this.field.value || '';
            }
        }

        getFieldLabel() {
            const label = this.formHandler.form.querySelector(`label[for="${this.field.id}"]`);
            return label ? label.textContent.replace('*', '').trim() : this.field.name;
        }

        isValid() {
            return this.isValidField;
        }

        clearValidation() {
            this.isValidField = true;
            this.errorMessage = '';
            this.field.classList.remove('valid', 'invalid');
            
            const errorEl = this.field.parentNode.querySelector('.form-error');
            if (errorEl) {
                errorEl.classList.remove('show');
            }
        }
    }

    // Portfolio Filter Management
    class PortfolioManager {
        constructor() {
            this.filterContainer = Utils.qs('.portfolio-filters');
            this.portfolioGrid = Utils.qs('.portfolio-grid');
            this.portfolioItems = Utils.qsa('.portfolio-item');
            this.filterButtons = Utils.qsa('.filter-btn');
            this.loadMoreBtn = Utils.qs('.load-more-btn');
            this.currentFilter = 'all';
            this.itemsPerPage = 6;
            this.currentPage = 1;
            this.isLoading = false;
        }

        init() {
            if (!this.portfolioGrid) return;

            this.setupFilterEventListeners();
            this.setupLoadMore();
            this.initializeIsotope();
        }

        setupFilterEventListeners() {
            this.filterButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const filter = btn.getAttribute('data-filter') || 'all';
                    this.setActiveFilter(filter);
                    this.filterPortfolio(filter);
                });
            });
        }

        setupLoadMore() {
            if (this.loadMoreBtn) {
                this.loadMoreBtn.addEventListener('click', () => {
                    this.loadMoreItems();
                });
            }
        }

        setActiveFilter(filter) {
            this.currentFilter = filter;
            
            // Update button states
            this.filterButtons.forEach(btn => {
                const btnFilter = btn.getAttribute('data-filter') || 'all';
                btn.classList.toggle('active', btnFilter === filter);
            });
        }

        filterPortfolio(filter) {
            // Show loading state
            this.portfolioGrid.classList.add('filtering');

            // Filter items with animation
            this.portfolioItems.forEach((item, index) => {
                const itemCategories = (item.getAttribute('data-category') || '').split(' ');
                const shouldShow = filter === 'all' || itemCategories.includes(filter);

                setTimeout(() => {
                    if (shouldShow) {
                        item.classList.remove('filtered-out');
                        item.style.display = 'block';
                    } else {
                        item.classList.add('filtered-out');
                        setTimeout(() => {
                            if (item.classList.contains('filtered-out')) {
                                item.style.display = 'none';
                            }
                        }, 500);
                    }
                }, index * 50);
            });

            // Remove loading state
            setTimeout(() => {
                this.portfolioGrid.classList.remove('filtering');
                this.updateLoadMoreButton();
            }, 1000);
        }

        initializeIsotope() {
            // If Isotope is available, use it for better animations
            if (typeof Isotope !== 'undefined') {
                this.isotope = new Isotope(this.portfolioGrid, {
                    itemSelector: '.portfolio-item',
                    layoutMode: 'fitRows',
                    transitionDuration: '0.6s'
                });
            }
        }

        async loadMoreItems() {
            if (this.isLoading) return;

            this.isLoading = true;
            this.loadMoreBtn.classList.add('loading');
            this.loadMoreBtn.disabled = true;

            try {
                // Simulate API call - replace with actual endpoint
                const response = await fetch(`/api/portfolio?page=${this.currentPage + 1}&filter=${this.currentFilter}`);
                const data = await response.json();

                if (data.items && data.items.length > 0) {
                    this.appendNewItems(data.items);
                    this.currentPage++;
                    
                    if (!data.hasMore) {
                        this.loadMoreBtn.style.display = 'none';
                    }
                } else {
                    this.loadMoreBtn.style.display = 'none';
                    NotificationManager.info('No more items to load');
                }
            } catch (error) {
                console.error('Failed to load more items:', error);
                NotificationManager.error('Failed to load more items');
            } finally {
                this.isLoading = false;
                this.loadMoreBtn.classList.remove('loading');
                this.loadMoreBtn.disabled = false;
            }
        }

        appendNewItems(items) {
            const newElements = items.map(item => this.createPortfolioItem(item));
            
            newElements.forEach((element, index) => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                this.portfolioGrid.appendChild(element);
                
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 100);
            });

            // Update Isotope if available
            if (this.isotope) {
                this.isotope.appended(newElements);
            }
        }

        createPortfolioItem(data) {
            // Create portfolio item HTML - customize based on your data structure
            const item = document.createElement('div');
            item.className = 'portfolio-item';
            item.setAttribute('data-category', data.category);
            
            item.innerHTML = `
                <div class="portfolio-card glass-card hover-lift">
                    <div class="portfolio-image">
                        <img src="${data.image}" alt="${data.title}" loading="lazy">
                        <div class="portfolio-overlay">
                            <div class="portfolio-actions">
                                <a href="${data.liveUrl}" class="portfolio-btn" target="_blank" rel="noopener">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                                <a href="${data.image}" class="portfolio-btn" data-lightbox="portfolio">
                                    <i class="fas fa-search"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="portfolio-content">
                        <div class="portfolio-header">
                            <h3 class="portfolio-title">${data.title}</h3>
                            <div class="portfolio-status">
                                <span class="status-badge ${data.status}">${data.status}</span>
                            </div>
                        </div>
                        <p class="portfolio-description">${data.description}</p>
                        <div class="portfolio-tech">
                            ${data.technologies.map(tech => 
                                `<span class="tech-tag">${tech}</span>`
                            ).join('')}
                        </div>
                        <div class="portfolio-metrics">
                            <div class="metric">
                                <i class="fas fa-calendar"></i>
                                <span>${data.date}</span>
                            </div>
                            <div class="metric">
                                <i class="fas fa-eye"></i>
                                <span>${data.views}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            return item;
        }

        updateLoadMoreButton() {
            // Update load more button visibility based on current filter
            const visibleItems = this.portfolioItems.filter(item => 
                !item.classList.contains('filtered-out')
            ).length;

            if (this.loadMoreBtn) {
                this.loadMoreBtn.style.display = visibleItems >= this.itemsPerPage ? 'block' : 'none';
            }
        }
    }

    // Scroll Effects Manager
    class ScrollEffectsManager {
        constructor() {
            this.elements = [];
            this.ticking = false;
            this.lastKnownScrollPosition = 0;
            
            this.handleScroll = this.onScroll.bind(this);
        }

        init() {
            this.collectElements();
            this.setupEventListeners();
            this.onScroll(); // Initial check
        }

        collectElements() {
            // Parallax elements
            const parallaxElements = Utils.qsa('[data-parallax]');
            parallaxElements.forEach(el => {
                const speed = parseFloat(el.getAttribute('data-parallax')) || 0.5;
                this.elements.push({
                    element: el,
                    type: 'parallax',
                    speed: speed,
                    offset: el.getBoundingClientRect().top + window.pageYOffset
                });
            });

            // Fade in elements
            const fadeElements = Utils.qsa('[data-fade]');
            fadeElements.forEach(el => {
                const direction = el.getAttribute('data-fade') || 'up';
                const delay = parseInt(el.getAttribute('data-delay')) || 0;
                this.elements.push({
                    element: el,
                    type: 'fade',
                    direction: direction,
                    delay: delay,
                    hasAnimated: false
                });
            });

            // Count up elements
            const countElements = Utils.qsa('[data-count]');
            countElements.forEach(el => {
                const endValue = parseInt(el.getAttribute('data-count')) || 0;
                const duration = parseInt(el.getAttribute('data-duration')) || 2000;
                this.elements.push({
                    element: el,
                    type: 'count',
                    endValue: endValue,
                    duration: duration,
                    hasAnimated: false
                });
            });

            // Progress bars
            const progressElements = Utils.qsa('[data-progress]');
            progressElements.forEach(el => {
                const percentage = parseInt(el.getAttribute('data-progress')) || 0;
                const delay = parseInt(el.getAttribute('data-delay')) || 0;
                this.elements.push({
                    element: el,
                    type: 'progress',
                    percentage: percentage,
                    delay: delay,
                    hasAnimated: false
                });
            });
        }

        setupEventListeners() {
            window.addEventListener('scroll', () => {
                this.lastKnownScrollPosition = window.pageYOffset;
                this.requestTick();
            }, { passive: true });

            window.addEventListener('resize', Utils.debounce(() => {
                this.elements.forEach(item => {
                    if (item.type === 'parallax') {
                        item.offset = item.element.getBoundingClientRect().top + window.pageYOffset;
                    }
                });
            }, 250));
        }

        requestTick() {
            if (!this.ticking) {
                requestAnimationFrame(this.handleScroll);
                this.ticking = true;
            }
        }

        onScroll() {
            this.ticking = false;
            const scrollTop = this.lastKnownScrollPosition;
            
            this.elements.forEach(item => {
                this.processElement(item, scrollTop);
            });
        }

        processElement(item, scrollTop) {
            const { element, type } = item;
            const rect = element.getBoundingClientRect();
            const isInViewport = Utils.isInViewport(element, 100);

            switch (type) {
                case 'parallax':
                    this.handleParallax(item, scrollTop);
                    break;

                case 'fade':
                    if (isInViewport && !item.hasAnimated) {
                        this.handleFadeIn(item);
                    }
                    break;

                case 'count':
                    if (isInViewport && !item.hasAnimated) {
                        this.handleCountUp(item);
                    }
                    break;

                case 'progress':
                    if (isInViewport && !item.hasAnimated) {
                        this.handleProgressBar(item);
                    }
                    break;
            }
        }

        handleParallax(item, scrollTop) {
            if (AppState.userPreferences.reducedMotion) return;
            
            const { element, speed, offset } = item;
            const yPos = -(scrollTop - offset) * speed;
            element.style.transform = `translateY(${yPos}px) translateZ(0)`;
        }

        handleFadeIn(item) {
            const { element, direction, delay } = item;
            
            element.style.opacity = '0';
            
            switch (direction) {
                case 'up':
                    element.style.transform = 'translateY(30px)';
                    break;
                case 'down':
                    element.style.transform = 'translateY(-30px)';
                    break;
                case 'left':
                    element.style.transform = 'translateX(30px)';
                    break;
                case 'right':
                    element.style.transform = 'translateX(-30px)';
                    break;
                case 'scale':
                    element.style.transform = 'scale(0.8)';
                    break;
            }

            setTimeout(() => {
                element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0) translateX(0) scale(1)';
            }, delay);

            item.hasAnimated = true;
        }

        handleCountUp(item) {
            const { element, endValue, duration } = item;
            
            let startValue = 0;
            const startTime = Date.now();
            const prefix = element.getAttribute('data-prefix') || '';
            const suffix = element.getAttribute('data-suffix') || '';

            const updateCount = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const currentValue = Math.floor(
                    startValue + (endValue - startValue) * this.easeOutQuart(progress)
                );
                
                element.textContent = prefix + currentValue.toLocaleString() + suffix;

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                }
            };

            updateCount();
            item.hasAnimated = true;
        }

        handleProgressBar(item) {
            const { element, percentage, delay } = item;
            const progressFill = element.querySelector('.progress-fill') || element;

            setTimeout(() => {
                progressFill.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
                progressFill.style.width = `${percentage}%`;
            }, delay);

            item.hasAnimated = true;
        }

        easeOutQuart(t) {
            return 1 - (--t) * t * t * t;
        }
    }

    // Background Effects Manager
    class BackgroundEffectsManager {
        constructor() {
            this.effects = [];
            this.isActive = !AppState.userPreferences.reducedMotion;
            this.animationFrame = null;
        }

        init() {
            if (!this.isActive) return;

            this.initializeStarField();
            this.initializeFloatingParticles();
            this.initializeShootingStars();
            this.startAnimationLoop();
        }

        initializeStarField() {
            const starField = Utils.qs('.star-field');
            if (!starField) return;

            const starCount = 200;
            
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 3 + 's';
                star.style.animationDuration = (Math.random() * 2 + 1) + 's';
                
                const size = Math.random() * 2 + 1;
                star.style.width = size + 'px';
                star.style.height = size + 'px';
                
                starField.appendChild(star);
                this.effects.push({
                    element: star,
                    type: 'star',
                    speed: Math.random() * 0.5 + 0.1
                });
            }
        }

        initializeFloatingParticles() {
            const particleContainers = Utils.qsa('.floating-particles-container');
            
            particleContainers.forEach(container => {
                const particleCount = parseInt(container.getAttribute('data-count')) || 50;
                
                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'floating-particle';
                    
                    // Random positioning
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.top = Math.random() * 100 + '%';
                    
                    // Random size
                    const size = Math.random() * 6 + 2;
                    particle.style.width = size + 'px';
                    particle.style.height = size + 'px';
                    
                    // Random animation properties
                    particle.style.animationDelay = Math.random() * 20 + 's';
                    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
                    
                    container.appendChild(particle);
                    
                    this.effects.push({
                        element: particle,
                        type: 'particle',
                        container: container,
                        speed: {
                            x: (Math.random() - 0.5) * 0.5,
                            y: (Math.random() - 0.5) * 0.5
                        },
                        position: {
                            x: Math.random() * 100,
                            y: Math.random() * 100
                        }
                    });
                }
            });
        }

        initializeShootingStars() {
            const heroSection = Utils.qs('.hero-section');
            if (!heroSection) return;

            setInterval(() => {
                if (Math.random() < 0.3) { // 30% chance every interval
                    this.createShootingStar(heroSection);
                }
            }, 3000);
        }

        createShootingStar(container) {
            const shootingStar = document.createElement('div');
            shootingStar.className = 'shooting-star';
            
            // Random starting position (top or right edge)
            if (Math.random() > 0.5) {
                shootingStar.style.top = Math.random() * 50 + '%';
                shootingStar.style.left = '100%';
            } else {
                shootingStar.style.top = '0%';
                shootingStar.style.left = Math.random() * 50 + '%';
            }
            
            container.appendChild(shootingStar);
            
            // Remove after animation
            setTimeout(() => {
                if (shootingStar.parentNode) {
                    shootingStar.parentNode.removeChild(shootingStar);
                }
            }, 2000);
        }

        startAnimationLoop() {
            if (!this.isActive) return;
            
            const animate = () => {
                this.updateParticles();
                this.animationFrame = requestAnimationFrame(animate);
            };
            
            animate();
        }

        updateParticles() {
            this.effects.forEach(effect => {
                if (effect.type === 'particle') {
                    this.updateParticle(effect);
                }
            });
        }

        updateParticle(effect) {
            const { element, speed, position, container } = effect;
            
            // Update position
            position.x += speed.x;
            position.y += speed.y;
            
            // Wrap around edges
            if (position.x > 100) position.x = 0;
            if (position.x < 0) position.x = 100;
            if (position.y > 100) position.y = 0;
            if (position.y < 0) position.y = 100;
            
            // Apply position
            element.style.left = position.x + '%';
            element.style.top = position.y + '%';
        }

        destroy() {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
            }
            
            this.effects.forEach(effect => {
                if (effect.element && effect.element.parentNode) {
                    effect.element.parentNode.removeChild(effect.element);
                }
            });
            
            this.effects = [];
        }

        toggle(active) {
            this.isActive = active;
            
            if (active && this.effects.length === 0) {
                this.init();
            } else if (!active) {
                this.destroy();
            }
        }
    }

    // Modal Manager
    class ModalManager {
        constructor() {
            this.modals = new Map();
            this.activeModals = [];
            this.scrollBarWidth = this.getScrollBarWidth();
        }

        init() {
            this.setupEventListeners();
            this.initializeModals();
        }

        setupEventListeners() {
            // Listen for modal triggers
            document.addEventListener('click', (e) => {
                const trigger = e.target.closest('[data-modal-target]');
                if (trigger) {
                    e.preventDefault();
                    const modalId = trigger.getAttribute('data-modal-target');
                    this.open(modalId);
                }
            });

            // Close modal on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeModals.length > 0) {
                    this.close();
                }
            });

            // Close modal on backdrop click
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-backdrop')) {
                    this.close();
                }
            });
        }

        initializeModals() {
            const modalElements = Utils.qsa('.modal');
            modalElements.forEach(modal => {
                const modalId = modal.id;
                if (modalId) {
                    this.modals.set(modalId, new Modal(modal, this));
                }
            });
        }

        open(modalId, options = {}) {
            const modal = this.modals.get(modalId);
            if (!modal) return;

            // Close previous modals if not stacking
            if (!options.stack) {
                this.closeAll();
            }

            modal.open(options);
            this.activeModals.push(modal);
            
            // Prevent body scroll
            this.preventBodyScroll();
        }

        close(modalId = null) {
            if (modalId) {
                const modal = this.modals.get(modalId);
                if (modal) {
                    modal.close();
                    this.removeActiveModal(modal);
                }
            } else {
                // Close the topmost modal
                if (this.activeModals.length > 0) {
                    const modal = this.activeModals[this.activeModals.length - 1];
                    modal.close();
                    this.removeActiveModal(modal);
                }
            }

            // Restore body scroll if no modals are open
            if (this.activeModals.length === 0) {
                this.restoreBodyScroll();
            }
        }

        closeAll() {
            [...this.activeModals].forEach(modal => {
                modal.close();
            });
            this.activeModals = [];
            this.restoreBodyScroll();
        }

        removeActiveModal(modal) {
            const index = this.activeModals.indexOf(modal);
            if (index > -1) {
                this.activeModals.splice(index, 1);
            }
        }

        preventBodyScroll() {
            const body = document.body;
            body.style.paddingRight = this.scrollBarWidth + 'px';
            body.style.overflow = 'hidden';
        }

        restoreBodyScroll() {
            const body = document.body;
            body.style.paddingRight = '';
            body.style.overflow = '';
        }

        getScrollBarWidth() {
            const outer = document.createElement('div');
            outer.style.visibility = 'hidden';
            outer.style.overflow = 'scroll';
            outer.style.msOverflowStyle = 'scrollbar';
            document.body.appendChild(outer);

            const inner = document.createElement('div');
            outer.appendChild(inner);

            const scrollBarWidth = outer.offsetWidth - inner.offsetWidth;
            outer.parentNode.removeChild(outer);

            return scrollBarWidth;
        }
    }

    // Individual Modal Class
    class Modal {
        constructor(element, manager) {
            this.element = element;
            this.manager = manager;
            this.isOpen = false;
            this.options = {};
            
            this.setupModalEventListeners();
        }

        setupModalEventListeners() {
            // Close button
            const closeBtn = this.element.querySelector('.btn-close, [data-modal-close]');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.close();
                });
            }

            // Modal content click shouldn't close modal
            const modalContent = this.element.querySelector('.modal-content, .modal-dialog');
            if (modalContent) {
                modalContent.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
        }

        open(options = {}) {
            if (this.isOpen) return;

            this.options = { ...options };
            this.isOpen = true;

            // Show modal
            this.element.style.display = 'block';
            this.element.classList.add('show');
            this.element.setAttribute('aria-hidden', 'false');

            // Focus management
            this.manageFocus();

            // Trigger open event
            this.element.dispatchEvent(new CustomEvent('modal:open', {
                detail: { modal: this, options: this.options }
            }));

            // Animation
            requestAnimationFrame(() => {
                this.element.classList.add('open');
            });
        }

        close() {
            if (!this.isOpen) return;

            this.isOpen = false;
            this.element.classList.remove('open');

            // Wait for animation
            setTimeout(() => {
                this.element.style.display = 'none';
                this.element.classList.remove('show');
                this.element.setAttribute('aria-hidden', 'true');

                // Restore focus
                this.restoreFocus();

                // Trigger close event
                this.element.dispatchEvent(new CustomEvent('modal:close', {
                    detail: { modal: this }
                }));
            }, 300);
        }

        manageFocus() {
            // Store currently focused element
            this.previouslyFocused = document.activeElement;

            // Focus first focusable element in modal
            const focusableElements = this.element.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }

            // Trap focus within modal
            this.element.addEventListener('keydown', this.handleFocusTrap.bind(this));
        }

        restoreFocus() {
            if (this.previouslyFocused) {
                this.previouslyFocused.focus();
            }
        }

        handleFocusTrap(e) {
            if (e.key !== 'Tab') return;

            const focusableElements = this.element.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    }

    // Back to Top Button Manager
    class BackToTopManager {
        constructor() {
            this.button = Utils.qs('.back-to-top');
            this.threshold = 300;
            this.isVisible = false;
            
            this.handleScroll = Utils.throttle(this.onScroll.bind(this), 100);
        }

        init() {
            if (!this.button) {
                this.createButton();
            }
            
            this.setupEventListeners();
        }

        createButton() {
            this.button = document.createElement('button');
            this.button.className = 'back-to-top';
            this.button.setAttribute('aria-label', 'Back to top');
            this.button.innerHTML = '<i class="fas fa-chevron-up"></i>';
            document.body.appendChild(this.button);
        }

        setupEventListeners() {
            this.button.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToTop();
            });

            window.addEventListener('scroll', this.handleScroll, { passive: true });
        }

        onScroll() {
            const scrollTop = window.pageYOffset;
            const shouldShow = scrollTop > this.threshold;

            if (shouldShow && !this.isVisible) {
                this.show();
            } else if (!shouldShow && this.isVisible) {
                this.hide();
            }
        }

        show() {
            this.isVisible = true;
            this.button.classList.add('visible');
        }

        hide() {
            this.isVisible = false;
            this.button.classList.remove('visible');
        }

        scrollToTop() {
            if ('scrollBehavior' in document.documentElement.style) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                Utils.animateScrollTo(0, 800);
            }
        }
    }

    // Cookie Consent Manager
    class CookieConsentManager {
        constructor() {
            this.banner = null;
            this.hasConsent = Utils.storage.get('cookieConsent', false);
            this.consentDate = Utils.storage.get('cookieConsentDate', null);
            this.consentExpiry = 365; // days
        }

        init() {
            if (this.shouldShowBanner()) {
                this.createBanner();
                this.showBanner();
            }
        }

        shouldShowBanner() {
            if (!this.hasConsent) return true;

            // Check if consent has expired
            if (this.consentDate) {
                const consentAge = (Date.now() - new Date(this.consentDate).getTime()) / (1000 * 60 * 60 * 24);
                return consentAge > this.consentExpiry;
            }

            return false;
        }

        createBanner() {
            this.banner = document.createElement('div');
            this.banner.className = 'cookie-banner';
            this.banner.setAttribute('role', 'banner');
            this.banner.setAttribute('aria-label', 'Cookie consent');
            
            this.banner.innerHTML = `
                <div class="cookie-content">
                    <div class="cookie-text">
                        <i class="fas fa-cookie-bite"></i>
                        <span>We use cookies to enhance your browsing experience and analyze our traffic. 
                        By clicking "Accept", you consent to our use of cookies.</span>
                    </div>
                    <div class="cookie-actions">
                        <button class="btn btn-sm btn-outline" data-action="preferences">
                            Preferences
                        </button>
                        <button class="btn btn-sm btn-primary" data-action="accept">
                            Accept All
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(this.banner);
            this.setupBannerEventListeners();
        }

        setupBannerEventListeners() {
            const acceptBtn = this.banner.querySelector('[data-action="accept"]');
            const preferencesBtn = this.banner.querySelector('[data-action="preferences"]');

            acceptBtn.addEventListener('click', () => {
                this.acceptAll();
            });

            preferencesBtn.addEventListener('click', () => {
                this.showPreferences();
            });
        }

        showBanner() {
            if (!this.banner) return;
            
            setTimeout(() => {
                this.banner.classList.add('show');
            }, 1000);
        }

        hideBanner() {
            if (!this.banner) return;
            
            this.banner.classList.remove('show');
            
            setTimeout(() => {
                if (this.banner.parentNode) {
                    this.banner.parentNode.removeChild(this.banner);
                }
            }, 300);
        }

        acceptAll() {
            this.setConsent(true);
            this.hideBanner();
            this.enableAnalytics();
            NotificationManager.success('Cookie preferences saved');
        }

        showPreferences() {
            // This would open a more detailed cookie preferences modal
            // For now, just show a simple message
            NotificationManager.info('Detailed cookie preferences coming soon');
        }

        setConsent(hasConsent) {
            this.hasConsent = hasConsent;
            this.consentDate = new Date().toISOString();
            
            Utils.storage.set('cookieConsent', hasConsent);
            Utils.storage.set('cookieConsentDate', this.consentDate);
        }

        enableAnalytics() {
            // Enable Google Analytics or other tracking
            // This is where you'd initialize your analytics
            if (typeof gtag !== 'undefined') {
                gtag('consent', 'update', {
                    'analytics_storage': 'granted'
                });
            }
        }
    }

    // PWA Install Manager
    class PWAInstallManager {
        constructor() {
            this.installPrompt = null;
            this.installButton = null;
            this.isInstalled = false;
        }

        init() {
            this.setupEventListeners();
            this.checkInstallStatus();
        }

        setupEventListeners() {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.installPrompt = e;
                this.showInstallButton();
            });

            window.addEventListener('appinstalled', () => {
                this.isInstalled = true;
                this.hideInstallButton();
                NotificationManager.success('App installed successfully!');
            });
        }

        checkInstallStatus() {
            // Check if already installed
            if (window.matchMedia('(display-mode: standalone)').matches) {
                this.isInstalled = true;
                return;
            }

            // Check if in PWA mode
            if (window.navigator.standalone === true) {
                this.isInstalled = true;
                return;
            }
        }

        showInstallButton() {
            if (this.isInstalled || this.installButton) return;

            this.installButton = document.createElement('button');
            this.installButton.className = 'pwa-install-btn';
            this.installButton.innerHTML = `
                <i class="fas fa-download"></i>
                <span>Install App</span>
            `;

            document.body.appendChild(this.installButton);

            setTimeout(() => {
                this.installButton.classList.add('show');
            }, 2000);

            this.installButton.addEventListener('click', () => {
                this.triggerInstall();
            });
        }

        hideInstallButton() {
            if (!this.installButton) return;

            this.installButton.classList.remove('show');
            
            setTimeout(() => {
                if (this.installButton.parentNode) {
                    this.installButton.parentNode.removeChild(this.installButton);
                }
                this.installButton = null;
            }, 300);
        }

        async triggerInstall() {
            if (!this.installPrompt) return;

            try {
                const result = await this.installPrompt.prompt();
                
                if (result.outcome === 'accepted') {
                    this.hideInstallButton();
                } else {
                    NotificationManager.info('Install cancelled');
                }
            } catch (error) {
                console.error('Install failed:', error);
                NotificationManager.error('Install failed');
            }

            this.installPrompt = null;
        }
    }

    // Performance Monitor
    class PerformanceMonitor {
        constructor() {
            this.metrics = new Map();
            this.observers = [];
        }

        init() {
            this.monitorPageLoad();
            this.monitorResourceTiming();
            this.monitorUserTiming();
            this.monitorWebVitals();
        }

        monitorPageLoad() {
            window.addEventListener('load', () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                
                this.metrics.set('page-load', {
                    loadComplete: navigation.loadEventEnd,
                    domComplete: navigation.domComplete,
                    domInteractive: navigation.domInteractive,
                    firstPaint: this.getFirstPaint(),
                    firstContentfulPaint: this.getFirstContentfulPaint()
                });

                this.reportMetrics();
            });
        }

        monitorResourceTiming() {
            // Monitor critical resources
            const criticalResources = ['stylesheet', 'script', 'image'];
            
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 1000) { // Resources taking > 1s
                        console.warn(`Slow resource: ${entry.name} (${entry.duration}ms)`);
                    }
                }
            });

            observer.observe({ entryTypes: ['resource'] });
            this.observers.push(observer);
        }

        monitorUserTiming() {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.metrics.set(`user-timing-${entry.name}`, {
                        duration: entry.duration,
                        startTime: entry.startTime
                    });
                }
            });

            observer.observe({ entryTypes: ['measure'] });
            this.observers.push(observer);
        }

        monitorWebVitals() {
            // Monitor Core Web Vitals
            this.observeLCP();
            this.observeFID();
            this.observeCLS();
        }

        observeLCP() {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.set('lcp', lastEntry.startTime);
            });

            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(observer);
        }

        observeFID() {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.metrics.set('fid', entry.processingStart - entry.startTime);
                }
            });

            observer.observe({ entryTypes: ['first-input'] });
            this.observers.push(observer);
        }

        observeCLS() {
            let clsValue = 0;
            let clsEntries = [];

            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsEntries.push(entry);
                        clsValue += entry.value;
                    }
                }
                this.metrics.set('cls', clsValue);
            });

            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(observer);
        }

        getFirstPaint() {
            const paintEntries = performance.getEntriesByType('paint');
            const fpEntry = paintEntries.find(entry => entry.name === 'first-paint');
            return fpEntry ? fpEntry.startTime : null;
        }

        getFirstContentfulPaint() {
            const paintEntries = performance.getEntriesByType('paint');
            const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            return fcpEntry ? fcpEntry.startTime : null;
        }

        reportMetrics() {
            // In production, send to analytics
            if (process.env.NODE_ENV === 'production') {
                this.sendToAnalytics();
            } else {
                console.group('Performance Metrics');
                this.metrics.forEach((value, key) => {
                    console.log(`${key}:`, value);
                });
                console.groupEnd();
            }
        }

        sendToAnalytics() {
            // Send to Google Analytics, other analytics platforms
            this.metrics.forEach((value, key) => {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'timing_complete', {
                        name: key,
                        value: Math.round(typeof value === 'object' ? value.duration || 0 : value)
                    });
                }
            });
        }

        destroy() {
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];
            this.metrics.clear();
        }
    }

    // Main Application Class
    class PegeartsApp {
        constructor() {
            this.managers = {};
            this.isInitialized = false;
            this.version = '2.0.0';
        }

        async init() {
            if (this.isInitialized) return;

            try {
                Utils.performance.mark('app-init-start');

                // Initialize critical managers first
                await this.initCriticalManagers();
                
                // Initialize other managers
                await this.initSecondaryManagers();
                
                // Setup global event listeners
                this.setupGlobalEventListeners();
                
                // Mark as initialized
                this.isInitialized = true;
                
                Utils.performance.mark('app-init-end');
                Utils.performance.measure('app-init', 'app-init-start', 'app-init-end');
                
                console.log(`🎨 Pegearts Portfolio v${this.version} initialized`);
                
                // Dispatch ready event
                document.dispatchEvent(new CustomEvent('app:ready'));
                
            } catch (error) {
                console.error('Failed to initialize app:', error);
                this.handleInitError(error);
            }
        }

        async initCriticalManagers() {
            // Preloader (must be first)
            this.managers.preloader = new PreloaderManager();
            this.managers.preloader.init();

            // Wait for page load before continuing
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            });

            // Navigation
            this.managers.navigation = new NavigationManager();
            this.managers.navigation.init();

            // Notification system
            this.managers.notification = new NotificationManager();
            
            // Form management
            this.managers.form = new FormManager();
            this.managers.form.init();
        }

        async initSecondaryManagers() {
            // Audio players
            this.managers.audio = new AudioPlayerManager();
            this.managers.audio.init();

            // Portfolio filtering
            this.managers.portfolio = new PortfolioManager();
            this.managers.portfolio.init();

            // Scroll effects
            this.managers.scrollEffects = new ScrollEffectsManager();
            this.managers.scrollEffects.init();

            // Background effects
            this.managers.backgroundEffects = new BackgroundEffectsManager();
            this.managers.backgroundEffects.init();

            // Modal system
            this.managers.modal = new ModalManager();
            this.managers.modal.init();

            // Back to top button
            this.managers.backToTop = new BackToTopManager();
            this.managers.backToTop.init();

            // Cookie consent
            this.managers.cookieConsent = new CookieConsentManager();
            this.managers.cookieConsent.init();

            // PWA install
            this.managers.pwaInstall = new PWAInstallManager();
            this.managers.pwaInstall.init();

            // Performance monitoring
            this.managers.performance = new PerformanceMonitor();
            this.managers.performance.init();
        }

        setupGlobalEventListeners() {
            // Handle uncaught errors
            window.addEventListener('error', (e) => {
                this.handleGlobalError(e.error);
            });

            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', (e) => {
                this.handleGlobalError(e.reason);
            });

            // Handle visibility change
            document.addEventListener('visibilitychange', () => {
                this.handleVisibilityChange();
            });

            // Handle online/offline status
            window.addEventListener('online', () => {
                NotificationManager.success('Connection restored');
            });

            window.addEventListener('offline', () => {
                NotificationManager.warning('Connection lost');
            });

            // Handle reduced motion preference changes
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            reducedMotionQuery.addListener((e) => {
                AppState.userPreferences.reducedMotion = e.matches;
                this.managers.backgroundEffects?.toggle(!e.matches);
            });
        }

        handleInitError(error) {
            // Fallback initialization for critical functionality
            console.error('App initialization failed, using fallback mode');
            
            // Basic navigation
            const navLinks = Utils.qsa('.nav-link[href^="#"]');
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    const target = Utils.qs(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        }

        handleGlobalError(error) {
            console.error('Global error:', error);
            
            // Don't show error notifications for network errors or script loading errors
            if (error && !error.message?.includes('Loading')) {
                NotificationManager.error('An unexpected error occurred');
            }
        }

        handleVisibilityChange() {
            if (document.hidden) {
                // Page is hidden - pause non-essential animations
                this.managers.backgroundEffects?.toggle(false);
            } else {
                // Page is visible - resume animations (if user preference allows)
                if (!AppState.userPreferences.reducedMotion) {
                    this.managers.backgroundEffects?.toggle(true);
                }
            }
        }

        // Public API methods
        getManager(name) {
            return this.managers[name];
        }

        // Graceful shutdown
        destroy() {
            Object.values(this.managers).forEach(manager => {
                if (manager && typeof manager.destroy === 'function') {
                    manager.destroy();
                }
            });
            
            this.managers = {};
            this.isInitialized = false;
        }
    }

    // Global app instance
    window.app = new PegeartsApp();

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            app.init();
        });
    } else {
        app.init();
    }

    // Expose NotificationManager globally for easy access
    window.NotificationManager = NotificationManager;

    // Add ripple effect to buttons
    document.addEventListener('click', function(e) {
        const button = e.target.closest('.btn, .card, .portfolio-card');
        if (!button) return;
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });

})();

// Ripple animation keyframes
const rippleStyles = document.createElement('style');
rippleStyles.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyles);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PegeartsApp, Utils, AppState };
}


