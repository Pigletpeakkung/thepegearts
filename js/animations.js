/**
 * ANIMATIONS.JS - Thanatsitt Professional Website
 * Enhanced Animation System with Celestial Effects & Performance Optimization
 * Version: 2.1 - Complete Integration System
 * Author: Thanatsitt Santisamranwilai
 */

class ThanatsittAnimations {
    constructor() {
        this.version = '2.1';
        this.isInitialized = false;
        this.performanceMode = 'auto';
        this.deviceCapabilities = this.detectDeviceCapabilities();
        
        // Core systems
        this.particleSystem = null;
        this.audioSystem = null;
        this.scrollSystem = null;
        this.interactionSystem = null;
        this.celestialSystem = null;
        
        // Animation states
        this.activeAnimations = new Set();
        this.animationFrame = null;
        this.isVisible = !document.hidden;
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.averageFPS = 60;
        this.performanceHistory = [];
        
        console.log(`🎬 Thanatsitt Animations v${this.version} initializing...`);
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Check for reduced motion preference
        this.respectsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (this.respectsReducedMotion) {
            this.initializeAccessibleAnimations();
            return;
        }
        
        // Wait for DOM content to be loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeFullSystem());
        } else {
            this.initializeFullSystem();
        }
    }
    
    detectDeviceCapabilities() {
        const capabilities = {
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isLowPower: false,
            memory: navigator.deviceMemory || 4,
            cores: navigator.hardwareConcurrency || 4,
            connection: (navigator.connection || {}).effectiveType || '4g',
            hasWebGL: this.detectWebGL(),
            hasAudioContext: !!(window.AudioContext || window.webkitAudioContext),
            supportsIntersectionObserver: 'IntersectionObserver' in window,
            supportsResizeObserver: 'ResizeObserver' in window
        };
        
        // Determine performance mode
        if (capabilities.memory < 2 || capabilities.connection === '2g') {
            this.performanceMode = 'low';
        } else if (capabilities.memory >= 8 && capabilities.cores >= 8 && !capabilities.isMobile) {
            this.performanceMode = 'high';
        } else {
            this.performanceMode = 'medium';
        }
        
        console.log('📱 Device capabilities:', capabilities);
        console.log('⚡ Performance mode:', this.performanceMode);
        
        return capabilities;
    }
    
    detectWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }
    
    initializeFullSystem() {
        try {
            this.setupEventListeners();
            this.initializeParticleSystem();
            this.initializeCelestialSystem();
            this.initializeScrollAnimations();
            this.initializeInteractionSystem();
            this.initializeAudioSystem();
            this.initializeTypewriterEffect();
            this.initializeCounterAnimations();
            this.initializePortfolioAnimations();
            this.initializeVoiceDemoAnimations();
            this.initializeFormAnimations();
            this.startAnimationLoop();
            
            this.isInitialized = true;
            console.log('✨ Full animation system initialized successfully');
            
        } catch (error) {
            console.error('❌ Animation system initialization failed:', error);
            this.initializeAccessibleAnimations();
        }
    }
    
    initializeAccessibleAnimations() {
        console.log('♿ Initializing accessible animations only');
        
        // Simple fade-in animations that respect reduced motion
        document.querySelectorAll('[data-aos]').forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            observer.observe(element);
        });
        
        this.isInitialized = true;
    }
    
    setupEventListeners() {
        // Throttled mouse movement
        let mouseThrottle = false;
        document.addEventListener('mousemove', (e) => {
            if (mouseThrottle) return;
            mouseThrottle = true;
            
            requestAnimationFrame(() => {
                this.handleMouseMove(e);
                mouseThrottle = false;
            });
        });
        
        // Throttled scroll events
        let scrollThrottle = false;
        window.addEventListener('scroll', () => {
            if (scrollThrottle) return;
            scrollThrottle = true;
            
            requestAnimationFrame(() => {
                this.handleScroll();
                scrollThrottle = false;
            });
        }, { passive: true });
        
        // Resize with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);  
            resizeTimeout = setTimeout(() => this.handleResize(), 250);
        });
        
        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            if (this.isVisible) {
                this.resumeAnimations();
            } else {
                this.pauseAnimations();
            }
        });
        
        // Reduced motion preference changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.respectsReducedMotion = e.matches;
            if (e.matches) {
                this.pauseComplexAnimations();
            } else {
                this.resumeComplexAnimations();
            }
        });

        // Battery status (if available)
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                this.monitorBatteryStatus(battery);
            });
        }
        
        // Network status changes
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                this.adaptToNetworkConditions();
            });
        }
    }
    
    initializeParticleSystem() {
        console.log('🌟 Initializing particle system...');
        
        const canvas = document.getElementById('particlesCanvas') || this.createParticleCanvas();
        if (!canvas) {
            console.warn('⚠️ Particle canvas not found, skipping particle system');
            return;
        }
        
        this.particleSystem = new ParticleSystem(canvas, {
            particleCount: this.getOptimalParticleCount(),
            performanceMode: this.performanceMode,
            deviceCapabilities: this.deviceCapabilities
        });
        
        this.activeAnimations.add('particles');
    }
    
    createParticleCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particlesCanvas';
        canvas.className = 'particle-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        document.body.appendChild(canvas);
        return canvas;
    }
    
    getOptimalParticleCount() {
        const base = this.deviceCapabilities.isMobile ? 30 : 50;
        const multipliers = {
            low: 0.3,
            medium: 0.7,
            high: 1.2
        };
        return Math.floor(base * multipliers[this.performanceMode]);
    }
    
    initializeCelestialSystem() {
        console.log('🌙 Initializing celestial system...');
        
        this.celestialSystem = {
            stars: this.createDynamicStars(),
            shootingStars: this.createShootingStars(),
            moon: this.createMoonSystem(),
            auroras: this.createAuroraEffects(),
            nebulas: this.createNebulaEffects()
        };
        
        this.activeAnimations.add('celestial');
    }
    
    createDynamicStars() {
        const starContainer = document.querySelector('.starfield') || document.querySelector('.cosmic-background');
        if (!starContainer) return [];
        
        const stars = [];
        const starCount = this.performanceMode === 'low' ? 50 : 
                         this.performanceMode === 'high' ? 150 : 100;
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'dynamic-star';
            star.style.cssText = `
                position: absolute;
                background: white;
                border-radius: 50%;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: starTwinkle ${Math.random() * 3 + 2}s ease-in-out infinite;
                opacity: ${Math.random() * 0.8 + 0.2};
            `;
            
            starContainer.appendChild(star);
            stars.push({
                element: star,
                baseOpacity: parseFloat(star.style.opacity),
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                phase: Math.random() * Math.PI * 2
            });
        }
        
        return stars;
    }
    
    createShootingStars() {
        const createShootingStar = () => {
            if (this.performanceMode === 'low') return;
            
            const shootingStar = document.createElement('div');
            shootingStar.className = 'shooting-star-dynamic';
            shootingStar.style.cssText = `
                position: fixed;
                width: 2px;
                height: 2px;
                background: linear-gradient(45deg, #fff, transparent);
                border-radius: 50%;
                box-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #fff;
                animation: shootingStarMove 3s linear forwards;
                z-index: 10;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 30}%;
            `;
            
            document.body.appendChild(shootingStar);
            
            setTimeout(() => {
                if (shootingStar.parentNode) {
                    shootingStar.parentNode.removeChild(shootingStar);
                }
            }, 3000);
            
            // Schedule next shooting star
            setTimeout(createShootingStar, Math.random() * 15000 + 10000);
        };
        
        // Create first shooting star
        setTimeout(createShootingStar, Math.random() * 5000 + 2000);
        
        return { createShootingStar };
    }
    
    createMoonSystem() {
        const moonContainer = document.querySelector('.cosmic-background') || document.body;
        
        // Remove any existing moon
        const existingMoon = moonContainer.querySelector('.dynamic-moon');
        if (existingMoon) existingMoon.remove();
        
        const moon = document.createElement('div');
        moon.className = 'dynamic-moon';
        moon.style.cssText = `
            position: absolute;
            width: 80px;
            height: 80px;
            background: radial-gradient(circle at 30% 30%, #fff, #ddd);
            border-radius: 50%;
            top: 10%;
            right: 10%;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            animation: moonFloat 20s ease-in-out infinite;
            cursor: pointer;
            transition: transform 0.3s ease;
        `;
        
        // Add moon phases effect
        const moonPhase = document.createElement('div');
        moonPhase.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.1) 50%);
            border-radius: 50%;
            animation: moonPhases 30s linear infinite;
        `;
        moon.appendChild(moonPhase);
        
        // Interactive effects
        moon.addEventListener('mouseenter', () => {
            moon.style.transform = 'scale(1.1)';
            moon.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.6)';
        });
        
        moon.addEventListener('mouseleave', () => {
            moon.style.transform = 'scale(1)';
            moon.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
        });
        
        moonContainer.appendChild(moon);
        return { element: moon, phase: moonPhase };
    }
    
    createAuroraEffects() {
        if (this.performanceMode === 'low') return [];
        
        const auroraContainer = document.querySelector('.cosmic-background') || document.body;
        const auroras = [];
        
        for (let i = 0; i < 3; i++) {
            const aurora = document.createElement('div');
            aurora.className = 'dynamic-aurora';
            aurora.style.cssText = `
                position: absolute;
                width: 100%;
                height: 200px;
                background: linear-gradient(90deg, 
                    transparent,
                    rgba(167, 139, 250, 0.1),
                    rgba(110, 231, 183, 0.1),
                    rgba(249, 168, 212, 0.1),
                    transparent
                );
                top: ${20 + i * 15}%;
                left: 0;
                animation: auroraWave ${15 + i * 3}s ease-in-out infinite;
                animation-delay: ${i * 2}s;
                pointer-events: none;
            `;
            
            auroraContainer.appendChild(aurora);
            auroras.push(aurora);
        }
        
        return auroras;
    }
    
    createNebulaEffects() {
        if (this.performanceMode === 'low') return [];
        
        const nebulaContainer = document.querySelector('.cosmic-background') || document.body;
        const nebulas = [];
        
        const colors = [
            'rgba(167, 139, 250, 0.1)',
            'rgba(249, 168, 212, 0.1)',
            'rgba(110, 231, 183, 0.1)'
        ];
        
        colors.forEach((color, index) => {
            const nebula = document.createElement('div');
            nebula.className = 'dynamic-nebula';
            nebula.style.cssText = `
                position: absolute;
                width: 300px;
                height: 300px;
                background: radial-gradient(circle, ${color} 0%, transparent 70%);
                border-radius: 50%;
                top: ${Math.random() * 70}%;
                left: ${Math.random() * 70}%;
                animation: nebulaFloat ${20 + index * 5}s ease-in-out infinite;
                animation-delay: ${index * 3}s;
                pointer-events: none;
            `;
            
            nebulaContainer.appendChild(nebula);
            nebulas.push(nebula);
        });
        
        return nebulas;
    }
    
    initializeScrollAnimations() {
        console.log('📜 Initializing scroll animations...');
        
        if (!this.deviceCapabilities.supportsIntersectionObserver) {
            console.warn('⚠️ IntersectionObserver not supported, using fallback');
            this.initializeFallbackScrollAnimations();
            return;
        }
        
        // Main scroll observer
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, {
            threshold: [0.1, 0.3, 0.5],
            rootMargin: '50px'
        });
        
        // Observe elements for scroll animations
        document.querySelectorAll('.scroll-reveal, [data-aos]').forEach(element => {
            scrollObserver.observe(element);
        });
        
        // Counter animations observer
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        document.querySelectorAll('.counter').forEach(counter => {
            counterObserver.observe(counter);
        });
        
        // Progress bars observer
        const progressObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateProgressBar(entry.target);
                    progressObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.7 });
        
        document.querySelectorAll('.progress-bar, .skill-bar').forEach(bar => {
            progressObserver.observe(bar);
        });
        
        this.activeAnimations.add('scroll');
    }
    
    initializeFallbackScrollAnimations() {
        // Fallback for browsers without IntersectionObserver
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.checkScrollElements();
            }, 100);
        }, { passive: true });
    }
    
    checkScrollElements() {
        const windowHeight = window.innerHeight;
        const scrollTop = window.pageYOffset;
        
        document.querySelectorAll('.scroll-reveal:not(.animated)').forEach(element => {
            const elementTop = element.offsetTop;
            const elementHeight = element.offsetHeight;
            
            if (elementTop < scrollTop + windowHeight - 100) {
                this.animateElement(element);
            }
        });
    }
    
    animateElement(element) {
        if (element.classList.contains('animated')) return;
        
        element.classList.add('animated');
        
        const animationType = element.dataset.animation || 'fadeInUp';
        const delay = element.dataset.delay || 0;
        
        setTimeout(() => {
            element.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            element.classList.add(`animate-${animationType}`);
        }, delay);
    }
    
    initializeInteractionSystem() {
        console.log('🎯 Initializing interaction system...');
        
        this.setupMouseFollower();
        this.setupHoverEffects();
        this.setupClickEffects();
        this.setupParallaxEffects();
        
        this.activeAnimations.add('interactions');
    }
    
    setupMouseFollower() {
        const mouseFollower = document.getElementById('mouseFollower');
        if (!mouseFollower) return;
        
        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        const animateFollower = () => {
            followerX += (mouseX - followerX) * 0.1;
            followerY += (mouseY - followerY) * 0.1;
            
            mouseFollower.style.transform = `translate(${followerX - 10}px, ${followerY - 10}px)`;
            
            if (this.isVisible) {
                requestAnimationFrame(animateFollower);
            }
        };
        
        animateFollower();
        
        // Interactive elements
        document.querySelectorAll('a, button, .interactive').forEach(element => {
            element.addEventListener('mouseenter', () => {
                mouseFollower.style.transform += ' scale(2)';
                mouseFollower.style.mixBlendMode = 'difference';
            });
            
            element.addEventListener('mouseleave', () => {
                mouseFollower.style.transform = mouseFollower.style.transform.replace(' scale(2)', '');
                mouseFollower.style.mixBlendMode = 'normal';
            });
        });
    }
    
    setupHoverEffects() {
        // Card hover effects
        document.querySelectorAll('.service-card, .portfolio-card, .voice-demo-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
                card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            });
        });
        
        // Button hover effects
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('mouseenter', () => {
                if (!button.classList.contains('no-hover')) {
                    button.style.transform = 'translateY(-2px)';
                    button.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
                }
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = '';
                button.style.boxShadow = '';
            });
        });
    }
    
    setupClickEffects() {
        // Ripple effect
        document.querySelectorAll('.btn, .card').forEach(element => {
            element.addEventListener('click', (e) => {
                const ripple = document.createElement('div');
                const rect = element.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    animation: ripple 0.6s ease-out;
                    pointer-events: none;
                    z-index: 1000;
                `;
                
                element.style.position = 'relative';
                element.style.overflow = 'hidden';
                element.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }
    
    setupParallaxEffects() {
        if (this.deviceCapabilities.isMobile || this.performanceMode === 'low') return;
        
        const parallaxElements = document.querySelectorAll('.parallax');
        
        if (parallaxElements.length === 0) return;
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        }, { passive: true });
    }
    
    initializeAudioSystem() {
        console.log('🎵 Initializing audio system...');
        
        if (!this.deviceCapabilities.hasAudioContext) {
            console.warn('⚠️ Web Audio API not supported');
            return;
        }
        
        this.audioSystem = {
            context: null,
            analyser: null,
            audioData: null,
            connectedSources: new Set()
        };
        
        this.setupAudioVisualizers();
        this.setupVoiceDemoPlayers();
        
        this.activeAnimations.add('audio');
    }
    
    setupAudioVisualizers() {
        document.querySelectorAll('.voice-waveform').forEach(waveform => {
            const bars = waveform.querySelectorAll('.waveform-bar');
            
            // Create animated waveform
            bars.forEach((bar, index) => {
                const animationDelay = index * 100;
                const animationDuration = 1000 + Math.random() * 500;
                
                bar.style.animation = `waveformPulse ${animationDuration}ms ease-in-out infinite`;
                bar.style.animationDelay = `${animationDelay}ms`;
            });
        });
        
        // Audio spectrum visualizer
        const spectrumContainer = document.getElementById('audioSpectrum');
        if (spectrumContainer) {
            const bars = spectrumContainer.querySelectorAll('.spectrum-bar');
            this.animateSpectrumBars(bars);
        }
    }
    
    animateSpectrumBars(bars) {
        const animate = () => {
            bars.forEach((bar, index) => {
                const height = Math.random() * 100 + 10;
                bar.style.height = `${height}%`;
                bar.style.opacity = 0.3 + (height / 100) * 0.7;
            });
        };
        
        setInterval(animate, 100);
    }
    
    setupVoiceDemoPlayers() {
        document.querySelectorAll('.voice-demo-card').forEach(card => {
            const playBtn = card.querySelector('.play-pause-btn');
            const audio = card.querySelector('audio');
            const progressBar = card.querySelector('.progress-fill');
            const currentTimeEl = card.querySelector('.current-time');
            const waveform = card.querySelector('.voice-waveform');
            
            if (!playBtn || !audio) return;
            
            let isPlaying = false;
            
            playBtn.addEventListener('click', () => {
                if (isPlaying) {
                    audio.pause();
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    waveform?.classList.remove('active');
                    isPlaying = false;
                } else {
                    // Pause other audio players
                    document.querySelectorAll('audio').forEach(otherAudio => {
                        if (otherAudio !== audio) {
                            otherAudio.pause();
                        }
                    });
                    
                    audio.play();
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    waveform?.classList.add('active');
                    isPlaying = true;
                }
            });
            
            // Update progress
            audio.addEventListener('timeupdate', () => {
                const progress = (audio.currentTime / audio.duration) * 100;
                if (progressBar) progressBar.style.width = `${progress}%`;
                
                if (currentTimeEl) {
                    const minutes = Math.floor(audio.currentTime / 60);
                    const seconds = Math.floor(audio.currentTime % 60);
                    currentTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            });
            
            // Reset when audio ends
            audio.addEventListener('ended', () => {
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                waveform?.classList.remove('active');
                if (progressBar) progressBar.style.width = '0%';
                if (currentTimeEl) currentTimeEl.textContent = '0:00';
                isPlaying = false;
            });
        });
    }
    
    initializeTypewriterEffect() {
        console.log('⌨️ Initializing typewriter effect...');
        
        const typedElement = document.getElementById('typed-text');
        if (!typedElement) return;
        
        const strings = [
            "AI Creative Designer",
            "Voice Actor Extraordinaire", 
            "Full-Stack Developer",
            "Digital Innovation Expert",
            "Multilingual Content Creator"
        ];
        
        let stringIndex = 0;
        let characterIndex = 0;
        let isDeleting = false;
        
        const typeSpeed = 50;
        const deleteSpeed = 25;
        const delayBetweenStrings = 2000;
        
        const typeWriter = () => {
            const currentString = strings[stringIndex];
            
            if (isDeleting) {
                typedElement.textContent = currentString.substring(0, characterIndex - 1);
                characterIndex--;
                
                if (characterIndex === 0) {
                    isDeleting = false;
                    stringIndex = (stringIndex + 1) % strings.length;
                    setTimeout(typeWriter, 500);
                    return;
                }
            } else {
                typedElement.textContent = currentString.substring(0, characterIndex + 1);
                characterIndex++;
                
                if (characterIndex === currentString.length) {
                    isDeleting = true;
                    setTimeout(typeWriter, delayBetweenStrings);
                    return;
                }
            }
            
            setTimeout(typeWriter, isDeleting ? deleteSpeed : typeSpeed);
        };
        
        // Start the typewriter effect
        setTimeout(typeWriter, 1000);
        
        this.activeAnimations.add('typewriter');
    }
    
    initializeCounterAnimations() {
        console.log('🔢 Initializing counter animations...');
        
        this.counters = document.querySelectorAll('.counter');
        
        // Will be triggered by scroll observer
        this.activeAnimations.add('counters');
    }
    
    animateCounter(counterElement) {
        if (counterElement.classList.contains('animated')) return;
        
        const target = parseInt(counterElement.dataset.target) || 0;
        const duration = 2000;
        const startTime = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(target * easeOut);
            
            counterElement.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counterElement.textContent = target;
                counterElement.classList.add('animated');
            }
        };
        
        requestAnimationFrame(updateCounter);
    }
    
    animateProgressBar(progressElement) {
        if (progressElement.classList.contains('animated')) return;
        
        const targetWidth = progressElement.dataset.width || '0%';
        
        progressElement.style.width = '0%';
        progressElement.style.transition = 'width 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        setTimeout(() => {
            progressElement.style.width = targetWidth;
            progressElement.classList.add('animated');
        }, 100);
    }
    
    initializePortfolioAnimations() {
        console.log('💼 Initializing portfolio animations...');
        
        // Filter animations
        const filterButtons = document.querySelectorAll('.filter-btn');
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter items
                this.filterPortfolioItems(portfolioItems, filter);
            });
        });
        
        // Portfolio modal animations
        this.setupPortfolioModals();
        
        this.activeAnimations.add('portfolio');
    }
    
    filterPortfolioItems(items, filter) {
        items.forEach((item, index) => {
            const categories = item.dataset.category?.split(' ') || [];
            const shouldShow = filter === 'all' || categories.includes(filter);
            
            if (shouldShow) {
                item.style.display = 'block';
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 100);
            } else {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });
    }
    
    setupPortfolioModals() {
        // Modal opening animations
        const portfolioModal = document.getElementById('portfolioModal');
        if (portfolioModal) {
            portfolioModal.addEventListener('show.bs.modal', () => {
                portfolioModal.style.opacity = '0';
                portfolioModal.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    portfolioModal.style.transition = 'all 0.3s ease';
                    portfolioModal.style.opacity = '1';
                    portfolioModal.style.transform = 'scale(1)';
                }, 50);
            });
            
            portfolioModal.addEventListener('hide.bs.modal', () => {
                portfolioModal.style.opacity = '0';
                portfolioModal.style.transform = 'scale(0.8)';
            });
        }
    }
    
    initializeVoiceDemoAnimations() {
        console.log('🎤 Initializing voice demo animations...');
        
        // Already handled in setupVoiceDemoPlayers
        this.activeAnimations.add('voiceDemos');
    }
    
    initializeFormAnimations() {
        console.log('📝 Initializing form animations...');
        
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) return;
        
        // Form field focus animations
        const formFields = contactForm.querySelectorAll('input, textarea, select');
        formFields.forEach(field => {
            field.addEventListener('focus', () => {
                field.parentElement.classList.add('focused');
            });
            
            field.addEventListener('blur', () => {
                if (!field.value) {
                    field.parentElement.classList.remove('focused');
                }
            });
            
            // Check if field has value on load
            if (field.value) {
                field.parentElement.classList.add('focused');
            }
        });
        
        // Form submission animation
        contactForm.addEventListener('submit', (e) => {
            const submitBtn = contactForm.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    submitBtn.style.transform = 'scale(1)';
                }, 150);
            }
        });
        
        this.activeAnimations.add('forms');
    }
    
    startAnimationLoop() {
        if (this.respectsReducedMotion) return;
        
        const animate = (currentTime) => {
            if (!this.isVisible) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }
            
            // Update performance tracking
            this.updatePerformanceTracking(currentTime);
            
            // Update particle system
            if (this.particleSystem && this.activeAnimations.has('particles')) {
                this.particleSystem.update(currentTime);
            }
            
            // Update celestial animations
            if (this.activeAnimations.has('celestial')) {
                this.updateCelestialSystem(currentTime);
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.animationFrame = requestAnimationFrame(animate);
        console.log('🎬 Animation loop started');
    }
    
    updatePerformanceTracking(currentTime) {
        this.frameCount++;
        const deltaTime = currentTime - this.lastFrameTime;
        
        if (deltaTime >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.performanceHistory.push(fps);
            
            if (this.performanceHistory.length > 10) {
                this.performanceHistory.shift();
            }
            
            this.averageFPS = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
            
            // Adjust performance if needed
            if (this.averageFPS < 30) {
                this.optimizePerformance();
            }
            
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
        }
    }
    
    updateCelestialSystem(currentTime) {
                // Update star twinkling
        if (this.celestialSystem.stars) {
            this.celestialSystem.stars.forEach(star => {
                star.phase += star.twinkleSpeed;
                const opacity = star.baseOpacity + Math.sin(star.phase) * 0.3;
                star.element.style.opacity = Math.max(0.1, Math.min(1, opacity));
            });
        }
        
        // Update aurora effects
        if (this.celestialSystem.auroras && this.performanceMode !== 'low') {
            this.celestialSystem.auroras.forEach((aurora, index) => {
                const wave = Math.sin(currentTime * 0.001 + index) * 10;
                aurora.style.transform = `translateX(${wave}px)`;
            });
        }
        
        // Update nebula movement
        if (this.celestialSystem.nebulas && this.performanceMode === 'high') {
            this.celestialSystem.nebulas.forEach((nebula, index) => {
                const x = Math.sin(currentTime * 0.0005 + index) * 20;
                const y = Math.cos(currentTime * 0.0003 + index) * 15;
                nebula.style.transform = `translate(${x}px, ${y}px)`;
            });
        }
    }
    
    handleMouseMove(event) {
        if (!this.isVisible) return;
        
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        // Update particle system
        if (this.particleSystem) {
            this.particleSystem.updateMousePosition(mouseX, mouseY);
        }
        
        // Parallax effect for celestial elements
        if (this.activeAnimations.has('celestial') && this.performanceMode !== 'low') {
            const moveX = (mouseX - window.innerWidth / 2) * 0.01;
            const moveY = (mouseY - window.innerHeight / 2) * 0.01;
            
            if (this.celestialSystem.moon?.element) {
                this.celestialSystem.moon.element.style.transform += ` translate(${moveX}px, ${moveY}px)`;
            }
        }
        
        // Update cosmic background parallax
        const cosmicBg = document.querySelector('.cosmic-background');
        if (cosmicBg && this.performanceMode === 'high') {
            const moveX = (mouseX - window.innerWidth / 2) * 0.005;
            const moveY = (mouseY - window.innerHeight / 2) * 0.005;
            cosmicBg.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    }
    
    handleScroll() {
        if (!this.isVisible) return;
        
        const scrollY = window.pageYOffset;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = scrollY / documentHeight;
        
        // Update navbar transparency
        const navbar = document.getElementById('mainNavbar');
        if (navbar) {
            const opacity = Math.min(0.95, scrollY / 100);
            navbar.style.backgroundColor = `rgba(13, 13, 18, ${opacity})`;
        }
        
        // Parallax scrolling for background elements
        if (this.performanceMode !== 'low') {
            const parallaxElements = document.querySelectorAll('.parallax-bg');
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                const yPos = -(scrollY * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        }
        
        // Update scroll progress indicator
        const scrollIndicator = document.querySelector('.scroll-progress');
        if (scrollIndicator) {
            scrollIndicator.style.width = `${scrollProgress * 100}%`;
        }
        
        // Hide/show scroll-to-top button
        const scrollTopBtn = document.querySelector('.scroll-to-top');
        if (scrollTopBtn) {
            if (scrollY > 500) {
                scrollTopBtn.style.opacity = '1';
                scrollTopBtn.style.pointerEvents = 'auto';
            } else {
                scrollTopBtn.style.opacity = '0';
                scrollTopBtn.style.pointerEvents = 'none';
            }
        }
    }
    
    handleResize() {
        console.log('📏 Handling window resize...');
        
        // Resize particle canvas
        if (this.particleSystem) {
            this.particleSystem.handleResize();
        }
        
        // Recalculate parallax elements
        const parallaxElements = document.querySelectorAll('.parallax');
        parallaxElements.forEach(element => {
            element.style.transform = 'translateY(0)';
        });
        
        // Update mobile detection
        this.deviceCapabilities.isMobile = window.innerWidth <= 768;
        
        // Adjust performance mode based on new viewport
        if (this.deviceCapabilities.isMobile && this.performanceMode === 'high') {
            this.performanceMode = 'medium';
            this.optimizeForMobile();
        }
    }
    
    optimizeForMobile() {
        console.log('📱 Optimizing for mobile...');
        
        // Reduce particle count
        if (this.particleSystem) {
            this.particleSystem.reduceParticleCount(0.5);
        }
        
        // Disable complex animations
        document.querySelectorAll('.dynamic-nebula, .dynamic-aurora').forEach(element => {
            element.style.animation = 'none';
        });
        
        // Simplify scroll animations
        document.querySelectorAll('.parallax').forEach(element => {
            element.style.transform = 'none';
        });
    }
    
    optimizePerformance() {
        console.log('⚡ Optimizing performance due to low FPS...');
        
        // Reduce particle count
        if (this.particleSystem) {
            this.particleSystem.reduceParticleCount(0.7);
        }
        
        // Disable expensive animations
        if (this.performanceMode !== 'low') {
            this.performanceMode = 'medium';
            
            // Remove complex celestial effects
            document.querySelectorAll('.dynamic-nebula, .dynamic-aurora').forEach(element => {
                element.remove();
            });
            
            // Reduce star count
            const stars = document.querySelectorAll('.dynamic-star');
            for (let i = stars.length - 1; i >= Math.floor(stars.length / 2); i--) {
                stars[i].remove();
            }
        }
    }
    
    monitorBatteryStatus(battery) {
        const checkBattery = () => {
            if (battery.level < 0.2 && !battery.charging) {
                console.log('🔋 Low battery detected, enabling power save mode');
                this.enablePowerSaveMode();
            } else if (battery.level > 0.8 && battery.charging) {
                console.log('🔋 Battery restored, resuming normal mode');
                this.disablePowerSaveMode();
            }
        };
        
        battery.addEventListener('levelchange', checkBattery);
        battery.addEventListener('chargingchange', checkBattery);
        checkBattery(); // Initial check
    }
    
    enablePowerSaveMode() {
        console.log('🔋 Enabling power save mode...');
        
        this.powerSaveMode = true;
        
        // Pause non-essential animations
        this.pauseAnimation('particles');
        this.pauseAnimation('celestial');
        
        // Reduce animation frequency
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.startReducedAnimationLoop();
        }
        
        // Show user notification
        this.showNotification('Power save mode enabled', 'info');
    }
    
    disablePowerSaveMode() {
        if (!this.powerSaveMode) return;
        
        console.log('🔋 Disabling power save mode...');
        
        this.powerSaveMode = false;
        
        // Resume animations
        this.resumeAnimation('particles');
        this.resumeAnimation('celestial');
        
        // Restore normal animation loop
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.startAnimationLoop();
        }
        
        this.showNotification('Power save mode disabled', 'success');
    }
    
    startReducedAnimationLoop() {
        const animate = (currentTime) => {
            if (!this.isVisible) {
                this.animationFrame = requestAnimationFrame(animate);
                return;
            }
            
            // Only update essential systems at reduced frequency
            if (currentTime % 3 === 0) { // Every 3rd frame
                if (this.particleSystem && this.activeAnimations.has('particles')) {
                    this.particleSystem.updateReduced(currentTime);
                }
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    adaptToNetworkConditions() {
        const connection = navigator.connection;
        if (!connection) return;
        
        console.log(`🌐 Network changed: ${connection.effectiveType}`);
        
        if (connection.effectiveType === '2g' || connection.saveData) {
            this.enableDataSaveMode();
        } else if (connection.effectiveType === '4g' && !this.powerSaveMode) {
            this.disableDataSaveMode();
        }
    }
    
    enableDataSaveMode() {
        console.log('📶 Enabling data save mode...');
        
        // Disable background videos/animations
        document.querySelectorAll('video').forEach(video => {
            video.pause();
        });
        
        // Reduce image quality
        document.querySelectorAll('img[data-src-low]').forEach(img => {
            img.src = img.dataset.srcLow;
        });
        
        // Disable autoplay audio
        document.querySelectorAll('audio[autoplay]').forEach(audio => {
            audio.removeAttribute('autoplay');
        });
        
        this.showNotification('Data save mode enabled', 'info');
    }
    
    disableDataSaveMode() {
        console.log('📶 Disabling data save mode...');
        
        // Restore high quality images
        document.querySelectorAll('img[data-src-high]').forEach(img => {
            img.src = img.dataset.srcHigh;
        });
        
        this.showNotification('Data save mode disabled', 'success');
    }
    
    pauseAnimations() {
        console.log('⏸️ Pausing animations...');
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Pause CSS animations
        document.querySelectorAll('.animated').forEach(element => {
            element.style.animationPlayState = 'paused';
        });
        
        // Pause audio
        document.querySelectorAll('audio').forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.dataset.wasPlaying = 'true';
            }
        });
    }
    
    resumeAnimations() {
        console.log('▶️ Resuming animations...');
        
        if (!this.animationFrame && !this.respectsReducedMotion) {
            if (this.powerSaveMode) {
                this.startReducedAnimationLoop();
            } else {
                this.startAnimationLoop();
            }
        }
        
        // Resume CSS animations
        document.querySelectorAll('.animated').forEach(element => {
            element.style.animationPlayState = 'running';
        });
        
        // Resume audio that was playing
        document.querySelectorAll('audio[data-was-playing="true"]').forEach(audio => {
            audio.play();
            audio.removeAttribute('data-was-playing');
        });
    }
    
    pauseAnimation(animationType) {
        this.activeAnimations.delete(animationType);
        console.log(`⏸️ Paused ${animationType} animations`);
    }
    
    resumeAnimation(animationType) {
        this.activeAnimations.add(animationType);
        console.log(`▶️ Resumed ${animationType} animations`);
    }
    
    pauseComplexAnimations() {
        console.log('⏸️ Pausing complex animations for accessibility...');
        
        this.pauseAnimation('particles');
        this.pauseAnimation('celestial');
        
        // Stop CSS animations that might cause motion sickness
        document.querySelectorAll('[class*="bounce"], [class*="shake"], [class*="rotate"]').forEach(element => {
            element.style.animation = 'none';
        });
    }
    
    resumeComplexAnimations() {
        console.log('▶️ Resuming complex animations...');
        
        this.resumeAnimation('particles');
        this.resumeAnimation('celestial');
        
        // Restore CSS animations
        document.querySelectorAll('[data-original-animation]').forEach(element => {
            element.style.animation = element.dataset.originalAnimation;
        });
    }
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}" aria-hidden="true"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" aria-label="Close notification">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        `;
        
        // Add click handler for close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        // Add to container
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
    }
    
    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    getNotificationIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    // Public API methods
    getPerformanceStats() {
        return {
            averageFPS: this.averageFPS,
            performanceMode: this.performanceMode,
            activeAnimations: Array.from(this.activeAnimations),
            deviceCapabilities: this.deviceCapabilities,
            powerSaveMode: this.powerSaveMode || false
        };
    }
    
    setPerformanceMode(mode) {
        if (!['low', 'medium', 'high'].includes(mode)) {
            console.warn(`Invalid performance mode: ${mode}`);
            return;
        }
        
        const oldMode = this.performanceMode;
        this.performanceMode = mode;
        
        console.log(`🎯 Performance mode changed: ${oldMode} → ${mode}`);
        
        // Reinitialize systems with new performance mode
        if (this.particleSystem) {
            this.particleSystem.updatePerformanceMode(mode);
        }
        
        // Adjust celestial system
        if (mode === 'low') {
            this.pauseAnimation('celestial');
        } else if (oldMode === 'low' && mode !== 'low') {
            this.resumeAnimation('celestial');
        }
    }
    
    destroy() {
        console.log('🧹 Destroying animation system...');
        
        // Cancel animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Destroy particle system
        if (this.particleSystem) {
            this.particleSystem.destroy();
        }
        
        // Remove event listeners
        // (Would need to store references to remove them properly)
        
        // Clear intervals and timeouts
        // (Would need to store references to clear them properly)
        
        // Clean up audio context
        if (this.audioSystem?.context) {
            this.audioSystem.context.close();
        }
        
        this.isInitialized = false;
        console.log('✅ Animation system destroyed');
    }
}

// Particle System Class
class ParticleSystem {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            particleCount: options.particleCount || 50,
            performanceMode: options.performanceMode || 'medium',
            deviceCapabilities: options.deviceCapabilities || {}
        };
        
        this.particles = [];
        this.mousePos = { x: 0, y: 0 };
        this.connections = [];
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.createParticles();
        console.log(`✨ Particle system initialized with ${this.particles.length} particles`);
    }
    
    setupCanvas() {
        const updateCanvasSize = () => {
            const rect = this.canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            
            this.ctx.scale(dpr, dpr);
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
        };
        
        updateCanvasSize();
        this.handleResize = updateCanvasSize;
    }
    
    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.options.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.8 + 0.2,
            baseOpacity: Math.random() * 0.8 + 0.2,
            color: this.getRandomColor(),
            life: Math.random() * 1000 + 500,
            maxLife: Math.random() * 1000 + 500,
            trail: []
        };
    }
    
    getRandomColor() {
        const colors = [
            { r: 167, g: 139, b: 250 }, // Purple
            { r: 249, g: 168, b: 212 }, // Pink
            { r: 110, g: 231, b: 183 }, // Green
            { r: 252, g: 211, b: 77 },  // Yellow
            { r: 99, g: 179, b: 237 }   // Blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update(currentTime) {
        this.updateParticles();
        this.render();
    }
    
    updateReduced(currentTime) {
        // Simplified update for power save mode
        this.updateParticles(true);
        this.renderSimple();
    }
    
    updateParticles(simplified = false) {
        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Boundary wrapping
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            if (!simplified) {
                // Mouse interaction
                const dx = this.mousePos.x - particle.x;
                const dy = this.mousePos.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    const force = (100 - distance) / 100;
                    particle.vx += dx * force * 0.01;
                    particle.vy += dy * force * 0.01;
                    particle.opacity = Math.min(1, particle.baseOpacity + force);
                } else {
                    particle.opacity = particle.baseOpacity;
                }
                
                // Add to trail
                particle.trail.push({ x: particle.x, y: particle.y });
                if (particle.trail.length > 5) {
                    particle.trail.shift();
                }
            }
            
            // Velocity dampening
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            
            // Life cycle
            particle.life--;
            if (particle.life <= 0) {
                this.particles[index] = this.createParticle();
            }
        });
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        if (this.options.performanceMode !== 'low') {
            this.drawConnections();
        }
        
        // Draw particles
        this.drawParticles();
    }
    
    renderSimple() {
        // Simplified rendering for power save mode
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawParticlesSimple();
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            // Draw trail
            if (particle.trail.length > 1 && this.options.performanceMode === 'high') {
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'lighter';
                
                for (let i = 1; i < particle.trail.length; i++) {
                    const point = particle.trail[i];
                    const alpha = (i / particle.trail.length) * particle.opacity * 0.3;
                    
                    this.ctx.globalAlpha = alpha;
                    this.ctx.strokeStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
                    this.ctx.lineWidth = particle.size * 0.5;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.trail[i - 1].x, particle.trail[i - 1].y);
                    this.ctx.lineTo(point.x, point.y);
                    this.ctx.stroke();
                }
                
                this.ctx.restore();
            }
            
            // Draw particle
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.opacity})`;
            
            // Add glow effect
            if (this.options.performanceMode !== 'low') {
                this.ctx.shadowBlur = particle.size * 2;
                this.ctx.shadowColor = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0.8)`;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
    
    drawParticlesSimple() {
        // Simple particle rendering without effects
        this.particles.forEach(particle => {
            this.ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawConnections() {
        const maxDistance = 100;
        const maxConnections = 3;
        
        for (let i = 0; i < this.particles.length; i++) {
            const particleA = this.particles[i];
            let connections = 0;
            
            for (let j = i + 1; j < this.particles.length && connections < maxConnections; j++) {
                const particleB = this.particles[j];
                const dx = particleA.x - particleB.x;
                const dy = particleA.y - particleB.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const opacity = (maxDistance - distance) / maxDistance * 0.5;
                    
                    this.ctx.save();
                    this.ctx.globalAlpha = opacity;
                    this.ctx.strokeStyle = `rgba(167, 139, 250, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(particleA.x, particleA.y);
                    this.ctx.lineTo(particleB.x, particleB.y);
                    this.ctx.stroke();
                    
                    this.ctx.restore();
                    connections++;
                }
            }
        }
    }
    
    updateMousePosition(x, y) {
        this.mousePos.x = x;
        this.mousePos.y = y;
    }
    
    reduceParticleCount(factor) {
        const newCount = Math.floor(this.particles.length * factor);
        this.particles = this.particles.slice(0, newCount);
        console.log(`🔧 Reduced particles to ${this.particles.length}`);
    }
    
    updatePerformanceMode(mode) {
        this.options.performanceMode = mode;
        
        // Adjust particle count based on performance mode
        const targetCount = this.getTargetParticleCount(mode);
        
        if (targetCount < this.particles.length) {
            this.particles = this.particles.slice(0, targetCount);
        } else if (targetCount > this.particles.length) {
            while (this.particles.length < targetCount) {
                this.particles.push(this.createParticle());
            }
        }
        
        console.log(`⚡ Particle system updated to ${mode} mode with ${this.particles.length} particles`);
    }
    
    getTargetParticleCount(mode) {
        const base = this.options.deviceCapabilities.isMobile ? 30 : 50;
        const multipliers = { low: 0.3, medium: 0.7, high: 1.2 };
        return Math.floor(base * multipliers[mode]);
    }
    
    destroy() {
        this.particles = [];
        console.log('✅ Particle system destroyed');
    }
}

