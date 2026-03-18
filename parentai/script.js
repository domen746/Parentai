// ─── Scroll to top on load ────────────────────────
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ─── Live Waitlist Counter ────────────────────────

const BASE_COUNT = 2419;
let currentCount = BASE_COUNT;
let lastSignupSeconds = 0; // seconds ago

const COUNTER_IDS = ['heroCounter', 'heroCommunityCount', 'tickerCount', 'statCounter', 'wlCounter'];

function formatCount(n) {
  return n.toLocaleString('en-US');
}

function updateAllCounters() {
  COUNTER_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatCount(currentCount);
  });
}

updateAllCounters();

function updateLastSignup() {
  const el = document.getElementById('lastSignup');
  if (!el) return;
  if (lastSignupSeconds < 60) {
    el.textContent = lastSignupSeconds < 5 ? 'just now' : `${lastSignupSeconds}s ago`;
  } else if (lastSignupSeconds < 3600) {
    el.textContent = `${Math.floor(lastSignupSeconds / 60)}m ago`;
  } else {
    el.textContent = `${Math.floor(lastSignupSeconds / 3600)}h ago`;
  }
}

function simulateLiveSignup() {
  // Random signup: every 40-120 seconds a new person joins
  const delay = (40 + Math.random() * 80) * 1000;
  setTimeout(() => {
    currentCount += 1;
    lastSignupSeconds = 0;
    updateAllCounters();
    updateLastSignup();
    pulseCounters();
    simulateLiveSignup();
  }, delay);
}

function pulseCounters() {
  COUNTER_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.color = 'var(--accent)';
    el.style.transform = 'scale(1.08)';
    el.style.display = 'inline-block';
    setTimeout(() => {
      el.style.color = '';
      el.style.transform = '';
    }, 600);
  });
}

// Tick every second: age the "last signup" time
setInterval(() => {
  lastSignupSeconds++;
  updateLastSignup();
}, 1000);

// Start simulation
updateAllCounters();
simulateLiveSignup();

// ─── Email Validation ─────────────────────────────

// Known disposable/fake email domains
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'trashmail.com', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'guerrillamail.info', 'temp-mail.org', 'fakeinbox.com',
  'maildrop.cc', 'dispostable.com', 'spamgourmet.com', 'mailnull.com',
  'spamhere.com', 'jetable.fr', 'discard.email', 'tempr.email',
  'getnada.com', 'harakirimail.com', 'mytrashmail.com', 'no-spam.ws',
  'spambox.us', '10minutemail.com', 'burnermail.io', 'inboxbear.com',
  'spam4.me', 'trashmail.me', 'spamgurmet.net', 'tempinbox.com'
];

function validateEmail(email) {
  const result = { valid: false, message: '', type: '' };

  if (!email) {
    result.message = '';
    return result;
  }

  // Basic format check
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) {
    result.type = 'error';
    result.message = 'Please enter a valid email address.';
    return result;
  }

  const parts = email.toLowerCase().split('@');
  const domain = parts[1];
  const localPart = parts[0];

  // Disposable email check
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    result.type = 'error';
    result.message = 'Disposable emails aren\'t allowed — we promise no spam!';
    return result;
  }

  // Suspicious patterns
  if (/^\d{6,}$/.test(localPart)) {
    result.type = 'warning';
    result.message = 'This looks unusual — double-check your email.';
    return result;
  }

  // Must have a real TLD
  const tld = domain.split('.').pop();
  if (tld.length < 2 || tld.length > 8) {
    result.type = 'error';
    result.message = 'Check the domain — something looks off.';
    return result;
  }

  // Common typos
  const typos = {
    'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gnail.com': 'gmail.com',
    'hotmial.com': 'hotmail.com', 'homail.com': 'hotmail.com',
    'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com',
    'outlok.com': 'outlook.com', 'outook.com': 'outlook.com',
    'iclud.com': 'icloud.com', 'icoud.com': 'icloud.com',
  };

  if (typos[domain]) {
    result.type = 'warning';
    result.message = `Did you mean ${localPart}@${typos[domain]}?`;
    return result;
  }

  result.valid = true;
  result.type = 'success';
  result.message = 'Looks good!';
  return result;
}

