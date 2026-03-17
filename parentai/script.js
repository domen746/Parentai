// ─── Live Waitlist Counter ────────────────────────
// Simulates a real-time counter. In production, replace
// fetchCount() with a real API call to your backend.

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

  // Success — simulate signup
  const originalText = btn.textContent;
  btn.textContent = '✓ You\'re on the list!';
  btn.style.background = '#bfdbfe';
  btn.style.color = '#1e40af';
  btn.disabled = true;
  input.disabled = true;

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

  console.log('Waitlist signup:', email);

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