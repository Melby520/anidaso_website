// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle mobile menu
if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
}

// Close menu when link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Set active nav link based on current filename (multi-page support)
function setActiveNavByFilename() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#')) {
            // if we're on the index page and have a hash, highlight accordingly
            const hash = window.location.hash.slice(1);
            if ((file === 'index.html' || file === '') && hash && href.slice(1) === hash) {
                link.classList.add('active');
            }
        } else {
            const linkFile = href.split('/').pop().split('?')[0].split('#')[0];
            if (!linkFile && (file === '' || file === 'index.html')) {
                link.classList.add('active');
            } else if (linkFile === file) {
                link.classList.add('active');
            }
        }
    });
}

// Run on load and when navigating history
document.addEventListener('DOMContentLoaded', setActiveNavByFilename);
window.addEventListener('popstate', setActiveNavByFilename);

// Active nav link on scroll (only when page contains sections)
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    if (!sections || sections.length === 0) return; // don't run on standalone pages

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#') && href.slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Button click handlers
const joinBtn = document.querySelector('.btn-primary');
const howItWorksBtn = document.querySelector('.btn-secondary');

if (joinBtn) {
    joinBtn.addEventListener('click', () => {
        alert('Redirecting to Join Anidaso page...');
        // window.location.href = '#membership';
    });
}

if (howItWorksBtn) {
    howItWorksBtn.addEventListener('click', () => {
        const howItWorksSection = document.querySelector('#how-it-works');
        if (howItWorksSection) {
            howItWorksSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Redirecting to How it works page...');
        }
    });
}

// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Fade-in animation for elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeIn 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.about, .container').forEach(el => {
    observer.observe(el);
});

// Add hover effects for buttons
const buttons = document.querySelectorAll('.btn');
buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

console.log('Anidaso Website - Loaded Successfully');
