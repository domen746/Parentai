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

// ─── 1. Social Proof Toast Notifications ──────────
(function() {
  const toast = document.getElementById('socialToast');
  if (!toast) return;

  const people = [
    { name: 'Laura', city: 'Berlin', initial: 'L', bg: '#bfdbfe', color: '#1d4ed8' },
    { name: 'James', city: 'London', initial: 'J', bg: '#ddd6fe', color: '#6d28d9' },
    { name: 'Anika', city: 'Amsterdam', initial: 'A', bg: '#fef3c7', color: '#92400e' },
    { name: 'Marcus', city: 'Stockholm', initial: 'M', bg: '#fecaca', color: '#991b1b' },
    { name: 'Sofia', city: 'Madrid', initial: 'S', bg: '#d1fae5', color: '#065f46' },
    { name: 'Tom', city: 'Dublin', initial: 'T', bg: '#e0e7ff', color: '#3730a3' },
    { name: 'Elena', city: 'Zurich', initial: 'E', bg: '#fce7f3', color: '#9d174d' },
    { name: 'David', city: 'Paris', initial: 'D', bg: '#ccfbf1', color: '#0f766e' },
  ];

  const nameEl = document.getElementById('toastName');
  const cityEl = document.getElementById('toastCity');
  const avatarEl = document.getElementById('toastAvatar');
  const timeEl = document.getElementById('toastTime');

  function showToast() {
    const p = people[Math.floor(Math.random() * people.length)];
    const mins = Math.floor(Math.random() * 10) + 1;
    nameEl.textContent = p.name;
    cityEl.textContent = p.city;
    avatarEl.textContent = p.initial;
    avatarEl.style.background = p.bg;
    avatarEl.style.color = p.color;
    timeEl.textContent = mins === 1 ? '1 minute ago' : mins + ' minutes ago';

    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 4000);
  }

  // First toast after 8s, then every 25-50s
  setTimeout(() => {
    showToast();
    setInterval(() => showToast(), (25 + Math.random() * 25) * 1000);
  }, 8000);
})();

