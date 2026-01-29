// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle mobile menu
if (hamburger) {
    hamburger.addEventListener('click', () => {
        console.log('hamburger clicked');
        const opened = navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', String(opened));

        // lock body scrolling when open
        if (opened) {
            document.body.classList.add('menu-open');
        } else {
            document.body.classList.remove('menu-open');
        }

        // manage overlay
        let overlay = document.querySelector('.mobile-menu-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-menu-overlay';
            overlay.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                overlay.classList.remove('active');
                document.body.classList.remove('menu-open');
                setTimeout(() => overlay.remove(), 260);
                hamburger.focus();
            });
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('active'));
        } else {
            if (navMenu.classList.contains('active')) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
                document.body.classList.remove('menu-open');
                setTimeout(() => overlay.remove(), 260);
                hamburger.focus();
            }
        }

        // accessibility: move focus into the menu when opened
        if (opened) {
            const firstLink = navMenu.querySelector('.nav-link');
            if (firstLink) firstLink.focus();
        }
    });
}

// Close menu when link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        const overlay = document.querySelector('.mobile-menu-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 260);
        }
        document.body.classList.remove('menu-open');
        hamburger.focus();
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

// Debug helper: open mobile menu when URL contains ?showMenu=1
document.addEventListener('DOMContentLoaded', () => {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('showMenu') === '1' && navMenu) {
            navMenu.classList.add('active');
            document.body.classList.add('menu-open');
            // ensure overlay exists and is active
            let overlay = document.querySelector('.mobile-menu-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'mobile-menu-overlay active';
                document.body.appendChild(overlay);
            } else {
                overlay.classList.add('active');
            }
        }
    } catch (e) { /* ignore in older browsers */ }
});

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

/* -------------------------
   Client-side Pagination
   - Finds any element with the `paginated` class
   - Uses direct child elements as items to paginate
   - Reads `data-page-size` (default 6)
   - Injects pagination controls after the container
------------------------- */
function createPagination(container, pageSize) {
    const items = Array.from(container.children).filter(c => c.nodeType === 1);
    if (items.length <= pageSize) return; // no pagination needed

    let currentPage = 1;
    const totalPages = Math.ceil(items.length / pageSize);

    function showPage(page) {
        currentPage = Math.max(1, Math.min(totalPages, page));
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;

        items.forEach((it, idx) => {
            it.style.display = (idx >= start && idx < end) ? '' : 'none';
        });

        // update controls
        const nums = container._pagination.querySelectorAll('.page-num');
        nums.forEach((btn, i) => {
            btn.classList.toggle('active', i + 1 === currentPage);
        });

        const prev = container._pagination.querySelector('.prev');
        const next = container._pagination.querySelector('.next');
        if (prev) prev.disabled = currentPage === 1;
        if (next) next.disabled = currentPage === totalPages;
    }

    // build controls
    const controls = document.createElement('div');
    controls.className = 'pagination';

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'prev';
    prev.textContent = '‹ Prev';
    prev.addEventListener('click', () => showPage(currentPage - 1));
    controls.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'page-num';
        btn.textContent = String(i);
        btn.addEventListener('click', () => showPage(i));
        controls.appendChild(btn);
    }

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'next';
    next.textContent = 'Next ›';
    next.addEventListener('click', () => showPage(currentPage + 1));
    controls.appendChild(next);

    // attach and initialize
    container._pagination = controls;
    container.parentNode.insertBefore(controls, container.nextSibling);
    showPage(1);
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.paginated').forEach(el => {
        const pageSize = parseInt(el.getAttribute('data-page-size') || '6', 10) || 6;
        try { createPagination(el, pageSize); } catch (e) { /* fail silently */ }
    });
});
