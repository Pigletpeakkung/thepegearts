/**
 * Pegearts Portfolio - Complete Main JavaScript
 * Enhanced interactive features and animations with all functionality
 * Author: Thanatsitt Santisamranwilai (Pegearts)
 */

// Global variables and utilities
const PegeArts = {
    config: {
        animationDuration: 300,
        scrollOffset: 80,
        particleCount: 50,
        starCount: 100,
        typingSpeed: 50,
        autoSaveInterval: 30000, // 30 seconds
        notificationDuration: 5000,
        audioFadeTime: 500,
        portfolioTransitionTime: 400
    },
    
    state: {
        isLoaded: false,
        currentSection: 'home',
        isScrolling: false,
        isMobile: window.innerWidth <= 768,
        theme: localStorage.getItem('theme') || 'auto',
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        currentAudio: null,
        portfolioFilter: 'all',
        formData: new Map()
    },
    
    elements: {},
    animations: {},
    observers: {},
    audioPlayers: new Map(),
    
    // Utility functions
    utils: {
        debounce(func, wait, immediate) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func(...args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func(...args);
            };
        },
        
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        lerp(start, end, factor) {
            return start + (end - start) * factor;
        },
        
        map(value, start1, stop1, start2, stop2) {
            return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
        },
        
        random(min, max) {
            return Math.random() * (max - min) + min;
        },
        
        randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
        
        isElementInViewport(element, threshold = 0) {
            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const windowWidth = window.innerWidth || document.documentElement.clientWidth;
            
            return (
                rect.top >= -threshold &&
                rect.left >= -threshold &&
                rect.bottom <= windowHeight + threshold &&
                rect.right <= windowWidth + threshold
            );
        },
        
        getFocusableElements(element) {
            return element.querySelectorAll(
                'a[href], button, textarea, input[type="text"], input[type="email"], input[type="tel"], input[type="radio"], input[type="checkbox"], select'
            );
        },
        
        trapFocus(element) {
            const focusableElements = this.getFocusableElements(element);
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstFocusable) {
                            lastFocusable.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastFocusable) {
                            firstFocusable.focus();
                            e.preventDefault();
                        }
                    }
                }
            });
        },
        
        validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },
        
        validatePhone(phone) {
            const re = /^[\+]?[1-9][\d]{0,15}$/;
            return re.test(phone.replace(/\s/g, ''));
        },
        
        sanitizeInput(input) {
            const div = document.createElement('div');
            div.textContent = input;
            return div.innerHTML;
        },
        
        getDeviceInfo() {
            return {
                isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
                isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
                isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
                browser: this.getBrowserInfo(),
                screen: {
                    width: window.screen.width,
                    height: window.screen.height,
                    devicePixelRatio: window.devicePixelRatio || 1
                }
            };
        },
        
        getBrowserInfo() {
            const ua = navigator.userAgent;
            if (ua.indexOf('Chrome') > -1) return 'Chrome';
            if (ua.indexOf('Firefox') > -1) return 'Firefox';
            if (ua.indexOf('Safari') > -1) return 'Safari';
            if (ua.indexOf('Edge') > -1) return 'Edge';
            return 'Unknown';
        }
    }
};

// =============================================================================
// AUDIO PLAYER FUNCTIONALITY
// =============================================================================

class AudioPlayerManager {
    constructor() {
        this.players = new Map();
        this.currentlyPlaying = null;
        this.visualizers = new Map();
        
        this.init();
    }
    
    init() {
        // Initialize all audio players on the page
        const audioContainers = document.querySelectorAll('.audio-player-container');
        audioContainers.forEach(container => {
            this.initializePlayer(container);
        });
        
        // Global audio event handlers
        this.setupGlobalAudioHandlers();
    }
    
    initializePlayer(container) {
        const audio = container.querySelector('audio');
        const playerId = container.id || 'player_' + Date.now();
        
        if (!audio) return;
        
        const player = {
            container,
            audio,
            id: playerId,
            isPlaying: false,
            duration: 0,
            currentTime: 0,
            volume: 0.8,
            muted: false,
            loading: false,
            error: null,
            
            // UI elements
            playBtn: container.querySelector('.play-btn'),
            pauseBtn: container.querySelector('.pause-btn'),
            stopBtn: container.querySelector('.stop-btn'),
            progressBar: container.querySelector('.progress-bar'),
            progressFill: container.querySelector('.progress-fill'),
            progressHandle: container.querySelector('.progress-handle'),
            timeDisplay: container.querySelector('.time-display'),
            currentTimeEl: container.querySelector('.current-time'),
            durationEl: container.querySelector('.duration'),
            volumeSlider: container.querySelector('.volume-slider'),
            volumeBtn: container.querySelector('.volume-btn'),
            downloadBtn: container.querySelector('.download-btn'),
            waveform: container.querySelector('.waveform'),
            loadingIndicator: container.querySelector('.loading-indicator')
        };
        
        this.setupPlayerEvents(player);
        this.setupPlayerUI(player);
        this.players.set(playerId, player);
        
        // Initialize waveform if available
        if (player.waveform) {
            this.initializeWaveform(player);
        }
        
        return player;
    }
    
    setupPlayerEvents(player) {
        const { audio } = player;
        
        // Audio events
        audio.addEventListener('loadstart', () => {
            this.setPlayerState(player, { loading: true });
        });
        
        audio.addEventListener('loadedmetadata', () => {
            player.duration = audio.duration;
            this.updateDurationDisplay(player);
            this.setPlayerState(player, { loading: false });
        });
        
        audio.addEventListener('loadeddata', () => {
            this.generateWaveform(player);
        });
        
        audio.addEventListener('timeupdate', () => {
            player.currentTime = audio.currentTime;
            this.updateProgressBar(player);
            this.updateTimeDisplay(player);
            this.updateWaveformProgress(player);
        });
        
        audio.addEventListener('ended', () => {
            this.stopAudio(player.id);
            this.trackAudioEvent('audio_complete', player);
        });
        
        audio.addEventListener('error', (e) => {
            this.handleAudioError(player, e);
        });
        
        audio.addEventListener('play', () => {
            this.setPlayerState(player, { isPlaying: true });
            this.currentlyPlaying = player.id;
        });
        
        audio.addEventListener('pause', () => {
            this.setPlayerState(player, { isPlaying: false });
        });
        
        // Volume change
        audio.addEventListener('volumechange', () => {
            player.volume = audio.volume;
            player.muted = audio.muted;
            this.updateVolumeUI(player);
        });
        
        // Buffer progress
        audio.addEventListener('progress', () => {
            this.updateBufferProgress(player);
        });
    }
    
    setupPlayerUI(player) {
        // Play button
        if (player.playBtn) {
            player.playBtn.addEventListener('click', () => {
                this.playAudio(player.id);
            });
        }
        
        // Pause button
        if (player.pauseBtn) {
            player.pauseBtn.addEventListener('click', () => {
                this.pauseAudio(player.id);
            });
        }
        
        // Stop button
        if (player.stopBtn) {
            player.stopBtn.addEventListener('click', () => {
                this.stopAudio(player.id);
            });
        }
        
        // Progress bar interaction
        if (player.progressBar) {
            this.setupProgressBarInteraction(player);
        }
        
        // Volume controls
        if (player.volumeSlider) {
            this.setupVolumeControls(player);
        }
        
        // Download button
        if (player.downloadBtn) {
            player.downloadBtn.addEventListener('click', () => {
                this.downloadAudio(player);
            });
        }
        
        // Keyboard controls
        player.container.addEventListener('keydown', (e) => {
            this.handleKeyboardControls(player, e);
        });
    }
    
    setupProgressBarInteraction(player) {
        const { progressBar, progressHandle } = player;
        let isDragging = false;
        
        const startDrag = (e) => {
            isDragging = true;
            this.pauseAudio(player.id);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', drag);
            document.addEventListener('touchend', endDrag);
        };
        
        const drag = (e) => {
            if (!isDragging) return;
            
            const rect = progressBar.getBoundingClientRect();
            const clientX = e.clientX || e.touches[0].clientX;
            const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const newTime = progress * player.duration;
            
            this.seekTo(player.id, newTime);
            this.updateProgressBar(player, progress);
        };
        
        const endDrag = () => {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('touchend', endDrag);
        };
        
        // Mouse events
        progressBar.addEventListener('mousedown', startDrag);
        if (progressHandle) {
            progressHandle.addEventListener('mousedown', startDrag);
        }
        
        // Touch events
        progressBar.addEventListener('touchstart', startDrag);
        if (progressHandle) {
            progressHandle.addEventListener('touchstart', startDrag);
        }
        
        // Click to seek
        progressBar.addEventListener('click', (e) => {
            if (isDragging) return;
            
            const rect = progressBar.getBoundingClientRect();
            const progress = (e.clientX - rect.left) / rect.width;
            const newTime = progress * player.duration;
            
            this.seekTo(player.id, newTime);
        });
    }
    