// ─── 2. 3D Tilt on Cards ─────────────────────────
(function() {
  const cards = document.querySelectorAll('.feature-card, .testi-card, .pricing-card');
  if (window.matchMedia('(pointer: coarse)').matches) return;

  cards.forEach(card => {
    card.classList.add('tilt-card');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-3px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

// ─── 3. Magnetic CTA Buttons ─────────────────────
(function() {
  const btns = document.querySelectorAll('.btn-primary, .nav-cta');
  if (window.matchMedia('(pointer: coarse)').matches) return;

  btns.forEach(btn => {
    btn.classList.add('btn-magnetic');

    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.2;
      const dy = (e.clientY - cy) * 0.2;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

// ─── 4. Animated Step Connectors ─────────────────
// (Uses the existing .visible class from scroll-reveal observer —
//  the CSS transition handles the draw-in animation)

// ─── 5. Text Marker Highlight on Scroll ──────────
(function() {
  const marks = document.querySelectorAll('.highlight-mark');
  if (!marks.length) return;

  const markObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        markObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  marks.forEach(m => markObserver.observe(m));
})();

// ─── 7. Section Blur-to-Sharp Reveal ─────────────
(function() {
  const sections = document.querySelectorAll(
    '.section-title, .section-sub, .section-label'
  );
  const blurObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        blurObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  sections.forEach(el => {
    el.classList.add('blur-reveal');
    blurObserver.observe(el);
  });
})();

// ─── 8. Rotating Hero Words ──────────────────────
(function() {
  const words = document.querySelectorAll('.rw-word');
  if (words.length < 2) return;

  let currentIdx = 0;

  setInterval(() => {
    const current = words[currentIdx];
    current.classList.add('rw-exit');
    current.classList.remove('rw-active');

    currentIdx = (currentIdx + 1) % words.length;
    const next = words[currentIdx];

    setTimeout(() => {
      current.classList.remove('rw-exit');
      next.classList.add('rw-active');
    }, 400);
  }, 2500);
})();

// ─── 9. Custom Cursor ────────────────────────────
(function() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mx = 0, my = 0;
  let rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });

  // Smooth follow for ring
  function followRing() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(followRing);
  }
  followRing();

  // Hover detection
  const hoverTargets = 'a, button, input, .ba-wrapper, .toggle-switch, .faq-q, .pricing-card, .feature-card, .testi-card';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      dot.classList.add('hovering');
      ring.classList.add('hovering');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      dot.classList.remove('hovering');
      ring.classList.remove('hovering');
    }
  });
})();

// ─── 10. Scroll-Triggered Stats Ring ─────────────
(function() {
  const ringFill = document.querySelector('.ring-fill[data-pct]');
  if (!ringFill) return;

  const ringObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        ringFill.classList.add('animated');
        ringObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  ringObserver.observe(ringFill.closest('.stat-ring-wrap') || ringFill);
})();

// ─── 11. Phone Sparkle Particles ─────────────────
(function() {
  const container = document.getElementById('phoneSparkles');
  if (!container) return;

  const colors = ['#2563eb', '#60a5fa', '#a78bfa', '#6ee7b7', '#fbbf24'];

  for (let i = 0; i < 12; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = 20 + Math.random() * 60 + '%';
    s.style.width = (3 + Math.random() * 3) + 'px';
    s.style.height = s.style.width;
    s.style.background = colors[Math.floor(Math.random() * colors.length)];
    s.style.animationDelay = (Math.random() * 3) + 's';
    s.style.animationDuration = (2.5 + Math.random() * 2) + 's';
    container.appendChild(s);
  }
})();

// ─── 13. Scroll Depth CTA Popup ──────────────────
(function() {
  const cta = document.getElementById('scrollDepthCta');
  const closeBtn = document.getElementById('sdcClose');
  if (!cta) return;

  let dismissed = false;
  let shown = false;

  window.addEventListener('scroll', () => {
    if (dismissed) return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? window.scrollY / docHeight : 0;

    if (pct > 0.6 && !shown) {
      shown = true;
      cta.classList.add('visible');
    } else if (pct <= 0.5 && shown && !dismissed) {
      shown = false;
      cta.classList.remove('visible');
    }
  }, { passive: true });

  closeBtn?.addEventListener('click', () => {
    dismissed = true;
    cta.classList.remove('visible');
  });

  // Also dismiss when user clicks the CTA link
  cta.querySelector('.sdc-btn')?.addEventListener('click', () => {
    dismissed = true;
    setTimeout(() => cta.classList.remove('visible'), 300);
  });
})();

// ─── 16. Sticky Pricing Bar on Mobile ────────────
(function() {
  const bar = document.getElementById('stickyPricingBar');
  const pricingSection = document.getElementById('pricing');
  if (!bar || !pricingSection || window.innerWidth > 900) return;

  const planEl = document.getElementById('spbPlan');
  const priceEl = document.getElementById('spbPrice');
  const cards = pricingSection.querySelectorAll('.pricing-card');

  const pricingObserver = new IntersectionObserver((entries) => {
    bar.classList.toggle('visible', entries[0].isIntersecting);
  }, { threshold: 0.05 });

  pricingObserver.observe(pricingSection);

  // Update plan name when scrolling through cards
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const tier = entry.target.querySelector('.pricing-tier');
        const price = entry.target.querySelector('.pricing-price');
        if (tier && planEl) planEl.textContent = tier.textContent;
        if (price && priceEl) priceEl.textContent = price.textContent.replace(/\s+/g, '');
      }
    });
  }, { threshold: 0.5 });

  cards.forEach(c => cardObserver.observe(c));
})();

// ─── 17. Slot-Machine Badge Counter ──────────────
(function() {
  const badge = document.querySelector('.hero-badge');
  if (!badge) return;
  const counterEl = document.getElementById('heroCounter');
  if (!counterEl) return;

  const text = counterEl.textContent;
  const wrap = document.createElement('span');
  wrap.className = 'badge-counter-wrap';

  for (let i = 0; i < text.length; i++) {
    const span = document.createElement('span');
    span.className = 'badge-digit';
    span.textContent = text[i];
    span.style.setProperty('--d', (i * 0.08) + 's');
    wrap.appendChild(span);
  }

  counterEl.textContent = '';
  counterEl.appendChild(wrap);
})();

