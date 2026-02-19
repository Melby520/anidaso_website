// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

const supportsHover = (() => {
    try {
        return window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch {
        return false;
    }
})();

function closeMobileMenu({ focusHamburger = false } = {}) {
    if (!navMenu || !hamburger) return;
    navMenu.classList.remove('active');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    const overlay = document.querySelector('.mobile-menu-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 260);
    }
    if (focusHamburger) hamburger.focus();
}

function setDropdownOpen(parent, open) {
    if (!parent) return;
    parent.classList.toggle('open', open);
    const btn = parent.querySelector('.dropdown-toggle');
    if (btn) btn.setAttribute('aria-expanded', String(open));
    const link = parent.querySelector('.nav-link');
    if (link) link.setAttribute('aria-expanded', String(open));
}

function closeAllDropdowns(exceptParent = null) {
    document.querySelectorAll('.has-dropdown.open').forEach(parent => {
        if (exceptParent && parent === exceptParent) return;
        setDropdownOpen(parent, false);
    });
}

// Toggle mobile menu
if (hamburger) {
    hamburger.addEventListener('click', () => {
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
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('active'));
        } else {
            if (navMenu.classList.contains('active')) {
                overlay.classList.add('active');
            } else {
                closeMobileMenu({ focusHamburger: true });
            }
        }

        // accessibility: move focus into the menu when opened
        if (opened) {
            const firstLink = navMenu.querySelector('.nav-link');
            if (firstLink) firstLink.focus();
        }
    });
}

// Close mobile menu when clicking outside the menu (overlay is visual-only)
document.addEventListener('click', (e) => {
    if (!navMenu || !hamburger) return;
    if (!navMenu.classList.contains('active')) return;

    const clickedMenu = e.target.closest('.nav-menu');
    const clickedHamburger = e.target.closest('.hamburger');
    if (clickedMenu || clickedHamburger) return;

    closeMobileMenu({ focusHamburger: false });
});

// Close menu when link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // Close mobile menu after navigation (allow links to navigate normally)
        // Note: submenu expansion is handled by the dedicated `.dropdown-toggle` button.
        closeMobileMenu();
    });
    // No keyboard toggle here; dropdowns are opened via the separate toggle button
});

// Close mobile menu when a dropdown link is clicked
document.querySelectorAll('.dropdown-link').forEach(link => {
    link.addEventListener('click', () => {
        const href = link.getAttribute('href') || '';
        // For normal page navigation, let the browser handle it.
        // Only close menus on hash-links or empty links.
        if (href && !href.startsWith('#')) return;
        closeMobileMenu();
        closeAllDropdowns();
    });
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
        e.preventDefault();
        const isOpen = !parent.classList.contains('open');
        closeAllDropdowns(parent);
        setDropdownOpen(parent, isOpen);
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
            setDropdownOpen(parent, false);
            btn.focus();
        }
    });
});

// Global Escape handler: close any open dropdowns
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeAllDropdowns();
    closeMobileMenu();
});

// Hover support for pointer-capable devices: open dropdown on hover and sync ARIA
if (supportsHover) {
    document.querySelectorAll('.has-dropdown').forEach(parent => {
        parent.addEventListener('mouseenter', () => {
            closeAllDropdowns(parent);
            setDropdownOpen(parent, true);
        });
        parent.addEventListener('mouseleave', () => {
            setDropdownOpen(parent, false);
        });
    });
}

// Toggle dropdowns via click and close when clicking outside
document.addEventListener('click', (e) => {
    const clickedInsideDropdown = e.target.closest('.has-dropdown');
    if (!clickedInsideDropdown) closeAllDropdowns();
});