    setupVolumeControls(player) {
        const { volumeSlider, volumeBtn } = player;
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value);
                this.setVolume(player.id, volume);
            });
        }
        
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => {
                this.toggleMute(player.id);
            });
        }
    }
    
    initializeWaveform(player) {
        if (!player.waveform) return;
        
        // Create canvas for waveform visualization
        const canvas = document.createElement('canvas');
        canvas.className = 'waveform-canvas';
        player.waveform.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const resizeCanvas = () => {
            const rect = player.waveform.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        
        resizeCanvas();
        window.addEventListener('resize', PegeArts.utils.debounce(resizeCanvas, 250));
        
        player.waveformCanvas = canvas;
        player.waveformCtx = ctx;
    }
    
    generateWaveform(player) {
        if (!player.waveformCanvas || !player.audio) return;
        
        // This is a simplified waveform generation
        // In production, you'd want to use Web Audio API for more accurate waveforms
        const { waveformCanvas, waveformCtx } = player;
        const width = waveformCanvas.width / window.devicePixelRatio;
        const height = waveformCanvas.height / window.devicePixelRatio;
        
        // Clear canvas
        waveformCtx.clearRect(0, 0, width, height);
        
        // Generate random waveform (placeholder)
        // In real implementation, analyze audio buffer
        const bars = 100;
        const barWidth = width / bars;
        
        waveformCtx.fillStyle = 'rgba(139, 92, 246, 0.3)';
        
        for (let i = 0; i < bars; i++) {
            const barHeight = Math.random() * height * 0.8;
            const x = i * barWidth;
            const y = (height - barHeight) / 2;
            
            waveformCtx.fillRect(x, y, barWidth - 1, barHeight);
        }
    }
    
    updateWaveformProgress(player) {
        if (!player.waveformCanvas || !player.duration) return;
        
        const progress = player.currentTime / player.duration;
        const width = player.waveformCanvas.width / window.devicePixelRatio;
        const height = player.waveformCanvas.height / window.devicePixelRatio;
        
        // Redraw waveform with progress
        this.generateWaveform(player);
        
        // Draw progress overlay
        player.waveformCtx.fillStyle = 'rgba(139, 92, 246, 0.8)';
        player.waveformCtx.fillRect(0, 0, width * progress, height);
    }
    
    // Public methods
    playAudio(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        // Pause other playing audio
        if (this.currentlyPlaying && this.currentlyPlaying !== playerId) {
            this.pauseAudio(this.currentlyPlaying);
        }
        
        player.audio.play().then(() => {
            this.trackAudioEvent('audio_play', player);
        }).catch(error => {
            this.handleAudioError(player, error);
        });
    }
    
    pauseAudio(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        player.audio.pause();
        this.trackAudioEvent('audio_pause', player);
    }
    
    stopAudio(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        player.audio.pause();
        player.audio.currentTime = 0;
        this.setPlayerState(player, { isPlaying: false });
        
        if (this.currentlyPlaying === playerId) {
            this.currentlyPlaying = null;
        }
        
        this.trackAudioEvent('audio_stop', player);
    }
    
    seekTo(playerId, time) {
        const player = this.players.get(playerId);
        if (!player || !player.duration) return;
        
        const clampedTime = Math.max(0, Math.min(time, player.duration));
        player.audio.currentTime = clampedTime;
        
        this.trackAudioEvent('audio_seek', player, { seekTime: clampedTime });
    }
    
    setVolume(playerId, volume) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        const clampedVolume = Math.max(0, Math.min(1, volume));
        player.audio.volume = clampedVolume;
    }
    
    toggleMute(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        player.audio.muted = !player.audio.muted;
        this.trackAudioEvent('audio_mute', player, { muted: player.audio.muted });
    }
    
    downloadAudio(player) {
        const audioSrc = player.audio.currentSrc || player.audio.src;
        if (!audioSrc) return;
        
        const link = document.createElement('a');
        link.href = audioSrc;
        link.download = audioSrc.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.trackAudioEvent('audio_download', player);
    }
    
    // UI Update methods
    setPlayerState(player, state) {
        Object.assign(player, state);
        this.updatePlayerUI(player);
    }
    
    updatePlayerUI(player) {
        const { container, isPlaying, loading, error } = player;
        
        // Update play/pause buttons
        container.classList.toggle('playing', isPlaying);
        container.classList.toggle('loading', loading);
        container.classList.toggle('error', !!error);
        
        // Update loading indicator
        if (player.loadingIndicator) {
            player.loadingIndicator.style.display = loading ? 'block' : 'none';
        }
    }
    
    updateProgressBar(player, customProgress = null) {
        if (!player.progressFill || !player.duration) return;
        
        const progress = customProgress !== null ? customProgress : player.currentTime / player.duration;
        const percentage = Math.max(0, Math.min(100, progress * 100));
        
        player.progressFill.style.width = percentage + '%';
        
        if (player.progressHandle) {
            player.progressHandle.style.left = percentage + '%';
        }
    }
    
    updateTimeDisplay(player) {
        if (player.currentTimeEl) {
            player.currentTimeEl.textContent = PegeArts.utils.formatTime(player.currentTime);
        }
    }
    
    updateDurationDisplay(player) {
        if (player.durationEl) {
            player.durationEl.textContent = PegeArts.utils.formatTime(player.duration);
        }
    }
    
    updateVolumeUI(player) {
        if (player.volumeSlider) {
            player.volumeSlider.value = player.muted ? 0 : player.volume;
        }
        
        if (player.volumeBtn) {
            const icon = player.volumeBtn.querySelector('i');
            if (icon) {
                icon.className = player.muted || player.volume === 0 
                    ? 'fas fa-volume-mute' 
                    : player.volume < 0.5 
                    ? 'fas fa-volume-down' 
                    : 'fas fa-volume-up';
            }
        }
    }
    
    updateBufferProgress(player) {
        const { audio } = player;
        if (!audio.buffered.length) return;
        
        const bufferEnd = audio.buffered.end(audio.buffered.length - 1);
        const bufferProgress = bufferEnd / audio.duration;
        
        const bufferBar = player.container.querySelector('.buffer-progress');
        if (bufferBar) {
            bufferBar.style.width = (bufferProgress * 100) + '%';
        }
    }
    
    handleKeyboardControls(player, event) {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                if (player.isPlaying) {
                    this.pauseAudio(player.id);
                } else {
                    this.playAudio(player.id);
                }
                break;
                
            case 'ArrowLeft':
                event.preventDefault();
                this.seekTo(player.id, player.currentTime - 10);
                break;
                
            case 'ArrowRight':
                event.preventDefault();
                this.seekTo(player.id, player.currentTime + 10);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                this.setVolume(player.id, Math.min(1, player.volume + 0.1));
                break;
                
            case 'ArrowDown':
                event.preventDefault();
                this.setVolume(player.id, Math.max(0, player.volume - 0.1));
                break;
                
            case 'KeyM':
                event.preventDefault();
                this.toggleMute(player.id);
                break;
        }
    }
    
    handleAudioError(player, error) {
        console.error('Audio error:', error);
        this.setPlayerState(player, { 
            error: error.message || 'Audio loading failed',
            loading: false 
        });
        
        PegeArts.notifications.show(
            'Sorry, there was an error loading the audio file.',
            'error',
            5000
        );
    }
    
    setupGlobalAudioHandlers() {
        // Pause all audio when page loses focus
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentlyPlaying) {
                this.pauseAudio(this.currentlyPlaying);
            }
        });
        
        // Handle media session API (if available)
        if ('mediaSession' in navigator) {
            this.setupMediaSession();
        }
    }
    
    setupMediaSession() {
        navigator.mediaSession.setActionHandler('play', () => {
            if (this.currentlyPlaying) {
                this.playAudio(this.currentlyPlaying);
            }
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            if (this.currentlyPlaying) {
                this.pauseAudio(this.currentlyPlaying);
            }
        });
        
        navigator.mediaSession.setActionHandler('seekbackward', () => {
            if (this.currentlyPlaying) {
                const player = this.players.get(this.currentlyPlaying);
                this.seekTo(this.currentlyPlaying, player.currentTime - 10);
            }
        });
        
        navigator.mediaSession.setActionHandler('seekforward', () => {
            if (this.currentlyPlaying) {
                const player = this.players.get(this.currentlyPlaying);
                this.seekTo(this.currentlyPlaying, player.currentTime + 10);
            }
        });
    }
    
    trackAudioEvent(eventName, player, additionalData = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'Audio Interaction',
                event_label: player.id,
                value: Math.round(player.currentTime),
                custom_map: {
                    duration: Math.round(player.duration),
                    ...additionalData
                }
            });
        }
    }
}

// =============================================================================
// PORTFOLIO FUNCTIONALITY
// =============================================================================

class PortfolioManager {
    constructor() {
        this.portfolioGrid = document.querySelector('.portfolio-grid');
        this.filterButtons = document.querySelectorAll('.portfolio-filter-btn');
        this.portfolioItems = document.querySelectorAll('.portfolio-item');
        this.portfolioModal = document.getElementById('portfolio-details-modal');
        this.currentFilter = 'all';
        this.isAnimating = false;
        
        // Portfolio data
        this.portfolioData = new Map();
        
        this.init();
    }
    
    init() {
        if (!this.portfolioGrid) return;
        
        this.loadPortfolioData();
        this.setupFilterButtons();
        this.setupPortfolioItems();
        this.setupModal();
        this.setupKeyboardNavigation();
    }
    