// ─── 19. Button Ripple Effect ────────────────────
(function() {
  const btns = document.querySelectorAll('.btn-primary, .btn-outline, .nav-cta');

  btns.forEach(btn => {
    btn.classList.add('btn-ripple');

    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const circle = document.createElement('span');
      circle.className = 'ripple-circle';
      const size = Math.max(rect.width, rect.height);
      circle.style.width = circle.style.height = size + 'px';
      circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
      circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(circle);
      circle.addEventListener('animationend', () => circle.remove());
    });
  });
})();

// ─── 20. FAQ Counter Badge Animation ─────────────
(function() {
  const badge = document.getElementById('faqCountBadge');
  if (!badge) return;

  const faqObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      badge.classList.add('visible');
      faqObserver.disconnect();
    }
  }, { threshold: 0.3 });

  faqObserver.observe(badge);
})();

// ═══════════════════════════════════════════════════
//  BATCH 5 — Innovative Features
// ═══════════════════════════════════════════════════

// ─── 21. Full-Site Dark Mode Toggle ──────────────
(function() {
  const toggle = document.getElementById('darkModeToggle');
  if (!toggle) return;

  // Restore saved preference
  if (localStorage.getItem('parentai_darkmode') === 'true') {
    document.body.classList.add('dark-mode');
    toggle.textContent = '☀️';
  }

  toggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    toggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('parentai_darkmode', isDark);
  });
})();

// ─── 22. Before/After Auto-Animate on Scroll ─────
(function() {
  const wrapper = document.getElementById('baWrapper');
  if (!wrapper) return;

  const baObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      wrapper.classList.add('auto-animate');
      baObserver.disconnect();

      // Remove auto-animate after animation completes to allow manual drag
      setTimeout(() => {
        wrapper.classList.remove('auto-animate');
      }, 2600);
    }
  }, { threshold: 0.4 });

  baObserver.observe(wrapper);
})();

// ─── 23. Launch Countdown Timer ──────────────────
(function() {
  const launchDate = new Date('2026-07-01T00:00:00').getTime();
  const daysEl = document.getElementById('cdDays');
  const hoursEl = document.getElementById('cdHours');
  const minsEl = document.getElementById('cdMins');
  const secsEl = document.getElementById('cdSecs');
  if (!daysEl) return;

  function pad(n, len) {
    return String(n).padStart(len || 2, '0');
  }

  function updateCountdown() {
    const now = Date.now();
    const diff = Math.max(0, launchDate - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const newDays = pad(days, 3);
    const newHours = pad(hours);
    const newMins = pad(mins);
    const newSecs = pad(secs);

    if (secsEl.textContent !== newSecs) {
      secsEl.classList.add('tick');
      setTimeout(() => secsEl.classList.remove('tick'), 300);
    }

    daysEl.textContent = newDays;
    hoursEl.textContent = newHours;
    minsEl.textContent = newMins;
    secsEl.textContent = newSecs;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
})();

// ─── 24. Emoji Reactions on Testimonials ─────────
(function() {
  const buttons = document.querySelectorAll('.reaction-btn');
  if (!buttons.length) return;

  // Load saved reactions
  const saved = JSON.parse(localStorage.getItem('parentai_reactions') || '{}');

  buttons.forEach(btn => {
    const card = btn.closest('.testi-card');
    const cardIdx = Array.from(document.querySelectorAll('.testi-card')).indexOf(card);
    const emoji = btn.dataset.emoji;
    const key = cardIdx + '_' + emoji;
    const countEl = btn.querySelector('.reaction-count');

    if (saved[key]) {
      btn.classList.add('reacted');
      const base = parseInt(countEl.textContent, 10);
      countEl.textContent = base + 1;
    }

    btn.addEventListener('click', () => {
      const isReacted = btn.classList.contains('reacted');
      const current = parseInt(countEl.textContent, 10);

      if (isReacted) {
        btn.classList.remove('reacted');
        countEl.textContent = current - 1;
        delete saved[key];
      } else {
        btn.classList.add('reacted');
        btn.classList.add('burst');
        countEl.textContent = current + 1;
        saved[key] = true;
        setTimeout(() => btn.classList.remove('burst'), 400);
      }

      localStorage.setItem('parentai_reactions', JSON.stringify(saved));
    });
  });
})();

// ─── 25. Comparison Table Animated Checkmarks ────
(function() {
  const checks = document.querySelectorAll('.ct-check');
  if (!checks.length) return;

  const ctObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      checks.forEach((check, i) => {
        setTimeout(() => check.classList.add('animated'), i * 150);
      });
      ctObserver.disconnect();
    }
  }, { threshold: 0.2 });

  const table = document.querySelector('.compare-table');
  if (table) ctObserver.observe(table);
})();

