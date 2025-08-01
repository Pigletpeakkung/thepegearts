/**
 * ANIMATIONS.JS - Thanatsitt Professional Website
 * Complete JavaScript animation system with celestial effects
 * Handles dynamic movements, particles, interactions, and performance optimization
 * Version: 2.0 - Enhanced with full celestial system
 */

class ThanaAnimations {
    constructor() {
        this.version = '2.0';
        this.init();
        this.setupEventListeners();
        this.initializeAnimations();
        
        // Performance monitoring
        this.performanceMode = this.detectPerformanceMode();
        this.frameCount = 0;
        this.lastFPSCheck = 0;
        this.currentFPS = 60;
        
        console.log(`🎬 Thanatsitt Animations v${this.version} initialized`);
    }

    init() {
        // Motion preferences
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches;
        this.isLowPowerMode = this.detectLowPowerMode();
        
        // Canvas setup
        this.particleCanvas = document.getElementById('particlesCanvas');
        this.ctx = this.particleCanvas?.getContext('2d');
        
        // Animation arrays
        this.particles = [];
        this.stars = [];
        this.shootingStars = [];
        this.cosmicParticles = [];
        this.mouseTrail = [];
        
        // Animation IDs
        this.animationId = null;
        this.typewriterTimeout = null;
        this.counterAnimations = new Map();
        
        // Mouse and interaction
        this.mousePos = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.mouseVelocity = { x: 0, y: 0 };
        this.isMouseMoving = false;
        
        // Scroll tracking
        this.scrollPos = 0;
        this.lastScrollPos = 0;
        this.scrollVelocity = 0;
        this.isScrolling = false;
        
        // Performance tracking
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.averageFPS = 60;
        this.frameHistory = [];
        
        // Animation states
        this.animations = {
            hero: false,
            particles: false,
            stars: false,
            moon: false,
            typewriter: false,
            counters: false,
            celestial: false
        };
        
        // Celestial system
        this.celestialSystem = {
            moon: null,
            moonGlow: null,
            constellations: [],
            auroras: []
        };
        
        // Audio context for sound-reactive animations
        this.audioContext = null;
        this.audioAnalyser = null;
        this.audioData = null;
    }

    detectPerformanceMode() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        
        // Low performance indicators
        if (connection && connection.effectiveType === '2g') return 'low';
        if (memory < 2) return 'low';
        if (cores < 2) return 'low';
        
        // High performance indicators
        if (memory >= 8 && cores >= 8) return 'high';
        if (connection && (connection.effectiveType === '4g' || connection.effectiveType === '5g')) {
            return memory >= 4 ? 'high' : 'medium';
        }
        