    loadPortfolioData() {
        // Portfolio project details
        const projectsData = {
            'ai-voice-assistant': {
                title: 'AI Voice Assistant Platform',
                category: 'ai-development',
                technologies: ['Python', 'TensorFlow', 'Speech Recognition', 'NLP', 'AWS'],
                description: 'Advanced multilingual voice assistant with natural language processing capabilities.',
                features: [
                    'Multi-language support (English, Thai, Japanese)',
                    'Context-aware conversation handling',
                    'Real-time speech-to-text processing',
                    'Custom wake word detection',
                    'Cloud-based neural network processing'
                ],
                challenges: 'Implementing accurate multilingual speech recognition while maintaining low latency and high accuracy across different accents.',
                results: '95% accuracy rate, 200ms response time, 50% improvement over previous solutions',
                images: ['project-ai-voice-1.jpg', 'project-ai-voice-2.jpg', 'project-ai-voice-3.jpg'],
                liveUrl: '#',
                githubUrl: 'https://github.com/thanattsitt',
                year: '2024'
            },
            
            'commercial-voiceover': {
                title: 'Commercial Voice-Over Portfolio',
                category: 'voice-acting',
                technologies: ['Pro Tools', 'Audio Post-Processing', 'Multiple Languages'],
                description: 'Professional voice-over work for commercials, e-learning, and multimedia projects.',
                features: [
                    'Commercial advertisements',
                    'E-learning narration',
                    'Character voices for animation',
                    'Podcast introductions',
                    'IVR system recordings'
                ],
                languages: ['English (Native-level fluency)', 'Thai (Native)', 'Japanese (Conversational)'],
                voiceTypes: ['Corporate Professional', 'Friendly Conversational', 'Energetic Commercial', 'Calm Educational'],
                audioSamples: ['commercial-sample-1.mp3', 'elearning-sample-1.mp3', 'character-sample-1.mp3'],
                clients: ['Tech Startups', 'E-learning Platforms', 'Animation Studios', 'Corporate Training'],
                year: '2024'
            },
            
            'ecommerce-platform': {
                title: 'AI-Powered E-commerce Platform',
                category: 'web-development',
                technologies: ['React', 'Node.js', 'MongoDB', 'Machine Learning', 'Stripe'],
                description: 'Full-stack e-commerce platform with AI-driven product recommendations and inventory management.',
                features: [
                    'AI-powered product recommendations',
                    'Smart inventory management',
                    'Real-time analytics dashboard',
                    'Multi-payment gateway integration',
                    'Advanced search with filters'
                ],
                challenges: 'Implementing real-time inventory synchronization across multiple sales channels while maintaining data consistency.',
                results: '40% increase in conversion rate, 60% reduction in inventory holding costs',
                images: ['ecommerce-dashboard.jpg', 'ecommerce-products.jpg', 'ecommerce-analytics.jpg'],
                liveUrl: '#',
                githubUrl: 'https://github.com/thanattsitt',
                year: '2024'
            },
            
            'ml-prediction-model': {
                title: 'Predictive Analytics ML Model',
                category: 'ai-development',
                technologies: ['Python', 'Scikit-learn', 'TensorFlow', 'Data Analysis', 'API Development'],
                description: 'Machine learning model for predictive analytics in business intelligence applications.',
                features: [
                    'Time series forecasting',
                    'Anomaly detection',
                    'Real-time data processing',
                    'RESTful API integration',
                    'Interactive visualization dashboard'
                ],
                challenges: 'Handling large datasets with missing values while maintaining prediction accuracy and model interpretability.',
                results: '85% prediction accuracy, 70% reduction in manual analysis time',
                images: ['ml-dashboard.jpg', 'ml-predictions.jpg', 'ml-analytics.jpg'],
                liveUrl: '#',
                githubUrl: 'https://github.com/thanattsitt',
                year: '2024'
            },
            
            'voice-ai-integration': {
                title: 'Voice AI Integration Project',
                category: 'voice-technology',
                technologies: ['Speech Synthesis', 'Voice Cloning', 'AI Models', 'Real-time Processing'],
                description: 'Integration of advanced voice AI technology with custom voice models for personalized experiences.',
                features: [
                    'Custom voice cloning',
                    'Real-time voice synthesis',
                    'Emotion recognition in speech',
                    'Multi-accent adaptation',
                    'Voice authentication system'
                ],
                voiceFeatures: [
                    'Natural-sounding speech synthesis',
                    'Emotion-aware voice modulation',
                    'Custom pronunciation training',
                    'Background noise reduction',
                    'Real-time voice conversion'
                ],
                applications: ['Virtual Assistants', 'Audiobook Narration', 'Game Character Voices', 'Accessibility Tools'],
                year: '2024'
            },
            
            'responsive-portfolio': {
                title: 'Interactive Portfolio Website',
                category: 'web-development',
                technologies: ['HTML5', 'CSS3', 'JavaScript', 'GSAP', 'WebGL'],
                description: 'Modern, interactive portfolio website with advanced animations and responsive design.',
                features: [
                    'Advanced CSS animations',
                    'WebGL particle systems',
                    'Progressive Web App (PWA)',
                    'Accessibility compliance',
                    'Performance optimization'
                ],
                challenges: 'Creating smooth 60fps animations while maintaining excellent performance across all devices and browsers.',
                results: '98 Google Lighthouse score, 100% accessibility compliance, <2s load time',
                images: ['portfolio-home.jpg', 'portfolio-projects.jpg', 'portfolio-contact.jpg'],
                liveUrl: '#',
                githubUrl: 'https://github.com/thanattsitt',
                year: '2024'
            }
        };
        
        // Store in portfolio data map
        Object.entries(projectsData).forEach(([key, data]) => {
            this.portfolioData.set(key, data);
        });
    }
    
