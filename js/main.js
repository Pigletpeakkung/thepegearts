/**
 * Pegearts Portfolio - Complete Enhanced Main JavaScript
 * Advanced interactive features with cosmic animations and all functionality
 * Author: Thanatsitt Santisamranwilai (Pegearts)
 * Version: 2.0.0 - Enhanced with Advanced Animations System
 */

// Enhanced Global Configuration and State
const PegeArts = {
    config: {
        animationDuration: 300,
        scrollOffset: 80,
        particleCount: 100,
        starCount: 200,
        typingSpeed: 50,
        autoSaveInterval: 30000,
        notificationDuration: 5000,
        audioFadeTime: 500,
        portfolioTransitionTime: 400,
        mouseTrailLength: 15,
        parallaxIntensity: 0.5,
        morphingDuration: 600,
        textAnimationStagger: 100,
        performanceThreshold: 60,
        maxParticles: 150,
        debounceDelay: 250,
        throttleDelay: 16
    },
    
    state: {
        isLoaded: false,
        currentSection: 'home',
        isScrolling: false,
        isMobile: window.innerWidth <= 768,
        isTablet: window.innerWidth <= 1024,
        theme: localStorage.getItem('theme') || 'auto',
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        currentAudio: null,
        portfolioFilter: 'all',
        formData: new Map(),
        activeAnimations: new Set(),
        performanceMode: 'auto',
        networkSpeed: 'unknown',
        deviceMemory: navigator.deviceMemory || 4,
        hardwareConcurrency: navigator.hardwareConcurrency || 4
    },
    
    elements: {},
    animations: {},
    observers: {},
    audioPlayers: new Map(),
    particleSystems: new Map(),
    
    // Enhanced Utility Functions
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
                },
                connection: this.getConnectionInfo()
            };
        },
        
        getBrowserInfo() {
            const ua = navigator.userAgent;
            if (ua.indexOf('Chrome') > -1) return 'Chrome';
            if (ua.indexOf('Firefox') > -1) return 'Firefox';
            if (ua.indexOf('Safari') > -1) return 'Safari';
            if (ua.indexOf('Edge') > -1) return 'Edge';
            return 'Unknown';
        },
        
        getConnectionInfo() {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (!connection) return { type: 'unknown', speed: 'unknown' };
            
            return {
                type: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0,
                saveData: connection.saveData || false
            };
        },
        
        // Mathematical easing functions
        easing: {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInQuart: t => t * t * t * t,
            easeOutQuart: t => 1 - (--t) * t * t * t,
            easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
            easeOutBounce: t => {
                if (t < 1 / 2.75) return 7.5625 * t * t;
                if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            },
            easeOutElastic: t => {
                if (t === 0) return 0;
                if (t === 1) return 1;
                return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * (2 * Math.PI) / 0.4) + 1;
            }
        },
        
        // Color utilities
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        
        rgbToHex(r, g, b) {
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        },
        
        interpolateColor(color1, color2, factor) {
            const rgb1 = this.hexToRgb(color1);
            const rgb2 = this.hexToRgb(color2);
            if (!rgb1 || !rgb2) return color1;
            
            const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
            const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
            const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));
            
            return this.rgbToHex(r, g, b);
        }
    }
};

// =============================================================================
// ENHANCED COSMIC ANIMATION SYSTEM
// =============================================================================

class CosmicAnimationEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.stars = [];
        this.particles = [];
        this.comets = [];
        this.nebulaClouds = [];
        this.mousePosition = { x: 0, y: 0 };
        this.animationFrame = null;
        this.isActive = true;
        this.performanceMode = 'high';
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.createCelestialObjects();
        this.startAnimation();
        
        // Adjust performance based on device capabilities
        this.adjustPerformance();
    }
    
    createCanvas() {
        // Create main canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'cosmic-canvas';
        this.canvas.className = 'cosmic-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.8;
        `;
        
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        document.body.appendChild(this.canvas);
        
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
    }
    
    setupEventListeners() {
        window.addEventListener('resize', PegeArts.utils.throttle(() => {
            this.resizeCanvas();
            this.redistributeCelestialObjects();
        }, 250));
        
        document.addEventListener('mousemove', PegeArts.utils.throttle((e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
            this.createMouseTrail(e.clientX, e.clientY);
        }, PegeArts.config.throttleDelay));
        
        document.addEventListener('visibilitychange', () => {
            this.isActive = !document.hidden;
            if (this.isActive && !this.animationFrame) {
                this.startAnimation();
            }
        });
    }
    
    adjustPerformance() {
        const deviceInfo = PegeArts.utils.getDeviceInfo();
        const connection = deviceInfo.connection;
        
        if (PegeArts.state.deviceMemory < 4 || deviceInfo.isMobile) {
            this.performanceMode = 'low';
            PegeArts.config.particleCount = 30;
            PegeArts.config.starCount = 50;
        } else if (connection.saveData || connection.type === 'slow-2g' || connection.type === '2g') {
            this.performanceMode = 'medium';
            PegeArts.config.particleCount = 50;
            PegeArts.config.starCount = 100;
        } else {
            this.performanceMode = 'high';
        }
        
        PegeArts.state.performanceMode = this.performanceMode;
        console.log(`🎭 Cosmic Engine: Performance mode set to ${this.performanceMode}`);
    }
    
    createCelestialObjects() {
        this.createStars();
        this.createParticles();
        this.createComets();
        this.createNebulaClouds();
    }
    
    createStars() {
        const starCount = Math.min(PegeArts.config.starCount, this.performanceMode === 'low' ? 50 : 200);
        
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                phase: Math.random() * Math.PI * 2,
                color: this.getRandomStarColor(),
                brightness: Math.random() * 0.8 + 0.2,
                type: this.getStarType()
            });
        }
    }
    
    getRandomStarColor() {
        const colors = [
            '#ffffff', '#fff8dc', '#87ceeb', '#ffd700', 
            '#ff6b6b', '#4ecdc4', '#a78bfa', '#f9a8d4'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getStarType() {
        const types = ['normal', 'giant', 'dwarf', 'binary'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    createParticles() {
        const particleCount = Math.min(PegeArts.config.particleCount, this.performanceMode === 'low' ? 30 : 100);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 4 + 1,
                color: this.getRandomParticleColor(),
                opacity: Math.random() * 0.6 + 0.2,
                life: Math.random() * 100 + 50,
                maxLife: 100,
                trail: []
            });
        }
    }
    
    getRandomParticleColor() {
        const colors = [
            '#a78bfa', '#f9a8d4', '#6ee7b7', '#fcd34d', 
            '#60a5fa', '#fb7185', '#34d399', '#fbbf24'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createComets() {
        if (this.performanceMode === 'low') return;
        
        for (let i = 0; i < 3; i++) {
            this.createComet();
        }
    }
    
    createComet() {
        const startSide = Math.floor(Math.random() * 4);
        let x, y, vx, vy;
        
        switch (startSide) {
            case 0: // Top
                x = Math.random() * this.canvas.width;
                y = -50;
                vx = (Math.random() - 0.5) * 2;
                vy = Math.random() * 2 + 1;
                break;
            case 1: // Right
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                vx = -(Math.random() * 2 + 1);
                vy = (Math.random() - 0.5) * 2;
                break;
            case 2: // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                vx = (Math.random() - 0.5) * 2;
                vy = -(Math.random() * 2 + 1);
                break;
            case 3: // Left
                x = -50;
                y = Math.random() * this.canvas.height;
                vx = Math.random() * 2 + 1;
                vy = (Math.random() - 0.5) * 2;
                break;
        }
        
        this.comets.push({
            x, y, vx, vy,
            size: Math.random() * 3 + 2,
            color: '#ffffff',
            trail: [],
            maxTrailLength: 20,
            life: 200
        });
    }
    
    createNebulaClouds() {
        if (this.performanceMode === 'low') return;
        
        for (let i = 0; i < 3; i++) {
            this.nebulaClouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 150 + 100,
                color: this.getRandomNebulaColor(),
                opacity: Math.random() * 0.3 + 0.1,
                pulseSpeed: Math.random() * 0.01 + 0.005,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    getRandomNebulaColor() {
        const colors = ['#a78bfa', '#f9a8d4', '#6ee7b7', '#60a5fa'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createMouseTrail(x, y) {
        if (this.performanceMode === 'low') return;
        
        this.particles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            color: '#a78bfa',
            opacity: 0.8,
            life: 30,
            maxLife: 30,
            trail: [],
            isMouseParticle: true
        });
    }
    
    redistributeCelestialObjects() {
        // Redistribute objects when canvas resizes
        this.stars.forEach(star => {
            if (star.x > this.canvas.width) star.x = Math.random() * this.canvas.width;
            if (star.y > this.canvas.height) star.y = Math.random() * this.canvas.height;
        });
        
        this.particles.forEach(particle => {
            if (particle.x > this.canvas.width) particle.x = Math.random() * this.canvas.width;
            if (particle.y > this.canvas.height) particle.y = Math.random() * this.canvas.height;
        });
    }
    
    startAnimation() {
        if (!this.isActive) return;
        
        this.animate();
    }
    
    animate() {
        if (!this.isActive) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw nebula clouds (background)
        this.updateNebulaClouds();
        
        // Draw particles
        this.updateParticles();
        
        // Draw stars
        this.updateStars();
        
        // Draw comets (foreground)
        this.updateComets();
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    updateNebulaClouds() {
        this.nebulaClouds.forEach((cloud, index) => {
            cloud.phase += cloud.pulseSpeed;
            const pulseFactor = Math.sin(cloud.phase) * 0.3 + 0.7;
            
            const gradient = this.ctx.createRadialGradient(
                cloud.x, cloud.y, 0,
                cloud.x, cloud.y, cloud.radius * pulseFactor
            );
            
            const rgb = PegeArts.utils.hexToRgb(cloud.color);
            gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${cloud.opacity * pulseFactor})`);
            gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${cloud.opacity * 0.3})`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.radius * pulseFactor, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    updateStars() {
        this.stars.forEach(star => {
            // Twinkling effect
            star.phase += star.twinkleSpeed;
            const twinkle = Math.sin(star.phase) * 0.5 + 0.5;
            const brightness = star.brightness * twinkle;
            
            // Draw star based on type
            this.ctx.save();
            this.ctx.globalAlpha = brightness;
            
            if (star.type === 'giant') {
                this.drawGiantStar(star, brightness);
            } else if (star.type === 'binary') {
                this.drawBinaryStar(star, brightness);
            } else {
                this.drawNormalStar(star, brightness);
            }
            
            this.ctx.restore();
        });
    }
    
    drawNormalStar(star, brightness) {
        this.ctx.fillStyle = star.color;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size * brightness, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add glow effect for brighter stars
        if (brightness > 0.8) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.globalAlpha = (brightness - 0.8) * 2.5;
            this.ctx.shadowBlur = star.size * 3;
            this.ctx.shadowColor = star.color;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawGiantStar(star, brightness) {
        const size = star.size * 1.5;
        
        // Main star body
        this.ctx.fillStyle = star.color;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, size * brightness, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cross pattern
        this.ctx.strokeStyle = star.color;
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(star.x - size * 2, star.y);
        this.ctx.lineTo(star.x + size * 2, star.y);
        this.ctx.moveTo(star.x, star.y - size * 2);
        this.ctx.lineTo(star.x, star.y + size * 2);
        this.ctx.stroke();
    }
    
    drawBinaryStar(star, brightness) {
        const offset = 3;
        
        this.ctx.fillStyle = star.color;
        this.ctx.beginPath();
        this.ctx.arc(star.x - offset, star.y, star.size * brightness, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(star.x + offset, star.y, star.size * brightness * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Add to trail
            if (particle.trail.length === 0 || 
                Math.abs(particle.trail[particle.trail.length - 1].x - particle.x) > 2 ||
                Math.abs(particle.trail[particle.trail.length - 1].y - particle.y) > 2) {
                particle.trail.push({ x: particle.x, y: particle.y });
                if (particle.trail.length > 10) {
                    particle.trail.shift();
                }
            }
            
            // Update life
            if (!particle.isMouseParticle) {
                if (particle.x < 0) particle.x = this.canvas.width;
                if (particle.x > this.canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = this.canvas.height;
                if (particle.y > this.canvas.height) particle.y = 0;
            } else {
                particle.life--;
                particle.opacity = (particle.life / particle.maxLife) * 0.8;
            }
            
            // Remove dead particles
            if (particle.isMouseParticle && particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Draw particle
            this.drawParticle(particle);
        }
    }
    
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.opacity;
        
        // Draw trail
        if (particle.trail.length > 1) {
            this.ctx.strokeStyle = particle.color;
            this.ctx.lineWidth = particle.size * 0.3;
            this.ctx.lineCap = 'round';
            this.ctx.globalCompositeOperation = 'lighter';
            
            this.ctx.beginPath();
            this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
            for (let i = 1; i < particle.trail.length; i++) {
                this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
            }
            this.ctx.stroke();
        }
        
        // Draw particle
        this.ctx.fillStyle = particle.color;
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    updateComets() {
        for (let i = this.comets.length - 1; i >= 0; i--) {
            const comet = this.comets[i];
            
            // Update position
            comet.x += comet.vx;
            comet.y += comet.vy;
            
            // Add to trail
            comet.trail.push({ x: comet.x, y: comet.y });
            if (comet.trail.length > comet.maxTrailLength) {
                comet.trail.shift();
            }
            
            // Update life
            comet.life--;
            
            // Remove if out of bounds or dead
            if (comet.life <= 0 || 
                comet.x < -100 || comet.x > this.canvas.width + 100 ||
                comet.y < -100 || comet.y > this.canvas.height + 100) {
                this.comets.splice(i, 1);
                
                // Create new comet occasionally
                if (Math.random() < 0.01) {
                    this.createComet();
                }
                continue;
            }
            
            // Draw comet
            this.drawComet(comet);
        }
    }
    
    drawComet(comet) {
        this.ctx.save();
        
        // Draw trail
        if (comet.trail.length > 1) {
            const gradient = this.ctx.createLinearGradient(
                comet.trail[0].x, comet.trail[0].y,
                comet.x, comet.y
            );
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = comet.size;
            this.ctx.lineCap = 'round';
            this.ctx.globalCompositeOperation = 'lighter';
            
            this.ctx.beginPath();
            this.ctx.moveTo(comet.trail[0].x, comet.trail[0].y);
            for (let i = 1; i < comet.trail.length; i++) {
                this.ctx.lineTo(comet.trail[i].x, comet.trail[i].y);
            }
            this.ctx.stroke();
        }
        
        // Draw comet head
        this.ctx.fillStyle = comet.color;
        this.ctx.shadowBlur = comet.size * 2;
        this.ctx.shadowColor = comet.color;
        this.ctx.globalCompositeOperation = 'lighter';
        
        this.ctx.beginPath();
        this.ctx.arc(comet.x, comet.y, comet.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    // Public methods
    pause() {
        this.isActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    resume() {
        this.isActive = true;
        this.startAnimation();
    }
    
    setPerformanceMode(mode) {
        this.performanceMode = mode;
        this.adjustPerformance();
        this.createCelestialObjects();
    }
    
    destroy() {
        this.pause();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        window.removeEventListener('resize', this.resizeCanvas);
        document.removeEventListener('mousemove', this.updateMousePosition);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}

// =============================================================================
// ENHANCED NAVIGATION SYSTEM
// =============================================================================

class NavigationManager {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('section[id]');
        this.currentSection = 'home';
        this.isScrolling = false;
        this.scrollTimeout = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupActiveStates();
        this.setupSmoothScrolling();
        this.setupScrollSpy();
        this.setupMobileMenu();
    }
    
    setupEventListeners() {
        // Navigation link clicks
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
                this.closeMobileMenu();
            });
        });
        
        // Scroll events
        window.addEventListener('scroll', PegeArts.utils.throttle(() => {
            this.updateActiveSection();
            this.updateNavbarState();
        }, 50), { passive: true });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }
    
    setupActiveStates() {
        // Set initial active state
        this.updateActiveLinks(this.currentSection);
    }
    
    setupSmoothScrolling() {
        // Enhanced smooth scrolling with easing
        this.scrollOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };
    }
    
    setupScrollSpy() {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -80% 0px',
            threshold: 0
        };
        
        this.sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.currentSection = entry.target.id;
                    this.updateActiveLinks(entry.target.id);
                    this.updateAriaStates(entry.target.id);
                    
                    // Track section views
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'section_view', {
                            event_category: 'Navigation',
                            event_label: entry.target.id,
                            non_interaction: true
                        });
                    }
                }
            });
        }, observerOptions);
        
        this.sections.forEach(section => {
            this.sectionObserver.observe(section);
        });
    }
    
    setupMobileMenu() {
        const toggleBtn = document.querySelector('.navbar-toggler');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const navbar = document.querySelector('.navbar-collapse');
            if (navbar && navbar.classList.contains('show')) {
                if (!e.target.closest('.navbar')) {
                    this.closeMobileMenu();
                }
            }
        });
    }
    
    scrollToSection(sectionId, offset = 0) {
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) return;
        
        this.isScrolling = true;
        
        // Clear any existing scroll timeout
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        
        // Calculate scroll position with offset
        const targetPosition = targetSection.offsetTop - (this.navbar.offsetHeight + offset);
        
        // Use custom smooth scroll for better control
        this.smoothScrollTo(targetPosition);
        
        // Update URL without triggering scroll
        history.pushState(null, null, `#${sectionId}`);
        
        // Reset scrolling flag
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, 1000);
        
        // Track navigation
        if (typeof gtag !== 'undefined') {
            gtag('event', 'navigation_click', {
                event_category: 'User Interaction',
                event_label: sectionId,
                value: 1
            });
        }
    }
    
    smoothScrollTo(targetY, duration = 800) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const startTime = Date.now();
        
        const scroll = () => {
            const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);
            const easeProgress = PegeArts.utils.easing.easeInOutCubic(progress);
            
            window.scrollTo(0, startY + distance * easeProgress);
            
            if (progress < 1) {
                requestAnimationFrame(scroll);
            }
        };
        
        requestAnimationFrame(scroll);
    }
    
    updateActiveSection() {
        if (this.isScrolling) return;
        
        const scrollPosition = window.pageYOffset;
        const windowHeight = window.innerHeight;
        
        let current = '';
        
        this.sections.forEach(section => {
            const sectionTop = section.offsetTop - this.navbar.offsetHeight - 50;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                current = section.getAttribute('id');
            }
        });
        
        if (current && current !== this.currentSection) {
            this.currentSection = current;
            this.updateActiveLinks(current);
        }
    }
    
    updateActiveLinks(activeId) {
        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${activeId}`) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
                
                // Add visual feedback
                this.addActiveFeedback(link);
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });
    }
    
    addActiveFeedback(link) {
        const indicator = link.querySelector('.nav-indicator');
        if (indicator) {
            indicator.style.transform = 'scaleX(1)';
            indicator.style.opacity = '1';
        }
        
        // Add ripple effect
        this.createRippleEffect(link);
    }
    
    createRippleEffect(element) {
        const ripple = document.createElement('span');
        ripple.className = 'nav-ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        
        element.appendChild(ripple);
        
        // Trigger animation
        requestAnimationFrame(() => {
            ripple.style.transform = 'translate(-50%, -50%) scale(1)';
            ripple.style.opacity = '0';
        });
        
        // Clean up
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }
    
    updateNavbarState() {
        const scrollPosition = window.pageYOffset;
        
        if (scrollPosition > 100) {
            this.navbar.classList.add('navbar-scrolled');
        } else {
            this.navbar.classList.remove('navbar-scrolled');
        }
        
        // Hide/show navbar on scroll
        if (this.lastScrollTop === undefined) {
            this.lastScrollTop = scrollPosition;
            return;
        }
        
        if (scrollPosition > this.lastScrollTop && scrollPosition > 200) {
            // Scrolling down
            this.navbar.classList.add('navbar-hidden');
        } else {
            // Scrolling up
            this.navbar.classList.remove('navbar-hidden');
        }
        
        this.lastScrollTop = scrollPosition;
    }
    
    updateAriaStates(activeId) {
        this.sections.forEach(section => {
            if (section.id === activeId) {
                section.setAttribute('aria-current', 'page');
            } else {
                section.removeAttribute('aria-current');
            }
        });
    }
    
    handleKeyboardNavigation(e) {
        // Navigation with arrow keys
        if (e.altKey) {
            const currentIndex = Array.from(this.sections).findIndex(section => section.id === this.currentSection);
            
            if (e.key === 'ArrowUp' && currentIndex > 0) {
                e.preventDefault();
                this.scrollToSection(this.sections[currentIndex - 1].id);
            } else if (e.key === 'ArrowDown' && currentIndex < this.sections.length - 1) {
                e.preventDefault();
                this.scrollToSection(this.sections[currentIndex + 1].id);
            }
        }
        
        // Home key to go to top
        if (e.key === 'Home' && e.ctrlKey) {
            e.preventDefault();
            this.scrollToSection('home');
        }
        
        // End key to go to bottom
        if (e.key === 'End' && e.ctrlKey) {
            e.preventDefault();
            this.scrollToSection('contact');
        }
    }
    
    toggleMobileMenu() {
        const navbarCollapse = document.querySelector('.navbar-collapse');
        const toggleBtn = document.querySelector('.navbar-toggler');
        
        if (navbarCollapse.classList.contains('show')) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
    
    openMobileMenu() {
        const navbarCollapse = document.querySelector('.navbar-collapse');
        const toggleBtn = document.querySelector('.navbar-toggler');
        
        navbarCollapse.classList.add('show');
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.classList.add('active');
        
        // Trap focus in menu
        PegeArts.utils.trapFocus(navbarCollapse);
        
        // Animate menu items
        const menuItems = navbarCollapse.querySelectorAll('.nav-item');
        menuItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                item.style.transition = 'opacity 0.3s, transform 0.3s';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }
    
    closeMobileMenu() {
        const navbarCollapse = document.querySelector('.navbar-collapse');
        const toggleBtn = document.querySelector('.navbar-toggler');
        
        navbarCollapse.classList.remove('show');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.classList.remove('active');
        
        // Reset menu item animations
        const menuItems = navbarCollapse.querySelectorAll('.nav-item');
        menuItems.forEach(item => {
            item.style.transition = '';
            item.style.opacity = '';
            item.style.transform = '';
        });
    }
    
    // Public methods
    getCurrentSection() {
        return this.currentSection;
    }
    
    navigateTo(sectionId) {
        this.scrollToSection(sectionId);
    }
    
    destroy() {
        if (this.sectionObserver) {
            this.sectionObserver.disconnect();
        }
        
        // Remove event listeners
        this.navLinks.forEach(link => {
            link.removeEventListener('click', this.handleNavClick);
        });
        
        window.removeEventListener('scroll', this.handleScroll);
        document.removeEventListener('keydown', this.handleKeyboardNavigation);
    }
}

// =============================================================================
// ENHANCED TEXT ANIMATION SYSTEM
// =============================================================================

class TextAnimationEngine {
    constructor() {
        this.animations = new Map();
        this.observer = null;
        this.init();
    }
    
    init() {
        this.setupObserver();
        this.findAnimatedElements();
    }
    
    setupObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.startAnimation(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
    }
    
    findAnimatedElements() {
        const elements = document.querySelectorAll('[data-animate-text]');
        elements.forEach(el => {
            this.observer.observe(el);
        });
    }
    
    startAnimation(element) {
        const animationType = element.getAttribute('data-animate-text');
        const delay = parseInt(element.getAttribute('data-animate-delay')) || 0;
        const duration = parseInt(element.getAttribute('data-animate-duration')) || 1000;
        const stagger = parseInt(element.getAttribute('data-animate-stagger')) || 50;
        
        setTimeout(() => {
            switch (animationType) {
                case 'typewriter':
                    this.typewriterEffect(element, duration);
                    break;
                case 'glitch':
                    this.glitchEffect(element, duration);
                    break;
                case 'wave':
                    this.waveEffect(element, duration, stagger);
                    break;
                case 'matrix':
                    this.matrixEffect(element, duration);
                    break;
                case 'reveal':
                    this.revealEffect(element, duration, stagger);
                    break;
                case 'morphing':
                    this.morphingEffect(element, duration);
                    break;
                case 'neon':
                    this.neonEffect(element, duration);
                    break;
                default:
                    this.fadeInEffect(element, duration);
                    break;
            }
        }, delay);
    }
    
    typewriterEffect(element, duration) {
        const text = element.textContent;
        const chars = text.split('');
        element.textContent = '';
        element.style.borderRight = '2px solid var(--primary-color)';
        
        const typeSpeed = duration / chars.length;
        let index = 0;
        
        const type = () => {
            if (index < chars.length) {
                element.textContent += chars[index];
                index++;
                setTimeout(type, typeSpeed + Math.random() * 50 - 25); // Add randomness
            } else {
                // Remove cursor after typing
                setTimeout(() => {
                    element.style.borderRight = 'none';
                }, 1000);
            }
        };
        
        type();
    }
    
    glitchEffect(element, duration) {
        const originalText = element.textContent;
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let frame = 0;
        const maxFrames = 30;
        
        const glitch = () => {
            if (frame < maxFrames) {
                let glitchedText = '';
                
                for (let i = 0; i < originalText.length; i++) {
                    if (Math.random() < 0.1) {
                        glitchedText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
                    } else {
                        glitchedText += originalText[i];
                    }
                }
                
                element.textContent = glitchedText;
                element.style.textShadow = `${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0 rgba(255, 0, 255, 0.8)`;
                
                frame++;
                setTimeout(glitch, duration / maxFrames);
            } else {
                element.textContent = originalText;
                element.style.textShadow = 'none';
            }
        };
        
        glitch();
    }
    
    waveEffect(element, duration, stagger) {
        const text = element.textContent;
        element.innerHTML = '';
        
        // Create spans for each character
        const spans = text.split('').map((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'translateY(50px)';
            span.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            return span;
        });
        
        spans.forEach(span => element.appendChild(span));
        
        // Animate each character with stagger
        spans.forEach((span, index) => {
            setTimeout(() => {
                span.style.opacity = '1';
                span.style.transform = 'translateY(0)';
                
                // Add bounce effect
                setTimeout(() => {
                    span.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        span.style.transform = 'translateY(0)';
                    }, 150);
                }, 300);
            }, index * stagger);
        });
    }
    
    matrixEffect(element, duration) {
        const originalText = element.textContent;
        const matrixChars = '01';
        let iterations = 0;
        const maxIterations = 20;
        
        const matrix = () => {
            if (iterations < maxIterations) {
                element.textContent = originalText
                    .split('')
                    .map((char, index) => {
                        if (index < iterations / maxIterations * originalText.length) {
                            return originalText[index];
                        }
                        return matrixChars[Math.floor(Math.random() * matrixChars.length)];
                    })
                    .join('');
                
                iterations++;
                setTimeout(matrix, duration / maxIterations);
            }
        };
        
        matrix();
    }
    
    revealEffect(element, duration, stagger) {
        const text = element.textContent;
        element.innerHTML = '';
        
        const words = text.split(' ');
        const wordSpans = words.map(word => {
            const span = document.createElement('span');
            span.textContent = word + ' ';
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'rotateX(90deg)';
            span.style.transformOrigin = 'bottom';
            span.style.transition = 'all 0.6s ease';
            return span;
        });
        
        wordSpans.forEach(span => element.appendChild(span));
        
        // Reveal each word
        wordSpans.forEach((span, index) => {
            setTimeout(() => {
                span.style.opacity = '1';
                span.style.transform = 'rotateX(0deg)';
            }, index * stagger);
        });
    }
    
    morphingEffect(element, duration) {
        const originalText = element.textContent;
        const morphTexts = [
            'Welcome to PegeArts',
            'Creative Solutions',
            'Digital Innovation',
            originalText
        ];
        
        let currentIndex = 0;
        
        const morph = () => {
            if (currentIndex < morphTexts.length - 1) {
                this.morphText(element, morphTexts[currentIndex], morphTexts[currentIndex + 1], 800);
                currentIndex++;
                setTimeout(morph, 1200);
            }
        };
        
        morph();
    }
    
    morphText(element, fromText, toText, duration) {
        let frame = 0;
        const maxFrames = 30;
        const frameTime = duration / maxFrames;
        
        const animate = () => {
            if (frame < maxFrames) {
                const progress = frame / maxFrames;
                let morphedText = '';
                
                const maxLength = Math.max(fromText.length, toText.length);
                
                for (let i = 0; i < maxLength; i++) {
                    const fromChar = fromText[i] || '';
                    const toChar = toText[i] || '';
                    
                    if (progress < 0.5) {
                        // First half: scramble and fade out
                        if (Math.random() < progress * 2) {
                            morphedText += String.fromCharCode(65 + Math.floor(Math.random() * 26));
                        } else {
                            morphedText += fromChar;
                        }
                    } else {
                        // Second half: fade in target text
                        if (Math.random() < (progress - 0.5) * 2) {
                            morphedText += toChar;
                        } else {
                            morphedText += String.fromCharCode(65 + Math.floor(Math.random() * 26));
                        }
                    }
                }
                
                element.textContent = morphedText;
                frame++;
                setTimeout(animate, frameTime);
            } else {
                element.textContent = toText;
            }
        };
        
        animate();
    }
    
    neonEffect(element, duration) {
        element.style.textShadow = 'none';
        element.style.opacity = '0.3';
        
        let intensity = 0;
        const maxIntensity = 1;
        const steps = 50;
        const stepTime = duration / steps;
        
        const animate = () => {
            if (intensity < maxIntensity) {
                const glow = intensity * 20;
                element.style.textShadow = `
                    0 0 ${glow}px var(--primary-color),
                    0 0 ${glow * 2}px var(--primary-color),
                    0 0 ${glow * 3}px var(--primary-color)
                `;
                element.style.opacity = 0.3 + intensity * 0.7;
                
                intensity += maxIntensity / steps;
                setTimeout(animate, stepTime);
            } else {
                // Final glow effect
                element.style.textShadow = `
                    0 0 20px var(--primary-color),
                    0 0 40px var(--primary-color),
                    0 0 60px var(--primary-color)
                `;
                element.style.opacity = '1';
            }
        };
        
        animate();
    }
    
    fadeInEffect(element, duration) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }
    
    // Method to manually trigger animation
    animate(selector, type, options = {}) {
        const element = document.querySelector(selector);
        if (!element) return;
        
        element.setAttribute('data-animate-text', type);
        if (options.delay) element.setAttribute('data-animate-delay', options.delay);
        if (options.duration) element.setAttribute('data-animate-duration', options.duration);
        if (options.stagger) element.setAttribute('data-animate-stagger', options.stagger);
        
        this.startAnimation(element);
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.animations.clear();
    }
}

// =============================================================================
// ENHANCED PORTFOLIO SYSTEM
// =============================================================================

class PortfolioManager {
    constructor() {
        this.portfolioItems = [];
        this.currentFilter = 'all';
        this.currentSort = 'recent';
        this.isotopeInstance = null;
        this.lightboxInstance = null;
        this.currentPage = 1;
        this.itemsPerPage = 9;
        
        this.init();
    }
    
    init() {
        this.loadPortfolioData();
        this.setupFilters();
        this.setupSorting();
        this.setupLightbox();
        this.setupInfiniteScroll();
        this.setupSearch();
    }
    
    loadPortfolioData() {
        // Extended portfolio data with more details
        this.portfolioItems = [
            {
                id: 1,
                title: "E-commerce Platform",
                category: "web-development",
                tags: ["React", "Node.js", "MongoDB", "Payment Integration"],
                description: "A full-featured e-commerce platform with modern UI/UX, secure payments, and admin dashboard.",
                thumbnail: "assets/images/portfolio/ecommerce-thumb.jpg",
                images: [
                    "assets/images/portfolio/ecommerce-1.jpg",
                    "assets/images/portfolio/ecommerce-2.jpg",
                    "assets/images/portfolio/ecommerce-3.jpg"
                ],
                demoUrl: "https://demo.ecommerce.pegearts.com",
                codeUrl: "https://github.com/pegearts/ecommerce-platform",
                client: "Tech Startup Inc.",
                date: "2024-01-15",
                duration: "3 months",
                featured: true,
                technologies: ["React", "Node.js", "Express", "MongoDB", "Stripe API", "AWS"],
                challenges: ["Real-time inventory management", "Payment security", "Scalable architecture"],
                solutions: ["WebSocket implementation", "PCI compliance", "Microservices architecture"]
            },
            {
                id: 2,
                title: "Brand Identity Design",
                category: "design",
                tags: ["Branding", "Logo Design", "Typography", "Color Theory"],
                description: "Complete brand identity system including logo, typography, color palette, and brand guidelines.",
                thumbnail: "assets/images/portfolio/brand-thumb.jpg",
                images: [
                    "assets/images/portfolio/brand-1.jpg",
                    "assets/images/portfolio/brand-2.jpg",
                    "assets/images/portfolio/brand-3.jpg"
                ],
                client: "Creative Agency",
                date: "2024-02-20",
                duration: "1 month",
                featured: false,
                deliverables: ["Logo variations", "Brand guidelines", "Business cards", "Letterhead", "Social media templates"]
            },
            {
                id: 3,
                title: "Mobile Fitness App",
                category: "mobile-development",
                tags: ["React Native", "Firebase", "Health APIs", "Push Notifications"],
                description: "Cross-platform fitness tracking app with workout plans, nutrition tracking, and social features.",
                thumbnail: "assets/images/portfolio/fitness-thumb.jpg",
                images: [
                    "assets/images/portfolio/fitness-1.jpg",
                    "assets/images/portfolio/fitness-2.jpg",
                    "assets/images/portfolio/fitness-3.jpg"
                ],
                demoUrl: "https://apps.apple.com/fitness-tracker",
                client: "Fitness Startup",
                date: "2023-12-10",
                duration: "4 months",
                featured: true,
                technologies: ["React Native", "Firebase", "HealthKit", "Google Fit API", "Redux"],
                downloads: "10k+",
                rating: 4.8
            },
            {
                id: 4,
                title: "Corporate Website",
                category: "web-development",
                tags: ["WordPress", "Custom Theme", "SEO", "Performance"],
                description: "Professional corporate website with custom CMS, optimized for performance and SEO.",
                thumbnail: "assets/images/portfolio/corporate-thumb.jpg",
                images: [
                    "assets/images/portfolio/corporate-1.jpg",
                    "assets/images/portfolio/corporate-2.jpg"
                ],
                demoUrl: "https://corporate.example.com",
                client: "Fortune 500 Company",
                date: "2024-01-30",
                duration: "2 months",
                featured: false,
                technologies: ["WordPress", "PHP", "MySQL", "SCSS", "JavaScript"]
            },
            {
                id: 5,
                title: "UI/UX Design System",
                category: "design",
                tags: ["Design System", "Figma", "Component Library", "Accessibility"],
                description: "Comprehensive design system with reusable components, design tokens, and accessibility guidelines.",
                thumbnail: "assets/images/portfolio/design-system-thumb.jpg",
                images: [
                    "assets/images/portfolio/design-system-1.jpg",
                    "assets/images/portfolio/design-system-2.jpg",
                    "assets/images/portfolio/design-system-3.jpg"
                ],
                client: "SaaS Company",
                date: "2023-11-15",
                duration: "2 months",
                featured: true,
                deliverables: ["Design tokens", "Component library", "Usage guidelines", "Figma templates"]
            }
        ];
        
        this.renderPortfolio();
    }
    
    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Get filter value
                const filter = btn.getAttribute('data-filter');
                this.filterPortfolio(filter);
                
                // Track filter usage
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'portfolio_filter', {
                        event_category: 'Portfolio',
                        event_label: filter,
                        value: 1
                    });
                }
            });
        });
    }
    
    setupSorting() {
        const sortSelect = document.getElementById('portfolio-sort');
        
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.sortPortfolio();
            });
        }
    }
    
    setupLightbox() {
        // Enhanced lightbox functionality
        this.lightboxInstance = {
            currentIndex: 0,
            images: [],
            
            open: (images, startIndex = 0) => {
                this.lightboxInstance.images = images;
                this.lightboxInstance.currentIndex = startIndex;
                this.lightboxInstance.show();
            },
            
            show: () => {
                const lightbox = this.createLightboxHTML();
                document.body.appendChild(lightbox);
                document.body.classList.add('lightbox-open');
                
                this.lightboxInstance.updateImage();
                this.lightboxInstance.setupControls();
                
                // Trap focus
                PegeArts.utils.trapFocus(lightbox);
            },
            
            close: () => {
                const lightbox = document.querySelector('.lightbox');
                if (lightbox) {
                    lightbox.classList.add('closing');
                    setTimeout(() => {
                        document.body.removeChild(lightbox);
                        document.body.classList.remove('lightbox-open');
                    }, 300);
                }
            },
            
            next: () => {
                this.lightboxInstance.currentIndex = 
                    (this.lightboxInstance.currentIndex + 1) % this.lightboxInstance.images.length;
                this.lightboxInstance.updateImage();
            },
            
            prev: () => {
                this.lightboxInstance.currentIndex = 
                    (this.lightboxInstance.currentIndex - 1 + this.lightboxInstance.images.length) % 
                    this.lightboxInstance.images.length;
                this.lightboxInstance.updateImage();
            },
            
            updateImage: () => {
                const img = document.querySelector('.lightbox-image');
                const counter = document.querySelector('.lightbox-counter');
                
                if (img && counter) {
                    img.src = this.lightboxInstance.images[this.lightboxInstance.currentIndex];
                    counter.textContent = `${this.lightboxInstance.currentIndex + 1} / ${this.lightboxInstance.images.length}`;
                }
            },
            
            setupControls: () => {
                const lightbox = document.querySelector('.lightbox');
                
                lightbox.addEventListener('click', (e) => {
                    if (e.target === lightbox || e.target.className === 'lightbox-content') {
                        this.lightboxInstance.close();
                    }
                });
                
                document.addEventListener('keydown', (e) => {
                    if (!document.querySelector('.lightbox')) return;
                    
                    switch (e.key) {
                        case 'Escape':
                            this.lightboxInstance.close();
                            break;
                        case 'ArrowLeft':
                            this.lightboxInstance.prev();
                            break;
                        case 'ArrowRight':
                            this.lightboxInstance.next();
                            break;
                    }
                });
            }
        };
    }
    
    createLightboxHTML() {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
                <button class="lightbox-prev" aria-label="Previous image">&lt;</button>
                <button class="lightbox-next" aria-label="Next image">&gt;</button>
                <img class="lightbox-image" src="" alt="" />
                <div class="lightbox-counter"></div>
            </div>
        `;
        
        // Add event listeners
        lightbox.querySelector('.lightbox-close').addEventListener('click', this.lightboxInstance.close);
        lightbox.querySelector('.lightbox-prev').addEventListener('click', this.lightboxInstance.prev);
        lightbox.querySelector('.lightbox-next').addEventListener('click', this.lightboxInstance.next);
        
        return lightbox;
    }
    
    setupInfiniteScroll() {
        const portfolioContainer = document.querySelector('.portfolio-grid');
        if (!portfolioContainer) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMoreItems()) {
                    this.loadMoreItems();
                }
            });
        }, {
            rootMargin: '100px'
        });
        
        // Create a sentinel element
        const sentinel = document.createElement('div');
        sentinel.className = 'portfolio-sentinel';
        portfolioContainer.parentNode.appendChild(sentinel);
        observer.observe(sentinel);
    }
    
    setupSearch() {
        const searchInput = document.getElementById('portfolio-search');
        
        if (searchInput) {
            searchInput.addEventListener('input', PegeArts.utils.debounce((e) => {
                this.searchPortfolio(e.target.value);
            }, 300));
        }
    }
    
    renderPortfolio() {
        const container = document.querySelector('.portfolio-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        const itemsToShow = this.getFilteredItems().slice(0, this.currentPage * this.itemsPerPage);
        
        itemsToShow.forEach(item => {
            const portfolioItem = this.createPortfolioItem(item);
            container.appendChild(portfolioItem);
        });
        
        // Animate items into view
        this.animatePortfolioItems();
    }
    
    createPortfolioItem(item) {
        const article = document.createElement('article');
        article.className = 'portfolio-item';
        article.setAttribute('data-category', item.category);
        article.setAttribute('data-id', item.id);
        
        const featuredBadge = item.featured ? '<div class="featured-badge">Featured</div>' : '';
        const tagsHTML = item.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        article.innerHTML = `
            <div class="portfolio-item-inner">
                <div class="portfolio-image">
                    <img src="${item.thumbnail}" alt="${item.title}" loading="lazy" />
                    <div class="portfolio-overlay">
                        <div class="portfolio-actions">
                            <button class="btn-view" data-id="${item.id}" aria-label="View project details">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${item.demoUrl ? `<a href="${item.demoUrl}" target="_blank" class="btn-demo" aria-label="View live demo">
                                <i class="fas fa-external-link-alt"></i>
                            </a>` : ''}
                            ${item.codeUrl ? `<a href="${item.codeUrl}" target="_blank" class="btn-code" aria-label="View source code">
                                <i class="fab fa-github"></i>
                            </a>` : ''}
                        </div>
                    </div>
                    ${featuredBadge}
                </div>
                <div class="portfolio-content">
                    <h3 class="portfolio-title">${item.title}</h3>
                    <p class="portfolio-description">${item.description}</p>
                    <div class="portfolio-tags">${tagsHTML}</div>
                    <div class="portfolio-meta">
                        <span class="portfolio-client">${item.client}</span>
                        <span class="portfolio-date">${this.formatDate(item.date)}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        const viewBtn = article.querySelector('.btn-view');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => this.openProjectDetails(item));
        }
        
        const image = article.querySelector('.portfolio-image');
        image.addEventListener('click', () => {
            this.lightboxInstance.open(item.images, 0);
        });
        
        return article;
    }
    
    openProjectDetails(item) {
        const modal = this.createProjectModal(item);
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');
        
        // Animate modal in
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        
        // Trap focus
        PegeArts.utils.trapFocus(modal);
        
        // Track project view
        if (typeof gtag !== 'undefined') {
            gtag('event', 'project_view', {
                event_category: 'Portfolio',
                event_label: item.title,
                value: 1
            });
        }
    }
    
    createProjectModal(item) {
        const modal = document.createElement('div');
        modal.className = 'project-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'project-title');
        modal.setAttribute('aria-describedby', 'project-description');
        
        const technologiesHTML = item.technologies ? 
            item.technologies.map(tech => `<span class="tech-badge">${tech}</span>`).join('') : '';
        
        const challengesHTML = item.challenges ? 
            item.challenges.map(challenge => `<li>${challenge}</li>`).join('') : '';
        
        const solutionsHTML = item.solutions ? 
            item.solutions.map(solution => `<li>${solution}</li>`).join('') : '';
        
        const deliverablesHTML = item.deliverables ? 
            item.deliverables.map(deliverable => `<li>${deliverable}</li>`).join('') : '';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <header class="modal-header">
                    <h2 id="project-title" class="project-modal-title">${item.title}</h2>
                    <button class="modal-close" aria-label="Close project details">&times;</button>
                </header>
                
                <div class="modal-body">
                    <div class="project-gallery">
                        <div class="main-image">
                            <img src="${item.images[0]}" alt="${item.title}" class="project-main-image" />
                            <div class="image-controls">
                                <button class="gallery-prev" aria-label="Previous image">&lt;</button>
                                <button class="gallery-next" aria-label="Next image">&gt;</button>
                            </div>
                        </div>
                        <div class="thumbnail-strip">
                            ${item.images.map((img, index) => 
                                `<img src="${img}" alt="${item.title} ${index + 1}" 
                                 class="thumbnail ${index === 0 ? 'active' : ''}" 
                                 data-index="${index}" />`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div class="project-details">
                        <div class="project-overview">
                            <h3>Project Overview</h3>
                            <p id="project-description">${item.description}</p>
                        </div>
                        
                        <div class="project-info-grid">
                            <div class="info-item">
                                <h4>Client</h4>
                                <p>${item.client}</p>
                            </div>
                            <div class="info-item">
                                <h4>Duration</h4>
                                <p>${item.duration}</p>
                            </div>
                            <div class="info-item">
                                <h4>Date</h4>
                                <p>${this.formatDate(item.date)}</p>
                            </div>
                            <div class="info-item">
                                <h4>Category</h4>
                                <p>${this.formatCategory(item.category)}</p>
                            </div>
                        </div>
                        
                        ${technologiesHTML ? `
                            <div class="project-section">
                                <h3>Technologies Used</h3>
                                <div class="technologies-list">${technologiesHTML}</div>
                            </div>
                        ` : ''}
                        
                        ${challengesHTML ? `
                            <div class="project-section">
                                <h3>Challenges</h3>
                                <ul class="challenges-list">${challengesHTML}</ul>
                            </div>
                        ` : ''}
                        
                        ${solutionsHTML ? `
                            <div class="project-section">
                                <h3>Solutions</h3>
                                <ul class="solutions-list">${solutionsHTML}</ul>
                            </div>
                        ` : ''}
                        
                        ${deliverablesHTML ? `
                            <div class="project-section">
                                <h3>Deliverables</h3>
                                <ul class="deliverables-list">${deliverablesHTML}</ul>
                            </div>
                        ` : ''}
                        
                        ${item.rating ? `
                            <div class="project-metrics">
                                <div class="metric">
                                    <span class="metric-label">Rating:</span>
                                    <div class="star-rating">
                                        ${this.generateStarRating(item.rating)}
                                    </div>
                                </div>
                                ${item.downloads ? `
                                    <div class="metric">
                                        <span class="metric-label">Downloads:</span>
                                        <span class="metric-value">${item.downloads}</span>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <footer class="modal-footer">
                    <div class="project-actions">
                        ${item.demoUrl ? `
                            <a href="${item.demoUrl}" target="_blank" class="btn btn-primary">
                                <i class="fas fa-external-link-alt"></i>
                                View Live Demo
                            </a>
                        ` : ''}
                        ${item.codeUrl ? `
                            <a href="${item.codeUrl}" target="_blank" class="btn btn-outline">
                                <i class="fab fa-github"></i>
                                View Source Code
                            </a>
                        ` : ''}
                        <button class="btn btn-secondary share-project" data-title="${item.title}">
                            <i class="fas fa-share"></i>
                            Share Project
                        </button>
                    </div>
                </footer>
            </div>
        `;
        
        this.setupModalControls(modal, item);
        return modal;
    }
    
    setupModalControls(modal, item) {
        let currentImageIndex = 0;
        
        // Close modal
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(modal);
                document.body.classList.remove('modal-open');
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Gallery controls
        const mainImage = modal.querySelector('.project-main-image');
        const thumbnails = modal.querySelectorAll('.thumbnail');
        const prevBtn = modal.querySelector('.gallery-prev');
        const nextBtn = modal.querySelector('.gallery-next');
        
        const updateMainImage = (index) => {
            currentImageIndex = index;
            mainImage.src = item.images[index];
            
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
        };
        
        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => updateMainImage(index));
        });
        
        prevBtn.addEventListener('click', () => {
            const newIndex = (currentImageIndex - 1 + item.images.length) % item.images.length;
            updateMainImage(newIndex);
        });
        
        nextBtn.addEventListener('click', () => {
            const newIndex = (currentImageIndex + 1) % item.images.length;
            updateMainImage(newIndex);
        });
        
        // Share functionality
        const shareBtn = modal.querySelector('.share-project');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareProject(item);
            });
        }
        
        // Keyboard navigation
        modal.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowLeft':
                    prevBtn.click();
                    break;
                case 'ArrowRight':
                    nextBtn.click();
                    break;
            }
        });
    }
    
    shareProject(item) {
        if (navigator.share) {
            navigator.share({
                title: item.title,
                text: item.description,
                url: window.location.href
            });
        } else {
            // Fallback to custom share modal
            this.showShareModal(item);
        }
    }
    
    showShareModal(item) {
        const shareModal = document.createElement('div');
        shareModal.className = 'share-modal';
        shareModal.innerHTML = `
            <div class="share-content">
                <h3>Share ${item.title}</h3>
                <div class="share-options">
                    <button class="share-btn" data-platform="twitter">
                        <i class="fab fa-twitter"></i>
                        Twitter
                    </button>
                    <button class="share-btn" data-platform="linkedin">
                        <i class="fab fa-linkedin"></i>
                        LinkedIn
                    </button>
                    <button class="share-btn" data-platform="facebook">
                        <i class="fab fa-facebook"></i>
                        Facebook
                    </button>
                    <button class="share-btn" data-platform="copy">
                        <i class="fas fa-copy"></i>
                        Copy Link
                    </button>
                </div>
                <button class="share-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(shareModal);
        
        shareModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('share-btn')) {
                this.handleShare(e.target.dataset.platform, item);
            } else if (e.target.classList.contains('share-close') || e.target === shareModal) {
                document.body.removeChild(shareModal);
            }
        });
    }
    
    handleShare(platform, item) {
        const url = window.location.href;
        const text = `Check out ${item.title} - ${item.description}`;
        
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        };
        
        if (platform === 'copy') {
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('Link copied to clipboard!', 'success');
            });
        } else if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }
    
    filterPortfolio(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.renderPortfolio();
        
        // Update URL without page reload
        const url = new URL(window.location);
        if (filter === 'all') {
            url.searchParams.delete('filter');
        } else {
            url.searchParams.set('filter', filter);
        }
        window.history.pushState({}, '', url);
    }
    
    sortPortfolio() {
        this.currentPage = 1;
        this.renderPortfolio();
    }
    
    searchPortfolio(query) {
        this.searchQuery = query.toLowerCase();
        this.currentPage = 1;
        this.renderPortfolio();
    }
    
    getFilteredItems() {
        let filtered = [...this.portfolioItems];
        
        // Apply category filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(item => item.category === this.currentFilter);
        }
        
        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(this.searchQuery) ||
                item.description.toLowerCase().includes(this.searchQuery) ||
                item.tags.some(tag => tag.toLowerCase().includes(this.searchQuery))
            );
        }
        
        // Apply sorting
        switch (this.currentSort) {
            case 'recent':
                filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'alphabetical':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'featured':
                filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
                break;
        }
        
        return filtered;
    }
    
    hasMoreItems() {
        const filteredItems = this.getFilteredItems();
        return filteredItems.length > this.currentPage * this.itemsPerPage;
    }
    
    loadMoreItems() {
        this.currentPage++;
        const container = document.querySelector('.portfolio-grid');
        const filteredItems = this.getFilteredItems();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = this.currentPage * this.itemsPerPage;
        const newItems = filteredItems.slice(startIndex, endIndex);
        
        newItems.forEach(item => {
            const portfolioItem = this.createPortfolioItem(item);
            container.appendChild(portfolioItem);
        });
        
        this.animatePortfolioItems(container.querySelectorAll('.portfolio-item:nth-last-child(-n+' + newItems.length + ')'));
    }
    
    animatePortfolioItems(items = null) {
        const portfolioItems = items || document.querySelectorAll('.portfolio-item');
        
        portfolioItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(50px)';
            
            setTimeout(() => {
                item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    formatCategory(category) {
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let starsHTML = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }
        
        return starsHTML;
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Public methods
    addPortfolioItem(item) {
        this.portfolioItems.unshift(item);
        this.renderPortfolio();
    }
    
    updatePortfolioItem(id, updatedData) {
        const index = this.portfolioItems.findIndex(item => item.id === id);
        if (index !== -1) {
            this.portfolioItems[index] = { ...this.portfolioItems[index], ...updatedData };
            this.renderPortfolio();
        }
    }
    
    removePortfolioItem(id) {
        this.portfolioItems = this.portfolioItems.filter(item => item.id !== id);
        this.renderPortfolio();
    }
    
    destroy() {
        if (this.lightboxInstance) {
            // Clean up lightbox
        }
    }
}

// =============================================================================
// ENHANCED AUDIO SYSTEM
// =============================================================================

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.audioBuffers = new Map();
        this.activePlayers = new Map();
        this.masterVolume = 0.7;
        this.isEnabled = localStorage.getItem('audioEnabled') !== 'false';
        this.currentTrack = null;
        this.playlist = [];
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        
        this.init();
    }
    
    async init() {
        if (!this.isEnabled) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.loadAudioFiles();
            this.setupControls();
            this.setupVisualization();
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }
    
    async loadAudioFiles() {
        const audioFiles = [
            { name: 'ambient1', url: 'assets/audio/ambient-space.mp3' },
            { name: 'ambient2', url: 'assets/audio/ambient-cosmic.mp3' },
            { name: 'click', url: 'assets/audio/ui-click.mp3' },
            { name: 'hover', url: 'assets/audio/ui-hover.mp3' },
            { name: 'success', url: 'assets/audio/success.mp3' },
            { name: 'notification', url: 'assets/audio/notification.mp3' }
        ];
        
        const loadPromises = audioFiles.map(async (file) => {
            try {
                const response = await fetch(file.url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.audioBuffers.set(file.name, audioBuffer);
            } catch (error) {
                console.warn(`Failed to load audio file: ${file.name}`, error);
            }
        });
        
        await Promise.all(loadPromises);
        console.log('🎵 Audio files loaded:', this.audioBuffers.size);
    }
    
    setupControls() {
        const audioToggle = document.querySelector('.audio-toggle');
        const volumeSlider = document.querySelector('.volume-slider');
        const playlistToggle = document.querySelector('.playlist-toggle');
        
        if (audioToggle) {
            audioToggle.addEventListener('click', () => {
                this.toggleAudio();
            });
        }
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setMasterVolume(e.target.value / 100);
            });
        }
        
        if (playlistToggle) {
            playlistToggle.addEventListener('click', () => {
                this.togglePlaylist();
            });
        }
        
        // Update UI state
        this.updateAudioControls();
    }
    
    setupVisualization() {
        const visualizer = document.querySelector('.audio-visualizer');
        if (!visualizer || !this.audioContext) return;
        
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        
        const canvas = visualizer.querySelector('canvas') || document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 60;
        
        if (!visualizer.querySelector('canvas')) {
            visualizer.appendChild(canvas);
        }
        
        this.visualizerCtx = canvas.getContext('2d');
        this.startVisualization();
    }
    
    startVisualization() {
        if (!this.visualizerCtx || !this.analyser) return;
        
        const draw = () => {
            requestAnimationFrame(draw);
            
            this.analyser.getByteFrequencyData(this.dataArray);
            
            this.visualizerCtx.fillStyle = 'rgba(26, 26, 46, 0.8)';
            this.visualizerCtx.fillRect(0, 0, 200, 60);
            
            const barWidth = 200 / this.bufferLength;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < this.bufferLength; i++) {
                barHeight = (this.dataArray[i] / 255) * 60;
                
                const hue = i / this.bufferLength * 360;
                this.visualizerCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                this.visualizerCtx.fillRect(x, 60 - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }
    
    playSound(name, options = {}) {
        if (!this.isEnabled || !this.audioBuffers.has(name)) return null;
        
        const audioBuffer = this.audioBuffers.get(name);
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        
        // Set volume
        const volume = (options.volume || 1) * this.masterVolume;
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        
        // Apply fade in/out
        if (options.fadeIn) {
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + options.fadeIn);
        }
        
        if (options.fadeOut && options.duration) {
            const fadeStartTime = this.audioContext.currentTime + options.duration - options.fadeOut;
            gainNode.gain.setValueAtTime(volume, fadeStartTime);
            gainNode.gain.linearRampToValueAtTime(0, fadeStartTime + options.fadeOut);
        }
        
        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        if (this.analyser) {
            gainNode.connect(this.analyser);
        }
        
        // Set playback rate (pitch)
        if (options.rate) {
            source.playbackRate.setValueAtTime(options.rate, this.audioContext.currentTime);
        }
        
        // Set loop
        if (options.loop) {
            source.loop = true;
        }
        
        // Start playback
        source.start(this.audioContext.currentTime);
        
        // Stop after duration
        if (options.duration) {
            source.stop(this.audioContext.currentTime + options.duration);
        }
        
        // Store player for later control
        const playerId = Date.now() + Math.random();
        this.activePlayers.set(playerId, { source, gainNode, name });
        
        // Clean up when finished
        source.onended = () => {
            this.activePlayers.delete(playerId);
        };
        
        return playerId;
    }
    
    stopSound(playerId) {
        if (this.activePlayers.has(playerId)) {
            const player = this.activePlayers.get(playerId);
            player.source.stop();
            this.activePlayers.delete(playerId);
        }
    }
    
    stopAllSounds() {
        this.activePlayers.forEach((player, id) => {
            player.source.stop();
        });
        this.activePlayers.clear();
    }
    
    playAmbientMusic() {
        if (this.currentTrack) {
            this.stopSound(this.currentTrack);
        }
        
        const ambientTracks = ['ambient1', 'ambient2'];
        const randomTrack = ambientTracks[Math.floor(Math.random() * ambientTracks.length)];
        
        this.currentTrack = this.playSound(randomTrack, {
            volume: 0.3,
            loop: true,
            fadeIn: 2
        });
    }
    
    stopAmbientMusic() {
        if (this.currentTrack) {
            this.stopSound(this.currentTrack);
            this.currentTrack = null;
        }
    }
    
    playUISound(type) {
        const soundMap = {
            click: 'click',
            hover: 'hover',
            success: 'success',
            error: 'notification',
            notification: 'notification'
        };
        
        const soundName = soundMap[type];
        if (soundName) {
            this.playSound(soundName, {
                volume: 0.4,
                rate: 0.8 + Math.random() * 0.4  // Slight pitch variation
            });
        }
    }
    
    toggleAudio() {
        this.isEnabled = !this.isEnabled;
        localStorage.setItem('audioEnabled', this.isEnabled);
        
        if (!this.isEnabled) {
            this.stopAllSounds();
        } else if (!this.audioContext) {
            this.init();
        }
        
        this.updateAudioControls();
        this.playUISound('click');
    }
    
    togglePlaylist() {
        if (this.currentTrack) {
            this.stopAmbientMusic();
        } else {
            this.playAmbientMusic();
        }
        
        this.updateAudioControls();
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('audioVolume', this.masterVolume);
        
        // Update all active players
        this.activePlayers.forEach(player => {
            player.gainNode.gain.setValueAtTime(
                this.masterVolume, 
                this.audioContext.currentTime
            );
        });
    }
    
    updateAudioControls() {
        const audioToggle = document.querySelector('.audio-toggle');
        const volumeSlider = document.querySelector('.volume-slider');
        const playlistToggle = document.querySelector('.playlist-toggle');
        
        if (audioToggle) {
            audioToggle.classList.toggle('active', this.isEnabled);
            audioToggle.setAttribute('aria-pressed', this.isEnabled);
        }
        
        if (volumeSlider) {
            volumeSlider.value = this.masterVolume * 100;
        }
        
        if (playlistToggle) {
            playlistToggle.classList.toggle('active', this.currentTrack !== null);
        }
    }
    
    // Advanced audio effects
    createReverbEffect() {
        if (!this.audioContext) return null;
        
        const convolver = this.audioContext.createConvolver();
        
        // Create impulse response for reverb
        const length = this.audioContext.sampleRate * 2;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        convolver.buffer = impulse;
        return convolver;
    }
    
    createDistortionEffect(amount = 50) {
        if (!this.audioContext) return null;
        
        const waveshaper = this.audioContext.createWaveShaper();
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        
        waveshaper.curve = curve;
        waveshaper.oversample = '4x';
        
        return waveshaper;
    }
    
    // Spatial audio
    createSpatialAudio(x, y, z) {
        if (!this.audioContext) return null;
        
        const panner = this.audioContext.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        
        panner.setPosition(x, y, z);
        
        return panner;
    }
    
    destroy() {
        this.stopAllSounds();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.audioBuffers.clear();
        this.activePlayers.clear();
    }
}

// =============================================================================
// FORM HANDLING SYSTEM
// =============================================================================

class FormManager {
    constructor() {
        this.forms = new Map();
        this.validators = new Map();
        this.submitHandlers = new Map();
        this.autosaveEnabled = true;
        this.autosaveInterval = 30000; // 30 seconds
        
        this.init();
    }
    
    init() {
        this.setupFormValidation();
        this.setupFileUploads();
        this.setupAutosave();
        this.setupFormSubmission();
        this.setupCustomElements();
    }
    
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            this.registerForm(form);
        });
        
        // Custom validation rules
        this.addValidationRule('email', (value) => {
            return PegeArts.utils.validateEmail(value);
        }, 'Please enter a valid email address');
        
        this.addValidationRule('phone', (value) => {
            return PegeArts.utils.validatePhone(value);
        }, 'Please enter a valid phone number');
        
        this.addValidationRule('required', (value) => {
            return value.trim().length > 0;
        }, 'This field is required');
        
        this.addValidationRule('minLength', (value, min) => {
            return value.length >= min;
        }, 'Too short');
        
        this.addValidationRule('maxLength', (value, max) => {
            return value.length <= max;
        }, 'Too long');
        
        this.addValidationRule('url', (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }, 'Please enter a valid URL');
    }
    
    registerForm(form) {
        const formId = form.id || 'form-' + Date.now();
        form.id = formId;
        
        const formData = {
            element: form,
            fields: new Map(),
            isValid: false,
            isDirty: false,
            submissionAttempts: 0
        };
        
        this.forms.set(formId, formData);
        
        // Setup field validation
        const fields = form.querySelectorAll('input, textarea, select');
        fields.forEach(field => {
            this.registerField(formId, field);
        });
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(formId);
        });
        
        // Auto-save setup
        if (this.autosaveEnabled && form.dataset.autosave !== 'false') {
            this.setupFormAutosave(formId);
        }
        
        // Load saved form data
        this.loadFormData(formId);
    }
    
    registerField(formId, field) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const fieldData = {
            element: field,
            rules: this.parseValidationRules(field),
            isValid: true,
            isDirty: false,
            lastValue: field.value
        };
        
        form.fields.set(field.name || field.id, fieldData);
        
        // Real-time validation
        field.addEventListener('blur', () => {
            this.validateField(formId, field.name || field.id);
        });
        
        field.addEventListener('input', PegeArts.utils.debounce(() => {
            this.markFieldAsDirty(formId, field.name || field.id);
            this.clearFieldError(formId, field.name || field.id);
            
            // Validate on input for better UX
            if (fieldData.isDirty) {
                this.validateField(formId, field.name || field.id);
            }
        }, 300));
        
        // Enhanced accessibility
        field.addEventListener('focus', () => {
            this.highlightField(field);
        });
        
        field.addEventListener('blur', () => {
            this.unhighlightField(field);
        });
    }
    
    parseValidationRules(field) {
        const rules = [];
        
        // HTML5 validation attributes
        if (field.required) {
            rules.push({ type: 'required' });
        }
        
        if (field.type === 'email') {
            rules.push({ type: 'email' });
        }
        
        if (field.type === 'tel') {
            rules.push({ type: 'phone' });
        }
        
        if (field.type === 'url') {
            rules.push({ type: 'url' });
        }
        
        if (field.minLength) {
            rules.push({ type: 'minLength', value: field.minLength });
        }
        
        if (field.maxLength) {
            rules.push({ type: 'maxLength', value: field.maxLength });
        }
        
        if (field.min) {
            rules.push({ type: 'min', value: field.min });
        }
        
        if (field.max) {
            rules.push({ type: 'max', value: field.max });
        }
        
        // Custom validation attributes
        const customRules = field.dataset.validate;
        if (customRules) {
            customRules.split('|').forEach(rule => {
                const [type, value] = rule.split(':');
                rules.push({ type: type.trim(), value: value?.trim() });
            });
        }
        
        return rules;
    }
    
    validateField(formId, fieldName) {
        const form = this.forms.get(formId);
        if (!form) return false;
        
        const field = form.fields.get(fieldName);
        if (!field) return false;
        
        const value = field.element.value;
        let isValid = true;
        let errorMessage = '';
        
        // Check each validation rule
        for (const rule of field.rules) {
            const validator = this.validators.get(rule.type);
            if (validator) {
                const result = validator.validate(value, rule.value);
                if (!result) {
                    isValid = false;
                    errorMessage = rule.message || validator.message;
                    break;
                }
            }
        }
        
        field.isValid = isValid;
        
        // Update UI
        if (isValid) {
            this.showFieldSuccess(formId, fieldName);
        } else {
            this.showFieldError(formId, fieldName, errorMessage);
        }
        
        // Update form validity
        this.updateFormValidity(formId);
        
        return isValid;
    }
    
    validateForm(formId) {
        const form = this.forms.get(formId);
        if (!form) return false;
        
        let isValid = true;
        
        form.fields.forEach((field, fieldName) => {
            if (!this.validateField(formId, fieldName)) {
                isValid = false;
            }
        });
        
        form.isValid = isValid;
        return isValid;
    }
    
    showFieldError(formId, fieldName, message) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const field = form.fields.get(fieldName);
        if (!field) return;
        
        const element = field.element;
        const container = element.closest('.form-group') || element.parentElement;
        
        // Add error class
        container.classList.add('has-error');
        container.classList.remove('has-success');
        element.setAttribute('aria-invalid', 'true');
        
        // Show error message
        let errorElement = container.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.setAttribute('role', 'alert');
            container.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        element.setAttribute('aria-describedby', errorElement.id || 'error-' + fieldName);
        
        // Add shake animation
        element.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
    
    showFieldSuccess(formId, fieldName) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const field = form.fields.get(fieldName);
        if (!field) return;
        
        const element = field.element;
        const container = element.closest('.form-group') || element.parentElement;
        
        // Add success class
        container.classList.add('has-success');
        container.classList.remove('has-error');
        element.setAttribute('aria-invalid', 'false');
        
        // Hide error message
        const errorElement = container.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
        clearFieldError(formId, fieldName) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const field = form.fields.get(fieldName);
        if (!field) return;
        
        const element = field.element;
        const container = element.closest('.form-group') || element.parentElement;
        
        // Remove error state
        container.classList.remove('has-error');
        element.setAttribute('aria-invalid', 'false');
        
        // Remove error message
        const errorElement = container.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    highlightField(field) {
        field.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.3)';
        field.style.borderColor = 'var(--primary-color)';
    }
    
    unhighlightField(field) {
        field.style.boxShadow = '';
        field.style.borderColor = '';
    }
    
    markFieldAsDirty(formId, fieldName) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const field = form.fields.get(fieldName);
        if (!field) return;
        
        field.isDirty = true;
        form.isDirty = true;
        
        // Show unsaved changes indicator
        this.showUnsavedIndicator(formId);
    }
    
    updateFormValidity(formId) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        let isValid = true;
        form.fields.forEach(field => {
            if (!field.isValid) {
                isValid = false;
            }
        });
        
        form.isValid = isValid;
        
        // Update submit button state
        const submitBtn = form.element.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = !isValid;
            submitBtn.classList.toggle('btn-disabled', !isValid);
        }
        
        // Update form state classes
        form.element.classList.toggle('form-valid', isValid);
        form.element.classList.toggle('form-invalid', !isValid);
    }
    
    addValidationRule(name, validator, message) {
        this.validators.set(name, {
            validate: validator,
            message: message
        });
    }
    
    setupFileUploads() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            this.setupFileInput(input);
        });
    }
    
    setupFileInput(input) {
        const container = input.closest('.file-upload') || this.createFileUploadContainer(input);
        
        // Drag and drop functionality
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });
        
        container.addEventListener('dragleave', (e) => {
            if (!container.contains(e.relatedTarget)) {
                container.classList.remove('drag-over');
            }
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelect(input, files);
        });
        
        // File input change
        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileSelect(input, files);
        });
        
        // Add progress indicators
        this.createFileProgress(container);
    }
    
    createFileUploadContainer(input) {
        const container = document.createElement('div');
        container.className = 'file-upload';
        
        input.parentNode.insertBefore(container, input);
        container.appendChild(input);
        
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.innerHTML = `
            <div class="drop-zone-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag & drop files here or <button type="button" class="btn-link">browse</button></p>
                <small>Supported formats: JPG, PNG, GIF, PDF (Max: 10MB)</small>
            </div>
        `;
        
        container.appendChild(dropZone);
        
        // Browse button functionality
        const browseBtn = dropZone.querySelector('.btn-link');
        browseBtn.addEventListener('click', () => {
            input.click();
        });
        
        return container;
    }
    
    createFileProgress(container) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'file-progress-container';
        container.appendChild(progressContainer);
    }
    
    handleFileSelect(input, files) {
        const container = input.closest('.file-upload');
        const progressContainer = container.querySelector('.file-progress-container');
        
        files.forEach(file => {
            // Validate file
            if (!this.validateFile(file, input)) {
                return;
            }
            
            // Create progress indicator
            const progressItem = this.createFileProgressItem(file);
            progressContainer.appendChild(progressItem);
            
            // Upload file
            this.uploadFile(file, progressItem, input);
        });
    }
    
    validateFile(file, input) {
        // Check file size
        const maxSize = parseInt(input.dataset.maxSize) || 10 * 1024 * 1024; // 10MB default
        if (file.size > maxSize) {
            this.showNotification(`File "${file.name}" is too large. Maximum size is ${this.formatFileSize(maxSize)}.`, 'error');
            return false;
        }
        
        // Check file type
        const allowedTypes = input.accept ? input.accept.split(',').map(type => type.trim()) : [];
        if (allowedTypes.length > 0) {
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            const mimeType = file.type;
            
            const isAllowed = allowedTypes.some(type => {
                if (type.startsWith('.')) {
                    return fileExtension === type.toLowerCase();
                } else {
                    return mimeType === type || mimeType.startsWith(type.replace('*', ''));
                }
            });
            
            if (!isAllowed) {
                this.showNotification(`File type "${fileExtension}" is not allowed.`, 'error');
                return false;
            }
        }
        
        return true;
    }
    
    createFileProgressItem(file) {
        const item = document.createElement('div');
        item.className = 'file-progress-item';
        
        item.innerHTML = `
            <div class="file-info">
                <div class="file-icon">
                    <i class="fas ${this.getFileIcon(file)}"></i>
                </div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                </div>
            </div>
            <div class="upload-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">0%</div>
            </div>
            <button class="btn-remove" aria-label="Remove file">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Remove button functionality
        const removeBtn = item.querySelector('.btn-remove');
        removeBtn.addEventListener('click', () => {
            item.remove();
        });
        
        return item;
    }
    
    getFileIcon(file) {
        const type = file.type.toLowerCase();
        if (type.includes('image')) return 'fa-image';
        if (type.includes('video')) return 'fa-video';
        if (type.includes('audio')) return 'fa-music';
        if (type.includes('pdf')) return 'fa-file-pdf';
        if (type.includes('word') || type.includes('doc')) return 'fa-file-word';
        if (type.includes('excel') || type.includes('sheet')) return 'fa-file-excel';
        if (type.includes('powerpoint') || type.includes('presentation')) return 'fa-file-powerpoint';
        if (type.includes('zip') || type.includes('rar')) return 'fa-file-archive';
        return 'fa-file';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    uploadFile(file, progressItem, input) {
        const formData = new FormData();
        formData.append('file', file);
        
        const xhr = new XMLHttpRequest();
        
        // Progress tracking
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                this.updateProgressItem(progressItem, percentComplete);
            }
        });
        
        // Upload completion
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                this.handleUploadSuccess(progressItem, JSON.parse(xhr.responseText));
            } else {
                this.handleUploadError(progressItem, 'Upload failed');
            }
        });
        
        // Upload error
        xhr.addEventListener('error', () => {
            this.handleUploadError(progressItem, 'Network error');
        });
        
        // Start upload
        const uploadUrl = input.dataset.uploadUrl || '/api/upload';
        xhr.open('POST', uploadUrl);
        
        // Add CSRF token if available
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
            xhr.setRequestHeader('X-CSRF-Token', csrfToken.getAttribute('content'));
        }
        
        xhr.send(formData);
    }
    
    updateProgressItem(item, percent) {
        const progressFill = item.querySelector('.progress-fill');
        const progressText = item.querySelector('.progress-text');
        
        progressFill.style.width = percent + '%';
        progressText.textContent = Math.round(percent) + '%';
    }
    
    handleUploadSuccess(item, response) {
        item.classList.add('upload-success');
        
        const progressText = item.querySelector('.progress-text');
        progressText.innerHTML = '<i class="fas fa-check"></i> Complete';
        
        // Store file data for form submission
        const fileData = {
            filename: response.filename,
            originalName: response.originalName,
            size: response.size,
            url: response.url
        };
        
        item.dataset.fileData = JSON.stringify(fileData);
        
        this.showNotification('File uploaded successfully!', 'success');
    }
    
    handleUploadError(item, error) {
        item.classList.add('upload-error');
        
        const progressText = item.querySelector('.progress-text');
        progressText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
        
        this.showNotification(`Upload failed: ${error}`, 'error');
    }
    
    setupAutosave() {
        if (!this.autosaveEnabled) return;
        
        setInterval(() => {
            this.forms.forEach((form, formId) => {
                if (form.isDirty && !form.element.classList.contains('no-autosave')) {
                    this.saveFormData(formId);
                }
            });
        }, this.autosaveInterval);
    }
    
    setupFormAutosave(formId) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        // Create autosave indicator
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.innerHTML = '<i class="fas fa-save"></i> <span>All changes saved</span>';
        
        form.element.appendChild(indicator);
    }
    
    saveFormData(formId) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const formData = {};
        
        form.fields.forEach((field, fieldName) => {
            if (field.element.type === 'password') return; // Don't save passwords
            
            formData[fieldName] = field.element.value;
        });
        
        localStorage.setItem(`form_${formId}`, JSON.stringify({
            data: formData,
            timestamp: Date.now()
        }));
        
        // Show saved indicator
        this.showSavedIndicator(formId);
        form.isDirty = false;
    }
    
    loadFormData(formId) {
        const saved = localStorage.getItem(`form_${formId}`);
        if (!saved) return;
        
        try {
            const { data, timestamp } = JSON.parse(saved);
            
            // Check if data is not too old (24 hours)
            if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(`form_${formId}`);
                return;
            }
            
            const form = this.forms.get(formId);
            if (!form) return;
            
            // Restore form data
            Object.keys(data).forEach(fieldName => {
                const field = form.fields.get(fieldName);
                if (field && data[fieldName]) {
                    field.element.value = data[fieldName];
                }
            });
            
            this.showRestoredIndicator(formId);
            
        } catch (error) {
            console.error('Failed to load form data:', error);
            localStorage.removeItem(`form_${formId}`);
        }
    }
    
    showUnsavedIndicator(formId) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const indicator = form.element.querySelector('.autosave-indicator');
        if (indicator) {
            indicator.className = 'autosave-indicator unsaved';
            indicator.innerHTML = '<i class="fas fa-circle"></i> <span>Unsaved changes</span>';
        }
    }
    
    showSavedIndicator(formId) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const indicator = form.element.querySelector('.autosave-indicator');
        if (indicator) {
            indicator.className = 'autosave-indicator saved';
            indicator.innerHTML = '<i class="fas fa-check-circle"></i> <span>All changes saved</span>';
        }
    }
    
    showRestoredIndicator(formId) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const notification = document.createElement('div');
        notification.className = 'form-notification restored';
        notification.innerHTML = `
            <i class="fas fa-undo"></i>
            <span>Previous form data has been restored</span>
            <button class="btn-dismiss" aria-label="Dismiss">&times;</button>
        `;
        
        form.element.insertBefore(notification, form.element.firstChild);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Manual dismiss
        notification.querySelector('.btn-dismiss').addEventListener('click', () => {
            notification.remove();
        });
    }
    
    setupFormSubmission() {
        // Add custom submit handlers
        this.addSubmitHandler('contact-form', async (formData, formElement) => {
            return await this.submitContactForm(formData);
        });
        
        this.addSubmitHandler('newsletter-form', async (formData, formElement) => {
            return await this.submitNewsletterForm(formData);
        });
        
        this.addSubmitHandler('quote-form', async (formData, formElement) => {
            return await this.submitQuoteForm(formData);
        });
    }
    
    addSubmitHandler(formId, handler) {
        this.submitHandlers.set(formId, handler);
    }
    
    async handleFormSubmit(formId) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        form.submissionAttempts++;
        
        // Validate form
        if (!this.validateForm(formId)) {
            this.showFormError(formId, 'Please correct the errors above');
            return;
        }
        
        // Show loading state
        this.setFormLoading(formId, true);
        
        try {
            // Collect form data
            const formData = this.collectFormData(formId);
            
            // Get custom handler or use default
            const handler = this.submitHandlers.get(formId) || this.defaultSubmitHandler;
            
            // Submit form
            const response = await handler(formData, form.element);
            
            if (response.success) {
                this.handleSubmitSuccess(formId, response);
            } else {
                this.handleSubmitError(formId, response.message || 'Submission failed');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.handleSubmitError(formId, 'Network error. Please try again.');
        } finally {
            this.setFormLoading(formId, false);
        }
    }
    
    collectFormData(formId) {
        const form = this.forms.get(formId);
        if (!form) return {};
        
        const formData = {};
        
        form.fields.forEach((field, fieldName) => {
            const element = field.element;
            
            if (element.type === 'checkbox') {
                formData[fieldName] = element.checked;
            } else if (element.type === 'radio') {
                if (element.checked) {
                    formData[fieldName] = element.value;
                }
            } else if (element.type === 'file') {
                // Collect uploaded file data
                const container = element.closest('.file-upload');
                const progressItems = container.querySelectorAll('.file-progress-item[data-file-data]');
                formData[fieldName] = Array.from(progressItems).map(item => 
                    JSON.parse(item.dataset.fileData)
                );
            } else {
                formData[fieldName] = PegeArts.utils.sanitizeInput(element.value);
            }
        });
        
        return formData;
    }
    
    async defaultSubmitHandler(formData, formElement) {
        const submitUrl = formElement.action || '/api/contact';
        
        const response = await fetch(submitUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(formData)
        });
        
        return await response.json();
    }
    
    async submitContactForm(formData) {
        // Enhanced contact form submission with integration possibilities
        const payload = {
            ...formData,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            source: 'website'
        };
        
        // Track form submission
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                event_category: 'Contact',
                event_label: 'Contact Form',
                value: 1
            });
        }
        
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Thank you! Your message has been sent successfully.'
                });
            }, 1500);
        });
    }
    
    async submitNewsletterForm(formData) {
        // Newsletter subscription
        const response = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: formData.email,
                firstName: formData.firstName,
                source: 'website',
                timestamp: new Date().toISOString()
            })
        });
        
        return await response.json();
    }
    
    async submitQuoteForm(formData) {
        // Project quote request
        const response = await fetch('/api/quote/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...formData,
                timestamp: new Date().toISOString(),
                urgency: this.calculateUrgency(formData)
            })
        });
        
        return await response.json();
    }
    
    calculateUrgency(formData) {
        // Simple urgency calculation based on form data
        let urgency = 'normal';
        
        if (formData.timeline && formData.timeline.includes('urgent')) {
            urgency = 'high';
        } else if (formData.budget && parseInt(formData.budget) > 50000) {
            urgency = 'high';
        }
        
        return urgency;
    }
    
    setFormLoading(formId, loading) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const submitBtn = form.element.querySelector('[type="submit"]');
        const formElement = form.element;
        
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            
            const originalText = submitBtn.textContent;
            submitBtn.dataset.originalText = originalText;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            formElement.classList.add('form-loading');
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            
            const originalText = submitBtn.dataset.originalText;
            if (originalText) {
                submitBtn.textContent = originalText;
            }
            
            formElement.classList.remove('form-loading');
        }
    }
    
    handleSubmitSuccess(formId, response) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        // Clear saved form data
        localStorage.removeItem(`form_${formId}`);
        
        // Show success message
        this.showFormSuccess(formId, response.message);
        
        // Reset form if specified
        if (response.resetForm !== false) {
            this.resetForm(formId);
        }
        
        // Play success sound
        if (PegeArts.audioManager) {
            PegeArts.audioManager.playUISound('success');
        }
        
        // Optional redirect
        if (response.redirectUrl) {
            setTimeout(() => {
                window.location.href = response.redirectUrl;
            }, 2000);
        }
    }
    
    handleSubmitError(formId, message) {
        this.showFormError(formId, message);
        
        // Play error sound
        if (PegeArts.audioManager) {
            PegeArts.audioManager.playUISound('error');
        }
    }
    
    showFormSuccess(formId, message) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const notification = this.createFormNotification(message, 'success');
        form.element.insertBefore(notification, form.element.firstChild);
        
        // Auto dismiss
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 8000);
    }
    
    showFormError(formId, message) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        const notification = this.createFormNotification(message, 'error');
        form.element.insertBefore(notification, form.element.firstChild);
        
        // Auto dismiss
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 8000);
    }
    
    createFormNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `form-notification ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            </div>
            <button class="btn-dismiss" aria-label="Dismiss">&times;</button>
        `;
        
        // Manual dismiss
        notification.querySelector('.btn-dismiss').addEventListener('click', () => {
            notification.remove();
        });
        
        return notification;
    }
    
    resetForm(formId) {
        const form = this.forms.get(formId);
        if (!form) return;
        
        // Reset form element
        form.element.reset();
        
        // Clear field states
        form.fields.forEach(field => {
            field.isValid = true;
            field.isDirty = false;
            
            const container = field.element.closest('.form-group') || field.element.parentElement;
            container.classList.remove('has-error', 'has-success');
            
            const errorElement = container.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }
        });
        
        // Clear file uploads
        const fileContainers = form.element.querySelectorAll('.file-progress-container');
        fileContainers.forEach(container => {
            container.innerHTML = '';
        });
        
        // Reset form state
        form.isValid = false;
        form.isDirty = false;
        form.element.classList.remove('form-valid', 'form-invalid');
    }
    
    setupCustomElements() {
        // Character counter for textareas
        const textareas = document.querySelectorAll('textarea[maxlength]');
        textareas.forEach(textarea => this.addCharacterCounter(textarea));
        
        // Custom select elements
        const customSelects = document.querySelectorAll('.custom-select');
        customSelects.forEach(select => this.enhanceSelectElement(select));
    }
    
    addCharacterCounter(textarea) {
        const maxLength = parseInt(textarea.getAttribute('maxlength'));
        if (!maxLength) return;
        
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        
        const updateCounter = () => {
            const remaining = maxLength - textarea.value.length;
            counter.textContent = `${remaining} characters remaining`;
            counter.classList.toggle('warning', remaining < 50);
            counter.classList.toggle('danger', remaining < 10);
        };
        
        textarea.addEventListener('input', updateCounter);
        textarea.parentNode.appendChild(counter);
        
        updateCounter();
    }
    
    enhanceSelectElement(select) {
        // Custom select dropdown implementation
        // This would create a more customizable select element
        // Implementation would depend on specific design requirements
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `toast toast-${type}`;
        notification.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;
        
        // Add to toast container or create one
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto dismiss
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
        // Manual dismiss
        notification.querySelector('.toast-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        return icons[type] || icons.info;
    }
    
    destroy() {
        // Clear autosave interval
        if (this.autosaveInterval) {
            clearInterval(this.autosaveInterval);
        }
        
        // Clean up forms
        this.forms.clear();
        this.validators.clear();
        this.submitHandlers.clear();
    }
}