// Global initialization
let thanatsittAnimations = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAnimations);
} else {
    initializeAnimations();
}

function initializeAnimations() {
    if (thanatsittAnimations) return;
    
    try {
        thanatsittAnimations = new ThanatsittAnimations();
        
        // Expose to global scope for debugging
        window.ThanatsittAnimations = thanatsittAnimations;
        
        // Add CSS animations dynamically
        addDynamicStyles();
        
        console.log('🎉 Thanatsitt Animations fully initialized!');
        
    } catch (error) {
        console.error('❌ Failed to initialize animations:', error);
    }
}

// Add required CSS animations
function addDynamicStyles() {
    const styles = `
        @keyframes starTwinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes shootingStarMove {
            0% {
                transform: translateX(-100px) translateY(-100px);
                opacity: 0;
            }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% {
                transform: translateX(100vw) translateY(100vh);
                opacity: 0;
            }
        }
        
        @keyframes moonFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes moonPhases {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes auroraWave {
            0%, 100% { transform: translateX(-20px) scaleY(1); opacity: 0.1; }
            50% { transform: translateX(20px) scaleY(1.1); opacity: 0.3; }
        }
        
        @keyframes nebulaFloat {
            0%, 100% { transform: translateX(0) translateY(0) scale(1); }
            33% { transform: translateX(20px) translateY(-10px) scale(1.05); }
            66% { transform: translateX(-15px) translateY(15px) scale(0.95); }
        }
        
        @keyframes waveformPulse {
            0%, 100% { transform: scaleY(0.3); }
            50% { transform: scaleY(1); }
        }
        
        @keyframes constellation {
            0% { stroke-dashoffset: 100; opacity: 0; }
            50% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0.7; }
        }
        
        @keyframes ripple {
            0% { transform: scale(0); opacity: 1; }
            100% { transform: scale(4); opacity: 0; }
        }
        
        .notification {
            transform: translateX(100%);
            transition: transform 0.3s ease;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .particle-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }
        
        .voice-waveform.active .waveform-bar {
            animation-play-state: running;
        }
        
        .voice-waveform .waveform-bar {
            animation-play-state: paused;
        }
        
        .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-fadeInLeft {
            animation: fadeInLeft 0.8s ease-out forwards;
        }
        
        .animate-fadeInRight {
            animation: fadeInRight 0.8s ease-out forwards;
        }
        
        .animate-zoomIn {
            animation: zoomIn 0.8s ease-out forwards;
        }
        
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInLeft {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeInRight {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes zoomIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        
        .scroll-reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .scroll-reveal.animated {
            opacity: 1;
            transform: translateY(0);
        }
        
        .stagger-children > * {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .stagger-children.animated > * {
            opacity: 1;
            transform: translateY(0);
        }
        
        .stagger-children > *:nth-child(1) { transition-delay: 0.1s; }
        .stagger-children > *:nth-child(2) { transition-delay: 0.2s; }
        .stagger-children > *:nth-child(3) { transition-delay: 0.3s; }
        .stagger-children > *:nth-child(4) { transition-delay: 0.4s; }
        .stagger-children > *:nth-child(5) { transition-delay: 0.5s; }
        .stagger-children > *:nth-child(6) { transition-delay: 0.6s; }
        
        .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
        }
        
        .bounce {
            animation: bounce 2s ease-in-out infinite;
        }
        
        .bounce.delay-1 { animation-delay: 0.2s; }
        .bounce.delay-2 { animation-delay: 0.4s; }
        .bounce.delay-3 { animation-delay: 0.6s; }
        .bounce.delay-4 { animation-delay: 0.8s; }
        .bounce.delay-5 { animation-delay: 1s; }
        .bounce.delay-6 { animation-delay: 1.2s; }
        
        @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
            40%, 43% { transform: translateY(-15px); }
            70% { transform: translateY(-8px); }
            90% { transform: translateY(-3px); }
        }
        
        .text-gradient.animated {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color), var(--accent-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: gradientShift 3s ease-in-out infinite;
        }
        
        @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .card-shimmer {
            position: relative;
            overflow: hidden;
        }
        
        .card-shimmer::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
                45deg,
                transparent 30%,
                rgba(255, 255, 255, 0.1) 50%,
                transparent 70%
            );
            transform: rotate(45deg);
            animation: shimmer 3s ease-in-out infinite;
            pointer-events: none;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .loading-dots {
            display: inline-block;
        }
        
        .loading-dots::after {
            content: '';
            animation: loadingDots 1.5s infinite;
        }
        
        @keyframes loadingDots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
        
        /* Performance optimized animations for low-end devices */
        @media (max-width: 768px) {
            .particle-canvas {
                opacity: 0.7;
            }
            
            .dynamic-nebula,
            .dynamic-aurora {
                display: none;
            }
            
            .cosmic-particle {
                animation-duration: 8s;
            }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .text-gradient.animated {
                background: none;
                -webkit-text-fill-color: currentColor;
                color: var(--text-primary);
            }
            
            .card-shimmer::before {
                display: none;
            }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
            
            .scroll-reveal {
                opacity: 1;
                transform: none;
            }
            
            .particle-canvas {
                display: none;
            }
        }
        
        /* Dark mode enhancements */
        @media (prefers-color-scheme: dark) {
            .dynamic-star {
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
            }
            
            .dynamic-moon {
                box-shadow: 0 0 30px rgba(255, 255, 255, 0.4);
            }
        }
        
        /* Print styles */
        @media print {
            .cosmic-background,
            .particle-canvas,
            .mouse-follower,
            .floating-elements {
                display: none !important;
            }
        }
        
        /* Focus indicators for accessibility */
        .nav-link:focus,
        .btn:focus,
        .social-link:focus {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
        }
        
        /* Skip link styles */
        .skip-nav {
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--primary-color);
            color: white;
            padding: 8px;
            text-decoration: none;
            z-index: 100;
            border-radius: 4px;
        }
        
        .skip-nav:focus {
            top: 6px;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// Portfolio modal functionality
function openPortfolioModal(portfolioId) {
    console.log(`🖼️ Opening portfolio modal: ${portfolioId}`);
    
    const modalData = getPortfolioData(portfolioId);
    if (!modalData) {
        console.error(`Portfolio data not found for: ${portfolioId}`);
        return;
    }
    
    updatePortfolioModal(modalData);
    
    const modal = new bootstrap.Modal(document.getElementById('portfolioModal'));
    modal.show();
}

function getPortfolioData(portfolioId) {
    const portfolioData = {
        'ai-chatbot': {
            title: 'AI Chatbot Development',
            category: 'AI & Machine Learning',
            description: 'Advanced conversational AI system with natural language processing capabilities, built using GPT-4 and custom training data.',
            technologies: ['Python', 'OpenAI API', 'TensorFlow', 'FastAPI', 'PostgreSQL'],
            features: [
                'Multi-language support (EN, TH, JP)',
                'Context-aware conversations',
                'Integration with business systems',
                'Real-time learning capabilities',
                'Advanced sentiment analysis'
            ],
            images: ['images/portfolio/ai-chatbot-1.jpg', 'images/portfolio/ai-chatbot-2.jpg'],
            liveUrl: 'https://demo.example.com',
            githubUrl: 'https://github.com/example/ai-chatbot',
            completedDate: '2024-01-15',
            client: 'Tech Startup Inc.'
        },
        'voice-commercial': {
            title: 'Commercial Voice Campaign',
            category: 'Voice Acting',
            description: 'Multi-language commercial voice campaign for international brand, featuring consistent brand voice across different markets.',
            technologies: ['Pro Tools', 'Audio Processing', 'Voice Modulation'],
            features: [
                'Professional studio recording',
                '15 different commercial spots',
                'Multi-language delivery',
                'Brand voice consistency',
                'Rapid turnaround delivery'
            ],
            images: ['images/portfolio/voice-commercial-1.jpg', 'images/portfolio/voice-commercial-2.jpg'],
            audioSamples: ['audio/commercial-sample-1.mp3', 'audio/commercial-sample-2.mp3'],
            completedDate: '2023-12-10',
            client: 'Global Brand Corp.'
        },
        'ecommerce-platform': {
            title: 'E-commerce Platform',
            category: 'Web Development',
            description: 'Full-stack e-commerce solution with AI-powered recommendations, advanced analytics, and multi-vendor support.',
            technologies: ['React', 'Node.js', 'MongoDB', 'Stripe', 'AWS', 'Docker'],
            features: [
                'AI product recommendations',
                'Multi-vendor marketplace',
                'Advanced analytics dashboard',
                'Mobile-responsive design',
                'Integrated payment processing',
                'Inventory management system'
            ],
            images: ['images/portfolio/ecommerce-1.jpg', 'images/portfolio/ecommerce-2.jpg'],
            liveUrl: 'https://ecommerce-demo.example.com',
            githubUrl: 'https://github.com/example/ecommerce-platform',
            completedDate: '2023-11-20',
            client: 'Retail Solutions Ltd.'
        },
        'seo-strategy': {
            title: 'SEO Strategy & Implementation',
            category: 'Digital Strategy',
            description: 'Comprehensive SEO strategy that improved organic traffic by 300% and achieved top 3 rankings for target keywords.',
            technologies: ['Google Analytics', 'Search Console', 'SEMrush', 'Content Optimization'],
            features: [
                'Keyword research & analysis',
                'Technical SEO optimization',
                'Content strategy development',
                'Link building campaigns',
                'Performance monitoring',
                'Competitor analysis'
            ],
            images: ['images/portfolio/seo-strategy-1.jpg', 'images/portfolio/seo-strategy-2.jpg'],
            results: {
                'Organic Traffic Increase': '300%',
                'Keyword Rankings (Top 3)': '25+',
                'Page Speed Improvement': '40%',
                'Conversion Rate Increase': '85%'
            },
            completedDate: '2023-10-05',
            client: 'Digital Marketing Agency'
        }
    };
    
    return portfolioData[portfolioId] || null;
}

function updatePortfolioModal(data) {
    const modal = document.getElementById('portfolioModal');
    if (!modal) return;
    
    // Update modal content
    const titleEl = modal.querySelector('.modal-title');
    const categoryEl = modal.querySelector('.portfolio-category');
    const descriptionEl = modal.querySelector('.portfolio-description');
    const technologiesEl = modal.querySelector('.portfolio-technologies');
    const featuresEl = modal.querySelector('.portfolio-features');
    const imagesEl = modal.querySelector('.portfolio-images');
    const linksEl = modal.querySelector('.portfolio-links');
    
    if (titleEl) titleEl.textContent = data.title;
    if (categoryEl) categoryEl.textContent = data.category;
    if (descriptionEl) descriptionEl.textContent = data.description;
    
    // Update technologies
    if (technologiesEl && data.technologies) {
        technologiesEl.innerHTML = data.technologies
            .map(tech => `<span class="badge bg-primary">${tech}</span>`)
            .join(' ');
    }
    
    // Update features
    if (featuresEl && data.features) {
        featuresEl.innerHTML = data.features
            .map(feature => `<li><i class="fas fa-check text-success"></i> ${feature}</li>`)
            .join('');
    }
    
    // Update images
    if (imagesEl && data.images) {
        imagesEl.innerHTML = data.images
            .map((img, index) => `
                <div class="col-md-6">
                    <img src="${img}" alt="${data.title} Screenshot ${index + 1}" 
                         class="img-fluid rounded" loading="lazy">
                </div>
            `)
            .join('');
    }
    
    // Update links
    if (linksEl) {
        let linksHTML = '';
        
        if (data.liveUrl) {
            linksHTML += `
                <a href="${data.liveUrl}" class="btn btn-primary" target="_blank" rel="noopener">
                    <i class="fas fa-external-link-alt"></i> View Live Demo
                </a>
            `;
        }
        
        if (data.githubUrl) {
            linksHTML += `
                <a href="${data.githubUrl}" class="btn btn-outline-primary" target="_blank" rel="noopener">
                    <i class="fab fa-github"></i> View Code
                </a>
            `;
        }
        
        linksEl.innerHTML = linksHTML;
    }
    
    // Update results section if available
    const resultsEl = modal.querySelector('.portfolio-results');
    if (resultsEl && data.results) {
        let resultsHTML = '<h6>Key Results:</h6><div class="row">';
        
        Object.entries(data.results).forEach(([key, value]) => {
            resultsHTML += `
                <div class="col-sm-6 col-md-3 mb-3">
                    <div class="text-center">
                        <div class="h4 text-primary">${value}</div>
                        <div class="small">${key}</div>
                    </div>
                </div>
            `;
        });
        
        resultsHTML += '</div>';
        resultsEl.innerHTML = resultsHTML;
    }
    
    // Add audio samples if available (for voice projects)
    if (data.audioSamples) {
        const audioContainer = modal.querySelector('.portfolio-audio');
        if (audioContainer) {
            let audioHTML = '<h6>Audio Samples:</h6>';
            
            data.audioSamples.forEach((audioUrl, index) => {
                audioHTML += `
                    <div class="mb-3">
                        <label class="form-label">Sample ${index + 1}:</label>
                        <audio controls class="w-100">
                            <source src="${audioUrl}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                `;
            });
            
            audioContainer.innerHTML = audioHTML;
        }
    }
}