function setupEmailValidation(inputId, statusId, feedbackId) {
  const input = document.getElementById(inputId);
  const status = document.getElementById(statusId);
  const feedback = document.getElementById(feedbackId);
  if (!input || !status || !feedback) return;

  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const val = input.value.trim();

    if (!val) {
      status.textContent = '';
      status.className = 'email-status';
      feedback.textContent = '';
      feedback.className = 'email-feedback';
      return;
    }

    // Debounce 300ms
    debounceTimer = setTimeout(() => {
      const result = validateEmail(val);
      status.className = 'email-status ' + (result.valid ? 'valid' : result.type === 'warning' ? '' : 'invalid');
      status.textContent = result.valid ? '✓' : result.type === 'error' ? '✗' : '?';
      feedback.textContent = result.message;
      feedback.className = 'email-feedback ' + (result.type || '');
    }, 300);
  });
}

setupEmailValidation('heroEmail', 'heroEmailStatus', 'heroFeedback');
setupEmailValidation('wlEmail', 'wlEmailStatus', 'wlFeedback');

// ─── Waitlist form submission ─────────────────────
function handleWaitlistSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const inputId = form.querySelector('.email-input').id;
  const input = form.querySelector('.email-input');
  const btn = form.querySelector('.btn-primary');
  const feedbackId = inputId === 'heroEmail' ? 'heroFeedback' : 'wlFeedback';
  const feedback = document.getElementById(feedbackId);
  const email = input.value.trim();

  if (!email) return;

  const validation = validateEmail(email);

  if (!validation.valid) {
    if (feedback) {
      feedback.textContent = validation.message || 'Please enter a valid email.';
      feedback.className = 'email-feedback error';
    }
    input.focus();
    return;
  }

  // Success — save locally
  const originalText = btn.textContent;
  btn.disabled = true;
  input.disabled = true;

  btn.textContent = '✓ You\'re on the list!';
  btn.style.background = '#bfdbfe';
  btn.style.color = '#1e40af';
  // Confetti burst
  launchConfetti(btn);
  if (feedback) {
    feedback.textContent = 'We\'ll email you the moment we launch. Welcome to ParentAI!';
    feedback.className = 'email-feedback success';
  }

  // Increment the live counter
  currentCount += 1;
  lastSignupSeconds = 0;
  updateAllCounters();
  updateLastSignup();
  pulseCounters();

  // Save locally
  const saved = JSON.parse(localStorage.getItem('parentai_waitlist') || '[]');
  saved.push({ email, date: new Date().toISOString() });
  localStorage.setItem('parentai_waitlist', JSON.stringify(saved));

  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
    btn.style.color = '';
    btn.disabled = false;
    input.value = '';
    input.disabled = false;
    if (feedback) {
      feedback.textContent = '';
      feedback.className = 'email-feedback';
    }
    const statusEl = document.getElementById(inputId === 'heroEmail' ? 'heroEmailStatus' : 'wlEmailStatus');
    if (statusEl) { statusEl.textContent = ''; statusEl.className = 'email-status'; }
  }, 7000);
}

document.getElementById('hero-form')?.addEventListener('submit', handleWaitlistSubmit);
document.getElementById('waitlist-form')?.addEventListener('submit', handleWaitlistSubmit);

// ─── Navbar scroll ────────────────────────────────
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar?.classList.toggle('scrolled', window.scrollY > 40);
});

// ─── Hamburger ────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger?.addEventListener('click', () => navLinks?.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(l => l.addEventListener('click', () => navLinks?.classList.remove('open')));

// ─── FAQ accordion ────────────────────────────────
window.toggleFaq = function(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));

  // Toggle clicked
  if (!isOpen) item.classList.add('open');
};

// ─── Scroll reveal ────────────────────────────────
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll(
  '.feature-card, .step, .stat, .testi-card, .pricing-card, .faq-item'
).forEach((el, i) => {
  el.classList.add('fade-up');
  el.style.transitionDelay = `${(i % 6) * 0.07}s`;
  observer.observe(el);
});

// ─── Phone dark/light mode toggle ─────────────────
const darkToggle = document.getElementById('phoneDarkToggle');
const phoneMockup = document.querySelector('.phone-mockup');
const lightLabel = document.querySelector('.mode-label-light');
const darkLabel = document.querySelector('.mode-label-dark');

if (darkToggle && phoneMockup) {
  darkToggle.addEventListener('change', () => {
    phoneMockup.classList.toggle('dark-mode', darkToggle.checked);
    lightLabel?.classList.toggle('active', !darkToggle.checked);
    darkLabel?.classList.toggle('active', darkToggle.checked);
  });
}

// ─── Before / After slider ────────────────────────
const baWrapper = document.getElementById('baWrapper');
const baBefore = document.getElementById('baBefore');
const baHandle = document.getElementById('baHandle');