// (Optional legacy support) If a dropdown's top-level link is an in-page anchor,
// allow tapping it to toggle the submenu on touch/mobile. Normal page links should navigate.
document.querySelectorAll('.has-dropdown').forEach(parent => {
    const link = parent.querySelector('.nav-link');
    const dropdown = parent.querySelector('.dropdown');
    const toggleBtn = parent.querySelector('.dropdown-toggle');
    if (!link || !dropdown) return;

    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#')) return;

    link.addEventListener('click', (e) => {
        const mobileMenuOpen = navMenu && navMenu.classList.contains('active');

        // If we're in the mobile menu OR the device is touch-first, treat hash-link as a submenu toggle.
        if (!supportsHover || mobileMenuOpen) {
            e.preventDefault();
            const isOpen = !parent.classList.contains('open');
            closeAllDropdowns(parent);
            setDropdownOpen(parent, isOpen);
            if (isOpen) {
                const first = dropdown.querySelector('.dropdown-link');
                if (first) first.focus();
            } else {
                link.focus();
            }
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

// Ensure chatbot is available on every page that loads `script.js`.
function ensureChatbot() {
        try {
                if (document.getElementById('site-chatbot')) return;

                const wrap = document.createElement('div');
                wrap.innerHTML = `
<div id="site-chatbot" class="chatbot" aria-hidden="false">
    <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Toggle Ask Anidaso" aria-expanded="false">
        <span class="chatbot-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
                <path class="bubble" d="M14 3C7.95 3 3 7.38 3 12.83c0 3.31 1.82 6.26 4.62 8.03V25l4.21-2.58c.89.18 1.7.24 2.17.24 6.05 0 11-4.38 11-9.83S20.05 3 14 3Z"/>
                <circle class="dot" cx="10" cy="12.8" r="1.5"/>
                <circle class="dot" cx="14" cy="12.8" r="1.5"/>
                <circle class="dot" cx="18" cy="12.8" r="1.5"/>
            </svg>
        </span>
    </button>
    <div id="chatbot-panel" class="chatbot-panel" hidden>
        <div class="chatbot-header"><span>Ask Anidaso</span><button id="chatbot-close" class="chatbot-close" aria-label="Close chat">×</button></div>
        <div id="chatbot-messages" class="chatbot-messages" role="log" aria-live="polite"></div>
        <form id="chatbot-form" class="chatbot-form" aria-label="Chat form">
            <input id="chatbot-input" class="chatbot-input" placeholder="Ask about membership, how it works..." aria-label="Ask a question" autocomplete="off" />
            <button type="submit" class="chatbot-send">Send</button>
        </form>
    </div>
</div>`;

                const node = wrap.firstElementChild;
                if (!node) return;
                document.body.appendChild(node);

                // Load chatbot script if not already present.
                const existing = document.querySelector('script[src*="assets/chatbot.js"]');
                if (!existing) {
                        const s = document.createElement('script');
                    // Resolve assets path relative to where `script.js` is served from.
                    const hostScript = document.querySelector('script[src*="script.js"]');
                    try {
                        const base = hostScript && hostScript.src ? new URL('.', hostScript.src) : new URL('.', window.location.href);
                        s.src = new URL('assets/chatbot.js', base).toString();
                    } catch (e) {
                        s.src = 'assets/chatbot.js';
                    }
                        s.defer = true;
                        document.head.appendChild(s);
                }
        } catch (e) {
                // fail silently
        }
}

// Ensure icon tiles and any non-linked flags redirect to the expected pages
document.addEventListener('DOMContentLoaded', () => {
    const labelToHref = {
        'register': 'register.html',
        'become a member': 'become-a-member.html',
        'monthly contribution': 'monthly-contribution.html',
        'community support': 'community-support.html'
    };

    // Ensure every .how-step (anchor or not) navigates on tap/Enter/Space.
    document.querySelectorAll('.how-step').forEach(el => {
        const anchor = (el.tagName === 'A') ? el : el.closest('a');
        const labelEl = el.querySelector('.how-step__label');
        const key = labelEl ? labelEl.textContent.trim().toLowerCase() : '';
        const fallbackHref = labelToHref[key];
        const href = (anchor && anchor.getAttribute('href')) ? anchor.getAttribute('href') : fallbackHref;
        if (!href) return;

        // If it's already a real link to another page, let the browser handle it
        // (avoids “first tap only highlights” issues on some mobile browsers).
        if (anchor && anchor.tagName === 'A' && anchor.getAttribute('href') && !String(href).startsWith('#')) {
            return;
        }

        // make element keyboard-focusable if not already
        if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
        el.setAttribute('role', 'link');
        el.style.cursor = 'pointer';

        el.addEventListener('click', function (e) {
            // allow modifier clicks (open in new tab) and non-left buttons to behave normally
            if (e.defaultPrevented) return;
            if (e.button && e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            const targetBlank = anchor && anchor.getAttribute && anchor.getAttribute('target') === '_blank';
            if (targetBlank) window.open(href, '_blank');
            else window.location.href = href;
        });

        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const targetBlank = anchor && anchor.getAttribute && anchor.getAttribute('target') === '_blank';
                if (targetBlank) window.open(href, '_blank');
                else window.location.href = href;
            }
        });
    });

    // Some flag elements may not be proper anchors (or may be missing href); ensure they navigate
    document.querySelectorAll('.flag-link').forEach(a => {
        // if it's a real anchor with href, leave it
        if (a.tagName === 'A' && a.getAttribute('href')) return;
        const img = a.querySelector('img');
        if (!img) return;
        const alt = (img.getAttribute('alt') || '').toLowerCase();
        let href = '';
        if (alt.includes('ghana')) href = 'membership/ghana.html';
        else if (alt.includes('united kingdom') || alt.includes('uk')) href = 'membership/uk.html';
        if (!href) return;
        a.setAttribute('role', 'link');
        a.tabIndex = 0;
        a.style.cursor = 'pointer';
        a.addEventListener('click', (e) => { e.preventDefault(); window.location.href = href; });
        a.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = href;
            }
        });
    });
});

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
    // Ensure any button labeled "Submit application" uses the primary-red styling
    document.querySelectorAll('button').forEach(btn => {
        if (!btn.textContent) return;
        if (btn.textContent.trim().toLowerCase() === 'submit application') {
            btn.classList.add('btn--primary-red');
        }
    });

    ensureChatbot();
});