// Service worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// Preloader management
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Ensure animations have time to initialize
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 1000);
    }
});

// Enhanced error handling and fallbacks
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // If animations fail, ensure basic functionality still works
    if (!thanatsittAnimations || !thanatsittAnimations.isInitialized) {
        console.log('🔄 Attempting animation system recovery...');
        
        setTimeout(() => {
            try {
                if (!thanatsittAnimations) {
                    thanatsittAnimations = new ThanatsittAnimations();
                }
            } catch (recoveryError) {
                console.error('❌ Animation system recovery failed:', recoveryError);
                
                // Initialize minimal fallback animations
                document.querySelectorAll('[data-aos]').forEach(element => {
                    element.style.opacity = '1';
                    element.style.transform = 'none';
                });
            }
        }, 2000);
    }
});

// Unhandled promise rejection handling
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default behavior (logging to console)
    event.preventDefault();
    
    // Show user-friendly error message if it's critical
    if (thanatsittAnimations && event.reason?.message?.includes('animation')) {
        thanatsittAnimations.showNotification(
            'Some animations may not work properly, but the site is still functional.',
            'warning'
        );
    }
});

// Export for potential external usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThanatsittAnimations, ParticleSystem };
}

// Debug helpers (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugAnimations = {
        getStats: () => thanatsittAnimations?.getPerformanceStats(),
        setPerformanceMode: (mode) => thanatsittAnimations?.setPerformanceMode(mode),
        pauseAnimations: () => thanatsittAnimations?.pauseAnimations(),
        resumeAnimations: () => thanatsittAnimations?.resumeAnimations(),
        enablePowerSave: () => thanatsittAnimations?.enablePowerSaveMode(),
        disablePowerSave: () => thanatsittAnimations?.disablePowerSaveMode(),
        destroy: () => thanatsittAnimations?.destroy()
    };
    
    console.log('🚀 Debug helpers available via window.debugAnimations');
}

// Final initialization check
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!thanatsittAnimations || !thanatsittAnimations.isInitialized) {
            console.warn('⚠️ Animation system not properly initialized, using fallback');
            
            // Apply basic reveal animations
            document.querySelectorAll('.scroll-reveal, [data-aos]').forEach((element, index) => {
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                    element.style.transition = 'all 0.6s ease';
                }, index * 100);
            });
        }
    }, 3000);
});

console.log('🎬 Thanatsitt Animations v2.1 - Complete System Loaded');