if (baWrapper && baBefore && baHandle) {
  let isDragging = false;

  function updateSlider(x) {
    const rect = baWrapper.getBoundingClientRect();
    let pos = (x - rect.left) / rect.width;
    pos = Math.max(0.05, Math.min(0.95, pos));
    const pct = pos * 100;
    baBefore.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    baHandle.style.left = `${pct}%`;
  }

  baWrapper.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateSlider(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    updateSlider(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  baWrapper.addEventListener('touchstart', (e) => {
    isDragging = true;
    updateSlider(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    updateSlider(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

// ─── Demo: drag & drop ────────────────────────────
const uploadArea = document.getElementById('uploadArea');

if (uploadArea) {
  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.style.background = 'rgba(110,231,183,0.05)';
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.background = '';
  });
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.style.background = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) triggerImageLoad(file);
  });
}

// Rescan button
document.getElementById('rescanBtn')?.addEventListener('click', () => {
  document.getElementById('imageContainer').style.display = 'none';
  document.getElementById('demoResults').style.display = 'none';
  document.getElementById('uploadPrompt').style.display = 'flex';
  document.getElementById('detectionCanvas').getContext('2d')?.clearRect(0, 0, 9999, 9999);
  const fi = document.getElementById('imageUpload');
  if (fi) fi.value = '';
});

// ─── Count-up animation ───────────────────────────
const countUpObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    if (el.dataset.counted) return;
    el.dataset.counted = '1';

    const text = el.textContent.trim();
    const match = text.match(/^([\d,]+)/);
    if (!match) return;

    const target = parseInt(match[1].replace(/,/g, ''), 10);
    if (isNaN(target)) return;
    const suffix = text.replace(match[1], '');
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * ease);
      el.textContent = current.toLocaleString('en-US') + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    el.textContent = '0' + suffix;
    requestAnimationFrame(tick);
  });
}, { threshold: 0.3 });

document.querySelectorAll('.stat-num').forEach(el => countUpObserver.observe(el));

// ─── Navbar active section highlight ──────────────
const navSections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

function updateActiveNav() {
  let current = '';
  navSections.forEach(section => {
    const top = section.offsetTop - 120;
    if (window.scrollY >= top) current = section.id;
  });
  navAnchors.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });

// ─── Mouse parallax on hero orbs ──────────────────
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  const orbs = heroBg.querySelectorAll('.orb');
  document.addEventListener('mousemove', (e) => {
    const cx = (e.clientX / window.innerWidth - 0.5) * 2;
    const cy = (e.clientY / window.innerHeight - 0.5) * 2;
    orbs.forEach((orb, i) => {
      const strength = (i + 1) * 12;
      orb.style.transform = `translate(${cx * strength}px, ${cy * strength}px)`;
    });
  });
}

// ─── Back to top button ───────────────────────────
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ─── Typing effect on hero subtitle ───────────────
const heroSub = document.querySelector('.hero-sub');
if (heroSub) {
  const fullText = heroSub.textContent;
  heroSub.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  heroSub.appendChild(cursor);
  let i = 0;
  function typeChar() {
    if (i < fullText.length) {
      heroSub.insertBefore(document.createTextNode(fullText[i]), cursor);
      i++;
      setTimeout(typeChar, 22);
    } else {
      setTimeout(() => cursor.remove(), 2000);
    }
  }
  // Start typing when hero is visible
  const heroObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      setTimeout(typeChar, 400);
      heroObserver.disconnect();
    }
  });
  heroObserver.observe(heroSub);
}

// ─── Testimonial auto-scroll on mobile ────────────
const testiGrid = document.querySelector('.testimonials-grid');
const testiDots = document.getElementById('testiDots');

if (testiGrid && testiDots) {
  const cards = testiGrid.querySelectorAll('.testi-card');

  // Create dots
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
    dot.addEventListener('click', () => {
      cards[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
    testiDots.appendChild(dot);
  });

  const dots = testiDots.querySelectorAll('.testi-dot');

  // Update dots on scroll
  testiGrid.addEventListener('scroll', () => {
    const scrollLeft = testiGrid.scrollLeft;
    const cardWidth = cards[0]?.offsetWidth || 1;
    const idx = Math.round(scrollLeft / (cardWidth + 16));
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }, { passive: true });

  // Auto-scroll every 4s on mobile
  let autoTimer;
  function startAutoScroll() {
    if (window.innerWidth > 900) return;
    let idx = 0;
    autoTimer = setInterval(() => {
      idx = (idx + 1) % cards.length;
      cards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 4000);
  }

  function stopAutoScroll() { clearInterval(autoTimer); }

  testiGrid.addEventListener('touchstart', stopAutoScroll, { passive: true });
  testiGrid.addEventListener('touchend', () => setTimeout(startAutoScroll, 8000), { passive: true });

  if (window.innerWidth <= 900) startAutoScroll();
  window.addEventListener('resize', () => {
    stopAutoScroll();
    if (window.innerWidth <= 900) startAutoScroll();
  });
}

// ─── Page Loader ──────────────────────────────────
const pageLoader = document.getElementById('pageLoader');
const loaderBar = document.getElementById('loaderBar');
if (pageLoader && loaderBar) {
  let progress = 0;
  const loaderInterval = setInterval(() => {
    progress += Math.random() * 25 + 5;
    if (progress > 90) progress = 90;
    loaderBar.style.width = progress + '%';
  }, 150);

  window.addEventListener('load', () => {
    clearInterval(loaderInterval);
    loaderBar.style.width = '100%';
    pageLoader.classList.add('done');
    setTimeout(() => {
      pageLoader.classList.add('hidden');
      setTimeout(() => pageLoader.remove(), 400);
    }, 300);
  });
}

// ─── Scroll Progress Bar ──────────────────────────
const scrollProgress = document.getElementById('scrollProgress');
if (scrollProgress) {
  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
  }, { passive: true });
}

