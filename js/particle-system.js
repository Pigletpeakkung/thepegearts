/**
 * PARTICLE-SYSTEM.JS - Advanced Cosmic Particle System
 * Professional-grade particle effects for Thanatsitt's portfolio
 * Version: 2.1 - Enhanced Performance & Visual Effects
 * Author: Thanatsitt Santisamranwilai
 */

class AdvancedParticleSystem {
    constructor(canvas, options = {}) {
        this.version = '2.1';
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
        
        // Configuration
        this.options = {
            particleCount: options.particleCount || this.getOptimalParticleCount(),
            performanceMode: options.performanceMode || 'medium',
            deviceCapabilities: options.deviceCapabilities || this.detectDeviceCapabilities(),
            enableTrails: options.enableTrails !== false,
            enableConnections: options.enableConnections !== false,
            enableInteraction: options.enableInteraction !== false,
            enablePhysics: options.enablePhysics !== false,
            colorPalette: options.colorPalette || 'cosmic',
            backgroundAlpha: options.backgroundAlpha || 0.1,
            maxFPS: options.maxFPS || 60,
            connectionDistance: options.connectionDistance || 120,
            interactionRadius: options.interactionRadius || 150
        };
        
        // System state
        this.particles = [];
        this.connections = [];
        this.forces = [];
        this.emitters = [];
        this.isRunning = false;
        this.isPaused = false;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.currentFPS = 60;
        
        // Interaction state
        this.mouse = {
            x: 0,
            y: 0,
            isActive: false,
            lastMoveTime: 0,
            velocity: { x: 0, y: 0 },
            trail: []
        };
        
        // Visual effects
        this.bloomEnabled = this.options.performanceMode === 'high';
        this.trailsEnabled = this.options.enableTrails && this.options.performanceMode !== 'low';
        this.connectionsEnabled = this.options.enableConnections;
        
        // Performance tracking
        this.performanceMetrics = {
            avgFrameTime: 16.67,
            maxFrameTime: 33.33,
            particleUpdateTime: 0,
            renderTime: 0,
            memoryUsage: 0
        };
        
        console.log(`✨ Advanced Particle System v${this.version} initializing...`);
        this.init();
    }
    
    detectDeviceCapabilities() {
        return {
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isLowPower: navigator.deviceMemory ? navigator.deviceMemory < 4 : false,
            memory: navigator.deviceMemory || 4,
            cores: navigator.hardwareConcurrency || 4,
            hasWebGL: this.detectWebGL(),
            supportsOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
            pixelRatio: window.devicePixelRatio || 1,
            maxTextureSize: this.getMaxTextureSize()
        };
    }
    
    detectWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }
    
    getMaxTextureSize() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048;
        } catch (e) {
            return 2048;
        }
    }
    
    getOptimalParticleCount() {
        const base = this.options.deviceCapabilities?.isMobile ? 25 : 50;
        const memoryMultiplier = Math.min(2, (this.options.deviceCapabilities?.memory || 4) / 4);
        const coreMultiplier = Math.min(1.5, (this.options.deviceCapabilities?.cores || 4) / 4);
        
        return Math.floor(base * memoryMultiplier * coreMultiplier);
    }
    
    init() {
        this.setupCanvas();
        this.createColorPalettes();
        this.initializeParticles();
        this.setupEventListeners();
        this.createForceFields();
        this.startRenderLoop();
        
        console.log(`🎨 Particle system initialized with ${this.particles.length} particles`);
    }
    
    setupCanvas() {
        this.updateCanvasSize();
        
        // Setup context properties for better performance
        this.ctx.imageSmoothingEnabled = this.options.performanceMode === 'high';
        this.ctx.imageSmoothingQuality = this.options.performanceMode === 'high' ? 'high' : 'low';
        
        // Create offscreen canvas for performance optimization
        if (this.options.deviceCapabilities.supportsOffscreenCanvas && this.options.performanceMode === 'high') {
            this.offscreenCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
            this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        }
    }
    
    updateCanvasSize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, this.options.performanceMode === 'high' ? 2 : 1);
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.bounds = {
            width: rect.width,
            height: rect.height,
            centerX: rect.width / 2,
            centerY: rect.height / 2
        };
    }
    
    createColorPalettes() {
        this.colorPalettes = {
            cosmic: [
                { r: 167, g: 139, b: 250, name: 'cosmic-purple' },    // #a78bfa
                { r: 249, g: 168, b: 212, name: 'cosmic-pink' },      // #f9a8d4
                { r: 110, g: 231, b: 183, name: 'cosmic-green' },     // #6ee7b7
                { r: 252, g: 211, b: 77, name: 'cosmic-yellow' },     // #fcd34d
                { r: 99, g: 179, b: 237, name: 'cosmic-blue' },       // #63b3ed
                { r: 196, g: 181, b: 253, name: 'cosmic-lavender' },  // #c4b5fd
                { r: 251, g: 191, b: 36, name: 'cosmic-amber' }       // #fbbf24
            ],
            aurora: [
                { r: 34, g: 197, b: 94, name: 'aurora-green' },       // #22c55e
                { r: 59, g: 130, b: 246, name: 'aurora-blue' },       // #3b82f6
                { r: 147, g: 51, b: 234, name: 'aurora-purple' },     // #9333ea
                { r: 236, g: 72, b: 153, name: 'aurora-pink' },       // #ec4899
                { r: 34, g: 211, b: 238, name: 'aurora-cyan' }        // #22d3ee
            ],
            nebula: [
                { r: 239, g: 68, b: 68, name: 'nebula-red' },         // #ef4444
                { r: 245, g: 101, b: 101, name: 'nebula-rose' },      // #f56565
                { r: 251, g: 146, b: 60, name: 'nebula-orange' },     // #fb923c
                { r: 234, g: 179, b: 8, name: 'nebula-gold' },        // #eab308
                { r: 168, g: 85, b: 247, name: 'nebula-violet' }      // #a855f7
            ]
        };
        
        this.currentPalette = this.colorPalettes[this.options.colorPalette] || this.colorPalettes.cosmic;
    }
    
    initializeParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.options.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
        
        // Create special particles for enhanced visual appeal
        if (this.options.performanceMode === 'high') {
            this.createSpecialParticles();
        }
    }
    
    createParticle(x, y, options = {}) {
        const color = options.color || this.getRandomColor();
        const size = options.size || (Math.random() * 2.5 + 0.5);
        
        return {
            // Position
            x: x !== undefined ? x : Math.random() * this.bounds.width,
            y: y !== undefined ? y : Math.random() * this.bounds.height,
            
            // Velocity
            vx: options.vx || (Math.random() - 0.5) * 2,
            vy: options.vy || (Math.random() - 0.5) * 2,
            
            // Acceleration
            ax: 0,
            ay: 0,
            
            // Visual properties
            size: size,
            baseSize: size,
            maxSize: size * 2,
            color: color,
            opacity: options.opacity || Math.random() * 0.8 + 0.2,
            baseOpacity: options.opacity || Math.random() * 0.8 + 0.2,
            
            // Animation properties
            life: options.life || Math.random() * 300 + 200,
            maxLife: options.maxLife || Math.random() * 300 + 200,
            age: 0,
            
            // Physics properties
            mass: size * 0.1,
            friction: 0.98,
            bounce: 0.7,
            
            // Trail system
            trail: [],
            maxTrailLength: this.options.performanceMode === 'high' ? 8 : 4,
            
            // Special properties
            type: options.type || 'normal',
            behavior: options.behavior || 'float',
            target: null,
            energy: Math.random() * 100,
            
            // Interaction properties
            interactionStrength: Math.random() * 0.5 + 0.5,
            attractionRadius: Math.random() * 50 + 25,
            
            // Animation state
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.02 + 0.01,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            rotation: 0,
            
            // Performance tracking
            lastUpdateTime: 0,
            skipFrames: 0
        };
    }
    
    createSpecialParticles() {
        // Create some larger, more prominent particles
        for (let i = 0; i < 5; i++) {
            const specialParticle = this.createParticle(undefined, undefined, {
                size: Math.random() * 4 + 3,
                opacity: 0.6,
                type: 'special',
                behavior: 'orbit',
                life: 1000,
                maxLife: 1000
            });
            this.particles.push(specialParticle);
        }
        
        // Create emitter particles
        for (let i = 0; i < 2; i++) {
            const emitter = this.createParticle(undefined, undefined, {
                size: 1,
                opacity: 0.3,
                type: 'emitter',
                behavior: 'emit',
                life: Infinity,
                maxLife: Infinity
            });
            this.particles.push(emitter);
        }
    }
    
    getRandomColor() {
        const palette = this.currentPalette;
        return palette[Math.floor(Math.random() * palette.length)];
    }
    
    createForceFields() {
        this.forces = [];
        
        // Central attraction force
        this.forces.push({
            type: 'attraction',
            x: this.bounds.centerX,
            y: this.bounds.centerY,
            strength: 0.0001,
            radius: Math.max(this.bounds.width, this.bounds.height) * 0.6,
            active: true
        });
        
        // Mouse interaction force
        this.forces.push({
            type: 'mouse',
            x: 0,
            y: 0,
            strength: 0.5,
            radius: this.options.interactionRadius,
            active: false
        });
        
        // Repulsion zones at edges
        const edgeForce = 0.01;
        const edgeSize = 50;
        
        this.forces.push(
            // Top edge
            { type: 'repulsion', x: this.bounds.centerX, y: -edgeSize, strength: edgeForce, radius: edgeSize, active: true },
            // Bottom edge
            { type: 'repulsion', x: this.bounds.centerX, y: this.bounds.height + edgeSize, strength: edgeForce, radius: edgeSize, active: true },
            // Left edge
            { type: 'repulsion', x: -edgeSize, y: this.bounds.centerY, strength: edgeForce, radius: edgeSize, active: true },
            // Right edge
            { type: 'repulsion', x: this.bounds.width + edgeSize, y: this.bounds.centerY, strength: edgeForce, radius: edgeSize, active: true }
        );
    }
    
    setupEventListeners() {
        // Mouse/touch movement
        this.handleMouseMove = this.throttle((e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
            
            const newX = clientX - rect.left;
            const newY = clientY - rect.top;
            
            // Calculate mouse velocity
            this.mouse.velocity.x = (newX - this.mouse.x) * 0.1;
            this.mouse.velocity.y = (newY - this.mouse.y) * 0.1;
            
            this.mouse.x = newX;
            this.mouse.y = newY;
            this.mouse.lastMoveTime = performance.now();
            this.mouse.isActive = true;
            
            // Update mouse force
            const mouseForce = this.forces.find(f => f.type === 'mouse');
            if (mouseForce) {
                mouseForce.x = this.mouse.x;
                mouseForce.y = this.mouse.y;
                mouseForce.active = true;
                mouseForce.strength = Math.min(1, Math.abs(this.mouse.velocity.x) + Math.abs(this.mouse.velocity.y)) * 0.5;
            }
            
            // Add to mouse trail
            this.mouse.trail.push({ x: newX, y: newY, time: performance.now() });
            if (this.mouse.trail.length > 10) {
                this.mouse.trail.shift();
            }
        }, 16);
        
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('touchmove', this.handleMouseMove);
        
        // Mouse leave
        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.isActive = false;
            const mouseForce = this.forces.find(f => f.type === 'mouse');
            if (mouseForce) mouseForce.active = false;
        });
        
        // Window resize
        this.handleResize = this.debounce(() => {
            this.updateCanvasSize();
            this.createForceFields();
            console.log('🔄 Particle system resized');
        }, 250);
        
        window.addEventListener('resize', this.handleResize);
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        // Performance monitoring
        if (this.options.performanceMode !== 'low') {
            this.performanceMonitor = setInterval(() => {
                this.updatePerformanceMetrics();
            }, 2000);
        }
    }
    
    updatePerformanceMetrics() {
        const metrics = this.performanceMetrics;
        
        // Check if we need to reduce quality
        if (metrics.avgFrameTime > 33 || this.currentFPS < 30) {
            this.adaptPerformance();
        }
        
        // Memory usage estimation
        metrics.memoryUsage = this.particles.length * 200 + this.connections.length * 50; // bytes
        
        console.log(`📊 Performance: ${this.currentFPS.toFixed(1)} FPS, ${this.particles.length} particles`);
    }
    
    adaptPerformance() {
        console.log('⚡ Adapting performance due to low FPS');
        
        // Reduce particle count
        const reductionFactor = 0.8;
        const newCount = Math.floor(this.particles.length * reductionFactor);
        this.particles = this.particles.slice(0, Math.max(10, newCount));
        
        // Disable expensive features
        if (this.options.performanceMode === 'medium') {
            this.options.performanceMode = 'low';
            this.trailsEnabled = false;
            this.bloomEnabled = false;
            console.log('📉 Switched to low performance mode');
        }
    }
    
    startRenderLoop() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        
        const render = (currentTime) => {
            if (!this.isRunning || this.isPaused) {
                if (this.isRunning) {
                    requestAnimationFrame(render);
                }
                return;
            }
            
            this.deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;
            this.frameCount++;
            
            // Calculate FPS
            if (this.frameCount % 60 === 0) {
                this.currentFPS = 1000 / this.deltaTime;
            }
            
            // Target FPS limiting
            if (this.deltaTime < 1000 / this.options.maxFPS) {
                requestAnimationFrame(render);
                return;
            }
            
            // Update and render
            const updateStart = performance.now();
            this.update(currentTime);
            this.performanceMetrics.particleUpdateTime = performance.now() - updateStart;
            
            const renderStart = performance.now();
            this.render();
            this.performanceMetrics.renderTime = performance.now() - renderStart;
            
            this.performanceMetrics.avgFrameTime = 
                (this.performanceMetrics.avgFrameTime * 0.9) + (this.deltaTime * 0.1);
            
            requestAnimationFrame(render);
        };
        
        requestAnimationFrame(render);
        console.log('🎬 Particle system render loop started');
    }
    
    update(currentTime) {
        // Clean up old mouse trail
        if (this.mouse.isActive && currentTime - this.mouse.lastMoveTime > 100) {
            this.mouse.velocity.x *= 0.95;
            this.mouse.velocity.y *= 0.95;
        }
        
        // Update particles
        this.updateParticles(currentTime);
        
        // Update connections
        if (this.connectionsEnabled) {
            this.updateConnections();
        }
        
        // Clean up dead particles and create new ones
        this.maintainParticleCount();
    }
    
    updateParticles(currentTime) {
        this.particles.forEach((particle, index) => {
            // Skip updates for performance on low-end devices
            if (this.options.performanceMode === 'low' && particle.skipFrames > 0) {
                particle.skipFrames--;
                return;
            }
            
            // Reset acceleration
            particle.ax = 0;
            particle.ay = 0;
            
            // Apply forces
            this.applyForces(particle);
            
            // Update velocity
            particle.vx += particle.ax;
            particle.vy += particle.ay;
            
            // Apply friction
            particle.vx *= particle.friction;
            particle.vy *= particle.friction;
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Handle boundaries based on behavior
            this.handleBoundaries(particle);
            
            // Update visual properties
            this.updateParticleVisuals(particle, currentTime);
            
            // Update trail
            if (this.trailsEnabled) {
                this.updateParticleTrail(particle);
            }
            
            // Update special behaviors
            this.updateParticleBehavior(particle, currentTime);
            
            // Age the particle
            particle.age++;
            if (particle.life !== Infinity) {
                particle.life--;
            }
            
            // Performance: Skip frames for distant particles
            if (this.options.performanceMode === 'low') {
                const distanceFromMouse = Math.sqrt(
                    Math.pow(particle.x - this.mouse.x, 2) + 
                    Math.pow(particle.y - this.mouse.y, 2)
                );
                if (distanceFromMouse > 200) {
                    particle.skipFrames = Math.floor(Math.random() * 3);
                }
            }
        });
    }
    
    applyForces(particle) {
        this.forces.forEach(force => {
            if (!force.active) return;
            
            const dx = force.x - particle.x;
            const dy = force.y - particle.y;
            const distanceSquared = dx * dx + dy * dy;
            const distance = Math.sqrt(distanceSquared);
            
            if (distance > force.radius) return;
            
            let strength = force.strength;
            
            switch (force.type) {
                case 'attraction':
                    // Weaker attraction at close distances to prevent clustering
                    strength *= Math.min(1, distance / 50);
                    particle.ax += (dx / distance) * strength * particle.interactionStrength;
                    particle.ay += (dy / distance) * strength * particle.interactionStrength;
                    break;
                    
                case 'repulsion':
                    strength *= (force.radius - distance) / force.radius;
                    particle.ax -= (dx / distance) * strength;
                    particle.ay -= (dy / distance) * strength;
                    break;
                    
                case 'mouse':
                    const mouseStrength = strength * (1 - distance / force.radius);
                    const velocityInfluence = Math.abs(this.mouse.velocity.x) + Math.abs(this.mouse.velocity.y);
                    
                    if (velocityInfluence > 5) {
                        // Push particles away from fast mouse movement
                        particle.ax -= (dx / distance) * mouseStrength * 0.5;
                        particle.ay -= (dy / distance) * mouseStrength * 0.5;
                    } else {
                        // Gentle attraction to slow mouse
                        particle.ax += (dx / distance) * mouseStrength * 0.2;
                        particle.ay += (dy / distance) * mouseStrength * 0.2;
                    }
                    
                    // Increase particle energy near mouse
                    particle.energy = Math.min(100, particle.energy + mouseStrength * 10);
                    break;
            }
        });
        
        // Add some randomness for natural movement
        particle.ax += (Math.random() - 0.5) * 0.02;
        particle.ay += (Math.random() - 0.5) * 0.02;
    }
    
    handleBoundaries(particle) {
        const margin = particle.size + 5;
        
        // X boundaries
        if (particle.x < -margin) {
            particle.x = this.bounds.width + margin;
        } else if (particle.x > this.bounds.width + margin) {
            particle.x = -margin;
        }
        
        // Y boundaries  
        if (particle.y < -margin) {
            particle.y = this.bounds.height + margin;
        } else if (particle.y > this.bounds.height + margin) {
            particle.y = -margin;
        }
    }
    
    updateParticleVisuals(particle, currentTime) {
        // Pulse effect
        particle.pulsePhase += particle.pulseSpeed;
        const pulse = Math.sin(particle.pulsePhase) * 0.3 + 0.7;
        particle.size = particle.baseSize * pulse;
        
        // Energy-based size scaling
        const energyScale = 1 + (particle.energy / 200);
        particle.size *= energyScale;
        
        // Opacity based on life and energy
        if (particle.life !== Infinity) {
            const lifeRatio = particle.life / particle.maxLife;
            particle.opacity = particle.baseOpacity * lifeRatio * (0.7 + particle.energy / 300);
        } else {
            particle.opacity = particle.baseOpacity * (0.7 + particle.energy / 300);
        }
        
        // Rotation
        particle.rotation += particle.rotationSpeed;
        
        // Decay energy over time
        particle.energy = Math.max(0, particle.energy - 0.5);
    }
    
    updateParticleTrail(particle) {
        // Add current position to trail
        particle.trail.push({
            x: particle.x,
            y: particle.y,
            opacity: particle.opacity,
            size: particle.size,
            timestamp: performance.now()
        });
        
        // Remove old trail points
        const maxAge = 500; // ms
        const currentTime = performance.now();
        particle.trail = particle.trail.filter(point => 
            currentTime - point.timestamp < maxAge
        );
        
        // Limit trail length
        if (particle.trail.length > particle.maxTrailLength) {
            particle.trail.shift();
        }
    }
    
    updateParticleBehavior(particle, currentTime) {
        switch (particle.behavior) {
            case 'orbit':
                const orbitRadius = 100;
                const orbitSpeed = 0.02;
                const angle = currentTime * orbitSpeed + particle.age * 0.1;
                particle.target = {
                    x: this.bounds.centerX + Math.cos(angle) * orbitRadius,
                    y: this.bounds.centerY + Math.sin(angle) * orbitRadius
                };
                
                if (particle.target) {
                    const dx = particle.target.x - particle.x;
                    const dy = particle.target.y - particle.y;
                    particle.ax += dx * 0.001;
                    particle.ay += dy * 0.001;
                }
                break;
                
            case 'emit':
                // Emit new particles occasionally
                if (Math.random() < 0.02) {
                    const emittedParticle = this.createParticle(
                        particle.x + (Math.random() - 0.5) * 20,
                        particle.y + (Math.random() - 0.5) * 20,
                        {
                            size: Math.random() * 1.5 + 0.5,
                            life: 100 + Math.random() * 100,
                            vx: (Math.random() - 0.5) * 3,
                            vy: (Math.random() - 0.5) * 3
                        }
                    );
                    
                    if (this.particles.length < this.options.particleCount * 1.2) {
                        this.particles.push(emittedParticle);
                    }
                }
                break;
        }
    }
    
    updateConnections() {
        this.connections = [];
        const maxDistance = this.options.connectionDistance;
        const maxConnections = this.options.performanceMode === 'high' ? 150 : 
                              this.options.performanceMode === 'medium' ? 100 : 50;
        
        let connectionCount = 0;
        
        for (let i = 0; i < this.particles.length && connectionCount < maxConnections; i++) {
            const particleA = this.particles[i];
            
            for (let j = i + 1; j < this.particles.length && connectionCount < maxConnections; j++) {
                const particleB = this.particles[j];
                
                const dx = particleA.x - particleB.x;
                const dy = particleA.y - particleB.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const strength = 1 - (distance / maxDistance);
                    const minOpacity = 0.1;
                    const maxOpacity = 0.6;
                    
                    this.connections.push({
                        x1: particleA.x,
                        y1: particleA.y,
                        x2: particleB.x,
                        y2: particleB.y,
                        opacity: minOpacity + (strength * (maxOpacity - minOpacity)),
                        strength: strength,
                        color: this.blendColors(particleA.color, particleB.color)
                    });
                    
                    connectionCount++;
                }
            }
        }
    }
    
    maintainParticleCount() {
        // Remove dead particles
        this.particles = this.particles.filter(particle => particle.life > 0 || particle.life === Infinity);
        
        // Add new particles if needed
        while (this.particles.length < this.options.particleCount) {
            this.particles.push(this.createParticle());
        }
    }
    
    render() {
        // Clear canvas
        this.clearCanvas();
        
        // Set blend mode for glowing effects
        if (this.bloomEnabled) {
            this.ctx.globalCompositeOperation = 'screen';
        }
        
        // Render connections first (behind particles)
        if (this.connectionsEnabled && this.connections.length > 0) {
            this.renderConnections();
        }
        
        // Render mouse trail
        if (this.mouse.isActive && this.mouse.trail.length > 1) {
            this.renderMouseTrail();
        }
        
        // Render particle trails
        if (this.trailsEnabled) {
            this.renderParticleTrails();
        }
        
        // Render particles
        this.renderParticles();
        
        // Reset blend mode
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Render debug info in development
        if (this.isDebugMode()) {
            this.renderDebugInfo();
        }
    }
    
    clearCanvas() {
        if (this.options.backgroundAlpha > 0) {
            // Fade trail effect
            this.ctx.fillStyle = `rgba(13, 13, 18, ${this.options.backgroundAlpha})`;
            this.ctx.fillRect(0, 0, this.bounds.width, this.bounds.height);
        } else {
            // Full clear
            this.ctx.clearRect(0, 0, this.bounds.width, this.bounds.height);
        }
    }
    
    renderConnections() {
        this.connections.forEach(connection => {
            this.ctx.save();
            this.ctx.globalAlpha = connection.opacity;
            this.ctx.strokeStyle = `rgba(${connection.color.r}, ${connection.color.g}, ${connection.color.b}, ${connection.opacity})`;
            this.ctx.lineWidth = 0.5 + connection.strength;
            
            // Add glow effect for high performance mode
            if (this.bloomEnabled) {
                this.ctx.shadowBlur = 5;
                this.ctx.shadowColor = `rgba(${connection.color.r}, ${connection.color.g}, ${connection.color.b}, 0.5)`;
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(connection.x1, connection.y1);
            this.ctx.lineTo(connection.x2, connection.y2);
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    renderMouseTrail() {
        if (this.mouse.trail.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(167, 139, 250, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (this.bloomEnabled) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(167, 139, 250, 0.8)';
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouse.trail[0].x, this.mouse.trail[0].y);
        
        for (let i = 1; i < this.mouse.trail.length; i++) {
            const alpha = i / this.mouse.trail.length;
            this.ctx.globalAlpha = alpha * 0.6;
            this.ctx.lineTo(this.mouse.trail[i].x, this.mouse.trail[i].y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    renderParticleTrails() {
        this.particles.forEach(particle => {
            if (particle.trail.length < 2) return;
            
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'lighter';
            
            for (let i = 1; i < particle.trail.length; i++) {
                const current = particle.trail[i];
                const previous = particle.trail[i - 1];
                const alpha = (i / particle.trail.length) * current.opacity * 0.3;
                
                this.ctx.globalAlpha = alpha;
                this.ctx.strokeStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
                this.ctx.lineWidth = current.size * 0.5;
                this.ctx.lineCap = 'round';
                
                this.ctx.beginPath();
                this.ctx.moveTo(previous.x, previous.y);
                this.ctx.lineTo(current.x, current.y);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.translate(particle.x, particle.y);
            
            if (particle.rotation !== 0) {
                this.ctx.rotate(particle.rotation);
            }
            
            // Color and glow effects
            this.ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.opacity})`;
            
            if (this.bloomEnabled) {
                this.ctx.shadowBlur = particle.size * 2;
                this.ctx.shadowColor = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0.8)`;
            }
            
            // Render based on particle type
            switch (particle.type) {
                case 'special':
                    this.renderSpecialParticle(particle);
                    break;
                    
                case 'emitter':
                    this.renderEmitterParticle(particle);
                    break;
                    
                default:
                    this.renderNormalParticle(particle);
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    renderNormalParticle(particle) {
        // Standard circular particle
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add inner glow for high energy particles
        if (particle.energy > 50 && this.bloomEnabled) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${(particle.energy / 100) * 0.3})`;
            this.ctx.fill();
        }
    }
    
    renderSpecialParticle(particle) {
        // Star-shaped particle
        this.renderStar(0, 0, 5, particle.size * 1.5, particle.size * 0.7);
        
        // Additional glow ring
        if (this.bloomEnabled) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size * 2, 0, Math.PI * 2);
                        this.ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0.1)`;
            this.ctx.fill();
        }
    }
    
    renderEmitterParticle(particle) {
        // Pulsing ring particle
        const pulseSize = particle.size * (2 + Math.sin(particle.pulsePhase) * 0.5);
        
        // Outer ring
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0.3)`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Inner core
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderStar(x, y, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            const x1 = x + Math.cos(rot) * outerRadius;
            const y1 = y + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x1, y1);
            rot += step;
            
            const x2 = x + Math.cos(rot) * innerRadius;
            const y2 = y + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x2, y2);
            rot += step;
        }
        
        this.ctx.lineTo(x, y - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px monospace';
        
        const info = [
            `Particles: ${this.particles.length}`,
            `Connections: ${this.connections.length}`,
            `FPS: ${this.currentFPS.toFixed(1)}`,
            `Frame Time: ${this.performanceMetrics.avgFrameTime.toFixed(1)}ms`,
            `Mode: ${this.options.performanceMode}`,
            `Mouse: ${this.mouse.isActive ? 'Active' : 'Inactive'}`
        ];
        
        info.forEach((text, index) => {
            this.ctx.fillText(text, 10, 20 + index * 15);
        });
        
        this.ctx.restore();
    }
    
    blendColors(colorA, colorB, ratio = 0.5) {
        return {
            r: Math.round(colorA.r * (1 - ratio) + colorB.r * ratio),
            g: Math.round(colorA.g * (1 - ratio) + colorB.g * ratio),
            b: Math.round(colorA.b * (1 - ratio) + colorB.b * ratio)
        };
    }
    
    isDebugMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.search.includes('debug=true');
    }
    
    // Utility functions
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
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
    
    // Public API methods
    updateMousePosition(x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.isActive = true;
        this.mouse.lastMoveTime = performance.now();
    }
    
    addParticle(x, y, options = {}) {
        const particle = this.createParticle(x, y, options);
        this.particles.push(particle);
        return particle;
    }
    
    removeParticle(particle) {
        const index = this.particles.indexOf(particle);
        if (index !== -1) {
            this.particles.splice(index, 1);
        }
    }
    
    addForce(force) {
        this.forces.push({
            type: force.type || 'attraction',
            x: force.x || 0,
            y: force.y || 0,
            strength: force.strength || 0.1,
            radius: force.radius || 100,
            active: force.active !== false
        });
    }
    
    removeForce(forceToRemove) {
        this.forces = this.forces.filter(force => force !== forceToRemove);
    }
    
    setColorPalette(paletteName) {
        if (this.colorPalettes[paletteName]) {
            this.currentPalette = this.colorPalettes[paletteName];
            console.log(`🎨 Color palette changed to: ${paletteName}`);
        }
    }
    
    reduceParticleCount(factor) {
        const newCount = Math.max(10, Math.floor(this.particles.length * factor));
        this.particles = this.particles.slice(0, newCount);
        this.options.particleCount = newCount;
        console.log(`🔧 Particle count reduced to ${newCount}`);
    }
    
    increaseParticleCount(factor) {
        const newCount = Math.floor(this.particles.length * factor);
        const maxParticles = this.options.deviceCapabilities.isMobile ? 100 : 200;
        
        while (this.particles.length < Math.min(newCount, maxParticles)) {
            this.particles.push(this.createParticle());
        }
        
        this.options.particleCount = this.particles.length;
        console.log(`🔧 Particle count increased to ${this.particles.length}`);
    }
    
    updatePerformanceMode(mode) {
        if (!['low', 'medium', 'high'].includes(mode)) {
            console.warn(`Invalid performance mode: ${mode}`);
            return;
        }
        
        const oldMode = this.options.performanceMode;
        this.options.performanceMode = mode;
        
        // Update visual features based on mode
        switch (mode) {
            case 'low':
                this.trailsEnabled = false;
                this.bloomEnabled = false;
                this.connectionsEnabled = false;
                this.options.maxFPS = 30;
                this.reduceParticleCount(0.5);
                break;
                
            case 'medium':
                this.trailsEnabled = false;
                this.bloomEnabled = false;
                this.connectionsEnabled = true;
                this.options.maxFPS = 45;
                break;
                
            case 'high':
                this.trailsEnabled = true;
                this.bloomEnabled = true;
                this.connectionsEnabled = true;
                this.options.maxFPS = 60;
                break;
        }
        
        // Recreate particles with new settings if switching to higher mode
        if ((oldMode === 'low' && mode !== 'low') || 
            (oldMode === 'medium' && mode === 'high')) {
            this.initializeParticles();
        }
        
        console.log(`⚡ Particle system performance mode: ${oldMode} → ${mode}`);
    }
    
    createExplosion(x, y, intensity = 1) {
        const particleCount = Math.floor(20 * intensity);
        const colors = this.currentPalette;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = (Math.random() * 5 + 2) * intensity;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const particle = this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                life: 100 + Math.random() * 100,
                color: color,
                type: 'explosion',
                behavior: 'float'
            });
            
            this.particles.push(particle);
        }
        
        console.log(`💥 Explosion created at (${x}, ${y}) with intensity ${intensity}`);
    }
    
    createEmitter(x, y, options = {}) {
        const emitter = {
            x: x,
            y: y,
            particlesPerSecond: options.particlesPerSecond || 5,
            lifeTime: options.lifeTime || 5000,
            particleLife: options.particleLife || 200,
            particleSize: options.particleSize || { min: 1, max: 3 },
            speed: options.speed || { min: 1, max: 3 },
            angle: options.angle || { min: 0, max: Math.PI * 2 },
            color: options.color || this.getRandomColor(),
            active: true,
            lastEmission: 0
        };
        
        this.emitters.push(emitter);
        console.log(`🚀 Emitter created at (${x}, ${y})`);
        return emitter;
    }
    
    updateEmitters(currentTime) {
        this.emitters.forEach((emitter, index) => {
            if (!emitter.active) return;
            
            // Check if emitter should expire
            if (currentTime - emitter.createdTime > emitter.lifeTime) {
                emitter.active = false;
                return;
            }
            
            // Emit particles
            const timeSinceLastEmission = currentTime - emitter.lastEmission;
            const emissionInterval = 1000 / emitter.particlesPerSecond;
            
            if (timeSinceLastEmission >= emissionInterval) {
                const angle = emitter.angle.min + Math.random() * (emitter.angle.max - emitter.angle.min);
                const speed = emitter.speed.min + Math.random() * (emitter.speed.max - emitter.speed.min);
                const size = emitter.particleSize.min + Math.random() * (emitter.particleSize.max - emitter.particleSize.min);
                
                const particle = this.createParticle(emitter.x, emitter.y, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: size,
                    life: emitter.particleLife,
                    color: emitter.color,
                    type: 'emitted'
                });
                
                this.particles.push(particle);
                emitter.lastEmission = currentTime;
            }
        });
        
        // Clean up inactive emitters
        this.emitters = this.emitters.filter(emitter => emitter.active);
    }
    
    pause() {
        this.isPaused = true;
        console.log('⏸️ Particle system paused');
    }
    
    resume() {
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        console.log('▶️ Particle system resumed');
    }
    
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor);
        }
        
        console.log('⏹️ Particle system stopped');
    }
    
    restart() {
        this.stop();
        setTimeout(() => {
            this.initializeParticles();
            this.startRenderLoop();
            console.log('🔄 Particle system restarted');
        }, 100);
    }
    
    handleResize() {
        this.updateCanvasSize();
        
        // Update force field positions
        const centerAttraction = this.forces.find(f => f.type === 'attraction');
        if (centerAttraction) {
            centerAttraction.x = this.bounds.centerX;
            centerAttraction.y = this.bounds.centerY;
        }
        
        // Reposition particles that are now outside bounds
        this.particles.forEach(particle => {
            if (particle.x > this.bounds.width) particle.x = this.bounds.width;
            if (particle.y > this.bounds.height) particle.y = this.bounds.height;
        });
        
        console.log('📏 Particle system resized to', this.bounds.width, 'x', this.bounds.height);
    }
    
    getStats() {
        return {
            particleCount: this.particles.length,
            connectionCount: this.connections.length,
            forceCount: this.forces.length,
            emitterCount: this.emitters.length,
            currentFPS: this.currentFPS,
            performanceMode: this.options.performanceMode,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            performanceMetrics: { ...this.performanceMetrics },
            bounds: { ...this.bounds },
            mouse: {
                isActive: this.mouse.isActive,
                position: { x: this.mouse.x, y: this.mouse.y },
                velocity: { ...this.mouse.velocity }
            }
        };
    }
    
    // Advanced features for special effects
    createWarpEffect(x, y, radius = 100, duration = 2000) {
        const warpForce = {
            type: 'warp',
            x: x,
            y: y,
            strength: 2,
            radius: radius,
            active: true,
            startTime: performance.now(),
            duration: duration
        };
        
        this.forces.push(warpForce);
        
        // Remove warp after duration
        setTimeout(() => {
            this.removeForce(warpForce);
        }, duration);
        
        console.log(`🌀 Warp effect created at (${x}, ${y})`);
    }
    
    createParticleStorm(centerX, centerY, particleCount = 50, radius = 150) {
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const distance = Math.random() * radius;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            const particle = this.createParticle(x, y, {
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: Math.random() * 4 + 1,
                life: 300 + Math.random() * 200,
                energy: 80 + Math.random() * 20,
                type: 'storm',
                behavior: 'chaotic'
            });
            
            this.particles.push(particle);
        }
        
        console.log(`⛈️ Particle storm created with ${particleCount} particles`);
    }
    
    createConstellationEffect(points, name = 'Custom') {
        const constellation = [];
        
        // Create particles at constellation points
        points.forEach((point, index) => {
            const particle = this.createParticle(point.x, point.y, {
                size: 3 + Math.random(),
                type: 'constellation',
                behavior: 'static',
                life: Infinity,
                opacity: 0.8,
                color: { r: 255, g: 255, b: 255 }
            });
            
            constellation.push(particle);
            this.particles.push(particle);
        });
        
        // Create connections between constellation points
        if (points.length > 1) {
            for (let i = 0; i < points.length - 1; i++) {
                const connection = {
                    x1: points[i].x,
                    y1: points[i].y,
                    x2: points[i + 1].x,
                    y2: points[i + 1].y,
                    opacity: 0.4,
                    strength: 1,
                    color: { r: 255, g: 255, b: 255 },
                    permanent: true
                };
                
                this.connections.push(connection);
            }
        }
        
        console.log(`⭐ Constellation "${name}" created with ${points.length} stars`);
        return constellation;
    }
    
    destroy() {
        console.log('🧹 Destroying particle system...');
        
        // Stop all loops
        this.stop();
        
        // Clear all arrays
        this.particles = [];
        this.connections = [];
        this.forces = [];
        this.emitters = [];
        
        // Remove event listeners
        if (this.handleMouseMove) {
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('touchmove', this.handleMouseMove);
        }
        
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Cleanup offscreen canvas
        if (this.offscreenCanvas) {
            this.offscreenCanvas = null;
            this.offscreenCtx = null;
        }
        
        console.log('✅ Particle system destroyed successfully');
    }
}

// Export class for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedParticleSystem;
}

// Global initialization function
function initializeParticleSystem(canvasId, options = {}) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    
    if (!canvas) {
        console.error(`❌ Canvas element not found: ${canvasId}`);
        return null;
    }
    
    try {
        const particleSystem = new AdvancedParticleSystem(canvas, options);
        console.log('✨ Particle system initialized successfully');
        return particleSystem;
    } catch (error) {
        console.error('❌ Failed to initialize particle system:', error);
        return null;
    }
}

// Preset configurations for easy setup
const ParticlePresets = {
    // Minimal setup for low-end devices
    minimal: {
        particleCount: 20,
        performanceMode: 'low',
        enableTrails: false,
        enableConnections: false,
        backgroundAlpha: 0,
        maxFPS: 30
    },
    
    // Balanced setup for most devices
    standard: {
        particleCount: 50,
        performanceMode: 'medium',
        enableTrails: false,
        enableConnections: true,
        backgroundAlpha: 0.1,
        maxFPS: 45
    },
    
    // Full-featured setup for high-end devices
    premium: {
        particleCount: 100,
        performanceMode: 'high',
        enableTrails: true,
        enableConnections: true,
        enablePhysics: true,
        backgroundAlpha: 0.1,
        maxFPS: 60,
        colorPalette: 'cosmic'
    },
    
    // Cosmic theme with aurora colors
    cosmic: {
        particleCount: 75,
        performanceMode: 'high',
        enableTrails: true,
        enableConnections: true,
        colorPalette: 'cosmic',
        backgroundAlpha: 0.15,
        connectionDistance: 100,
        interactionRadius: 120
    },
    
    // Aurora theme with flowing particles
    aurora: {
        particleCount: 60,
        performanceMode: 'medium',
        enableTrails: true,
        enableConnections: false,
        colorPalette: 'aurora',
        backgroundAlpha: 0.2,
        interactionRadius: 150
    },
    
    // Nebula theme with glowing effects
    nebula: {
        particleCount: 80,
        performanceMode: 'high',
        enableTrails: true,
        enableConnections: true,
        colorPalette: 'nebula',
        backgroundAlpha: 0.1,
        connectionDistance: 80,
        interactionRadius: 100
    }
};

// Utility function to get recommended preset based on device
function getRecommendedPreset() {
    const capabilities = {
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        memory: navigator.deviceMemory || 4,
        cores: navigator.hardwareConcurrency || 4,
        connection: (navigator.connection || {}).effectiveType || '4g'
    };
    
    if (capabilities.isMobile || capabilities.memory < 4 || capabilities.connection === '2g') {
        return ParticlePresets.minimal;
    } else if (capabilities.memory >= 8 && capabilities.cores >= 8) {
        return ParticlePresets.premium;
    } else {
        return ParticlePresets.standard;
    }
}

// Export presets and utilities
if (typeof window !== 'undefined') {
    window.AdvancedParticleSystem = AdvancedParticleSystem;
    window.initializeParticleSystem = initializeParticleSystem;
    window.ParticlePresets = ParticlePresets;
    window.getRecommendedPreset = getRecommendedPreset;
    
    console.log('🎆 Advanced Particle System v2.1 loaded successfully');
}