    setupFilterButtons() {
        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = button.getAttribute('data-filter');
                this.filterPortfolio(filter);
                
                // Update active state
                this.filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Track filter usage
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'portfolio_filter', {
                        event_category: 'User Interaction',
                        event_label: filter,
                        value: 1
                    });
                }
            });
        });
    }
    
    setupPortfolioItems() {
        this.portfolioItems.forEach(item => {
            // Add hover effects
            item.addEventListener('mouseenter', () => {
                if (!PegeArts.state.reducedMotion) {
                    this.animateItemHover(item, true);
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (!PegeArts.state.reducedMotion) {
                    this.animateItemHover(item, false);
                }
            });
            
            // Click to open modal
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const projectId = item.getAttribute('data-project');
                this.openProjectModal(projectId);
            });
            
            // Keyboard accessibility
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const projectId = item.getAttribute('data-project');
                    this.openProjectModal(projectId);
                }
            });
        });
    }
    
    setupModal() {
        if (!this.portfolioModal) return;
        
        // Close modal events
        this.portfolioModal.addEventListener('click', (e) => {
            if (e.target === this.portfolioModal) {
                this.closeProjectModal();
            }
        });
        
        // Close button
        const closeBtn = this.portfolioModal.querySelector('.btn-close, [data-bs-dismiss="modal"]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeProjectModal();
            });
        }
        
        // Keyboard navigation
        this.portfolioModal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProjectModal();
            }
        });
    }
    
    setupKeyboardNavigation() {
        // Arrow key navigation for portfolio items
        document.addEventListener('keydown', (e) => {
            if (document.activeElement && document.activeElement.classList.contains('portfolio-item')) {
                this.handleArrowKeyNavigation(e);
            }
        });
    }
    
    filterPortfolio(filter) {
        if (this.isAnimating || this.currentFilter === filter) return;
        
        this.isAnimating = true;
        this.currentFilter = filter;
        
        // Get visible and hidden items
        const visibleItems = [];
        const hiddenItems = [];
        
        this.portfolioItems.forEach(item => {
            const categories = item.getAttribute('data-category').split(' ');
            const shouldShow = filter === 'all' || categories.includes(filter);
            
            if (shouldShow) {
                visibleItems.push(item);
            } else {
                hiddenItems.push(item);
            }
        });
        
        // Animate out hidden items
        this.animateItemsOut(hiddenItems).then(() => {
            // Hide items
            hiddenItems.forEach(item => {
                item.style.display = 'none';
            });
            
            // Show and animate in visible items
            visibleItems.forEach(item => {
                item.style.display = 'block';
            });
            
            return this.animateItemsIn(visibleItems);
        }).then(() => {
            this.isAnimating = false;
            
            // Update URL hash
            if (filter !== 'all') {
                history.replaceState(null, null, `#portfolio-${filter}`);
            } else {
                history.replaceState(null, null, '#portfolio');
            }
            
            // Announce to screen readers
            PegeArts.accessibility.announce(`Showing ${visibleItems.length} ${filter === 'all' ? '' : filter} projects`);
        });
    }
    
    animateItemsOut(items) {
        if (PegeArts.state.reducedMotion) {
            return Promise.resolve();
        }
        
        const animations = items.map(item => {
            return new Promise(resolve => {
                item.style.transition = `opacity ${PegeArts.config.portfolioTransitionTime}ms ease, transform ${PegeArts.config.portfolioTransitionTime}ms ease`;
                item.style.opacity = '0';
                item.style.transform = 'scale(0.8) translateY(20px)';
                
                setTimeout(resolve, PegeArts.config.portfolioTransitionTime);
            });
        });
        
        return Promise.all(animations);
    }
    
    animateItemsIn(items) {
        if (PegeArts.state.reducedMotion) {
            return Promise.resolve();
        }
        
        // Reset transform and opacity
        items.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.8) translateY(20px)';
            
            setTimeout(() => {
                item.style.transition = `opacity ${PegeArts.config.portfolioTransitionTime}ms ease, transform ${PegeArts.config.portfolioTransitionTime}ms ease`;
                item.style.opacity = '1';
                item.style.transform = 'scale(1) translateY(0)';
            }, index * 100); // Stagger animation
        });
        
        return new Promise(resolve => {
            setTimeout(resolve, PegeArts.config.portfolioTransitionTime + (items.length * 100));
        });
    }
    
    animateItemHover(item, isHover) {
        if (!item) return;
        
        const overlay = item.querySelector('.portfolio-overlay');
        const image = item.querySelector('.portfolio-image img');
        
        if (isHover) {
            if (overlay) {
                overlay.style.opacity = '1';
            }
            if (image) {
                image.style.transform = 'scale(1.1)';
            }
            item.style.transform = 'translateY(-5px)';
        } else {
            if (overlay) {
                overlay.style.opacity = '0';
            }
            if (image) {
                image.style.transform = 'scale(1)';
            }
            item.style.transform = 'translateY(0)';
        }
    }
    
    openProjectModal(projectId) {
        const projectData = this.portfolioData.get(projectId);
        if (!projectData || !this.portfolioModal) return;
        
        // Store focus for restoration
        PegeArts.accessibility.storeFocus();
        
        // Populate modal content
        this.populateModalContent(projectData);
        
        // Show modal
        this.portfolioModal.classList.add('show');
        this.portfolioModal.style.display = 'block';
        this.portfolioModal.setAttribute('aria-hidden', 'false');
        
        // Focus management
        setTimeout(() => {
            const firstFocusable = this.portfolioModal.querySelector('button, a, input, [tabindex="0"]');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 150);
        
        // Trap focus in modal
        PegeArts.utils.trapFocus(this.portfolioModal);
        
        // Prevent body scroll
        document.body.classList.add('modal-open');
        
        // Track modal opening
        if (typeof gtag !== 'undefined') {
            gtag('event', 'portfolio_modal_open', {
                event_category: 'User Interaction',
                event_label: projectId,
                value: 1
            });
        }
    }
    
    closeProjectModal() {
        if (!this.portfolioModal) return;
        
        // Hide modal
        this.portfolioModal.classList.remove('show');
        this.portfolioModal.style.display = 'none';
        this.portfolioModal.setAttribute('aria-hidden', 'true');
        
        // Allow body scroll
        document.body.classList.remove('modal-open');
        
        // Restore focus
        PegeArts.accessibility.restoreFocus();
    }
    
    populateModalContent(projectData) {
        const modalContent = this.portfolioModal.querySelector('#portfolioDetailsContent');
        if (!modalContent) return;
        
        const {
            title,
            category,
            technologies = [],
            description,
            features = [],
            challenges = '',
            results = '',
            images = [],
            liveUrl = '',
            githubUrl = '',
            year = '',
            languages = [],
            voiceTypes = [],
            audioSamples = [],
            clients = [],
            voiceFeatures = [],
            applications = []
        } = projectData;
        
        // Build modal HTML
        let modalHTML = `
            <div class="project-modal-header">
                <div class="project-meta">
                    <span class="project-category">${this.getCategoryDisplayName(category)}</span>
                    ${year ? `<span class="project-year">${year}</span>` : ''}
                </div>
                <h2 class="project-title">${title}</h2>
                <p class="project-description">${description}</p>
                
                <div class="project-tech-stack">
                    ${technologies.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
                </div>
            </div>
            
            <div class="project-modal-body">
                ${images.length > 0 ? this.createImageGallery(images) : ''}
                ${audioSamples.length > 0 ? this.createAudioSamples(audioSamples) : ''}
                
                <div class="project-details-grid">
                    ${features.length > 0 ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-star"></i> Key Features</h4>
                            <ul class="feature-list">
                                ${features.map(feature => `<li>${feature}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${languages.length > 0 ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-globe"></i> Languages</h4>
                            <ul class="language-list">
                                ${languages.map(lang => `<li>${lang}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${voiceTypes.length > 0 ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-microphone"></i> Voice Types</h4>
                            <ul class="voice-type-list">
                                ${voiceTypes.map(type => `<li>${type}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${voiceFeatures.length > 0 ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-magic"></i> Voice AI Features</h4>
                            <ul class="voice-feature-list">
                                ${voiceFeatures.map(feature => `<li>${feature}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${applications.length > 0 ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-rocket"></i> Applications</h4>
                            <ul class="application-list">
                                ${applications.map(app => `<li>${app}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${clients.length > 0 ? `
                        <div class="detail-section">
                            <h4><i class="fas fa-users"></i> Client Types</h4>
                            <ul class="client-list">
                                ${clients.map(client => `<li>${client}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${challenges ? `
                        <div class="detail-section full-width">
                            <h4><i class="fas fa-puzzle-piece"></i> Challenges</h4>
                            <p class="challenge-text">${challenges}</p>
                        </div>
                    ` : ''}
                    
                    ${results ? `
                        <div class="detail-section full-width">
                            <h4><i class="fas fa-chart-line"></i> Results</h4>
                            <p class="results-text">${results}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="project-modal-footer">
                <div class="project-actions">
                    ${liveUrl && liveUrl !== '#' ? `
                        <a href="${liveUrl}" 
                           class="btn btn-primary" 
                           target="_blank" 
                           rel="noopener"
                           data-track="portfolio-live-demo">
                            <i class="fas fa-external-link-alt"></i>
                            Live Demo
                        </a>
                    ` : ''}
                    
                    ${githubUrl && githubUrl !== '#' ? `
                        <a href="${githubUrl}" 
                           class="btn btn-outline" 
                           target="_blank" 
                           rel="noopener"
                           data-track="portfolio-github">
                            <i class="fab fa-github"></i>
                            View Code
                        </a>
                    ` : ''}
                    
                    ${category === 'voice-acting' ? `
                        <button class="btn btn-secondary" 
                                onclick="PegeArts.contact.openContactModal('${title}')">
                            <i class="fas fa-envelope"></i>
                            Hire for Similar Project
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        modalContent.innerHTML = modalHTML;
        
        // Initialize any audio players in the modal
        if (audioSamples.length > 0) {
            setTimeout(() => {
                PegeArts.audioPlayer.init();
            }, 100);
        }
    }
    
    createImageGallery(images) {
        if (!images.length) return '';
        
        return `
            <div class="project-image-gallery">
                <div class="main-image">
                    <img src="images/portfolio/${images[0]}" 
                         alt="Project screenshot" 
                         loading="lazy"
                         onclick="PegeArts.portfolio.openImageLightbox(this)">
                </div>
                ${images.length > 1 ? `
                    <div class="thumbnail-gallery">
                        ${images.map((img, index) => `
                            <img src="images/portfolio/${img}" 
                                 alt="Project screenshot ${index + 1}"
                                 class="thumbnail ${index === 0 ? 'active' : ''}"
                                 loading="lazy"
                                 onclick="PegeArts.portfolio.switchMainImage(this, '${img}')">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    createAudioSamples(audioSamples) {
        if (!audioSamples.length) return '';
        
        return `
            <div class="project-audio-samples">
                <h4><i class="fas fa-headphones"></i> Listen to Samples</h4>
                <div class="audio-samples-grid">
                    ${audioSamples.map((audio, index) => `
                        <div class="audio-player-container sample-player" id="sample-player-${index}">
                            <audio preload="metadata">
                                <source src="audio/samples/${audio}" type="audio/mpeg">
                                <source src="audio/samples/${audio.replace('.mp3', '.ogg')}" type="audio/ogg">
                                Your browser does not support the audio element.
                            </audio>
                            
                            <div class="audio-player-controls">
                                <button class="play-btn" aria-label="Play sample ${index + 1}">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button class="pause-btn" aria-label="Pause sample ${index + 1}">
                                    <i class="fas fa-pause"></i>
                                </button>
                                
                                <div class="progress-bar">
                                    <div class="progress-fill"></div>
                                    <div class="progress-handle"></div>
                                </div>
                                
                                <div class="time-display">
                                    <span class="current-time">0:00</span>
                                    <span class="duration">0:00</span>
                                </div>
                            </div>
                            
                            <div class="sample-info">
                                <div class="sample-title">Sample ${index + 1}</div>
                                <div class="sample-description">
                                    ${this.getSampleDescription(audio, index)}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    getSampleDescription(audio, index) {
        const descriptions = [
            'Commercial advertisement voice-over',
            'E-learning narration sample',
            'Character voice for animation',
            'Podcast introduction',
            'Corporate presentation narration'
        ];
        
        return descriptions[index] || 'Professional voice sample';
    }
    
    getCategoryDisplayName(category) {
        const categoryNames = {
            'all': 'All Projects',
            'ai-development': 'AI Development',
            'voice-acting': 'Voice Acting',
            'web-development': 'Web Development',
            'voice-technology': 'Voice Technology',
            'seo-strategy': 'SEO Strategy'
        };
        
        return categoryNames[category] || category;
    }
    
    switchMainImage(thumbnail, imageSrc) {
        const gallery = thumbnail.closest('.project-image-gallery');
        const mainImage = gallery.querySelector('.main-image img');
        const thumbnails = gallery.querySelectorAll('.thumbnail');
        
        // Update main image
        mainImage.src = `images/portfolio/${imageSrc}`;
        
        // Update active thumbnail
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnail.classList.add('active');
    }
    
    openImageLightbox(image) {
        // Create lightbox overlay
        const lightbox = document.createElement('div');
        lightbox.className = 'image-lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="lightbox-content">
                <img src="${image.src}" alt="${image.alt}" loading="lazy">
                <button class="lightbox-close" onclick="this.closest('.image-lightbox').remove()" aria-label="Close lightbox">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(lightbox);
        
        // Fade in
        setTimeout(() => {
            lightbox.classList.add('show');
        }, 10);
        
        // Keyboard support
        lightbox.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                lightbox.remove();
            }
        });
        
        // Focus the close button
        lightbox.querySelector('.lightbox-close').focus();
    }
    
    handleArrowKeyNavigation(e) {
        const currentItem = document.activeElement;
        const items = Array.from(this.portfolioItems).filter(item => 
            item.style.display !== 'none'
        );
        const currentIndex = items.indexOf(currentItem);
        let newIndex;
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                items[newIndex].focus();
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                items[newIndex].focus();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                const itemsPerRow = this.getItemsPerRow();
                newIndex = currentIndex - itemsPerRow;
                if (newIndex >= 0) {
                    items[newIndex].focus();
                }
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                const itemsPerRowDown = this.getItemsPerRow();
                newIndex = currentIndex + itemsPerRowDown;
                if (newIndex < items.length) {
                    items[newIndex].focus();
                }
                break;
        }
    }
    
    getItemsPerRow() {
        // Calculate items per row based on current grid layout
        const containerWidth = this.portfolioGrid.offsetWidth;
        const itemWidth = this.portfolioItems[0]?.offsetWidth || 300;
        return Math.floor(containerWidth / itemWidth);
    }
}

// =============================================================================
// CONTACT FORM FUNCTIONALITY
// =============================================================================

class ContactFormManager {
    constructor() {
        this.contactForm = document.getElementById('contactForm');
        this.newsletterForm = document.getElementById('newsletterForm');
        this.formData = new Map();
        this.validators = new Map();
        this.isSubmitting = false;
        
        // Form validation rules
        this.validationRules = {
            name: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s\-']{2,50}$/,
                message: 'Please enter a valid name (2-50 characters, letters only)'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                required: false,
                pattern: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Please enter a valid phone number'
            },
            subject: {
                required: true,
                minLength: 5,
                maxLength: 100,
                message: 'Subject must be between 5-100 characters'
            },
            message: {
                required: true,
                minLength: 10,
                maxLength: 1000,
                message: 'Message must be between 10-1000 characters'
            },
            budget: {
                required: false
            },
            timeline: {
                required: false
            },
            projectType: {
                required: true,
                message: 'Please select a project type'
            }
        };
        
        this.init();
    }
    
    init() {
        if (this.contactForm) {
            this.setupContactForm();
        }
        
        if (this.newsletterForm) {
            this.setupNewsletterForm();
        }
        
        this.setupFormValidation();
        this.setupRealTimeValidation();
        this.setupFormPersistence();
    }
    
    setupContactForm() {
        this.contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleContactFormSubmit();
        });
        
        // Reset form button
        const resetBtn = this.contactForm.querySelector('[type="button"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetContactForm();
            });
        }
        
        // File upload handling
        const fileInput = this.contactForm.querySelector('input[type="file"]');
        if (fileInput) {
            this.setupFileUpload(fileInput);
        }
        
        // Character counter for textarea
        const messageField = this.contactForm.querySelector('[name="message"]');
        if (messageField) {
            this.setupCharacterCounter(messageField);
        }
        
        // Auto-resize textarea
        const textareas = this.contactForm.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            this.setupAutoResize(textarea);
        });
    }
    
    setupNewsletterForm() {
        this.newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleNewsletterSubmit();
        });
    }
    
    setupFormValidation() {
        Object.keys(this.validationRules).forEach(fieldName => {
            this.validators.set(fieldName, (value, rules) => {
                return this.validateField(value, rules);
            });
        });
    }
    
    setupRealTimeValidation() {
        if (!this.contactForm) return;
        
        const formFields = this.contactForm.querySelectorAll('input, textarea, select');
        
        formFields.forEach(field => {
            // Validate on blur
            field.addEventListener('blur', () => {
                this.validateSingleField(field);
            });
            
            // Clear errors on input
            field.addEventListener('input', () => {
                this.clearFieldError(field);
                
                // Save to local storage for persistence
                this.saveFieldData(field);
            });
            
            // Validate on change for select fields
            if (field.tagName === 'SELECT') {
                field.addEventListener('change', () => {
                    this.validateSingleField(field);
                });
            }
        });
    }
    
    setupFormPersistence() {
        // Load saved form data
        this.loadFormData();
        
        // Auto-save form data
        setInterval(() => {
            this.saveFormData();
        }, 30000); // Save every 30 seconds
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveFormData();
        });
    }
    
    setupFileUpload(fileInput) {
        const dropZone = fileInput.closest('.file-upload-area');
        if (!dropZone) return;
        
        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            });
        });
        
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelection(files, fileInput);
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files, fileInput);
        });
    }
    
    setupCharacterCounter(textarea) {
        const maxLength = textarea.getAttribute('maxlength') || 1000;
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        textarea.parentNode.appendChild(counter);
        
        const updateCounter = () => {
            const remaining = maxLength - textarea.value.length;
            counter.textContent = `${remaining} characters remaining`;
            counter.classList.toggle('warning', remaining < 50);
            counter.classList.toggle('danger', remaining < 10);
        };
        
        textarea.addEventListener('input', updateCounter);
        updateCounter(); // Initial count
    }
    
    setupAutoResize(textarea) {
        const adjustHeight = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };
        
        textarea.addEventListener('input', adjustHeight);
        textarea.addEventListener('focus', adjustHeight);
        
        // Initial adjustment
        setTimeout(adjustHeight, 100);
    }
    
    validateField(value, rules) {
        const errors = [];
        
        // Required validation
        if (rules.required && (!value || value.trim() === '')) {
            errors.push('This field is required');
        }
        
        // Skip other validations if field is empty and not required
        if (!value && !rules.required) {
            return { isValid: true, errors: [] };
        }
        
        // Length validations
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Must be at least ${rules.minLength} characters`);
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Must be no more than ${rules.maxLength} characters`);
        }
        
        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(rules.message || 'Invalid format');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    validateSingleField(field) {
        const fieldName = field.name;
        const value = field.value;
        const rules = this.validationRules[fieldName];
        
        if (!rules) return true;
        
        const validation = this.validateField(value, rules);
        
        if (validation.isValid) {
            this.showFieldSuccess(field);
            return true;
        } else {
            this.showFieldError(field, validation.errors[0]);
            return false;
        }
    }
    
    validateForm() {
        let isFormValid = true;
        const formFields = this.contactForm.querySelectorAll('[name]');
        
        formFields.forEach(field => {
            const fieldValid = this.validateSingleField(field);
            if (!fieldValid) {
                isFormValid = false;
            }
        });
        
        return isFormValid;
    }
    
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        
        const fieldGroup = field.closest('.form-group') || field.parentNode;
        fieldGroup.appendChild(errorElement);
        
        // Announce error to screen readers
        PegeArts.accessibility.announce(`Error: ${message}`);
    }
    
    showFieldSuccess(field) {
        this.clearFieldError(field);
        field.classList.add('success');
        field.classList.remove('error');
    }
    
    clearFieldError(field) {
        field.classList.remove('error', 'success');
        
        const fieldGroup = field.closest('.form-group') || field.parentNode;
        const existingError = fieldGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
    
    async handleContactFormSubmit() {
        if (this.isSubmitting) return;
        
        // Validate form
        if (!this.validateForm()) {
            PegeArts.notifications.show(
                'Please correct the errors in the form before submitting.',
                'error',
                5000
            );
            
            // Focus first error field
            const firstError = this.contactForm.querySelector('.error');
            if (firstError) {
                firstError.focus();
            }
            return;
        }
        
        this.isSubmitting = true;
        this.showSubmitLoading();
        
        try {
            // Collect form data
            const formData = new FormData(this.contactForm);
            const data = Object.fromEntries(formData.entries());
            
            // Add metadata
            data.timestamp = new Date().toISOString();
            data.userAgent = navigator.userAgent;
            data.referrer = document.referrer;
            
            // Submit form (replace with your actual endpoint)
            const response = await this.submitContactForm(data);
            
            if (response.success) {
                this.showFormSuccess();
                this.clearFormData(); // Clear saved data
                
                // Track successful submission
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'contact_form_submit', {
                        event_category: 'Contact',
                        event_label: data.projectType,
                        value: 1
                    });
                }
            } else {
                throw new Error(response.message || 'Submission failed');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showSubmitError(error.message);
        } finally {
            this.isSubmitting = false;
            this.hideSubmitLoading();
        }
    }
    
    async submitContactForm(data) {
        // Simulate API call (replace with actual endpoint)
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate success/failure
                const success = Math.random() > 0.1; // 90% success rate
                resolve({
                    success,
                    message: success ? 'Message sent successfully!' : 'Server error occurred'
                });
            }, 2000);
        });
    }
    
    async handleNewsletterSubmit() {
        const emailField = this.newsletterForm.querySelector('[name="email"], [type="email"]');
        const email = emailField.value.trim();
        
        if (!PegeArts.utils.validateEmail(email)) {
            this.showFieldError(emailField, 'Please enter a valid email address');
            return;
        }
        
        try {
            // Submit newsletter subscription
            const response = await this.submitNewsletter({ email });
            
            if (response.success) {
                PegeArts.notifications.show(
                    'Successfully subscribed to newsletter!',
                    'success',
                    4000
                );
                this.newsletterForm.reset();
                
                // Track subscription
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'newsletter_subscribe', {
                        event_category: 'Newsletter',
                        value: 1
                    });
                }
            } else {
                throw new Error(response.message || 'Subscription failed');
            }
            
        } catch (error) {
            PegeArts.notifications.show(
                'Failed to subscribe. Please try again.',
                'error',
                4000
            );
        }
    }
    
    async submitNewsletter(data) {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 1000);
        });
    }
    
    showSubmitLoading() {
        const submitBtn = this.contactForm.querySelector('[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'flex';
    }
    
    hideSubmitLoading() {
        const submitBtn = this.contactForm.querySelector('[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        
        if (btnText) btnText.style.display = 'flex';
        if (btnLoading) btnLoading.style.display = 'none';
    }
    
    showFormSuccess() {
        const form = this.contactForm;
        const successMessage = document.getElementById('formSuccessMessage');
        
        if (form && successMessage) {
            form.style.display = 'none';
            successMessage.style.display = 'block';
            
            // Animate success message
            setTimeout(() => {
                successMessage.classList.add('show');
            }, 100);
            
            // Focus the success message for accessibility
            successMessage.focus();
        }
        
        PegeArts.notifications.show(
            'Message sent successfully! I\'ll get back to you soon.',
            'success',
            5000
        );
    }
    
    showSubmitError(message) {
        PegeArts.notifications.show(
            `Failed to send message: ${message}. Please try again.`,
            'error',
            6000,
            [{
                text: 'Retry',
                action: 'retry',
                handler: 'PegeArts.contact.handleContactFormSubmit()'
            }]
        );
    }
    
    resetContactForm() {
        if (!this.contactForm) return;
        
        // Clear form fields
        this.contactForm.reset();
        
        // Clear validation states
        const formFields = this.contactForm.querySelectorAll('input, textarea, select');
        formFields.forEach(field => {
            this.clearFieldError(field);
        });
        
        // Clear saved data
        this.clearFormData();
        
        // Update character counters
        const textareas = this.contactForm.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            const event = new Event('input');
            textarea.dispatchEvent(event);
        });
        
        PegeArts.notifications.show(
            'Form has been reset',
            'info',
            2000
        );
    }
    
    handleFileSelection(files, fileInput) {
        if (!files.length) return;
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        const validFiles = [];
        
        Array.from(files).forEach(file => {
            if (!allowedTypes.includes(file.type)) {
                PegeArts.notifications.show(
                    `${file.name}: File type not supported`,
                    'warning',
                    4000
                );
                return;
            }
            
            if (file.size > maxSize) {
                PegeArts.notifications.show(
                    `${file.name}: File too large (max 5MB)`,
                    'warning',
                    4000
                );
                return;
            }
            
            validFiles.push(file);
        });
        
        if (validFiles.length > 0) {
            this.displaySelectedFiles(validFiles, fileInput);
        }
    }
    
    displaySelectedFiles(files, fileInput) {
        const container = fileInput.closest('.file-upload-area');
        let fileList = container.querySelector('.selected-files');
        
        if (!fileList) {
            fileList = document.createElement('div');
            fileList.className = 'selected-files';
            container.appendChild(fileList);
        }
        
        fileList.innerHTML = files.map(file => `
            <div class="selected-file">
                <i class="fas ${this.getFileIcon(file.type)}"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
                <button type="button" 
                        class="remove-file" 
                        onclick="this.parentElement.remove()"
                        aria-label="Remove ${file.name}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fa-image';
        if (mimeType === 'application/pdf') return 'fa-file-pdf';
        if (mimeType.startsWith('text/')) return 'fa-file-alt';
        return 'fa-file';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    saveFormData() {
        if (!this.contactForm) return;
        
        const formData = new FormData(this.contactForm);
        const data = Object.fromEntries(formData.entries());
        
        localStorage.setItem('pegearts_contact_form', JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    }
    
    saveFieldData(field) {
        const key = `pegearts_field_${field.name}`;
        localStorage.setItem(key, JSON.stringify({
            value: field.value,
            timestamp: Date.now()
        }));
    }
    
    loadFormData() {
        if (!this.contactForm) return;
        
        try {
            const saved = localStorage.getItem('pegearts_contact_form');
            if (!saved) return;
            
            const { data, timestamp } = JSON.parse(saved);
            
            // Don't load data older than 1 day
            if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
                this.clearFormData();
                return;
            }
            
            // Restore form values
            Object.entries(data).forEach(([name, value]) => {
                const field = this.contactForm.querySelector(`[name="${name}"]`);
                if (field && field.type !== 'file') {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = value === 'on';
                    } else {
                        field.value = value;
                    }
                }
            });
            
            // Show restore notification
            PegeArts.notifications.show(
                'Previous form data has been restored',
                'info',
                3000
            );
            
        } catch (error) {
            console.error('Error loading form data:', error);
            this.clearFormData();
        }
    }
    
    clearFormData() {
        localStorage.removeItem('pegearts_contact_form');
        
        // Clear individual field data
        Object.keys(this.validationRules).forEach(fieldName => {
            localStorage.removeItem(`pegearts_field_${fieldName}`);
        });
    }
    
    openContactModal(projectTitle = '') {
        const modal = document.createElement('div');
        modal.className = 'contact-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Get In Touch</h3>
                    <button class="modal-close" onclick="this.closest('.contact-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Interested in working together? Let's discuss your project!</p>
                    ${projectTitle ? `<p class="project-ref">Reference: <strong>${projectTitle}</strong></p>` : ''}
                    <div class="contact-options">
                                                <a href="mailto:thanattsitt.info@yahoo.com" class="contact-option">
                            <i class="fas fa-envelope"></i>
                            <span>Email Me</span>
                        </a>
                        <a href="#contact" class="contact-option" onclick="PegeArts.navigation.scrollToSection('contact'); this.closest('.contact-modal').remove();">
                            <i class="fas fa-form"></i>
                            <span>Contact Form</span>
                        </a>
                        <a href="https://linkedin.com/in/thanattsitt" class="contact-option" target="_blank" rel="noopener">
                            <i class="fab fa-linkedin"></i>
                            <span>LinkedIn</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Focus management
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.focus();
        
        // Keyboard support
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
        
        // Track modal opening
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_modal_open', {
                event_category: 'Contact',
                event_label: projectTitle || 'General Inquiry',
                value: 1
            });
        }
    }
}

// =============================================================================
// ADVANCED ANIMATIONS FUNCTIONALITY
// =============================================================================

class AdvancedAnimationsManager {
    constructor() {
        this.scrollTriggers = new Map();
        this.parallaxElements = new Map();
        this.morphingElements = new Map();
        this.particleSystems = new Map();
        this.animatedCounters = new Map();
        this.textAnimations = new Map();
        this.mouseFollower = null;
        this.cursorTrail = [];
        this.lastMousePosition = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        if (!PegeArts.state.reducedMotion) {
            this.initScrollAnimations();
            this.initParallaxEffects();
            this.initMorphingElements();
            this.initTextAnimations();
            this.initMouseEffects();
            this.initParticleEffects();
            this.initAdvancedCounters();
            this.initPageTransitions();
        }
        
        this.initIntersectionObservers();
    }
    
    initScrollAnimations() {
        // Enhanced scroll-triggered animations
        const animatedElements = document.querySelectorAll('[data-animate]');
        
        animatedElements.forEach(element => {
            const animationType = element.getAttribute('data-animate');
            const delay = parseInt(element.getAttribute('data-delay')) || 0;
            const duration = parseInt(element.getAttribute('data-duration')) || 800;
            const offset = element.getAttribute('data-offset') || '10%';
            
            const scrollTrigger = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            this.playScrollAnimation(element, animationType, duration);
                        }, delay);
                        scrollTrigger.unobserve(element);
                    }
                });
            }, {
                rootMargin: `0px 0px -${offset} 0px`,
                threshold: 0.1
            });
            
            scrollTrigger.observe(element);
            this.scrollTriggers.set(element, scrollTrigger);
        });
    }
    
    playScrollAnimation(element, type, duration) {
        element.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        
        switch (type) {
            case 'fade-in':
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 50);
                break;
                
            case 'slide-left':
                element.style.transform = 'translateX(-50px)';
                element.style.opacity = '0';
                setTimeout(() => {
                    element.style.transform = 'translateX(0)';
                    element.style.opacity = '1';
                }, 50);
                break;
                
            case 'slide-right':
                element.style.transform = 'translateX(50px)';
                element.style.opacity = '0';
                setTimeout(() => {
                    element.style.transform = 'translateX(0)';
                    element.style.opacity = '1';
                }, 50);
                break;
                
            case 'scale-in':
                element.style.transform = 'scale(0.8)';
                element.style.opacity = '0';
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                    element.style.opacity = '1';
                }, 50);
                break;
                
            case 'rotate-in':
                element.style.transform = 'rotate(-15deg) scale(0.8)';
                element.style.opacity = '0';
                setTimeout(() => {
                    element.style.transform = 'rotate(0deg) scale(1)';
                    element.style.opacity = '1';
                }, 50);
                break;
                
            case 'flip-in':
                element.style.transform = 'rotateY(90deg)';
                element.style.opacity = '0';
                setTimeout(() => {
                    element.style.transform = 'rotateY(0deg)';
                    element.style.opacity = '1';
                }, 50);
                break;
                
            case 'bounce-in':
                element.style.transform = 'scale(0.3)';
                element.style.opacity = '0';
                setTimeout(() => {
                    element.style.animation = `bounceIn ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards`;
                    element.style.opacity = '1';
                }, 50);
                break;
        }
        
        element.classList.add('animated');
    }
    
    initParallaxEffects() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.getAttribute('data-parallax')) || 0.5;
            const direction = element.getAttribute('data-parallax-direction') || 'vertical';
            
            this.parallaxElements.set(element, { speed, direction });
        });
        
        // Parallax scroll handler
        window.addEventListener('scroll', PegeArts.utils.throttle(() => {
            this.updateParallaxElements();
        }, 16));
    }
    
    updateParallaxElements() {
        const scrollTop = window.pageYOffset;
        
        this.parallaxElements.forEach(({ speed, direction }, element) => {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top + scrollTop;
            const elementHeight = rect.height;
            const windowHeight = window.innerHeight;
            
            // Only animate if element is in viewport
            if (rect.top < windowHeight && rect.bottom > 0) {
                const parallaxValue = (scrollTop - elementTop) * speed;
                
                if (direction === 'vertical') {
                    element.style.transform = `translate3d(0, ${parallaxValue}px, 0)`;
                } else if (direction === 'horizontal') {
                    element.style.transform = `translate3d(${parallaxValue}px, 0, 0)`;
                } else if (direction === 'both') {
                    element.style.transform = `translate3d(${parallaxValue * 0.5}px, ${parallaxValue}px, 0)`;
                }
            }
        });
    }
    
    initMorphingElements() {
        const morphElements = document.querySelectorAll('[data-morph]');
        
        morphElements.forEach(element => {
            const morphData = JSON.parse(element.getAttribute('data-morph'));
            const trigger = morphData.trigger || 'hover';
            const duration = morphData.duration || 300;
            
            this.morphingElements.set(element, morphData);
            
            if (trigger === 'hover') {
                element.addEventListener('mouseenter', () => {
                    this.applyMorph(element, morphData, true);
                });
                
                element.addEventListener('mouseleave', () => {
                    this.applyMorph(element, morphData, false);
                });
            } else if (trigger === 'scroll') {
                this.setupScrollMorph(element, morphData);
            }
        });
    }
    
    applyMorph(element, morphData, isActive) {
        const { 
            scale = 1, 
            rotate = 0, 
            translateX = 0, 
            translateY = 0, 
            opacity = 1,
            borderRadius = '',
            backgroundColor = '',
            duration = 300
        } = morphData;
        
        element.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        
        if (isActive) {
            element.style.transform = `scale(${scale}) rotate(${rotate}deg) translate(${translateX}px, ${translateY}px)`;
            element.style.opacity = opacity;
            if (borderRadius) element.style.borderRadius = borderRadius;
            if (backgroundColor) element.style.backgroundColor = backgroundColor;
        } else {
            element.style.transform = 'scale(1) rotate(0deg) translate(0px, 0px)';
            element.style.opacity = '1';
            element.style.borderRadius = '';
            element.style.backgroundColor = '';
        }
    }
    
    initTextAnimations() {
        const textElements = document.querySelectorAll('[data-text-animate]');
        
        textElements.forEach(element => {
            const animationType = element.getAttribute('data-text-animate');
            const delay = parseInt(element.getAttribute('data-text-delay')) || 0;
            const staggerDelay = parseInt(element.getAttribute('data-stagger')) || 50;
            
            this.textAnimations.set(element, { animationType, delay, staggerDelay });
            
            // Setup intersection observer for text animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            this.playTextAnimation(element, animationType, staggerDelay);
                        }, delay);
                        observer.unobserve(element);
                    }
                });
            }, { threshold: 0.1 });
            
            observer.observe(element);
        });
    }
    
    playTextAnimation(element, type, staggerDelay) {
        const text = element.textContent;
        
        switch (type) {
            case 'word-reveal':
                this.animateWordReveal(element, text, staggerDelay);
                break;
            case 'letter-cascade':
                this.animateLetterCascade(element, text, staggerDelay);
                break;
            case 'typewriter':
                this.animateTypewriter(element, text, staggerDelay);
                break;
            case 'scramble':
                this.animateTextScramble(element, text);
                break;
        }
    }
    
    animateWordReveal(element, text, staggerDelay) {
        const words = text.split(' ');
        element.innerHTML = words.map(word => 
            `<span class="word-reveal" style="opacity: 0; transform: translateY(20px);">${word}</span>`
        ).join(' ');
        
        const wordElements = element.querySelectorAll('.word-reveal');
        wordElements.forEach((word, index) => {
            setTimeout(() => {
                word.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                word.style.opacity = '1';
                word.style.transform = 'translateY(0)';
            }, index * staggerDelay);
        });
    }
    
    animateLetterCascade(element, text, staggerDelay) {
        const letters = text.split('');
        element.innerHTML = letters.map(letter => 
            letter === ' ' ? ' ' : `<span class="letter-cascade" style="opacity: 0; transform: translateY(30px);">${letter}</span>`
        ).join('');
        
        const letterElements = element.querySelectorAll('.letter-cascade');
        letterElements.forEach((letter, index) => {
            setTimeout(() => {
                letter.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                letter.style.opacity = '1';
                letter.style.transform = 'translateY(0)';
            }, index * staggerDelay);
        });
    }
    
    animateTypewriter(element, text, speed) {
        element.textContent = '';
        let index = 0;
        
        const cursor = document.createElement('span');
        cursor.className = 'typewriter-cursor';
        cursor.textContent = '|';
        element.appendChild(cursor);
        
        const typeInterval = setInterval(() => {
            if (index < text.length) {
                element.textContent = text.substring(0, index + 1);
                element.appendChild(cursor);
                index++;
            } else {
                clearInterval(typeInterval);
                setTimeout(() => {
                    cursor.style.animation = 'blink 1s infinite';
                }, 500);
            }
        }, speed);
    }
    
    animateTextScramble(element, finalText) {
        const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let iteration = 0;
        const originalText = element.textContent;
        
        const scrambleInterval = setInterval(() => {
            element.textContent = finalText
                .split('')
                .map((char, index) => {
                    if (index < iteration) {
                        return finalText[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');
            
            if (iteration >= finalText.length) {
                clearInterval(scrambleInterval);
            }
            
            iteration += 1 / 3;
        }, 30);
    }
    
    initMouseEffects() {
        // Create custom cursor
        this.createCustomCursor();
        
        // Mouse follower elements
        const followerElements = document.querySelectorAll('[data-mouse-follow]');
        followerElements.forEach(element => {
            this.initMouseFollower(element);
        });
        
        // Magnetic elements
        const magneticElements = document.querySelectorAll('[data-magnetic]');
        magneticElements.forEach(element => {
            this.initMagneticElement(element);
        });
        
        // Cursor trail
        this.initCursorTrail();
    }
    
    createCustomCursor() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.innerHTML = `
            <div class="cursor-dot"></div>
            <div class="cursor-ring"></div>
        `;
        document.body.appendChild(cursor);
        
        this.customCursor = cursor;
        
        // Mouse move handler
        document.addEventListener('mousemove', (e) => {
            this.updateCustomCursor(e.clientX, e.clientY);
        });
        
        // Hover effects for interactive elements
        document.querySelectorAll('a, button, [data-cursor-hover]').forEach(element => {
            element.addEventListener('mouseenter', () => {
                this.customCursor.classList.add('cursor-hover');
            });
            
            element.addEventListener('mouseleave', () => {
                this.customCursor.classList.remove('cursor-hover');
            });
        });
    }
    
    updateCustomCursor(x, y) {
        if (!this.customCursor) return;
        
        this.customCursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        this.lastMousePosition = { x, y };
    }
    
    initMouseFollower(element) {
        const speed = parseFloat(element.getAttribute('data-follow-speed')) || 0.1;
        const offset = JSON.parse(element.getAttribute('data-follow-offset') || '{"x": 0, "y": 0}');
        
        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;
        
        document.addEventListener('mousemove', (e) => {
            targetX = e.clientX + offset.x;
            targetY = e.clientY + offset.y;
        });
        
        const updatePosition = () => {
            currentX += (targetX - currentX) * speed;
            currentY += (targetY - currentY) * speed;
            
            element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            
            requestAnimationFrame(updatePosition);
        };
        
        updatePosition();
    }
    
    initMagneticElement(element) {
        const strength = parseFloat(element.getAttribute('data-magnetic')) || 30;
        
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = (e.clientX - centerX) / rect.width;
            const deltaY = (e.clientY - centerY) / rect.height;
            
            const moveX = deltaX * strength;
            const moveY = deltaY * strength;
            
            element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translate3d(0px, 0px, 0)';
        });
    }
    
    initCursorTrail() {
        document.addEventListener('mousemove', PegeArts.utils.throttle((e) => {
            this.addTrailPoint(e.clientX, e.clientY);
        }, 16));
    }
    
    addTrailPoint(x, y) {
        const trailPoint = document.createElement('div');
        trailPoint.className = 'cursor-trail-point';
        trailPoint.style.left = x + 'px';
        trailPoint.style.top = y + 'px';
        
        document.body.appendChild(trailPoint);
        
        // Animate and remove trail point
        setTimeout(() => {
            trailPoint.classList.add('fade-out');
            setTimeout(() => {
                if (trailPoint.parentNode) {
                    trailPoint.parentNode.removeChild(trailPoint);
                }
            }, 300);
        }, 100);
    }
    
    initParticleEffects() {
        const particleContainers = document.querySelectorAll('[data-particles]');
        
        particleContainers.forEach(container => {
            const config = JSON.parse(container.getAttribute('data-particles'));
            this.createParticleSystem(container, config);
        });
    }
    
    createParticleSystem(container, config) {
        const {
            count = 50,
            speed = 1,
            size = { min: 2, max: 4 },
            color = '#8B5CF6',
            opacity = { min: 0.3, max: 0.8 },
            direction = 'up'
        } = config;
        
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const particle = this.createParticle(container, { speed, size, color, opacity, direction });
            particles.push(particle);
        }
        
        this.particleSystems.set(container, particles);
        this.animateParticles(particles);
    }
    
    createParticle(container, config) {
        const particle = document.createElement('div');
        particle.className = 'animated-particle';
        
        const particleSize = PegeArts.utils.random(config.size.min, config.size.max);
        const particleOpacity = PegeArts.utils.random(config.opacity.min, config.opacity.max);
        
        particle.style.cssText = `
            position: absolute;
            width: ${particleSize}px;
            height: ${particleSize}px;
            background: ${config.color};
            border-radius: 50%;
            opacity: ${particleOpacity};
            pointer-events: none;
        `;
        
        // Random starting position
        const containerRect = container.getBoundingClientRect();
        particle.x = PegeArts.utils.random(0, containerRect.width);
        particle.y = containerRect.height + 10;
        particle.speedX = PegeArts.utils.random(-config.speed, config.speed);
        particle.speedY = -PegeArts.utils.random(config.speed * 0.5, config.speed * 2);
        particle.life = 1;
        particle.decay = PegeArts.utils.random(0.005, 0.02);
        
        particle.style.left = particle.x + 'px';
        particle.style.top = particle.y + 'px';
        
        container.appendChild(particle);
        return particle;
    }
    
    animateParticles(particles) {
        const animate = () => {
            particles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                particle.life -= particle.decay;
                
                particle.style.left = particle.x + 'px';
                particle.style.top = particle.y + 'px';
                particle.style.opacity = particle.life;
                
                // Reset particle if it's dead or out of bounds
                if (particle.life <= 0 || particle.y < -10) {
                    const container = particle.parentNode;
                    const containerRect = container.getBoundingClientRect();
                    
                    particle.x = PegeArts.utils.random(0, containerRect.width);
                    particle.y = containerRect.height + 10;
                    particle.life = 1;
                }
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    initAdvancedCounters() {
        const counterElements = document.querySelectorAll('[data-counter-advanced]');
        
        counterElements.forEach(element => {
            const config = JSON.parse(element.getAttribute('data-counter-advanced'));
            this.setup    initAdvancedCounters() {
        const counterElements = document.querySelectorAll('[data-counter-advanced]');
        
        counterElements.forEach(element => {
            const config = JSON.parse(element.getAttribute('data-counter-advanced'));
            this.setupAdvancedCounter(element, config);
        });
    }
    
    setupAdvancedCounter(element, config) {
        const {
            start = 0,
            end = 100,
            duration = 2000,
            easing = 'easeOutCubic',
            suffix = '',
            prefix = '',
            separator = '',
            decimal = 0,
            trigger = 'scroll'
        } = config;
        
        const counter = {
            element,
            start,
            end,
            current: start,
            duration,
            suffix,
            prefix,
            separator,
            decimal,
            isAnimating: false
        };
        
        if (trigger === 'scroll') {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !counter.isAnimating) {
                        this.animateAdvancedCounter(counter, easing);
                        observer.unobserve(element);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(element);
        }
        
        this.animatedCounters.set(element, counter);
    }
    
    animateAdvancedCounter(counter, easing) {
        counter.isAnimating = true;
        const startTime = Date.now();
        const { start, end, duration, element, suffix, prefix, separator, decimal } = counter;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Apply easing
            const easedProgress = this.applyEasing(progress, easing);
            const currentValue = start + (end - start) * easedProgress;
            
            // Format number
            const formattedValue = this.formatCounterValue(currentValue, separator, decimal);
            element.textContent = `${prefix}${formattedValue}${suffix}`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                counter.isAnimating = false;
                counter.current = end;
            }
        };
        
        animate();
    }
    
    formatCounterValue(value, separator, decimal) {
        let formatted = parseFloat(value).toFixed(decimal);
        
        if (separator === ',') {
            formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        
        return formatted;
    }
    
    applyEasing(t, easingType) {
        const easingFunctions = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeOutBounce: t => {
                if (t < 1 / 2.75) return 7.5625 * t * t;
                if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            }
        };
        
        return easingFunctions[easingType] ? easingFunctions[easingType](t) : t;
    }
    
    initPageTransitions() {
        // Smooth page transitions for SPA-like experience
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link && link.hash) {
                e.preventDefault();
                this.smoothPageTransition(link.hash);
            }
        });
    }
    
    smoothPageTransition(targetHash) {
        const targetElement = document.querySelector(targetHash);
        if (!targetElement) return;
        
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'page-transition-overlay';
        document.body.appendChild(overlay);
        
        // Fade in overlay
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
        
        // Scroll to target after fade
        setTimeout(() => {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Fade out overlay
            setTimeout(() => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 300);
            }, 500);
        }, 300);
    }
    
    initIntersectionObservers() {
        // Performance-optimized observers for various elements
        this.setupLazyLoading();
        this.setupAnimationTriggers();
        this.setupVisibilityTracking();
    }
    
    setupLazyLoading() {
        const lazyImages = document.querySelectorAll('img[data-src], [data-bg]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyContent(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            lazyImages.forEach(img => this.loadLazyContent(img));
        }
    }
    
    loadLazyContent(element) {
        if (element.dataset.src) {
            // Lazy load image
            const img = new Image();
            img.onload = () => {
                element.src = element.dataset.src;
                element.classList.add('loaded');
                element.removeAttribute('data-src');
            };
            img.onerror = () => {
                element.classList.add('error');
            };
            img.src = element.dataset.src;
        }
        
        if (element.dataset.bg) {
            // Lazy load background image
            const img = new Image();
            img.onload = () => {
                element.style.backgroundImage = `url(${element.dataset.bg})`;
                element.classList.add('bg-loaded');
                element.removeAttribute('data-bg');
            };
            img.src = element.dataset.bg;
        }
    }
    
    setupAnimationTriggers() {
        const animationElements = document.querySelectorAll('[data-aos], .animate-on-scroll');
        
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate', 'in-view');
                } else {
                    // Remove animation class if element goes out of view (for repeatable animations)
                    const repeat = entry.target.getAttribute('data-aos-repeat');
                    if (repeat === 'true') {
                        entry.target.classList.remove('aos-animate', 'in-view');
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -10% 0px'
        });
        
        animationElements.forEach(el => animationObserver.observe(el));
    }
    
    setupVisibilityTracking() {
        // Track which sections are visible for analytics
        const sections = document.querySelectorAll('section[id]');
        
        const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    PegeArts.state.currentSection = sectionId;
                    
                    // Update URL hash without jumping
                    if (history.pushState) {
                        history.pushState(null, null, `#${sectionId}`);
                    }
                    
                    // Track section visibility
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'section_view', {
                            event_category: 'Navigation',
                            event_label: sectionId,
                            non_interaction: true
                        });
                    }
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '-20% 0px'
        });
        
        sections.forEach(section => visibilityObserver.observe(section));
    }
    
    // Public methods for external control
    triggerAnimation(element, animationType, options = {}) {
        if (PegeArts.state.reducedMotion) return;
        
        const duration = options.duration || 600;
        const delay = options.delay || 0;
        
        setTimeout(() => {
            this.playScrollAnimation(element, animationType, duration);
        }, delay);
    }
    
    pauseAllAnimations() {
        // Pause all running animations
        document.querySelectorAll('.animated, .aos-animate').forEach(element => {
            element.style.animationPlayState = 'paused';
        });
        
        // Stop particle systems
        this.particleSystems.forEach(particles => {
            particles.forEach(particle => {
                particle.style.animationPlayState = 'paused';
            });
        });
    }
    
    resumeAllAnimations() {
        // Resume all paused animations
        document.querySelectorAll('.animated, .aos-animate').forEach(element => {
            element.style.animationPlayState = 'running';
        });
        
        // Resume particle systems
        this.particleSystems.forEach(particles => {
            particles.forEach(particle => {
                particle.style.animationPlayState = 'running';
            });
        });
    }
    
    cleanup() {
        // Clean up observers and event listeners
        this.scrollTriggers.forEach(trigger => trigger.disconnect());
        this.particleSystems.forEach(particles => {
            particles.forEach(particle => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
        });
        
        this.scrollTriggers.clear();
        this.parallaxElements.clear();
        this.morphingElements.clear();
        this.particleSystems.clear();
        this.animatedCounters.clear();
        this.textAnimations.clear();
    }
}