// ─── Confetti on signup ───────────────────────────
function launchConfetti(originEl) {
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ['#2563eb', '#60a5fa', '#a78bfa', '#fbbf24', '#6ee7b7', '#f87171'];
  const count = 40;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position:fixed; left:${cx}px; top:${cy}px;
      width:${4 + Math.random() * 4}px; height:${4 + Math.random() * 4}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      pointer-events:none; z-index:9999;
    `;
    document.body.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const velocity = 60 + Math.random() * 120;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - 60;

    particle.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy + 200}px) scale(0)`, opacity: 0 }
    ], { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' })
      .onfinish = () => particle.remove();
  }
}

// ─── Pricing toggle (monthly/yearly) ─────────────
const pricingToggle = document.getElementById('pricingToggle');
const pToggleMonthly = document.getElementById('pToggleMonthly');
const pToggleYearly = document.getElementById('pToggleYearly');

if (pricingToggle) {
  pToggleMonthly?.classList.add('active');

  pricingToggle.addEventListener('change', () => {
    const isYearly = pricingToggle.checked;
    pToggleMonthly?.classList.toggle('active', !isYearly);
    pToggleYearly?.classList.toggle('active', isYearly);

    document.querySelectorAll('.pricing-price[data-monthly]').forEach(el => {
      const price = isYearly ? el.dataset.yearly : el.dataset.monthly;
      const suffix = isYearly ? '/mo' : '/mo';
      el.style.opacity = '0';
      setTimeout(() => {
        el.innerHTML = `$${price}<span>${suffix}</span>`;
        el.style.opacity = '1';
      }, 150);
    });
  });
}

// ─── Phone screen live animations on scroll ───────
const phoneSection = document.querySelector('.hero-visual');
if (phoneSection) {
  let phoneAnimated = false;
  const phoneObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !phoneAnimated) {
      phoneAnimated = true;
      const tasks = document.querySelectorAll('.phone-mockup .task-pending');
      tasks.forEach((task, i) => {
        setTimeout(() => {
          const check = task.querySelector('.task-check');
          if (check) check.textContent = '✓';
          task.classList.remove('task-pending');
          task.classList.add('task-done');
        }, 3000 + i * 1200);
      });

      // Animate score from 18% to 96%
      const scoreVal = document.querySelector('.phone-mockup .score-value');
      const scoreBar = document.querySelector('.phone-mockup .score-bar');
      if (scoreVal && scoreBar) {
        setTimeout(() => {
          let current = 18;
          const target = 96;
          scoreBar.classList.remove('score-bar-low');
          const interval = setInterval(() => {
            current += 2;
            if (current >= target) {
              current = target;
              clearInterval(interval);
            }
            scoreVal.textContent = current + '%';
          }, 40);
        }, 6600);
      }
    }
  }, { threshold: 0.3 });
  phoneObserver.observe(phoneSection);
}

// ─── Cookie Consent ───────────────────────────────
const cookieBanner = document.getElementById('cookieBanner');
if (cookieBanner && !localStorage.getItem('parentai_cookies')) {
  setTimeout(() => cookieBanner.classList.add('visible'), 2000);

  document.getElementById('cookieAccept')?.addEventListener('click', () => {
    localStorage.setItem('parentai_cookies', 'accepted');
    cookieBanner.classList.remove('visible');
  });

  document.getElementById('cookieDecline')?.addEventListener('click', () => {
    localStorage.setItem('parentai_cookies', 'declined');
    cookieBanner.classList.remove('visible');
  });
}