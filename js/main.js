// Enhanced Main JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Theme System
    initializeTheme();
    
    // Navigation
    initializeNavigation();
    
    // Contact Form
    initializeContactForm();
    
    // Portfolio
    initializePortfolio();
    
    // Voice Demo
    initializeVoiceDemo();
    
    // Smooth Scrolling
    initializeSmoothScrolling();
});

// Theme System
function initializeTheme() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '🌙';
    themeToggle.setAttribute('aria-label', 'Toggle theme');
    document.body.appendChild(themeToggle);

    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        const isLight = document.documentElement.hasAttribute('data-theme');
        
        if (isLight) {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.innerHTML = '🌙';
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '☀️';
            localStorage.setItem('theme', 'light');
        }
    });
}

// Navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Update nav on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            
            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// Contact Form
function initializeContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        // Show loading state
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        submitBtn.disabled = true;

        // Simulate form submission (replace with actual endpoint)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success message
            showNotification('Message sent successfully!', 'success');
            form.reset();
            
        } catch (error) {
            showNotification('Failed to send message. Please try again.', 'error');
        } finally {
            // Reset button state
            btnText.style.display = 'flex';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

// Portfolio Filtering
function initializePortfolio() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter items
            portfolioItems.forEach(item => {
                const category = item.dataset.category;
                
                if (filter === 'all' || category === filter) {
                    item.style.display = 'block';
                    item.style.opacity = '1';
                } else {
                    item.style.opacity = '0';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// Voice Demo Player
function initializeVoiceDemo() {
    const playBtns = document.querySelectorAll('.play-pause-btn');
    
    playBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const audioType = btn.dataset.audio;
            const audio = document.querySelector(`audio[data-demo="${audioType}"]`);
            const icon = btn.querySelector('i');
            
            if (!audio) return;

            if (audio.paused) {
                // Stop all other audio
                document.querySelectorAll('audio').forEach(a => {
                    a.pause();
                    a.currentTime = 0;
                });
                
                // Reset all buttons
                document.querySelectorAll('.play-pause-btn i').forEach(i => {
                    i.className = 'fas fa-play';
                });
                
                // Play current audio
                audio.play();
                icon.className = 'fas fa-pause';
                
                // Start waveform animation
                const waveform = btn.closest('.voice-demo-card').querySelector('.voice-waveform');
                waveform.classList.add('playing');
                
            } else {
                audio.pause();
                icon.className = 'fas fa-play';
                
                // Stop waveform animation
                const waveform = btn.closest('.voice-demo-card').querySelector('.voice-waveform');
                waveform.classList.remove('playing');
            }
            
            // Update on audio end
            audio.addEventListener('ended', () => {
                icon.className = 'fas fa-play';
                const waveform = btn.closest('.voice-demo-card').querySelector('.voice-waveform');
                waveform.classList.remove('playing');
            });
        });
    });
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: var(--primary);
        color: white;
        border-radius: 8px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    if (type === 'error') {
        notification.style.background = '#ef4444';
    } else if (type === 'success') {
        notification.style.background = '#10b981';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Portfolio Modal Functions (referenced in HTML)
window.openPortfolioModal = function(projectId) {
    console.log('Opening portfolio modal for:', projectId);
    // Add your modal logic here
};

window.playVoiceSample = function(sampleId) {
    console.log('Playing voice sample:', sampleId);
    // Add your audio playing logic here
};

window.showResults = function(resultsId) {
    console.log('Showing results for:', resultsId);
    // Add your results display logic here
};