        return 'medium';
    }

    detectLowPowerMode() {
        return navigator.getBattery ? navigator.getBattery().then(battery => battery.charging === false && battery.level < 0.2) : false;
    }

    setupEventListeners() {
        // Mouse movement with throttling
        let mouseThrottle = null;
        document.addEventListener('mousemove', (e) => {
            if (mouseThrottle) return;
            
            mouseThrottle = setTimeout(() => {
                this.lastMousePos = { ...this.mousePos };
                this.mousePos.x = e.clientX;
                this.mousePos.y = e.clientY;
                
                // Calculate mouse velocity
                this.mouseVelocity.x = this.mousePos.x - this.lastMousePos.x;
                this.mouseVelocity.y = this.mousePos.y - this.lastMousePos.y;
                this.isMouseMoving = true;
                
                // Add to mouse trail
                this.addMouseTrail(e.clientX, e.clientY);
                
                clearTimeout(this.mouseStopTimeout);
                this.mouseStopTimeout = setTimeout(() => {
                    this.isMouseMoving = false;
                }, 100);
                
                mouseThrottle = null;
            }, 16); // ~60fps
        });

        // Touch events for mobile
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.mousePos.x = touch.clientX;
                this.mousePos.y = touch.clientY;
            }
        }, { passive: true });

        // Scroll handling with throttling
        let scrollThrottle = null;
        window.addEventListener('scroll', () => {
            if (scrollThrottle) return;
            
            scrollThrottle = setTimeout(() => {
                this.lastScrollPos = this.scrollPos;
                this.scrollPos = window.pageYOffset;
                this.scrollVelocity = this.scrollPos - this.lastScrollPos;
                this.isScrolling = true;
                
                this.handleScroll();
                
                clearTimeout(this.scrollStopTimeout);
                this.scrollStopTimeout = setTimeout(() => {
                    this.isScrolling = false;
                }, 150);
                
                scrollThrottle = null;
            }, 16);
        }, { passive: true });

        // Resize handler with debouncing
        let resizeTimeout = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
                this.repositionCelestialElements();
                this.recalculateParticles();
            }, 250);
        });

        // Visibility change (page focus/blur)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });

        // Intersection observers
        this.setupIntersectionObservers();

        // Reduced motion preference change
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.isReducedMotion = e.matches;
            if (this.isReducedMotion) {
                this.stopAllAnimations();
            } else {
                this.initializeAnimations();
            }
        });

        // Battery API
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                battery.addEventListener('levelchange', () => {
                    if (battery.level < 0.15 && !battery.charging) {
                        this.enablePowerSaveMode();
                    }
                });
            });
        }

        // Network change
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                const connection = navigator.connection;
                if (connection.effectiveType === '2g' || connection.saveData) {
                    this.enableDataSaveMode();
                }
            });
        }
    }

    setupIntersectionObservers() {
        const options = {
            threshold: [0.1, 0.3, 0.5, 0.7],
            rootMargin: '50px'
        };

        // Hero section observer
        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                    if (!this.animations.hero) {
                        this.startHeroAnimations();
                        this.animations.hero = true;
                    }
                }
            });
        }, options);

        const heroSection = document.getElementById('home');
        if (heroSection) {
            heroObserver.observe(heroSection);
        }

        // Section reveal observer
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
                    entry.target.classList.add('reveal-animate');
                    
                    // Trigger section-specific animations
                    this.triggerSectionAnimations(entry.target);
                }
            });
        }, { threshold: 0.2, rootMargin: '100px' });

        // Observe all sections and animated elements
        document.querySelectorAll('section, .animate-on-scroll').forEach(element => {
            revealObserver.observe(element);
        });

        // Skill bars observer
        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateSkillBars(entry.target);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.skill-bar, .progress-bar').forEach(bar => {
            skillObserver.observe(bar);
        });
    }

    initializeAnimations() {
        if (this.isReducedMotion) {
            console.log('🚫 Animations disabled: Reduced motion preference');
            return;
        }

        this.setupCanvas();
        this.createParticleSystem();
        this.createCelestialSystem();
        this.initializeAudioContext();
        this.startAnimationLoop();
        
        console.log('✨ Animation systems initialized');
    }

    setupCanvas() {
        if (!this.particleCanvas || !this.ctx) return;

        this.resizeCanvas();
        
        // Set canvas styles for better performance
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Set initial canvas properties
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    resizeCanvas() {
        if (!this.particleCanvas || !this.ctx) return;

        const rect = this.particleCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.particleCanvas.width = rect.width * dpr;
        this.particleCanvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.particleCanvas.style.width = rect.width + 'px';
        this.particleCanvas.style.height = rect.height + 'px';
    }

    createParticleSystem() {
        if (!this.ctx) return;

        const particleCount = this.getOptimalParticleCount();
        this.particles = [];

        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createParticle());
        }

        console.log(`🌟 Created ${particleCount} particles`);
    }

    getOptimalParticleCount() {
        const baseCount = window.innerWidth < 768 ? 20 : 40;
        
        switch (this.performanceMode) {
            case 'low': return Math.floor(baseCount * 0.5);
            case 'high': return Math.floor(baseCount * 1.5);
            default: return baseCount;
        }
    }

    createParticle() {
        return {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.8 + 0.2,
            baseOpacity: Math.random() * 0.8 + 0.2,
            pulseSpeed: Math.random() * 0.02 + 0.01,
            pulsePhase: Math.random() * Math.PI * 2,
            color: this.getRandomParticleColor(),
            life: 1,
            maxLife: Math.random() * 1000 + 500,
            trail: [],
            connections: 0
        };
    }

    getRandomParticleColor() {
        const colors = [
            { r: 167, g: 139, b: 250, a: 0.8 }, // Primary purple
            { r: 249, g: 168, b: 212, a: 0.6 }, // Secondary pink
            { r: 110, g: 231, b: 183, a: 0.7 }, // Accent green
            { r: 252, g: 211, b: 77, a: 0.5 },  // Gold accent
            { r: 99, g: 179, b: 237, a: 0.6 }   // Blue accent
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createCelestialSystem() {
        this.createDynamicStars();
        this.createShootingStars();
        this.createCosmicParticles();
        this.createConstellations();
        this.setupMoonSystem();
        
        console.log('🌙 Celestial system created');
    }

    createDynamicStars() {
        const container = document.querySelector('.floating-elements') || document.body;
        const starCount = this.performanceMode === 'low' ? 15 : 
                         this.performanceMode === 'high' ? 35 : 25;
        
        // Clear existing stars
        container.querySelectorAll('.dynamic-star').forEach(star => star.remove());
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = `star dynamic-star ${this.getRandomStarSize()}`;
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            star.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            // Add random movement
            star.style.setProperty('--float-x', (Math.random() - 0.5) * 20 + 'px');
            star.style.setProperty('--float-y', (Math.random() - 0.5) * 20 + 'px');
            
            container.appendChild(star);
            this.stars.push({
                element: star,
                baseX: parseFloat(star.style.left),
                baseY: parseFloat(star.style.top),
                parallaxFactor: Math.random() * 0.5 + 0.1
            });
        }
    }

    getRandomStarSize() {
        const sizes = ['star-small', 'star-medium', 'star-large'];
        const weights = [0.6, 0.3, 0.1];
        
        const random = Math.random();
        let cumulativeWeight = 0;
        
        for (let i = 0; i < sizes.length; i++) {
            cumulativeWeight += weights[i];
            if (random <= cumulativeWeight) {
                return sizes[i];
            }
        }
        return sizes[0];
    }

    createShootingStars() {
        const container = document.querySelector('.floating-elements') || document.body;
        
        // Create shooting stars with random timing
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createShootingStar(container);
            }, Math.random() * 10000 + 5000); // Random delay between 5-15 seconds
        }
    }

    createShootingStar(container) {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        shootingStar.style.left = Math.random() * 100 + '%';
        shootingStar.style.top = Math.random() * 50 + '%'; // Keep in upper half
        
        container.appendChild(shootingStar);
        
        // Remove after animation
        setTimeout(() => {
            if (shootingStar.parentNode) {
                shootingStar.parentNode.removeChild(shootingStar);
            }
            
            // Create new shooting star after delay
            setTimeout(() => {
                this.createShootingStar(container);
            }, Math.random() * 20000 + 10000); // Random delay between 10-30 seconds
        }, 3000);
    }

    createCosmicParticles() {
        const container = document.querySelector('.floating-elements') || document.body;
        const particleCount = this.performanceMode === 'low' ? 10 : 20;
        
        // Clear existing cosmic particles
        container.querySelectorAll('.dynamic-cosmic-particle').forEach(p => p.remove());
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'cosmic-particle dynamic-cosmic-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 8 + 's';
            particle.style.animationDuration = (Math.random() * 4 + 8) + 's';
            
            // Add color variation
            const colors = [
                'rgba(167, 139, 250, 0.8)',
                'rgba(249, 168, 212, 0.6)',
                'rgba(110, 231, 183, 0.7)',
                'rgba(252, 211, 77, 0.5)'
            ];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            container.appendChild(particle);
            this.cosmicParticles.push({
                element: particle,
                baseX: parseFloat(particle.style.left),
                baseY: parseFloat(particle.style.top),
                parallaxFactor: Math.random() * 0.3 + 0.1
            });
        }
    }

    createConstellations() {
        if (this.performanceMode === 'low') return;
        
        const container = document.querySelector('.floating-elements') || document.body;
        
        // Create SVG for constellation lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'constellation-svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '1';
        
        container.appendChild(svg);
        
        // Create constellation patterns
        this.drawConstellation(svg, [
            { x: 20, y: 30 }, { x: 35, y: 25 }, { x: 50, y: 40 }, { x: 30, y: 50 }
        ]);
        
        this.drawConstellation(svg, [
            { x: 70, y: 20 }, { x: 85, y: 35 }, { x: 75, y: 50 }, { x: 90, y: 45 }
        ]);
    }

    drawConstellation(svg, points) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let pathData = `M ${points[0].x}% ${points[0].y}%`;
        
        for (let i = 1; i < points.length; i++) {
            pathData += ` L ${points[i].x}% ${points[i].y}%`;
        }
        
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
        path.setAttribute('stroke-width', '1');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-dasharray', '100');
        path.setAttribute('stroke-dashoffset', '100');
        path.style.animation = 'constellation 8s ease-in-out infinite';
        
        svg.appendChild(path);
    }

    setupMoonSystem() {
        const container = document.querySelector('.floating-elements') || document.body;
        
        // Remove existing moon elements
        container.querySelectorAll('.moon, .moon-glow').forEach(el => el.remove());
        
        // Create moon
        const moon = document.createElement('div');
        moon.className = 'moon';
        container.appendChild(moon);
        
        // Create moon glow
        const moonGlow = document.createElement('div');
        moonGlow.className = 'moon-glow';
        container.appendChild(moonGlow);
        
        this.celestialSystem.moon = moon;
        this.celestialSystem.moonGlow = moonGlow;
        
        // Add interactive moon effects
        moon.addEventListener('mouseenter', () => {
            moon.style.animationPlayState = 'paused';
            moon.style.transform = 'scale(1.1)';
            moon.style.transition = 'transform 0.3s ease';
        });
        
        moon.addEventListener('mouseleave', () => {
            moon.style.animationPlayState = 'running';
            moon.style.transform = 'scale(1)';
        });
    }

    initializeAudioContext() {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioAnalyser = this.audioContext.createAnalyser();
            this.audioAnalyser.fftSize = 256;
            this.audioData = new Uint8Array(this.audioAnalyser.frequencyBinCount);
            
            console.log('🎵 Audio context initialized for reactive animations');
        } catch (error) {
            console.warn('Audio context initialization failed:', error);
        }
    }

    connectAudioSource(audioElement) {
        if (!this.audioContext || !this.audioAnalyser) return;
        
        try {
            const source = this.audioContext.createMediaElementSource(audioElement);
            source.connect(this.audioAnalyser);
            this.audioAnalyser.connect(this.audioContext.destination);
            
            console.log('🎵 Audio source connected for reactive animations');
        } catch (error) {
            console.warn('Audio source connection failed:', error);
        }
    }

    startAnimationLoop() {
        if (this.isReducedMotion || this.animationId) return;

        this.animationId = requestAnimationFrame(this.animate.bind(this));
        console.log('🎬 Animation loop started');
    }

    animate(currentTime) {
        if (!this.ctx || this.isReducedMotion) return;

        // Calculate delta time and FPS
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Update FPS tracking
        this.updateFPSTracking(currentTime);
        
        // Skip frame if performance is poor
        if (this.shouldSkipFrame()) {
            this.animationId = requestAnimationFrame(this.animate.bind(this));
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        
        // Update and render systems
        this.updateParticles();
        this.drawParticles();
        this.drawConnections();
        this.drawMouseTrail();
        this.updateAudioReactiveElements();
        
        // Continue animation loop
        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }

    updateFPSTracking(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFPSCheck >= 1000) {
            this.currentFPS = Math.round((this.frameCount * 1000) / (currentTime - this.lastFPSCheck));
            this.frameHistory.push(this.currentFPS);
            
            if (this.frameHistory.length > 10) {
                this.frameHistory.shift();
            }
            
            this.averageFPS = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
            
            // Adjust performance if needed
            if (this.averageFPS < 30) {
                this.optimizePerformance();
            }
            
            this.frameCount = 0;
            this.lastFPSCheck = currentTime;
        }
    }

    shouldSkipFrame() {
        return this.averageFPS < 20 || this.deltaTime > 50;
    }

    optimizePerformance() {
        if (this.particles.length > 10) {
            this.particles.splice(0, Math.floor(this.particles.length * 0.2));
            console.log('🔧 Reduced particle count for performance');
        }
        
        // Reduce cosmic particles
        const cosmicElements = document.querySelectorAll('.dynamic-cosmic-particle');
        for (let i = cosmicElements.length - 1; i >= Math.floor(cosmicElements.length / 2); i--) {
            cosmicElements[i].remove();
        }
    }

    updateParticles() {
        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Boundary collision with energy loss
            if (particle.x <= 0 || particle.x >= window.innerWidth) {
                particle.vx *= -0.8;
                particle.x = Math.max(0, Math.min(window.innerWidth, particle.x));
            }
            if (particle.y <= 0 || particle.y >= window.innerHeight) {
                particle.vy *= -0.8;
                particle.y = Math.max(0, Math.min(window.innerHeight, particle.y));
            }

            // Mouse interaction
            if (this.isMouseMoving) {
                const dx = this.mousePos.x - particle.x;
                const dy = this.mousePos.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    const force = (120 - distance) / 120;
                    const angle = Math.atan2(dy, dx);
                    
                    particle.vx += Math.cos(angle) * force * 0.02;
                    particle.vy += Math.sin(angle) * force * 0.02;
                    
                    // Increase opacity near mouse
                    particle.opacity = Math.min(1, particle.baseOpacity + force * 0.5);
                } else {
                    particle.opacity = particle.baseOpacity;
                }
            }

            // Pulse effect
            particle.pulsePhase += particle.pulseSpeed;
            particle.opacity += Math.sin(particle.pulsePhase) * 0.2;

            // Velocity dampening
            particle.vx *= 0.995;
            particle.vy *= 0.995;

            // Life cycle
            particle.life--;
            if (particle.life <= 0) {
                this.particles[index] = this.createParticle();
            }

            // Trail effect
            particle.trail.push({ x: particle.x, y: particle.y, opacity: particle.opacity });
            if (particle.trail.length > 5) {
                particle.trail.shift();
            }
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            // Draw trail
            if (particle.trail.length > 1) {
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'lighter';
                
                for (let i = 1; i < particle.trail.length; i++) {
                    const point = particle.trail[i];
                    const prevPoint = particle.trail[i - 1];
                    const alpha = (i / particle.trail.length) * particle.opacity * 0.3;
                    
                    this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
                    this.ctx.strokeStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
                    this.ctx.lineWidth = particle.size * 0.5;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(prevPoint.x, prevPoint.y);
                    this.ctx.lineTo(point.x, point.y);
                    this.ctx.stroke();
                }
                
                this.ctx.restore();
            }

            // Draw particle
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, Math.min(1, particle.opacity));
            this.ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.opacity})`;
            
            // Add glow effect
            this.ctx.shadowBlur = particle.size * 2;
            this.ctx.shadowColor = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0.8)`;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }

    drawConnections() {
        const maxDistance = 100;
        const maxConnections = 3;
        
        for (let i = 0; i < this.particles.length; i++) {
            const particleA = this.particles[i];
            particleA.connections = 0;
            
            for (let j = i + 1; j < this.particles.length; j++) {
                if (particleA.connections >= maxConnections) break;
                
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
                    
                    particleA.connections++;
                }
            }
        }
    }

    addMouseTrail(x, y) {
        this.mouseTrail.push({
            x: x,
            y: y,
            life: 20,
            maxLife: 20,
            size: Math.random() * 3 + 2
        });

        // Limit trail length
        if (this.mouseTrail.length > 15) {
            this.mouseTrail.shift();
        }
    }

    drawMouseTrail() {
        if (!this.isMouseMoving || this.mouseTrail.length === 0) return;

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';

        this.mouseTrail.forEach((point, index) => {
            point.life--;
            const alpha = (point.life / point.maxLife) * 0.6;
            
            if (alpha > 0) {
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = `rgba(167, 139, 250, ${alpha})`;
                this.ctx.shadowBlur = point.size * 2;
                this.ctx.shadowColor = `rgba(167, 139, 250, ${alpha})`;
                
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, point.size * (point.life / point.maxLife), 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Remove dead trail points
        this.mouseTrail = this.mouseTrail.filter(point => point.life > 0);
        
        this.ctx.restore();
    }

    updateAudioReactiveElements() {
        if (!this.audioAnalyser || !this.audioData) return;

        this.audioAnalyser.getByteFrequencyData(this.audioData);
        
        // Calculate average volume
        const average = this.audioData.reduce((sum, value) => sum + value, 0) / this.audioData.length;
        const normalizedVolume = average / 255;

        // Affect particle movement based on audio
        if (normalizedVolume > 0.1) {
            this.particles.forEach(particle => {
                const bassResponse = this.audioData.slice(0, 10).reduce((sum, val) => sum + val, 0) / (10 * 255);
                const trebleResponse = this.audioData.slice(-10).reduce((sum, val) => sum + val, 0) / (10 * 255);
                
                particle.vx += (Math.random() - 0.5) * bassResponse * 0.5;
                particle.vy += (Math.random() - 0.5) * trebleResponse * 0.5;
                particle.size = particle.baseSize + normalizedVolume * 2;
            });
        }

        // Update waveform visualization
        this.updateWaveformBars(this.audioData);
    }

    updateWaveformBars(audioData) {
        const waveformBars = document.querySelectorAll('.waveform-bar');
        
        waveformBars.forEach((bar, index) => {
            const dataIndex = Math.floor((index / waveformBars.length) * audioData.length);
            const value = audioData[dataIndex] / 255;
            const height = Math.max(0.1, value);
            
            bar.style.transform = `scaleY(${height * 2})`;
            bar.style.opacity = 0.3 + (value * 0.7);
        });
    }

    startHeroAnimations() {
        console.log('🎭 Starting hero animations');
        
        // Animate hero elements in sequence
        const elements = [
            { selector: '.hero-title', delay: 0, animation: 'fadeInUp' },
            { selector: '.hero-subtitle', delay: 200, animation: 'fadeInUp' },
            { selector: '.hero-description', delay: 400, animation: 'fadeInUp' },
            { selector: '.hero-stats', delay: 600, animation: 'fadeInUp' },
            { selector: '.hero-actions', delay: 800, animation: 'fadeInUp' },
            { selector: '.social-links', delay: 1000, animation: 'fadeInUp' }
        ];

        elements.forEach(({ selector, delay, animation }) => {
            setTimeout(() => {
                const element = document.querySelector(selector);
                if (element) {
                    this.animateElement(element, animation);
                }
            }, delay);
        });

        // Start typewriter effect
        setTimeout(() => {
            this.startTypewriterEffect('.hero-subtitle .typewriter-text');
        }, 300);

        // Start counter animations
        setTimeout(() => {
            this.animateCounters();
        }, 800);

        // Add floating elements
        setTimeout(() => {
            this.addFloatingElements();
        }, 1200);
    }

    animateElement(element, animationType = 'fadeInUp') {
        element.style.opacity = '0';
        element.style.transform = this.getTransformForAnimation(animationType, 'start');
        element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = this.getTransformForAnimation(animationType, 'end');
        });
    }

    getTransformForAnimation(type, state) {
        const transforms = {
            fadeInUp: {
                start: 'translateY(30px)',
                end: 'translateY(0)'
            },
            fadeInDown: {
                start: 'translateY(-30px)',
                end: 'translateY(0)'
            },
            fadeInLeft: {
                start: 'translateX(-30px)',
                end: 'translateX(0)'
            },
            fadeInRight: {
                start: 'translateX(30px)',
                end: 'translateX(0)'
            },
            scaleIn: {
                start: 'scale(0.8)',
                end: 'scale(1)'
            }
        };
        
        return transforms[type]?.[state] || 'none';
    }

    startTypewriterEffect(selector) {
        const element = document.querySelector(selector);
        if (!element) return;

        const text = element.textContent;
        const speed = 100; // ms per character
        
        element.textContent = '';
        element.style.borderRight = '2px solid var(--primary-color)';
        
        let index = 0;
        const typeInterval = setInterval(() => {
            element.textContent += text[index];
            index++;
            
            if (index >= text.length) {
                clearInterval(typeInterval);
                
                // Remove cursor after delay
                setTimeout(() => {
                    element.style.borderRight = 'none';
                }, 1000);
            }
        }, speed);

        this.typewriterTimeout = typeInterval;
    }

    animateCounters() {
        const counters = document.querySelectorAll('[data-counter]');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-counter'));
            const duration = parseInt(counter.getAttribute('data-duration')) || 2000;
            const startValue = parseInt(counter.getAttribute('data-start')) || 0;
            
            this.animateCounter(counter, startValue, target, duration);
        });
    }

    animateCounter(element, start, end, duration) {
        const startTime = performance.now();
        const range = end - start;
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (range * easeOut));
            
            element.textContent = this.formatNumber(current);
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = this.formatNumber(end);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    addFloatingElements() {
        const container = document.querySelector('.hero') || document.body;
        const elementCount = this.performanceMode === 'low' ? 3 : 6;
        
        for (let i = 0; i < elementCount; i++) {
            const element = document.createElement('div');
            element.className = 'floating-decoration';
            element.style.position = 'absolute';
            element.style.width = Math.random() * 20 + 10 + 'px';
            element.style.height = element.style.width;
            element.style.background = `rgba(167, 139, 250, ${Math.random() * 0.3 + 0.1})`;
            element.style.borderRadius = Math.random() > 0.5 ? '50%' : '20%';
            element.style.left = Math.random() * 100 + '%';
            element.style.top = Math.random() * 100 + '%';
            element.style.animation = `float ${Math.random() * 3 + 3}s ease-in-out infinite`;
            element.style.animationDelay = Math.random() * 2 + 's';
            element.style.pointerEvents = 'none';
            element.style.zIndex = '1';
            
            container.appendChild(element);
            
            // Remove after 30 seconds to prevent DOM bloat
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 30000);
        }
    }

    triggerSectionAnimations(section) {
        const sectionId = section.id;
        
        switch (sectionId) {
            case 'about':
                this.animateAboutSection(section);
                break;
            case 'services':
                this.animateServicesSection(section);
                break;
            case 'portfolio':
                this.animatePortfolioSection(section);
                break;
            case 'voice-demos':
                this.animateVoiceDemosSection(section);
                break;
            case 'contact':
                this.animateContactSection(section);
                break;
        }
    }

    animateAboutSection(section) {
        const elements = section.querySelectorAll('.skill-item, .about-text, .profile-image');
        
        elements.forEach((element, index) => {
            setTimeout(() => {
                this.animateElement(element, 'fadeInUp');
            }, index * 100);
        });
    }

    animateServicesSection(section) {
        const serviceCards = section.querySelectorAll('.service-card');
        
        serviceCards.forEach((card, index) => {
            setTimeout(() => {
                this.animateElement(card, 'scaleIn');
                
                // Add hover enhancement
                this.enhanceCardHover(card);
            }, index * 150);
        });
    }

    animatePortfolioSection(section) {
        const portfolioItems = section.querySelectorAll('.portfolio-card');
        
        portfolioItems.forEach((item, index) => {
            setTimeout(() => {
                this.animateElement(item, 'fadeInUp');
                this.setupPortfolioCardEffects(item);
            }, index * 100);
        });
    }

    animateVoiceDemosSection(section) {
        const voiceCards = section.querySelectorAll('.voice-demo-card');
        
        voiceCards.forEach((card, index) => {
            setTimeout(() => {
                this.animateElement(card, 'fadeInLeft');
                this.setupVoiceCardEffects(card);
            }, index * 120);
        });
    }

    animateContactSection(section) {
        const formGroups = section.querySelectorAll('.form-group');
        const contactInfo = section.querySelectorAll('.contact-info-item');
        
        formGroups.forEach((group, index) => {
            setTimeout(() => {
                this.animateElement(group, 'fadeInUp');
            }, index * 100);
        });
        
        contactInfo.forEach((info, index) => {
            setTimeout(() => {
                this.animateElement(info, 'fadeInRight');
            }, index * 80);
        });
    }

    enhanceCardHover(card) {
        let isHovering = false;
        
        card.addEventListener('mouseenter', () => {
            isHovering = true;
            this.createCardParticles(card);
        });
        
        card.addEventListener('mouseleave', () => {
            isHovering = false;
        });
        
        card.addEventListener('mousemove', (e) => {
            if (!isHovering) return;
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Create subtle parallax effect
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const deltaX = (x - centerX) / centerX;
            const deltaY = (y - centerY) / centerY;
            
            card.style.transform = `
                translateY(-5px) 
                scale(1.02) 
                rotateX(${deltaY * 5}deg) 
                rotateY(${deltaX * 5}deg)
            `;
        });
    }

    createCardParticles(card) {
        if (this.performanceMode === 'low') return;
        
        const rect = card.getBoundingClientRect();
        const particleCount = 5;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = 'var(--primary-color)';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.style.left = rect.left + Math.random() * rect.width + 'px';
            particle.style.top = rect.top + Math.random() * rect.height + 'px';
            
            document.body.appendChild(particle);
            
            // Animate particle
            const animation = particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)', 
                    opacity: 1 
                },
                { 
                    transform: `translate(${(Math.random() - 0.5) * 100}px, ${-Math.random() * 100}px) scale(0)`, 
                    opacity: 0 
                }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            });
            
            animation.onfinish = () => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            };
        }
    }

    setupPortfolioCardEffects(card) {
        const overlay = card.querySelector('.portfolio-overlay');
        const actions = card.querySelector('.portfolio-actions');
        
        if (!overlay || !actions) return;
        
        card.addEventListener('mouseenter', () => {
            overlay.style.opacity = '1';
            
            const buttons = actions.querySelectorAll('.btn');
            buttons.forEach((btn, index) => {
                setTimeout(() => {
                    btn.style.transform = 'translateY(0)';
                    btn.style.opacity = '1';
                }, index * 100);
            });
        });
        
        card.addEventListener('mouseleave', () => {
            overlay.style.opacity = '0';
            
            const buttons = actions.querySelectorAll('.btn');
            buttons.forEach(btn => {
                btn.style.transform = 'translateY(20px)';
                btn.style.opacity = '0';
            });
        });
    }

    setupVoiceCardEffects(card) {
        const playBtn = card.querySelector('.play-pause-btn');
        const waveform = card.querySelector('.waveform');
        const audio = card.querySelector('audio');
        
        if (!playBtn || !audio) return;
        
        let isPlaying = false;
        
        playBtn.addEventListener('click', () => {
            if (isPlaying) {
                audio.pause();
                this.stopWaveformAnimation(waveform);
                playBtn.classList.remove('playing');
            } else {
                // Pause all other audio
                document.querySelectorAll('audio').forEach(a => {
                    if (a !== audio) a.pause();
                });
                document.querySelectorAll('.play-pause-btn').forEach(btn => {
                    btn.classList.remove('playing');
                });
                
                audio.play();
                this.startWaveformAnimation(waveform);
                playBtn.classList.add('playing');
                
                // Connect to audio analyser if available
                if (this.audioContext) {
                    this.connectAudioSource(audio);
                }
            }
            
            isPlaying = !isPlaying;
        });
        
        audio.addEventListener('ended', () => {
            this.stopWaveformAnimation(waveform);
            playBtn.classList.remove('playing');
            isPlaying = false;
        });
    }

    startWaveformAnimation(waveform) {
        if (!waveform) return;
        
        const bars = waveform.querySelectorAll('.waveform-bar');
        
        bars.forEach((bar, index) => {
            bar.style.animation = `waveform ${Math.random() * 0.5 + 0.8}s ease-in-out infinite`;
            bar.style.animationDelay = `${index * 0.1}s`;
        });
    }

    stopWaveformAnimation(waveform) {
        if (!waveform) return;
        
        const bars = waveform.querySelectorAll('.waveform-bar');
        bars.forEach(bar => {
            bar.style.animation = 'none';
            bar.style.transform = 'scaleY(1)';
        });
    }

    animateSkillBars(container) {
        const skillBars = container.querySelectorAll('.skill-progress, .progress-bar');
        
        skillBars.forEach(bar => {
            const percentage = bar.getAttribute('data-percentage') || 
                             bar.getAttribute('data-progress') || 
                             bar.style.getPropertyValue('--progress-width') || '0%';
            
            bar.style.width = '0%';
            bar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                bar.style.width = percentage;
            }, 200);
        });
    }

    handleScroll() {
        const scrolled = this.scrollPos;
        const rate = scrolled * -0.5;
        const velocity = this.scrollVelocity;

        // Parallax effects for celestial elements
        this.updateParallaxElements(rate, velocity);
        
        // Update progress indicators
        this.updateScrollProgress();
        
        // Navbar scroll effects
        this.updateNavbarOnScroll(scrolled);
        
        // Section reveal effects
        this.checkSectionVisibility();
    }

    updateParallaxElements(rate, velocity) {
        // Moon parallax
        if (this.celestialSystem.moon) {
            const moonRate = rate * 0.3;
            this.celestialSystem.moon.style.transform = `translateY(${moonRate}px)`;
        }
        
        if (this.celestialSystem.moonGlow) {
            const glowRate = rate * 0.25;
            this.celestialSystem.moonGlow.style.transform = `translateY(${glowRate}px)`;
        }

        // Stars parallax
        this.stars.forEach((star, index) => {
            const speed = star.parallaxFactor;
            const parallaxY = rate * speed;
            const velocityEffect = velocity * 0.1;
            
            star.element.style.transform = `translateY(${parallaxY + velocityEffect}px)`;
        });

        // Cosmic particles parallax
        this.cosmicParticles.forEach((particle, index) => {
            const speed = particle.parallaxFactor;
            const parallaxY = rate * speed;
            
            particle.element.style.transform = `translateY(${parallaxY}px)`;
        });
    }

    updateScrollProgress() {
        const scrollProgress = document.querySelector('.scroll-progress');
        if (!scrollProgress) return;
        
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (this.scrollPos / scrollHeight) * 100;
        
        scrollProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    updateNavbarOnScroll(scrolled) {
        const navbar = document.getElementById('mainNavbar');
        if (!navbar) return;
        
        if (scrolled > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar based on scroll direction
        if (Math.abs(this.scrollVelocity) > 5) {
            if (this.scrollVelocity > 0 && scrolled > 200) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
        }
    }

    checkSectionVisibility() {
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight * 0.8 && rect.bottom > 0;
            
            if (isVisible && !section.classList.contains('section-visible')) {
                section.classList.add('section-visible');
                this.triggerSectionAnimations(section);
            }
        });
    }

    repositionCelestialElements() {
        // Reposition stars
        this.createDynamicStars();
        
        // Reposition cosmic particles
        this.createCosmicParticles();
        
        // Recreate particle system
        this.createParticleSystem();
        
        console.log('🔄 Celestial elements repositioned');
    }

    recalculateParticles() {
        const newCount = this.getOptimalParticleCount();
        const currentCount = this.particles.length;
        
        if (newCount > currentCount) {
            // Add particles
            for (let i = 0; i < newCount - currentCount; i++) {
                this.particles.push(this.createParticle());
            }
        } else if (newCount < currentCount) {
            // Remove particles
            this.particles.splice(0, currentCount - newCount);
        }
    }

    enablePowerSaveMode() {
        console.log('🔋 Enabling power save mode');
        
        // Reduce particle count
        this.particles = this.particles.slice(0, Math.floor(this.particles.length * 0.3));
        
        // Disable some effects
        const cosmicElements = document.querySelectorAll('.cosmic-particle, .shooting-star');
        cosmicElements.forEach(el => {
            el.style.animationPlayState = 'paused';
        });
        
        // Reduce animation frequency
        this.targetFPS = 30;
    }

    enableDataSaveMode() {
        console.log('📶 Enabling data save mode');
        
        // Remove heavy visual effects
        const heavyElements = document.querySelectorAll('.aurora-bg, .starfield');
        heavyElements.forEach(el => el.style.display = 'none');
        
        // Reduce particle count significantly
        this.particles = this.particles.slice(0, 5);
        
        // Disable audio reactive features
        this.audioContext = null;
        this.audioAnalyser = null;
    }

    pauseAnimations() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Clear timeouts
        if (this.typewriterTimeout) {
            clearTimeout(this.typewriterTimeout);
        }
        
        console.log('⏸️ Animations paused');
    }

    resumeAnimations() {
        if (!this.isReducedMotion && !this.animationId) {
            this.startAnimationLoop();
            console.log('▶️ Animations resumed');
        }
    }

    stopAllAnimations() {
        this.pauseAnimations();
        
        // Clear canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
        }
        
        // Stop CSS animations
        document.body.classList.add('reduce-motion');
        
        // Clear all particles
        this.particles = [];
        this.mouseTrail = [];
        
        console.log('⏹️ All animations stopped');
    }

    // Public API methods
    getPerformanceStats() {
        return {
            fps: Math.round(this.currentFPS),
            averageFPS: Math.round(this.averageFPS),
            particles: this.particles.length,
            stars: this.stars.length,
            cosmicParticles: this.cosmicParticles.length,
            animationActive: !!this.animationId,
            performanceMode: this.performanceMode,
            reducedMotion: this.isReducedMotion,
            version: this.version
        };
    }

    setPerformanceMode(mode) {
        this.performanceMode = mode;
        this.recalculateParticles();
        
        if (mode === 'low') {
            this.enablePowerSaveMode();
        }
        
        console.log(`🎛️ Performance mode set to: ${mode}`);
    }

    addCustomAnimation(selector, animationType, options = {}) {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((element, index) => {
            setTimeout(() => {
                this.animateElement(element, animationType);
            }, (options.delay || 0) + (index * (options.stagger || 100)));
        });
    }

    triggerCustomEffect(effectName, options = {}) {
        switch (effectName) {
            case 'starburst':
                this.createStarburstEffect(options);
                break;
            case 'particleExplosion':
                this.createParticleExplosion(options);
                break;
            case 'waveRipple':
                this.createWaveRipple(options);
                break;
        }
    }

    createStarburstEffect(options) {
        const { x = window.innerWidth / 2, y = window.innerHeight / 2, count = 12 } = options;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                size: Math.random() * 4 + 2,
                color: this.getRandomParticleColor(),
                life: 60,
                opacity: 1
            };
            
            this.particles.push(particle);
        }
    }

    createParticleExplosion(options) {
        const { x = this.mousePos.x, y = this.mousePos.y, intensity = 20 } = options;
        
        for (let i = 0; i < intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                color: this.getRandomParticleColor(),
                life: Math.random() * 60 + 30,
                opacity: 1,
                gravity: 0.1
            };
            
            this.particles.push(particle);
        }
    }

    createWaveRipple(options) {
        const { x = this.mousePos.x, y = this.mousePos.y } = options;
        
        // Create ripple element
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '10px';
        ripple.style.height = '10px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid rgba(167, 139, 250, 0.8)';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '9999';
        
        document.body.appendChild(ripple);
        
        // Animate ripple
        const animation = ripple.animate([
            { 
                transform: 'translate(-50%, -50%) scale(1)', 
                opacity: 1 
            },
            { 
                transform: 'translate(-50%, -50%) scale(20)', 
                opacity: 0 
            }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
        
        animation.onfinish = () => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        };
    }

    destroy() {
        this.stopAllAnimations();
        
        // Remove event listeners
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.resizeCanvas);
        document.removeEventListener('mousemove', this.updateMousePosition);
        
        // Clear all arrays
        this.particles = [];
        this.stars = [];
        this.cosmicParticles = [];
        this.mouseTrail = [];
        
        // Remove created elements
        document.querySelectorAll('.dynamic-star, .dynamic-cosmic-particle, .floating-decoration').forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
        
                console.log('🗑️ Animation system destroyed and cleaned up');
    }
}

