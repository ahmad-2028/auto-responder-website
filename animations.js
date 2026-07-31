/* ============================================
   Auto Responder - Animation Scripts
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initScrollReveal();
    initScrollProgress();
    initBackToTop();
    initParticles();
    initParallax();
    initTiltCards();
    initCountUp();
    initTypewriter();
    initMagneticButtons();
});

/* ---------- Page Loader ---------- */
function initLoader() {
    // Add loader to page if not present
    if (!document.querySelector('.loader-overlay')) {
        const loader = document.createElement('div');
        loader.className = 'loader-overlay';
        loader.innerHTML = `
            <div class="loader-container">
                <div class="loader-logo">
                    ${'AUTO RESPONDER'.split('').map(ch => `<span>${ch}</span>`).join('')}
                </div>
                <div class="loader-bar"></div>
                <div class="loader-text">Loading...</div>
            </div>
        `;
        document.body.prepend(loader);

        // Hide loader after page loads
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 700);
            }, 800);
        });

        // Fallback: hide after 3s even if load doesn't fire
        setTimeout(() => {
            if (document.contains(loader)) {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 700);
            }
        }, 3000);
    }
}

/* ---------- Scroll Reveal ---------- */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom');

    if (revealElements.length === 0) return;

    // Add reveal classes to elements that don't have them
    document.querySelectorAll('.feature-card, .stat-card, .table-card, .contact-form-wrapper').forEach((el, i) => {
        if (!el.classList.contains('reveal') &&
            !el.classList.contains('reveal-left') &&
            !el.classList.contains('reveal-right') &&
            !el.classList.contains('reveal-zoom')) {
            el.classList.add('reveal');
            if (i < 4) el.classList.add(`reveal-delay-${(i % 4) + 1}`);
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));

    // Also observe newly added elements
    document.querySelectorAll('.feature-card, .stat-card, .table-card, .contact-form-wrapper').forEach(el => {
        observer.observe(el);
    });
}

/* ---------- Scroll Progress Bar ---------- */
function initScrollProgress() {
    if (!document.querySelector('.scroll-progress')) {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.prepend(progressBar);
    }

    const progressBar = document.querySelector('.scroll-progress');

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = scrollPercent + '%';
    }, { passive: true });
}

/* ---------- Back to Top Button ---------- */
function initBackToTop() {
    if (!document.querySelector('.back-to-top')) {
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.innerHTML = '↑';
        btn.title = 'Back to top';
        document.body.appendChild(btn);

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }, { passive: true });
    }
}

/* ---------- Floating Particles (Hero) ---------- */
function initParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    if (!hero.querySelector('.particles')) {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        hero.appendChild(particlesContainer);

        // Make hero position relative if not already
        if (getComputedStyle(hero).position === 'static') {
            hero.style.position = 'relative';
        }

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 20 + 5;
            const left = Math.random() * 100;
            const duration = Math.random() * 12 + 10;
            const delay = Math.random() * 10;

            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.left = left + '%';
            particle.style.animationDuration = duration + 's';
            particle.style.animationDelay = '-' + delay + 's';

            particlesContainer.appendChild(particle);
        }
    }
}

/* ---------- Mouse Parallax ---------- */
function initParallax() {
    const elements = document.querySelectorAll('.parallax-element');

    if (elements.length === 0) return;

    document.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX / window.innerWidth) - 0.5;
        const mouseY = (e.clientY / window.innerHeight) - 0.5;

        elements.forEach(el => {
            const speed = parseFloat(el.dataset.speed) || 20;
            el.style.transform = `translate(${mouseX * speed}px, ${mouseY * speed}px)`;
        });
    });
}

/* ---------- Tilt Effect Cards ---------- */
function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rotateX = (0.5 - y) * 10;
            const rotateY = (x - 0.5) * 10;
            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
        });
    });
}

/* ---------- Count Up Animation ---------- */
function initCountUp() {
    const countElements = document.querySelectorAll('.count-up, .stat-number');

    if (countElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const target = parseInt(element.dataset.target) || parseInt(element.textContent.replace(/,/g, '')) || 0;
                animateCountUp(element, target);
                observer.unobserve(element);
            }
        });
    }, { threshold: 0.5 });

    countElements.forEach(el => observer.observe(el));
}

/* Global function so other scripts can trigger count-up with new values */
window.animateCountUp = function (element, target, duration) {
    duration = duration || 1200;
    const start = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.floor(target * eased);
        element.textContent = current.toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target.toLocaleString();
        }
    }

    requestAnimationFrame(update);
};

/* ---------- Typewriter Effect ---------- */
function initTypewriter() {
    const el = document.querySelector('.typing-text');
    if (!el) return;

    let words = [];
    try {
        words = JSON.parse(el.dataset.words || '[]');
    } catch (e) {
        words = [];
    }
    if (!words.length) return;

    const typeSpeed = 75;
    const deleteSpeed = 40;
    const pauseEnd = 1800;
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
        const word = words[wordIndex];
        if (deleting) {
            charIndex--;
            el.textContent = word.slice(0, charIndex);
            if (charIndex === 0) {
                deleting = false;
                wordIndex = (wordIndex + 1) % words.length;
            }
            setTimeout(tick, deleteSpeed);
        } else {
            charIndex++;
            el.textContent = word.slice(0, charIndex);
            if (charIndex === word.length) {
                deleting = true;
                setTimeout(tick, pauseEnd);
            } else {
                setTimeout(tick, typeSpeed);
            }
        }
    }

    setTimeout(tick, 600); // wait for hero entrance animation
}

/* ---------- Magnetic Buttons ---------- */
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-magnetic');
    if (buttons.length === 0) return;

    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.35}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

/* ---------- Smooth Scroll for Anchors ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});
