// Animation utilities and helpers
class AnimationManager {
    constructor() {
        this.observers = new Map();
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.setupCounterAnimations();
    }

    setupScrollAnimations() {
        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe all scroll-reveal elements
        document.querySelectorAll('.scroll-reveal').forEach(el => {
            observer.observe(el);
        });

        this.observers.set('scroll', observer);
    }

    setupHoverEffects() {
        document.querySelectorAll('.hover-lift').forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.style.transform = 'translateY(-5px)';
                el.style.transition = 'transform 0.3s ease';
            });

            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translateY(0)';
            });
        });

        document.querySelectorAll('.hover-scale').forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.05)';
                el.style.transition = 'transform 0.3s ease';
            });

            el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1)';
            });
        });
    }

    setupCounterAnimations() {
        const counters = document.querySelectorAll('.counter');
        
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.dataset.target);
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            element.textContent = Math.round(current);

            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            }
        }, 16);
    }
}

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.animationManager = new AnimationManager();
});

// CSS Animation classes
const animationStyles = `
    .scroll-reveal {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }

    .scroll-reveal.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    .fade-in {
        animation: fadeIn 0.5s ease forwards;
    }

    .fade-out {
        animation: fadeOut 0.5s ease forwards;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    .voice-waveform.playing .waveform-bar {
        animation: waveform 0.8s ease-in-out infinite alternate;
    }

    @keyframes waveform {
        0% { height: 10px; }
        100% { height: 30px; }
    }

    .voice-waveform .waveform-bar:nth-child(2) { animation-delay: 0.1s; }
    .voice-waveform .waveform-bar:nth-child(3) { animation-delay: 0.2s; }
    .voice-waveform .waveform-bar:nth-child(4) { animation-delay: 0.3s; }
    .voice-waveform .waveform-bar:nth-child(5) { animation-delay: 0.4s; }
    .voice-waveform .waveform-bar:nth-child(6) { animation-delay: 0.5s; }
    .voice-waveform .waveform-bar:nth-child(7) { animation-delay: 0.6s; }
    .voice-waveform .waveform-bar:nth-child(8) { animation-delay: 0.7s; }
`;

// Inject animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);