// Utility functions for animations
const AnimationUtils = {
    // Easing functions
    easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOut: (t) => t * (2 - t),
    easeIn: (t) => t * t,
    easeOutBounce: (t) => {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    },

    // Color utilities
    hexToRgba: (hex, alpha = 1) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b, a: alpha };
    },

    rgbaToString: (color) => `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,

    // Random utilities
    randomBetween: (min, max) => Math.random() * (max - min) + min,
    randomChoice: (array) => array[Math.floor(Math.random() * array.length)],

    // Animation helpers
    lerp: (start, end, factor) => start + (end - start) * factor,
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    
    // Performance utilities
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    debounce: (func, wait) => {
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
};

// Animation presets for common effects
const AnimationPresets = {
    heroEntrance: {
        title: { animation: 'fadeInUp', delay: 0, duration: 800 },
        subtitle: { animation: 'fadeInUp', delay: 200, duration: 800 },
        description: { animation: 'fadeInUp', delay: 400, duration: 800 },
        actions: { animation: 'fadeInUp', delay: 600, duration: 800 },
        social: { animation: 'fadeInUp', delay: 800, duration: 800 }
    },

    cardReveal: {
        animation: 'scaleIn',
        stagger: 150,
        duration: 600,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },

    slideIn: {
        from: { transform: 'translateX(-100%)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
        duration: 600,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },

    bounce: {
        keyframes: [
            { transform: 'translateY(0)' },
            { transform: 'translateY(-20px)' },
            { transform: 'translateY(0)' }
        ],
        duration: 600,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
};

// Advanced particle systems
class AdvancedParticleSystem {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.forces = [];
        this.emitters = [];
        
        this.options = {
            maxParticles: options.maxParticles || 100,
            gravity: options.gravity || 0,
            friction: options.friction || 0.99,
            bounds: options.bounds || true,
            ...options
        };
    }

    addEmitter(x, y, options = {}) {
        const emitter = {
            x, y,
            rate: options.rate || 5,
            angle: options.angle || 0,
            spread: options.spread || Math.PI / 4,
            speed: options.speed || { min: 1, max: 3 },
            life: options.life || { min: 30, max: 60 },
            size: options.size || { min: 1, max: 3 },
            color: options.color || { r: 255, g: 255, b: 255, a: 1 },
            lastEmit: 0,
            active: true
        };
        
        this.emitters.push(emitter);
        return emitter;
    }

    addForce(x, y, strength, radius) {
        this.forces.push({ x, y, strength, radius });
    }

    update() {
        // Update emitters
        this.emitters.forEach(emitter => {
            if (!emitter.active) return;
            
            const now = Date.now();
            if (now - emitter.lastEmit > 1000 / emitter.rate) {
                this.emit(emitter);
                emitter.lastEmit = now;
            }
        });

        // Update particles
        this.particles.forEach((particle, index) => {
            // Apply forces
            this.forces.forEach(force => {
                const dx = force.x - particle.x;
                const dy = force.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < force.radius) {
                    const forceStrength = (force.radius - distance) / force.radius * force.strength;
                    const angle = Math.atan2(dy, dx);
                    
                    particle.vx += Math.cos(angle) * forceStrength;
                    particle.vy += Math.sin(angle) * forceStrength;
                }
            });

            // Apply gravity
            particle.vy += this.options.gravity;

            // Apply friction
            particle.vx *= this.options.friction;
            particle.vy *= this.options.friction;

            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Update life
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;

            // Boundary collision
            if (this.options.bounds) {
                if (particle.x <= 0 || particle.x >= this.canvas.width) {
                    particle.vx *= -0.8;
                    particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
                }
                if (particle.y <= 0 || particle.y >= this.canvas.height) {
                    particle.vy *= -0.8;
                    particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
                }
            }

            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }

    emit(emitter) {
        if (this.particles.length >= this.options.maxParticles) return;

        const angle = emitter.angle + (Math.random() - 0.5) * emitter.spread;
        const speed = AnimationUtils.randomBetween(emitter.speed.min, emitter.speed.max);
        const life = AnimationUtils.randomBetween(emitter.life.min, emitter.life.max);
        const size = AnimationUtils.randomBetween(emitter.size.min, emitter.size.max);

        const particle = {
            x: emitter.x,
            y: emitter.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size,
            life: life,
            maxLife: life,
            alpha: 1,
            color: { ...emitter.color }
        };

        this.particles.push(particle);
    }

    render() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = AnimationUtils.rgbaToString({
                ...particle.color,
                a: particle.alpha
            });
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }
}

// Special effects system
class SpecialEffectsSystem {
    constructor(container) {
        this.container = container;
        this.effects = [];
    }

    createFireworks(x, y, colors = null) {
        const defaultColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'
        ];
        
        const effectColors = colors || defaultColors;
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework-particle';
            particle.style.position = 'absolute';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = AnimationUtils.randomChoice(effectColors);
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            
            this.container.appendChild(particle);
            
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = AnimationUtils.randomBetween(50, 150);
            const duration = AnimationUtils.randomBetween(1000, 2000);
            
            const animation = particle.animate([
                { 
                    transform: 'translate(-50%, -50%) scale(1)', 
                    opacity: 1 
                },
                { 
                    transform: `translate(${Math.cos(angle) * velocity - 2}px, ${Math.sin(angle) * velocity - 2}px) scale(0)`, 
                    opacity: 0 
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.4, 0, 0.6, 1)'
            });
            
            animation.onfinish = () => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            };
        }
    }

    createTextReveal(element, options = {}) {
        const text = element.textContent;
        const chars = text.split('');
        
        element.innerHTML = '';
        
        chars.forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'translateY(20px)';
            span.style.transition = `all ${options.duration || 0.6}s cubic-bezier(0.4, 0, 0.2, 1)`;
            
            element.appendChild(span);
            
            setTimeout(() => {
                span.style.opacity = '1';
                span.style.transform = 'translateY(0)';
            }, index * (options.stagger || 50));
        });
    }

    createRippleEffect(x, y, color = 'rgba(167, 139, 250, 0.5)') {
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '0';
        ripple.style.height = '0';
        ripple.style.borderRadius = '50%';
        ripple.style.border = `2px solid ${color}`;
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '9999';
        
        this.container.appendChild(ripple);
        
        const maxSize = Math.max(window.innerWidth, window.innerHeight) * 0.5;
        
        const animation = ripple.animate([
            { 
                width: '0px', 
                height: '0px', 
                opacity: 1 
            },
            { 
                width: maxSize + 'px', 
                height: maxSize + 'px', 
                opacity: 0 
            }
        ], {
            duration: 800,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
        
        animation.onfinish = () => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        };
    }

    createMagnetEffect(element, strength = 0.3) {
        let isActive = false;
        
        const handleMouseMove = (e) => {
            if (!isActive) return;
            
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = e.clientX - centerX;
            const deltaY = e.clientY - centerY;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = 200;
            
            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance * strength;
                const angle = Math.atan2(deltaY, deltaX);
                
                const moveX = Math.cos(angle) * force * 20;
                const moveY = Math.sin(angle) * force * 20;
                
                element.style.transform = `translate(${moveX}px, ${moveY}px) scale(${1 + force * 0.1})`;
            }
        };
        
        element.addEventListener('mouseenter', () => {
            isActive = true;
            document.addEventListener('mousemove', handleMouseMove);
        });
        
        element.addEventListener('mouseleave', () => {
            isActive = false;
            element.style.transform = 'translate(0, 0) scale(1)';
            document.removeEventListener('mousemove', handleMouseMove);
        });
    }
}

// Performance monitor for animations
class AnimationPerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            memory: 0,
            particles: 0,
            droppedFrames: 0
        };
        
        this.history = [];
        this.observers = [];
        this.thresholds = {
            lowFPS: 30,
            highFrameTime: 33,
            memoryWarning: 50 * 1024 * 1024 // 50MB
        };
    }

    startMonitoring() {
        this.startTime = performance.now();
        this.frameCount = 0;
        this.lastFrameTime = this.startTime;
        
        this.monitorLoop();
    }

    monitorLoop() {
        const now = performance.now();
        this.frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        this.frameCount++;
        
        // Update FPS every second
        if (now - this.startTime >= 1000) {
            this.metrics.fps = Math.round((this.frameCount / (now - this.startTime)) * 1000);
            this.metrics.frameTime = this.frameTime;
            
            // Get memory usage if available
            if (performance.memory) {
                this.metrics.memory = performance.memory.usedJSHeapSize;
            }
            
            // Check performance thresholds
            this.checkThresholds();
            
            // Reset counters
            this.frameCount = 0;
            this.startTime = now;
        }
        
        requestAnimationFrame(() => this.monitorLoop());
    }

    checkThresholds() {
        const warnings = [];
        
        if (this.metrics.fps < this.thresholds.lowFPS) {
            warnings.push({ type: 'low-fps', value: this.metrics.fps });
        }
        
        if (this.metrics.frameTime > this.thresholds.highFrameTime) {
            warnings.push({ type: 'high-frame-time', value: this.metrics.frameTime });
        }
        
        if (this.metrics.memory > this.thresholds.memoryWarning) {
            warnings.push({ type: 'memory-warning', value: this.metrics.memory });
        }
        
        if (warnings.length > 0) {
            this.notifyObservers(warnings);
        }
    }

    addObserver(callback) {
        this.observers.push(callback);
    }

    notifyObservers(warnings) {
        this.observers.forEach(callback => callback(warnings, this.metrics));
    }

    getMetrics() {
        return { ...this.metrics };
    }
}

// Initialize the animation system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global animation instance
    window.ThanaAnimations = new ThanaAnimations();
    
    // Create performance monitor
    window.AnimationMonitor = new AnimationPerformanceMonitor();
    
    // Create special effects system
    window.SpecialEffects = new SpecialEffectsSystem(document.body);
    
    // Add performance monitoring
    window.AnimationMonitor.addObserver((warnings, metrics) => {
        console.warn('🚨 Performance warnings:', warnings);
        
        // Auto-optimize if performance is poor
        if (warnings.some(w => w.type === 'low-fps')) {
            window.ThanaAnimations.setPerformanceMode('low');
        }
    });
    
    // Start monitoring
    window.AnimationMonitor.startMonitoring();
    
    // Setup global event listeners for special effects
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-primary') || 
            e.target.classList.contains('cta-button')) {
                        window.SpecialEffects.createRippleEffect(e.clientX, e.clientY);
        }
        
        // Easter egg - double click for fireworks
        if (e.detail === 2) {
            window.SpecialEffects.createFireworks(e.clientX, e.clientY);
        }
    });
    
    // Setup voice demo enhancements
    document.querySelectorAll('.voice-demo-card').forEach(card => {
        window.SpecialEffects.createMagnetEffect(card, 0.2);
    });
    
    // Setup text reveals for headings
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('text-revealed')) {
                window.SpecialEffects.createTextReveal(entry.target, {
                    duration: 0.8,
                    stagger: 30
                });
                entry.target.classList.add('text-revealed');
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('h1, h2, h3').forEach(heading => {
        observer.observe(heading);
    });
    
    console.log('🚀 Advanced animation system fully loaded and ready!');
});

// Intersection Observer polyfill fallback
if (!window.IntersectionObserver) {
    console.warn('IntersectionObserver not supported, loading fallback');
    
    // Simple fallback for older browsers
    window.IntersectionObserver = class {
        constructor(callback, options = {}) {
            this.callback = callback;
            this.options = options;
            this.elements = new Set();
            this.startWatching();
        }
        
        observe(element) {
            this.elements.add(element);
        }
        
        unobserve(element) {
            this.elements.delete(element);
        }
        
        disconnect() {
            this.elements.clear();
            if (this.interval) {
                clearInterval(this.interval);
            }
        }
        
        startWatching() {
            this.interval = setInterval(() => {
                this.elements.forEach(element => {
                    const rect = element.getBoundingClientRect();
                    const isIntersecting = rect.top < window.innerHeight && rect.bottom > 0;
                    
                    this.callback([{
                        target: element,
                        isIntersecting,
                        intersectionRatio: isIntersecting ? 0.5 : 0
                    }]);
                });
            }, 100);
        }
    };
}

// Utility functions for external use
window.AnimationUtils = {
    ...AnimationUtils,
    
    // Quick animation methods
    fadeIn: (element, duration = 300) => {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    },
    
    fadeOut: (element, duration = 300) => {
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    },
    
    slideUp: (element, duration = 300) => {
        const height = element.scrollHeight;
        element.style.transition = `height ${duration}ms ease-in-out`;
        element.style.height = height + 'px';
        
        requestAnimationFrame(() => {
            element.style.height = '0';
            element.style.paddingTop = '0';
            element.style.paddingBottom = '0';
            element.style.marginTop = '0';
            element.style.marginBottom = '0';
        });
        
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    },
    
    slideDown: (element, duration = 300) => {
        element.style.removeProperty('display');
        let display = window.getComputedStyle(element).display;
        if (display === 'none') display = 'block';
        element.style.display = display;
        
        const height = element.scrollHeight;
        element.style.overflow = 'hidden';
        element.style.height = '0';
        element.style.paddingTop = '0';
        element.style.paddingBottom = '0';
        element.style.marginTop = '0';
        element.style.marginBottom = '0';
        
        element.offsetHeight; // Trigger reflow
        
        element.style.boxSizing = 'border-box';
        element.style.transition = `height ${duration}ms ease-in-out`;
        element.style.height = height + 'px';
        element.style.removeProperty('padding-top');
        element.style.removeProperty('padding-bottom');
        element.style.removeProperty('margin-top');
        element.style.removeProperty('margin-bottom');
        
        setTimeout(() => {
            element.style.removeProperty('height');
            element.style.removeProperty('overflow');
            element.style.removeProperty('transition');
        }, duration);
    },
    
    // Scroll animations
    scrollToElement: (element, duration = 800, offset = 0) => {
        const targetPosition = element.offsetTop - offset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();
        
        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = AnimationUtils.easeInOut(progress);
            
            window.scrollTo(0, startPosition + (distance * easeProgress));
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };
        
        requestAnimationFrame(animateScroll);
    },
    
    // Element animations
    shake: (element, intensity = 10, duration = 600) => {
        const originalTransform = element.style.transform;
        const animation = element.animate([
            { transform: 'translateX(0)' },
            { transform: `translateX(-${intensity}px)` },
            { transform: `translateX(${intensity}px)` },
            { transform: 'translateX(0)' }
        ], {
            duration: duration / 4,
            iterations: 4,
            easing: 'ease-in-out'
        });
        
        animation.onfinish = () => {
            element.style.transform = originalTransform;
        };
    },
    
    pulse: (element, scale = 1.1, duration = 300) => {
        const originalTransform = element.style.transform;
        const animation = element.animate([
            { transform: 'scale(1)' },
            { transform: `scale(${scale})` },
            { transform: 'scale(1)' }
        ], {
            duration: duration,
            easing: 'ease-in-out'
        });
        
        animation.onfinish = () => {
            element.style.transform = originalTransform;
        };
    },
    
    // Number animations
    animateNumber: (element, start, end, duration = 1000, formatter = null) => {
        const startTime = performance.now();
        const range = end - start;
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = AnimationUtils.easeOut(progress);
            const current = start + (range * easeProgress);
            
            const value = Math.floor(current);
            element.textContent = formatter ? formatter(value) : value;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = formatter ? formatter(end) : end;
            }
        };
        
        requestAnimationFrame(updateNumber);
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ThanaAnimations,
        AnimationUtils,
        AnimationPresets,
        AdvancedParticleSystem,
        SpecialEffectsSystem,
        AnimationPerformanceMonitor
    };
}

// Global animations configuration
window.ANIMATION_CONFIG = {
    // Performance settings
    performance: {
        targetFPS: 60,
        maxParticles: 100,
        reducedMotionRespect: true,
        autoOptimize: true,
        powerSaveMode: false,
        dataSaveMode: false
    },
    
    // Visual settings
    visual: {
        particleOpacity: 0.8,
        connectionOpacity: 0.5,
        trailLength: 5,
        glowIntensity: 1.0,
        colorSaturation: 1.0
    },
    
    // Animation timings
    timings: {
        heroEntrance: 800,
        sectionReveal: 600,
        cardHover: 300,
        buttonPress: 150,
        typewriter: 100,
        counter: 2000
    },
    
    // Celestial settings
    celestial: {
        moonOrbitDuration: 60000, // 60 seconds
        starTwinkleRate: 3000,
        shootingStarFrequency: 15000,
        particleFloatSpeed: 8000,
        auroraShiftSpeed: 15000
    },
    
    // Interaction settings
    interaction: {
        mouseInfluence: 120,
        scrollParallax: 0.5,
        audioReactive: true,
        clickEffects: true,
        hoverEffects: true
    }
};

// Debug utilities (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.ANIMATION_DEBUG = {
        showFPS: () => {
            const fpsDisplay = document.createElement('div');
            fpsDisplay.id = 'fps-display';
            fpsDisplay.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(fpsDisplay);
            
            setInterval(() => {
                if (window.AnimationMonitor) {
                    const metrics = window.AnimationMonitor.getMetrics();
                    fpsDisplay.innerHTML = `
                        FPS: ${metrics.fps}<br>
                        Frame Time: ${metrics.frameTime.toFixed(2)}ms<br>
                        Particles: ${metrics.particles}<br>
                        Memory: ${(metrics.memory / 1024 / 1024).toFixed(2)}MB
                    `;
                }
            }, 1000);
        },
        
        showParticles: () => {
            if (window.ThanaAnimations && window.ThanaAnimations.ctx) {
                const canvas = window.ThanaAnimations.particleCanvas;
                canvas.style.border = '1px solid red';
                canvas.style.opacity = '1';
                canvas.style.zIndex = '9999';
            }
        },
        
        logPerformance: () => {
            if (window.AnimationMonitor) {
                console.table(window.AnimationMonitor.getMetrics());
                console.log('Animation Performance Stats:', window.ThanaAnimations.getPerformanceStats());
            }
        },
        
        testAnimations: () => {
            console.log('🧪 Testing animations...');
            
            // Test particle explosion
            if (window.ThanaAnimations) {
                window.ThanaAnimations.triggerCustomEffect('particleExplosion', {
                    x: window.innerWidth / 2,
                    y: window.innerHeight / 2,
                    intensity: 30
                });
            }
            
            // Test fireworks
            if (window.SpecialEffects) {
                setTimeout(() => {
                    window.SpecialEffects.createFireworks(
                        Math.random() * window.innerWidth,
                        Math.random() * window.innerHeight / 2
                    );
                }, 1000);
            }
            
            console.log('✅ Animation tests completed');
        }
    };
    
    // Auto-show FPS in debug mode
    if (localStorage.getItem('showAnimationDebug') === 'true') {
        setTimeout(() => {
            window.ANIMATION_DEBUG.showFPS();
        }, 1000);
    }
    
    console.log('🐛 Animation debug utilities available:', Object.keys(window.ANIMATION_DEBUG));
}

// Service worker integration for performance
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PERFORMANCE_WARNING') {
            console.warn('🔋 Service worker reports low performance, enabling power save mode');
            if (window.ThanaAnimations) {
                window.ThanaAnimations.enablePowerSaveMode();
            }
        }
    });
}

// Battery API integration
if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
        const checkBattery = () => {
            if (battery.level < 0.2 && !battery.charging) {
                console.log('🔋 Low battery detected, optimizing animations');
                if (window.ThanaAnimations) {
                    window.ThanaAnimations.enablePowerSaveMode();
                }
            }
        };
        
        battery.addEventListener('levelchange', checkBattery);
        battery.addEventListener('chargingchange', checkBattery);
        checkBattery(); // Initial check
    });
}

// Network-aware animations
if (navigator.connection) {
    const connection = navigator.connection;
    
    const adaptToConnection = () => {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === '2g' || connection.saveData) {
            console.log('📶 Slow connection detected, reducing animations');
            if (window.ThanaAnimations) {
                window.ThanaAnimations.enableDataSaveMode();
            }
        }
    };
    
    connection.addEventListener('change', adaptToConnection);
    adaptToConnection(); // Initial check
}

// Memory pressure handling (Chrome)
if (performance.measureUserAgentSpecificMemory) {
    setInterval(async () => {
        try {
            const memoryInfo = await performance.measureUserAgentSpecificMemory();
            const totalMemory = memoryInfo.bytes;
            
            // If memory usage is high, reduce particles
            if (totalMemory > 100 * 1024 * 1024) { // 100MB threshold
                console.log('🧠 High memory usage detected, optimizing');
                if (window.ThanaAnimations && window.ThanaAnimations.particles.length > 20) {
                    window.ThanaAnimations.particles = window.ThanaAnimations.particles.slice(0, 10);
                }
            }
        } catch (error) {
            // Memory API not available or failed
        }
    }, 30000); // Check every 30 seconds
}

console.log(`
🎬 Thanatsitt Advanced Animation System v2.0
✨ Features loaded:
   - Advanced particle system with physics
   - Celestial effects (moon, stars, aurora)
   - Audio-reactive animations  
   - Performance monitoring & auto-optimization
   - Special effects system
   - Accessibility support
   - Mobile optimization
   - Debug utilities (dev mode)
   
🚀 Ready to animate!
`);

// Animation system is now fully loaded and ready
window.dispatchEvent(new CustomEvent('animationSystemReady', {
    detail: {
        version: '2.0',
        features: [
            'particles', 'celestial', 'audio-reactive', 
            'performance-monitoring', 'special-effects',
            'accessibility', 'mobile-optimized'
        ]
    }
}));