// ─── 26. Scroll-Position Nav Dots ────────────────
(function() {
  const dotsContainer = document.getElementById('scrollNavDots');
  if (!dotsContainer) return;
  const dots = dotsContainer.querySelectorAll('.snd');
  const targetIds = Array.from(dots).map(d => d.dataset.target);

  // Show/hide based on scroll
  function updateDots() {
    const scrollY = window.scrollY;
    dotsContainer.classList.toggle('visible', scrollY > 300);

    let activeId = targetIds[0];
    targetIds.forEach(id => {
      const section = document.getElementById(id);
      if (section && scrollY >= section.offsetTop - 200) {
        activeId = id;
      }
    });

    dots.forEach(d => d.classList.toggle('active', d.dataset.target === activeId));
  }

  window.addEventListener('scroll', updateDots, { passive: true });
  updateDots();

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const target = document.getElementById(dot.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
})();

// ─── 27. Referral Share Widget ───────────────────
(function() {
  const fab = document.getElementById('shareFab');
  const dropdown = document.getElementById('shareDropdown');
  const copyBtn = document.getElementById('shareCopy');
  const nativeBtn = document.getElementById('shareNative');
  if (!fab || !dropdown) return;

  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));

  copyBtn?.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('share-copied');
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy link';
        copyBtn.classList.remove('share-copied');
      }, 2000);
    });
    dropdown.classList.remove('open');
  });

  nativeBtn?.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: 'ParentAI — Clean Room, No Argument',
        text: 'AI scans messy rooms, assigns tasks, and verifies they\'re done. Join the waitlist!',
        url: window.location.href
      });
    } else {
      // Fallback: open mailto
      const subject = encodeURIComponent('Check out ParentAI');
      const body = encodeURIComponent('AI-powered room cleaning for kids: ' + window.location.href);
      window.open('mailto:?subject=' + subject + '&body=' + body);
    }
    dropdown.classList.remove('open');
  });
})();

// ─── 28. Waitlist Position Reveal After Signup ───
(function() {
  const reveal = document.getElementById('wlPositionReveal');
  const posNum = document.getElementById('wlPosNum');
  if (!reveal || !posNum) return;

  // Intercept the existing form submission to show position
  const form = document.getElementById('waitlist-form');
  if (!form) return;

  form.addEventListener('submit', () => {
    // Delay to let the main handler run first
    setTimeout(() => {
      posNum.textContent = formatCount(currentCount);
      reveal.classList.add('visible');

      // Mini confetti
      const container = document.getElementById('wlPosConfetti');
      if (container) {
        const colors = ['#2563eb', '#60a5fa', '#fbbf24', '#6ee7b7', '#a78bfa'];
        for (let i = 0; i < 20; i++) {
          const p = document.createElement('div');
          p.style.cssText = 'position:absolute;width:6px;height:6px;border-radius:50%;pointer-events:none;';
          p.style.background = colors[Math.floor(Math.random() * colors.length)];
          p.style.left = '50%';
          p.style.top = '0';
          container.appendChild(p);

          const angle = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 80;
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist;

          p.animate([
            { transform: 'translate(-50%, 0) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), ${dy}px) scale(0)`, opacity: 0 }
          ], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' })
            .onfinish = () => p.remove();
        }
      }

      // Hide after reset
      setTimeout(() => reveal.classList.remove('visible'), 7000);
    }, 200);
  });
})();

// ─── 29. Keyboard Shortcuts ──────────────────────
(function() {
  const sectionMap = {
    '1': 'hero',
    '2': 'features',
    '3': 'how',
    '4': 'compare',
    '5': 'testimonials',
    '6': 'pricing'
  };

  document.addEventListener('keydown', (e) => {
    // Don't trigger when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const section = sectionMap[e.key];
    if (section) {
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  });
})();

// ─── 30. "Why Parents Love It" Flip Number Tickers ─
(function() {
  const nums = document.querySelectorAll('.love-num[data-target]');
  if (!nums.length) return;

  const loveObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      nums.forEach(numEl => {
        const target = parseInt(numEl.dataset.target, 10);
        if (isNaN(target)) return;

        let current = 0;
        const duration = 1200;
        const start = performance.now();

        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          current = Math.round(target * ease);
          numEl.textContent = current;
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
      });
      loveObserver.disconnect();
    }
  }, { threshold: 0.3 });

  const ticker = document.getElementById('loveTicker');
  if (ticker) loveObserver.observe(ticker);
})();