// Homepage country picker: Ghana / UK redirect
(function () {
    const form = document.getElementById('country-search-form');
    const input = document.getElementById('country-search-input');
    const hint = document.getElementById('country-search-hint');
    if (!form || !input) return;

    const submitBtn = form.querySelector('button[type="submit"]');

    const flagLinks = Array.from(document.querySelectorAll('.homepage-flags .flag-link'));

    const countries = [
        { name: 'Ghana', href: 'membership/ghana.html', terms: ['ghana', 'gh'] },
        { name: 'United Kingdom (UK)', href: 'membership/uk.html', terms: ['united kingdom', 'uk', 'u k', 'u.k', 'britain', 'great britain'] }
    ];

    const normalize = (value) => String(value || '')
        .toLowerCase()
        .replace(/\(.*?\)/g, ' ')
        .replace(/[^a-z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    function resolveCountry(value) {
        const q = normalize(value);
        if (!q) return null;
        for (const c of countries) {
            const nameN = normalize(c.name);
            if (q === nameN) return c;
            for (const t of c.terms) {
                const tN = normalize(t);
                if (q === tN) return c;
            }
        }
        return null;
    }

    function resolveCountryLoose(value) {
        const q = normalize(value);
        if (!q) return null;

        // Prefix match on country name
        const prefixMatches = countries.filter(c => normalize(c.name).startsWith(q));
        if (prefixMatches.length === 1) return prefixMatches[0];

        // Contains match on known terms (helps on mobile where datalist may not appear)
        for (const c of countries) {
            const haystack = [c.name, ...c.terms].map(normalize).join(' ');
            if (haystack.includes(q) || q.includes(normalize(c.name))) return c;
        }

        // Small heuristics for common inputs
        if (q.startsWith('gh') || q.includes('ghana')) return countries.find(c => c.href.includes('ghana')) || null;
        if (q === 'uk' || q.includes('kingdom') || q.includes('britain')) return countries.find(c => c.href.includes('/uk')) || countries.find(c => c.href.includes('uk')) || null;

        return null;
    }

    function setHint(message, isError = false) {
        if (!hint) return;
        hint.textContent = message || '';
        hint.style.color = isError ? '#c5292e' : '#6c757d';
    }

    function go() {
        const match = resolveCountry(input.value) || resolveCountryLoose(input.value);
        if (!match) {
            setHint('Please choose Ghana or United Kingdom (UK).', true);
            return;
        }
        setHint(`Redirecting to ${match.name}…`, false);
        window.location.href = match.href;
    }

    function setCountryAndGo(countryName) {
        input.value = countryName;
        go();
    }

    // As the user types, show a helpful hint; redirect only on explicit action.
    input.addEventListener('input', () => {
        const match = resolveCountry(input.value);
        if (!match) {
            setHint('');
            return;
        }
        setHint(`Press Enter to go to ${match.name}.`, false);
    });

    // If the user selects a datalist option, treat it as a selection and redirect.
    input.addEventListener('change', () => {
        const match = resolveCountry(input.value);
        if (!match) return;
        go();
    });

    // Mobile keyboards sometimes submit oddly; explicitly handle Enter.
    input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        go();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        go();
    });

    // Extra safety: ensure tapping the icon button always triggers the same flow.
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            go();
        });
    }

    // Keep flag links consistent with the picker (left-click/Enter triggers same flow)
    flagLinks.forEach(a => {
        a.addEventListener('click', (e) => {
            // Let modifier clicks open in a new tab/window as normal.
            if (e.defaultPrevented) return;
            if (e.button && e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            const href = (a.getAttribute('href') || '').toLowerCase();
            if (!href) return;

            if (href.includes('ghana')) {
                e.preventDefault();
                setCountryAndGo('Ghana');
            } else if (href.includes('/uk') || href.includes('united') || href.includes('kingdom')) {
                e.preventDefault();
                setCountryAndGo('United Kingdom (UK)');
            }
        });

        a.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const href = (a.getAttribute('href') || '').toLowerCase();
            if (!href) return;
            if (href.includes('ghana')) {
                e.preventDefault();
                setCountryAndGo('Ghana');
            } else if (href.includes('/uk') || href.includes('united') || href.includes('kingdom')) {
                e.preventDefault();
                setCountryAndGo('United Kingdom (UK)');
            }
        });
    });
})();

// General accessibility/navigation audit: attach handlers to elements that should navigate
document.addEventListener('DOMContentLoaded', () => {
    // 1) Elements that declare a data-href should act like links
    document.querySelectorAll('[data-href]').forEach(el => {
        const href = el.getAttribute('data-href');
        if (!href) return;
        if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
        el.setAttribute('role', el.getAttribute('role') || 'link');
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
            if (e.button && e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            window.location.href = href;
        });
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                window.location.href = href;
            }
        });
    });

    // 2) Anchors with empty href but with data-href should navigate
    document.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if (href && href.trim() !== '') return;
        const dh = a.getAttribute('data-href') || a.dataset.href;
        if (!dh) return;
        a.addEventListener('click', (e) => { e.preventDefault(); window.location.href = dh; });
        a.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = dh; } });
    });

    // 3) Elements with role=link but no handler — ensure keyboard/click works
    document.querySelectorAll('[role="link"]').forEach(el => {
        // if it already navigates via anchor inside or has data-href, skip
        if (el.closest('a') || el.getAttribute('data-href')) return;
        if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
        if (!el.onclick && !el.hasAttribute('data-click')) {
            // no-op: we avoid inventing destinations; leave element focusable so authors can add handlers
        }
    });
});