// =============================================================================
// COMPLETE INITIALIZATION AND COMPONENT INTEGRATION
// =============================================================================

// Star Field Manager (Enhanced version from earlier)
class StarFieldManager {
    constructor() {
        this.canvas = document.getElementById('starfield');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.stars = [];
        this.animationFrame = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isAnimating = true;
        
        if (this.ctx) {
            this.init();
        }
    }
    
    init() {
        this.resizeCanvas();
        this.createStars();
        this.bindEvents();
        this.animate();
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    createStars() {
        const numStars = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        this.stars = [];
        
        for (let i = 0; i < numStars; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 1.5,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.8 + 0.2
            });
        }
    }
    
    bindEvents() {
        window.addEventListener('resize', PegeArts.utils.throttle(() => {
            this.resizeCanvas();
            this.createStars();
        }, 250));
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.stars.forEach(star => {
            // Mouse interaction
            const dx = this.mouseX - star.x;
            const dy = this.mouseY - star.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                star.x -= dx * force * 0.01;
                star.y -= dy * force * 0.01;
            }
            
            // Update position
            star.x += star.vx;
            star.y += star.vy;
            
            // Wrap around edges
            if (star.x < 0) star.x = this.canvas.width;
            if (star.x > this.canvas.width) star.x = 0;
            if (star.y < 0) star.y = this.canvas.height;
            if (star.y > this.canvas.height) star.y = 0;
            
            // Draw star
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            this.ctx.fill();
        });
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    stop() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
    
    start() {
        this.isAnimating = true;
        this.animate();
    }
}

