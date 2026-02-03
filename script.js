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
    link.addEventListener('click', (e) => {
        // Close mobile menu after navigation (allow links to navigate normally)
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
    // No keyboard toggle here; dropdowns are opened via the separate toggle button
});

// Dropdown toggle buttons: initialize ARIA, open/close on click, support keyboard (Enter/Space/Escape)
const dropdownToggles = Array.from(document.querySelectorAll('.dropdown-toggle'));
dropdownToggles.forEach((btn, idx) => {
    const parent = btn.closest('.has-dropdown');
    if (!parent) return;

    // initialize ARIA attributes
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') || 'false');

    const dropdown = parent.querySelector('.dropdown');
    if (dropdown) {
        if (!dropdown.id) dropdown.id = `membership-dropdown-${idx}`;
        btn.setAttribute('aria-controls', dropdown.id);
    }

    btn.addEventListener('click', (e) => {
        const isOpen = parent.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
        const link = parent.querySelector('.nav-link');
        if (link) link.setAttribute('aria-expanded', String(isOpen));
        if (isOpen && dropdown) {
            const first = dropdown.querySelector('.dropdown-link');
            if (first) first.focus();
        }
    });

    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
        } else if (e.key === 'Escape' || e.key === 'Esc') {
            parent.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            const link = parent.querySelector('.nav-link');
            if (link) link.setAttribute('aria-expanded', 'false');
            btn.focus();
        }
    });
});

// Global Escape handler: close any open dropdowns
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openParents = document.querySelectorAll('.has-dropdown.open');
    openParents.forEach(parent => {
        parent.classList.remove('open');
        const btn = parent.querySelector('.dropdown-toggle');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        const link = parent.querySelector('.nav-link');
        if (link) link.setAttribute('aria-expanded', 'false');
    });
});

// Hover support for pointer-capable devices: open dropdown on hover and sync ARIA
try {
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.querySelectorAll('.has-dropdown').forEach(parent => {
            parent.addEventListener('mouseenter', () => {
                parent.classList.add('open');
                const btn = parent.querySelector('.dropdown-toggle');
                if (btn) btn.setAttribute('aria-expanded', 'true');
                const link = parent.querySelector('.nav-link');
                if (link) link.setAttribute('aria-expanded', 'true');
            });
            parent.addEventListener('mouseleave', () => {
                parent.classList.remove('open');
                const btn = parent.querySelector('.dropdown-toggle');
                if (btn) btn.setAttribute('aria-expanded', 'false');
                const link = parent.querySelector('.nav-link');
                if (link) link.setAttribute('aria-expanded', 'false');
            });
        });
    }
} catch (e) { /* ignore in older browsers */ }

// If device supports hover, sync ARIA and .open on mouse enter/leave
if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.has-dropdown').forEach(parent => {
        parent.addEventListener('mouseenter', () => {
            parent.classList.add('open');
            const btn = parent.querySelector('.dropdown-toggle');
            if (btn) btn.setAttribute('aria-expanded', 'true');
            const link = parent.querySelector('.nav-link');
            if (link) link.setAttribute('aria-expanded', 'true');
        });
        parent.addEventListener('mouseleave', () => {
            parent.classList.remove('open');
            const btn = parent.querySelector('.dropdown-toggle');
            if (btn) btn.setAttribute('aria-expanded', 'false');
            const link = parent.querySelector('.nav-link');
            if (link) link.setAttribute('aria-expanded', 'false');
        });
    });
}

// Toggle dropdowns via click and close when clicking outside
document.addEventListener('click', (e) => {
    const dropdownParents = document.querySelectorAll('.has-dropdown');
    let clickedInsideAny = false;

    dropdownParents.forEach(parent => {
        if (parent.contains(e.target)) clickedInsideAny = true;
    });

    if (!clickedInsideAny) {
        dropdownParents.forEach(parent => {
            if (parent.classList.contains('open')) {
                parent.classList.remove('open');
                const link = parent.querySelector('.nav-link');
                if (link) link.setAttribute('aria-expanded', 'false');
            }
        });
    }
});

// Allow clicking the top-level nav link itself to toggle its dropdown (prevent navigation)
document.querySelectorAll('.has-dropdown').forEach(parent => {
    const link = parent.querySelector('.nav-link');
    const dropdown = parent.querySelector('.dropdown');
    const toggleBtn = parent.querySelector('.dropdown-toggle');
    if (!link || !dropdown) return;

    link.addEventListener('click', (e) => {
        // Prevent following the href and toggle the menu instead
        e.preventDefault();
        const isOpen = parent.classList.toggle('open');
        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(isOpen));
        link.setAttribute('aria-expanded', String(isOpen));
        if (isOpen) {
            const first = dropdown.querySelector('.dropdown-link');
            if (first) first.focus();
        } else {
            link.focus();
        }
    });

    link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            link.click();
        }
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

// Hero CTA handling: smooth-scroll to in-page sections when available, otherwise navigate
document.querySelectorAll('.hero a.btn, .hero .btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
        const href = this.getAttribute('href') || '';
        if (!href) return;
        // Prevent immediate navigation so we can decide behavior
        e.preventDefault();

        const parts = href.split('#');
        const hash = parts[1];

        if (hash) {
            const target = document.getElementById(hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // update hash without causing an extra jump
                try { history.replaceState && history.replaceState(null, '', '#' + hash); } catch (err) { /* ignore */ }
                return;
            }
        }

        // If no in-page target, navigate to the href (same or other page)
        window.location.href = href;
    });
});

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

/* Chat widget removed per request. */

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.paginated').forEach(el => {
        const pageSize = parseInt(el.getAttribute('data-page-size') || '6', 10) || 6;
        try { createPagination(el, pageSize); } catch (e) { /* fail silently */ }
    });
    // Attach membership form handlers (client-side demo)
    document.querySelectorAll('.membership-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const successEl = form.querySelector('.form-success');
            if (!submitBtn) return;

            // quick validation
            const required = Array.from(form.querySelectorAll('[required]'));
            const invalid = required.find(i => !i.value || i.value.trim() === '');
            if (invalid) {
                invalid.focus();
                successEl.style.display = 'block';
                successEl.style.color = '#c5292e';
                successEl.textContent = 'Please complete required fields.';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting…';

            // simulate server submission
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit application';
                form.reset();
                successEl.style.display = 'block';
                successEl.style.color = 'var(--primary-red)';
                successEl.textContent = 'Application received. We will contact you shortly.';
            }, 900);
        });
    });
});