// =============================================================================
// THEME MANAGEMENT SYSTEM
// =============================================================================

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'auto';
        this.systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        this.customThemes = new Map();
        this.themeTransitionDuration = 300;
        
        this.init();
    }
    
    init() {
        this.setupThemeDetection();
        this.setupControls();
        this.applyTheme();
        this.loadCustomThemes();
    }
    
    setupThemeDetection() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            this.systemTheme = e.matches ? 'dark' : 'light';
            
            if (this.currentTheme === 'auto') {
                this.applyTheme();
            }
        });
    }
    
    setupControls() {
        const themeToggle = document.querySelector('.theme-toggle');
        const themeSelect = document.querySelector('.theme-select');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        if (themeSelect) {
            themeSelect.value = this.currentTheme;
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }
    }
    
    toggleTheme() {
        const themes = ['auto', 'light', 'dark'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.setTheme(themes[nextIndex]);
    }
    
    setTheme(theme) {
        if (!['auto', 'light', 'dark'].includes(theme)) {
            console.warn('Invalid theme:', theme);
            return;
        }
        
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        
        this.applyTheme();
        this.updateControls();
        
        // Trigger theme change event
        document.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme, resolvedTheme: this.getResolvedTheme() }
        }));
        
        // Track theme usage
        if (typeof gtag !== 'undefined') {
            gtag('event', 'theme_change', {
                event_category: 'User Preference',
                event_label: theme,
                value: 1
            });
        }
    }
    
    applyTheme() {
        const resolvedTheme = this.getResolvedTheme();
        
        // Add transition class for smooth theme changes
        document.documentElement.classList.add('theme-transitioning');
        
        // Apply theme class
        document.documentElement.setAttribute('data-theme', resolvedTheme);
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${resolvedTheme}`);
        
        // Update meta theme-color
        this.updateMetaThemeColor(resolvedTheme);
        
        // Remove transition class after animation
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, this.themeTransitionDuration);
        
        // Update cosmic canvas if present
        this.updateCosmicTheme(resolvedTheme);
        
        console.log(`🎨 Theme applied: ${resolvedTheme} (${this.currentTheme})`);
    }
    
    getResolvedTheme() {
        if (this.currentTheme === 'auto') {
            return this.systemTheme;
        }
        return this.currentTheme;
    }
    
    updateMetaThemeColor(theme) {
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            document.head.appendChild(themeColorMeta);
        }
        
        const themeColors = {
            light: '#ffffff',
            dark: '#1a1a2e'
        };
        
        themeColorMeta.content = themeColors[theme] || themeColors.dark;
    }
    
    updateCosmicTheme(theme) {
        const cosmicCanvas = document.getElementById('cosmic-canvas');
        if (cosmicCanvas) {
            const opacity = theme === 'light' ? '0.3' : '0.6';
            cosmicCanvas.style.opacity = opacity;
        }
    }
    
    updateControls() {
        const themeToggle = document.querySelector('.theme-toggle');
        const themeSelect = document.querySelector('.theme-select');
        
        if (themeToggle) {
            const icons = {
                auto: 'fa-adjust',
                light: 'fa-sun',
                dark: 'fa-moon'
            };
            
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = `fas ${icons[this.currentTheme]}`;
            }
            
            themeToggle.setAttribute('aria-label', `Current theme: ${this.currentTheme}`);
        }
        
        if (themeSelect) {
            themeSelect.value = this.currentTheme;
        }
    }
    
    loadCustomThemes() {
        // Load custom theme definitions
        const customThemeData = localStorage.getItem('customThemes');
        if (customThemeData) {
            try {
                const themes = JSON.parse(customThemeData);
                Object.entries(themes).forEach(([name, theme]) => {
                    this.addCustomTheme(name, theme);
                });
            } catch (error) {
                console.error('Failed to load custom themes:', error);
            }
        }
    }
    
    addCustomTheme(name, theme) {
        this.customThemes.set(name, theme);
        this.saveCustomTheme(name, theme);
        
        // Add to theme selector if present
        const themeSelect = document.querySelector('.theme-select');
        if (themeSelect) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = theme.displayName || name;
            themeSelect.appendChild(option);
        }
    }
    
    saveCustomTheme(name, theme) {
        const customThemes = JSON.parse(localStorage.getItem('customThemes') || '{}');
        customThemes[name] = theme;
        localStorage.setItem('customThemes', JSON.stringify(customThemes));
    }
    
    applyCustomTheme(name) {
        const theme = this.customThemes.get(name);
        if (!theme) return;
        
        const root = document.documentElement;
        
        // Apply custom CSS variables
        Object.entries(theme.variables || {}).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });
        
        // Apply custom classes
        if (theme.bodyClass) {
            document.body.className = document.body.className.replace(/custom-theme-\w+/g, '');
            document.body.classList.add(theme.bodyClass);
        }
    }
    
    createThemeBuilder() {
        // Advanced theme builder interface
        const builder = document.createElement('div');
        builder.className = 'theme-builder';
        
        builder.innerHTML = `
            <div class="theme-builder-header">
                <h3>Theme Builder</h3>
                <button class="close-builder" aria-label="Close">&times;</button>
            </div>
            
            <div class="theme-builder-content">
                <div class="color-controls">
                    <div class="color-group">
                        <label>Primary Color</label>
                        <input type="color" id="primary-color" value="#a78bfa">
                    </div>
                    
                    <div class="color-group">
                        <label>Secondary Color</label>
                        <input type="color" id="secondary-color" value="#f9a8d4">
                    </div>
                    
                    <div class="color-group">
                        <label>Background Color</label>
                        <input type="color" id="bg-color" value="#1a1a2e">
                    </div>
                    
                    <div class="color-group">
                        <label>Text Color</label>
                        <input type="color" id="text-color" value="#e2e8f0">
                    </div>
                </div>
                
                <div class="typography-controls">
                    <div class="font-group">
                        <label>Font Family</label>
                        <select id="font-family">
                            <option value="'Inter', sans-serif">Inter</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Poppins', sans-serif">Poppins</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                        </select>
                    </div>
                    
                    <div class="size-group">
                        <label>Base Font Size</label>
                        <input type="range" id="font-size" min="14" max="20" value="16">
                        <span class="size-value">16px</span>
                    </div>
                </div>
                
                <div class="spacing-controls">
                    <div class="spacing-group">
                        <label>Border Radius</label>
                        <input type="range" id="border-radius" min="0" max="20" value="8">
                        <span class="radius-value">8px</span>
                    </div>
                </div>
                
                <div class="theme-preview">
                    <div class="preview-card">
                        <h4>Preview</h4>
                        <p>This is how your custom theme will look.</p>
                        <button class="btn btn-primary">Primary Button</button>
                    </div>
                </div>
                
                <div class="theme-actions">
                    <input type="text" id="theme-name" placeholder="Theme name">
                    <button class="btn btn-primary save-theme">Save Theme</button>
                    <button class="btn btn-secondary reset-theme">Reset</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(builder);
        this.setupThemeBuilderEvents(builder);
        
        return builder;
    }
    
    setupThemeBuilderEvents(builder) {
        const colorInputs = builder.querySelectorAll('input[type="color"]');
        const rangeInputs = builder.querySelectorAll('input[type="range"]');
        const fontSelect = builder.querySelector('#font-family');
        
        // Live preview updates
        const updatePreview = () => {
            const theme = {
                variables: {
                    'primary-color': builder.querySelector('#primary-color').value,
                    'secondary-color': builder.querySelector('#secondary-color').value,
                    'bg-color': builder.querySelector('#bg-color').value,
                    'text-color': builder.querySelector('#text-color').value,
                    'font-family': fontSelect.value,
                    'font-size': builder.querySelector('#font-size').value + 'px',
                    'border-radius': builder.querySelector('#border-radius').value + 'px'
                }
            };
            
            this.applyThemePreview(theme, builder.querySelector('.theme-preview'));
            this.updateRangeValues(builder);
        };
        
        colorInputs.forEach(input => {
            input.addEventListener('input', updatePreview);
        });
        
        rangeInputs.forEach(input => {
            input.addEventListener('input', updatePreview);
        });
        
        fontSelect.addEventListener('change', updatePreview);
        
        // Save theme
        builder.querySelector('.save-theme').addEventListener('click', () => {
            this.saveCustomThemeFromBuilder(builder);
        });
        
        // Reset theme
        builder.querySelector('.reset-theme').addEventListener('click', () => {
            this.resetThemeBuilder(builder);
        });
        
        // Close builder
        builder.querySelector('.close-builder').addEventListener('click', () => {
            document.body.removeChild(builder);
        });
        
        // Initial update
        updatePreview();
    }
    
    applyThemePreview(theme, previewElement) {
        Object.entries(theme.variables).forEach(([key, value]) => {
            previewElement.style.setProperty(`--${key}`, value);
        });
    }
    
    updateRangeValues(builder) {
        const fontSize = builder.querySelector('#font-size');
        const borderRadius = builder.querySelector('#border-radius');
        
        builder.querySelector('.size-value').textContent = fontSize.value + 'px';
        builder.querySelector('.radius-value').textContent = borderRadius.value + 'px';
    }
    
    saveCustomThemeFromBuilder(builder) {
        const themeName = builder.querySelector('#theme-name').value.trim();
        
        if (!themeName) {
            alert('Please enter a theme name');
            return;
        }
        
        const theme = {
            displayName: themeName,
            variables: {
                'primary-color': builder.querySelector('#primary-color').value,
                'secondary-color': builder.querySelector('#secondary-color').value,
                'bg-color': builder.querySelector('#bg-color').value,
                'text-color': builder.querySelector('#text-color').value,
                'font-family': builder.querySelector('#font-family').value,
                'font-size': builder.querySelector('#font-size').value + 'px',
                'border-radius': builder.querySelector('#border-radius').value + 'px'
            },
            created: new Date().toISOString()
        };
        
        this.addCustomTheme(themeName, theme);
        
        // Show success message
        this.showThemeMessage('Theme saved successfully!', 'success');
        
        // Close builder
        document.body.removeChild(builder);
    }
    
    resetThemeBuilder(builder) {
        builder.querySelector('#primary-color').value = '#a78bfa';
        builder.querySelector('#secondary-color').value = '#f9a8d4';
        builder.querySelector('#bg-color').value = '#1a1a2e';
        builder.querySelector('#text-color').value = '#e2e8f0';
        builder.querySelector('#font-family').value = "'Inter', sans-serif";
        builder.querySelector('#font-size').value = '16';
        builder.querySelector('#border-radius').value = '8';
        builder.querySelector('#theme-name').value = '';
        
        // Trigger update
        builder.querySelector('#primary-color').dispatchEvent(new Event('input'));
    }
    
    showThemeMessage(message, type) {
        const notification = document.createElement('div');
        notification.className = `theme-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    exportTheme(themeName) {
        const theme = this.customThemes.get(themeName);
        if (!theme) return null;
        
        const exportData = {
            name: themeName,
            theme: theme,
            version: '1.0',
            exported: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${themeName}-theme.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    importTheme(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (!importData.name || !importData.theme) {
                    throw new Error('Invalid theme file format');
                }
                
                this.addCustomTheme(importData.name, importData.theme);
                this.showThemeMessage(`Theme "${importData.name}" imported successfully!`, 'success');
                
            } catch (error) {
                console.error('Theme import error:', error);
                this.showThemeMessage('Failed to import theme file', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    deleteCustomTheme(name) {
        if (confirm(`Are you sure you want to delete the "${name}" theme?`)) {
            this.customThemes.delete(name);
            
            // Remove from localStorage
            const customThemes = JSON.parse(localStorage.getItem('customThemes') || '{}');
            delete customThemes[name];
            localStorage.setItem('customThemes', JSON.stringify(customThemes));
            
            // Remove from theme selector
            const themeSelect = document.querySelector('.theme-select');
            if (themeSelect) {
                const option = themeSelect.querySelector(`option[value="${name}"]`);
                if (option) {
                    option.remove();
                }
            }
            
            this.showThemeMessage(`Theme "${name}" deleted`, 'success');
        }
    }
    
    getAvailableThemes() {
        const themes = [
            { value: 'auto', label: 'System Default', icon: 'fa-adjust' },
            { value: 'light', label: 'Light Mode', icon: 'fa-sun' },
            { value: 'dark', label: 'Dark Mode', icon: 'fa-moon' }
        ];
        
        // Add custom themes
        this.customThemes.forEach((theme, name) => {
            themes.push({
                value: name,
                label: theme.displayName || name,
                icon: 'fa-palette',
                custom: true
            });
        });
        
        return themes;
    }
    
    getCurrentTheme() {
        return {
            current: this.currentTheme,
            resolved: this.getResolvedTheme(),
            system: this.systemTheme
        };
    }
    
    // Accessibility features
    setupAccessibilityEnhancements() {
        // High contrast mode detection
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        
        highContrastQuery.addEventListener('change', (e) => {
            document.documentElement.classList.toggle('high-contrast', e.matches);
        });
        
        // Initial state
        document.documentElement.classList.toggle('high-contrast', highContrastQuery.matches);
        
        // Reduced motion detection
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        reducedMotionQuery.addEventListener('change', (e) => {
            document.documentElement.classList.toggle('reduced-motion', e.matches);
            PegeArts.state.reducedMotion = e.matches;
        });
        
        // Initial state
        document.documentElement.classList.toggle('reduced-motion', reducedMotionQuery.matches);
        PegeArts.state.reducedMotion = reducedMotionQuery.matches;
    }
    
    // Theme-based performance optimizations
    optimizeForTheme() {
        const resolvedTheme = this.getResolvedTheme();
        
        // Adjust cosmic animation intensity based on theme
        if (PegeArts.cosmicEngine) {
            const intensity = resolvedTheme === 'light' ? 0.5 : 1.0;
            PegeArts.cosmicEngine.canvas.style.opacity = intensity;
        }
        
        // Adjust particle systems
        if (PegeArts.particleSystems) {
            PegeArts.particleSystems.forEach(system => {
                system.updateTheme(resolvedTheme);
            });
        }
    }
    
    destroy() {
        // Clean up event listeners and stored data
        this.customThemes.clear();
    }
}

// =============================================================================
// MAIN APPLICATION INITIALIZATION
// =============================================================================

// Initialize PegeArts application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing PegeArts Portfolio...');
    
    // Performance monitoring
    const initStart = performance.now();
    
    try {
        // Initialize core systems
        PegeArts.cosmicEngine = new CosmicAnimationEngine();
        PegeArts.navigationManager = new NavigationManager();
        PegeArts.textAnimationEngine = new TextAnimationEngine();
        PegeArts.portfolioManager = new PortfolioManager();
        PegeArts.audioManager = new AudioManager();
        PegeArts.formManager = new FormManager();
        PegeArts.themeManager = new ThemeManager();
        
        // Setup accessibility enhancements
        PegeArts.themeManager.setupAccessibilityEnhancements();
        
        // Initialize additional features
        initializeScrollEffects();
        initializeInteractiveElements();
        initializeKeyboardShortcuts();
        initializeServiceWorker();
        initializeAnalytics();
        
        // Mark as loaded
        PegeArts.state.isLoaded = true;
        document.body.classList.add('app-loaded');
        
        // Performance metrics
        const initTime = performance.now() - initStart;
        console.log(`✅ PegeArts Portfolio initialized in ${initTime.toFixed(2)}ms`);
        
        // Dispatch ready event
        document.dispatchEvent(new CustomEvent('pegearts:ready', {
            detail: { initTime, version: '2.0.0' }
        }));
        
    } catch (error) {
        console.error('❌ Failed to initialize PegeArts Portfolio:', error);
        
        // Fallback mode
        document.body.classList.add('app-error');
        showErrorFallback(error);
    }
});

// =============================================================================
// ADDITIONAL INITIALIZATION FUNCTIONS
// =============================================================================

function initializeScrollEffects() {
    // Parallax scrolling effects
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    if (parallaxElements.length > 0 && !PegeArts.state.reducedMotion) {
        const handleParallax = PegeArts.utils.throttle(() => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const rate = parseFloat(element.dataset.parallax) || 0.5;
                const yPos = -(scrolled * rate);
                element.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });
        }, 16);
        
        window.addEventListener('scroll', handleParallax, { passive: true });
    }
    
    // Reveal animations on scroll
    const revealElements = document.querySelectorAll('[data-reveal]');
    
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animation = element.dataset.reveal || 'fadeInUp';
                    const delay = parseInt(element.dataset.revealDelay) || 0;
                    
                    setTimeout(() => {
                        element.classList.add('revealed', `animate-${animation}`);
                    }, delay);
                    
                    revealObserver.unobserve(element);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    }
}

function initializeInteractiveElements() {
    // Enhanced button interactions
    const buttons = document.querySelectorAll('button, .btn');
    
    buttons.forEach(btn => {
        // Ripple effect
        btn.addEventListener('click', function(e) {
            if (PegeArts.state.reducedMotion) return;
            
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
        
        // Sound effects
        btn.addEventListener('click', () => {
            if (PegeArts.audioManager) {
                PegeArts.audioManager.playUISound('click');
            }
        });
        
        btn.addEventListener('mouseenter', () => {
            if (PegeArts.audioManager) {
                PegeArts.audioManager.playUISound('hover');
            }
        });
    });
    
    // Enhanced link interactions
    const links = document.querySelectorAll('a[href^="http"]');
    
    links.forEach(link => {
        // External link indicator
        if (link.hostname !== location.hostname) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-external-link-alt external-icon';
            link.appendChild(icon);
        }
    });
    
    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('[data-copy]');
    
    copyButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const textToCopy = btn.dataset.copy || btn.textContent;
            
            try {
                await navigator.clipboard.writeText(textToCopy);
                
                // Visual feedback
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                btn.classList.add('success');
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('success');
                }, 2000);
                
                if (PegeArts.audioManager) {
                    PegeArts.audioManager.playUISound('success');
                }
                
            } catch (error) {
                console.error('Failed to copy text:', error);
                
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    btn.textContent = 'Copy';
                }, 2000);
            }
        });
    });
}

function initializeKeyboardShortcuts() {
    const shortcuts = new Map([
        ['KeyT', () => PegeArts.themeManager.toggleTheme()],
        ['KeyA', () => PegeArts.audioManager.toggleAudio()],
        ['KeyP', () => PegeArts.audioManager.togglePlaylist()],
        ['KeyH', () => PegeArts.navigationManager.navigateTo('home')],
        ['KeyS', () => PegeArts.navigationManager.navigateTo('services')],
        ['KeyW', () => PegeArts.navigationManager.navigateTo('portfolio')],
        ['KeyC', () => PegeArts.navigationManager.navigateTo('contact')],
        ['Escape', () => closeAllModals()],
        ['Slash', () => focusSearchInput()]
    ]);
    
    document.addEventListener('keydown', (e) => {
        // Only trigger if no input is focused and modifier keys are appropriate
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = e.code;
        const shortcut = shortcuts.get(key);
        
        if (shortcut && (e.ctrlKey || e.metaKey || e.altKey || key === 'Escape' || key === 'Slash')) {
            e.preventDefault();
            shortcut();
        }
    });
    
    // Show keyboard shortcuts help
    const showShortcutsHelp = () => {
        const modal = document.createElement('div');
        modal.className = 'shortcuts-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Keyboard Shortcuts</h3>
                <div class="shortcuts-list">
                    <div class="shortcut-item">
                        <kbd>Ctrl/Cmd + T</kbd>
                        <span>Toggle Theme</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl/Cmd + A</kbd>
                        <span>Toggle Audio</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Ctrl/Cmd + P</kbd>
                        <span>Toggle Playlist</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Alt + ↑/↓</kbd>
                        <span>Navigate Sections</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Esc</kbd>
                        <span>Close Modals</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>/</kbd>
                        <span>Focus Search</span>
                    </div>
                </div>
                <button class="close-shortcuts">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-shortcuts').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    };
    
    // Add help trigger (usually Ctrl+? or F1)
    shortcuts.set('F1', showShortcutsHelp);
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal, .lightbox, .project-modal');
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close, .lightbox-close, button[aria-label*="Close"]');
        if (closeBtn) {
            closeBtn.click();
        }
    });
}

function focusSearchInput() {
    const searchInput = document.querySelector('#portfolio-search, input[type="search"]');
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
}

function initializeServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('📱 Service Worker registered:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <div class="update-content">
            <i class="fas fa-download"></i>
            <span>A new version is available!</span>
            <button class="btn-update">Update</button>
            <button class="btn-dismiss">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    notification.querySelector('.btn-update').addEventListener('click', () => {
        window.location.reload();
    });
    
    notification.querySelector('.btn-dismiss').addEventListener('click', () => {
        document.body.removeChild(notification);
    });
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
}

function initializeAnalytics() {
    // Enhanced analytics and error reporting
    if (typeof gtag !== 'undefined') {
        // Track page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            
            gtag('event', 'page_load_time', {
                event_category: 'Performance',
                value: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                custom_parameter_1: perfData.type
            });
        });
        
        // Track JavaScript errors
        window.addEventListener('error', (e) => {
            gtag('event', 'javascript_error', {
                event_category: 'Error',
                event_label: e.message,
                value: 1
            });
        });
        
        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            gtag('event', 'promise_rejection', {
                event_category: 'Error',
                event_label: e.reason.toString(),
                value: 1
            });
        });
        
        // Track user engagement
        let engagementTime = 0;
        let lastActiveTime = Date.now();
        
        const trackEngagement = () => {
            const now = Date.now();
            engagementTime += now - lastActiveTime;
            lastActiveTime = now;
        };
        
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, trackEngagement, { passive: true });
        });
        
        // Send engagement data periodically
        setInterval(() => {
            if (engagementTime > 0) {
                gtag('event', 'user_engagement', {
                    event_category: 'Navigation',
                    value: Math.round(engagementTime / 1000),
                    custom_parameter_1: PegeArts.navigationManager.getCurrentSection()
                });
                
                engagementTime = 0;
            }
        }, 30000);
    }
}

function showErrorFallback(error) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-fallback';
    errorContainer.innerHTML = `
        <div class="error-content">
            <h2>⚠️ Something went wrong</h2>
            <p>We're sorry, but an error occurred while loading the application.</p>
            <details>
                <summary>Technical Details</summary>
                <pre>${error.toString()}</pre>
            </details>
            <button onclick="location.reload()" class="btn btn-primary">
                <i class="fas fa-redo"></i> Reload Page
            </button>
        </div>
    `;
    
    document.body.appendChild(errorContainer);
}

// =============================================================================
// WINDOW EVENT HANDLERS
// =============================================================================

// Handle window resize
window.addEventListener('resize', PegeArts.utils.debounce(() => {
    // Update device state
    PegeArts.state.isMobile = window.innerWidth <= 768;
    PegeArts.state.isTablet = window.innerWidth <= 1024;
    
    // Update body classes
    document.body.classList.toggle('mobile', PegeArts.state.isMobile);
    document.body.classList.toggle('tablet', PegeArts.state.isTablet);
    
    // Notify components of resize
    document.dispatchEvent(new CustomEvent('pegearts:resize', {
        detail: {
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile: PegeArts.state.isMobile,
            isTablet: PegeArts.state.isTablet
        }
    }));
}, 250));

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations and audio when tab is hidden
        if (PegeArts.cosmicEngine) {
            PegeArts.cosmicEngine.pause();
        }
        
        if (PegeArts.audioManager) {
            PegeArts.audioManager.stopAmbientMusic();
        }
    } else {
        // Resume when tab becomes visible
        if (PegeArts.cosmicEngine) {
            PegeArts.cosmicEngine.resume();
        }
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    document.body.classList.remove('offline');
    console.log('🌐 Connection restored');
});

window.addEventListener('offline', () => {
    document.body.classList.add('offline');
    console.log('📡 Connection lost');
});

// =============================================================================
// EXPORT FOR GLOBAL ACCESS
// =============================================================================

// Make PegeArts globally available
window.PegeArts = PegeArts;

// Export individual components for modular usage
window.PegeArtsComponents = {
    CosmicAnimationEngine,
    NavigationManager,
    TextAnimationEngine,
    PortfolioManager,
    AudioManager,
    FormManager,
    ThemeManager
};

console.log('🎭 PegeArts Portfolio System Ready');