// ═══════════════════════════════════════════════════
//  BATCH 6 — 10 More Features
// ═══════════════════════════════════════════════════

// ─── 31. Text Scramble / Decode Effect on Titles ──
(function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  const titles = document.querySelectorAll('.section-title');
  if (!titles.length) return;

  titles.forEach(title => {
    const originalHTML = title.innerHTML;
    const textContent = title.textContent;
    let scrambled = false;

    const scrambleObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !scrambled) {
        scrambled = true;
        scrambleObserver.disconnect();

        // Extract text nodes only for scramble
        const textNodes = [];
        const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.trim()) textNodes.push(node);
        }

        const iterations = 6;
        let round = 0;

        function doScramble() {
          if (round >= iterations) return;
          round++;

          textNodes.forEach(tn => {
            const original = tn._original || (tn._original = tn.textContent);
            const arr = original.split('');
            const scrambleCount = Math.max(1, Math.floor(arr.length * (1 - round / iterations)));

            for (let i = 0; i < scrambleCount; i++) {
              const idx = Math.floor(Math.random() * arr.length);
              if (arr[idx] !== ' ' && arr[idx] !== '\n') {
                arr[idx] = chars[Math.floor(Math.random() * chars.length)];
              }
            }
            tn.textContent = arr.join('');
          });

          if (round < iterations) {
            setTimeout(doScramble, 50);
          } else {
            // Restore original
            textNodes.forEach(tn => {
              tn.textContent = tn._original;
            });
          }
        }

        doScramble();
      }
    }, { threshold: 0.3 });

    scrambleObserver.observe(title);
  });
})();

// ─── 32. Pricing Card Spotlight Glow ─────────────
(function() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const cards = document.querySelectorAll('.pricing-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--spot-x', x + 'px');
      card.style.setProperty('--spot-y', y + 'px');
      // Move the pseudo-element via inline style on a data attr
      card.style.cssText += `--spot-x:${x}px;--spot-y:${y}px;`;
    });
  });

  // Inject a tiny style to position the ::before from custom properties
  const style = document.createElement('style');
  style.textContent = '.pricing-card::before{left:var(--spot-x,50%);top:var(--spot-y,50%);}';
  document.head.appendChild(style);
})();

// ─── 33. Scroll-Filled Timeline (How It Works) ───
(function() {
  const fill = document.getElementById('timelineFill');
  const stepsGrid = document.querySelector('.steps-grid');
  if (!fill || !stepsGrid) return;

  function updateTimeline() {
    const rect = stepsGrid.getBoundingClientRect();
    const viewH = window.innerHeight;

    // How far through the steps-grid the viewport center is
    const center = viewH / 2;
    const progress = (center - rect.top) / rect.height;
    const clamped = Math.max(0, Math.min(1, progress));

    fill.style.height = (clamped * 100) + '%';
  }

  window.addEventListener('scroll', updateTimeline, { passive: true });
  updateTimeline();
})();

// ─── 34. Animated Avatar Rings on Testimonials ───
// (Pure CSS — the animation is handled by the CSS added in style.css)