// Complete Notification System
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        
        this.init();
    }
    
    init() {
        this.createContainer();
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = this.defaultDuration, actions = []) {
        const id = 'notification_' + Date.now() + Math.random().toString(36).substr(2, 9);
        
        const notification = this.createNotification(id, message, type, duration, actions);
        this.container.appendChild(notification);
        this.notifications.set(id, notification);
        
        // Enforce max notifications
        if (this.notifications.size > this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.hide(oldestId);
        }
        
        // Show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-hide if duration is specified
        if (duration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }
        
        // Announce to screen readers
        if (PegeArts.accessibility) {
            PegeArts.accessibility.announce(message, type === 'error' ? 'assertive' : 'polite');
        }
        
        return id;
    }
    
    createNotification(id, message, type, duration, actions) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', type === 'error' ? 'alert' : 'status');
        notification.setAttribute('data-id', id);
        
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const progressBar = duration > 0 ? `
            <div class="notification-progress">
                <div class="notification-progress-bar" style="animation-duration: ${duration}ms"></div>
            </div>
        ` : '';
        
        const actionButtons = actions.length > 0 ? `
            <div class="notification-actions">
                ${actions.map(action => `
                    <button class="notification-action" 
                            onclick="${action.handler}" 
                            data-action="${action.action}">
                        ${action.text}
                    </button>
                `).join('')}
            </div>
        ` : '';
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas ${iconMap[type]}"></i>
                </div>
                <div class="notification-message">
                    ${message}
                </div>
                <button class="notification-close" 
                        onclick="PegeArts.notifications.hide('${id}')"
                        aria-label="Close notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${actionButtons}
            ${progressBar}
        `;
        
        return notification;
    }
    
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        notification.classList.add('hide');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 300);
    }
    
    hideAll() {
        this.notifications.forEach((notification, id) => {
            this.hide(id);
        });
    }
    
    update(id, message, type) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        const messageEl = notification.querySelector('.notification-message');
        const iconEl = notification.querySelector('.notification-icon i');
        
        if (messageEl) messageEl.textContent = message;
        if (iconEl && type) {
            const iconMap = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            };
            iconEl.className = `fas ${iconMap[type]}`;
        }
        
        if (type) {
            notification.className = `notification notification-${type} show`;
        }
    }
}

// Initialize all components
PegeArts.init = function() {
    console.log('🎨 Initializing Pegearts Portfolio with Full Features...');
    
    try {
        // Core managers
        PegeArts.starField = new StarFieldManager();
        PegeArts.navigation = new NavigationManager();
        PegeArts.typing = new TypingAnimationManager();
        PegeArts.counters = new CounterAnimationManager();
        PegeArts.fab = new FABManager();
        PegeArts.backToTop = new BackToTopManager();
        PegeArts.cookieManager = new CookieManager();
        PegeArts.themeManager = new ThemeManager();
        PegeArts.performanceMonitor = new PerformanceMonitor();
        PegeArts.errorHandler = new ErrorHandler();
        PegeArts.accessibility = new AccessibilityHelper();
        PegeArts.autoSave = new AutoSaveManager();
        PegeArts.notifications = new NotificationManager();
        
        // Feature-specific managers
        PegeArts.audioPlayer = new AudioPlayerManager();
        PegeArts.portfolio = new PortfolioManager();
        PegeArts.contact = new ContactFormManager();
        PegeArts.animations = new AdvancedAnimationsManager();
        
        // Initialize external libraries
        if (typeof AOS !== 'undefined' && !PegeArts.state.reducedMotion) {
            AOS.init({
                duration: 800,
                easing: 'ease-out-cubic',
                once: true,
                offset: 100,
                delay: 0,
                disable: PegeArts.state.isMobile
            });
        }
        
        // Mark as loaded
        PegeArts.state.isLoaded = true;
        document.body.classList.add('pegearts-loaded');
        
        // Show welcome notification
        setTimeout(() => {
            PegeArts.notifications.show(
                'Welcome to Pegearts Portfolio! Experience interactive AI and voice technology.',
                'success',
                4000
            );
        }, 1000);
        
        console.log('✅ Pegearts Portfolio initialized successfully!');
        
    } catch (error) {
        console.error('❌ Error initializing Pegearts Portfolio:', error);
        PegeArts.errorHandler?.handleError({
            type: 'initialization',
            message: error.message,
            stack: error.stack,
            timestamp: Date.now()
        });
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PegeArts.init);
} else {
    PegeArts.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PegeArts;
}

// Global error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});