// ─── 35. Section Exploration Tracker ─────────────
(function() {
  const tracker = document.getElementById('exploreTracker');
  const countEl = document.getElementById('etCount');
  const ringFill = document.getElementById('etRingFill');
  if (!tracker || !countEl || !ringFill) return;

  const sectionIds = ['hero', 'features', 'how', 'compare', 'testimonials', 'pricing', 'faq'];
  const total = sectionIds.length;
  const explored = new Set();
  const circumference = 2 * Math.PI * 15.5; // r=15.5

  function updateTracker() {
    const count = explored.size;
    countEl.textContent = count + '/' + total;
    const offset = circumference * (1 - count / total);
    ringFill.style.strokeDashoffset = offset;

    tracker.classList.toggle('visible', window.scrollY > 200);
  }

  const expObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        explored.add(entry.target.id);
        updateTracker();
      }
    });
  }, { threshold: 0.3 });

  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) expObserver.observe(el);
  });

  window.addEventListener('scroll', () => {
    tracker.classList.toggle('visible', window.scrollY > 200);
  }, { passive: true });
})();

// ─── 36. Exit-Intent Popup ───────────────────────
(function() {
  const overlay = document.getElementById('exitIntentOverlay');
  if (!overlay) return;
  const closeBtn = document.getElementById('eimClose');
  const skipBtn = document.getElementById('eimSkip');
  const ctaBtn = document.getElementById('eimCta');

  let shown = false;

  function showPopup() {
    if (shown || localStorage.getItem('parentai_exit_dismissed')) return;
    // Don't show if user already signed up
    const wl = JSON.parse(localStorage.getItem('parentai_waitlist') || '[]');
    if (wl.length > 0) return;

    shown = true;
    overlay.classList.add('visible');
  }

  function hidePopup() {
    overlay.classList.remove('visible');
    localStorage.setItem('parentai_exit_dismissed', 'true');
  }

  // Desktop: mouse leaves viewport top
  document.addEventListener('mouseout', (e) => {
    if (e.clientY <= 0 && !e.relatedTarget) {
      showPopup();
    }
  });

  closeBtn?.addEventListener('click', hidePopup);
  skipBtn?.addEventListener('click', hidePopup);
  ctaBtn?.addEventListener('click', () => {
    hidePopup();
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Close on overlay click (not modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hidePopup();
  });
})();

// ─── 37. Feature Card Peek / Expand ──────────────
(function() {
  const cards = document.querySelectorAll('.feature-card');

  cards.forEach(card => {
    const bonus = card.querySelector('.feat-bonus');
    if (!bonus) return;

    // Add hint text
    const hint = document.createElement('div');
    hint.className = 'feat-expand-hint';
    hint.textContent = 'Click to learn more';
    card.appendChild(hint);

    card.addEventListener('click', (e) => {
      // Don't expand if clicking a link
      if (e.target.closest('a')) return;
      card.classList.toggle('expanded');
    });
  });
})();

// ─── 38. Reading Time Badge ──────────────────────
(function() {
  const badge = document.getElementById('readingTimeBadge');
  if (!badge) return;

  // Calculate reading time from page text (~200 wpm)
  const text = document.body.innerText;
  const words = text.split(/\s+/).length;
  const totalMinutes = Math.ceil(words / 200);
  badge.textContent = '~' + totalMinutes + ' min read';

  function updateBadge() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? scrollY / docHeight : 0;

    badge.classList.toggle('visible', scrollY > 100 && pct < 0.95);

    if (pct >= 0.95) {
      badge.textContent = '✓ Finished';
      badge.classList.add('done');
      badge.classList.add('visible');
    } else {
      const remaining = Math.max(1, Math.ceil(totalMinutes * (1 - pct)));
      badge.textContent = '~' + remaining + ' min left';
      badge.classList.remove('done');
    }
  }

  window.addEventListener('scroll', updateBadge, { passive: true });
})();

// ─── 39. Scroll-Zoom Section Entrance ────────────
(function() {
  const sections = document.querySelectorAll(
    '.features, .how-it-works, .ba-section, .testimonials-section, .compare-table-section, .pricing-section, .faq-section'
  );

  sections.forEach(s => s.classList.add('section-zoom'));

  const zoomObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('zoomed-in');
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -60px 0px' });

  sections.forEach(s => zoomObserver.observe(s));
})();

// ─── 40. Animated Mesh Gradient Hero ─────────────
// (Pure CSS — mesh blobs animate via CSS keyframes, no JS needed)