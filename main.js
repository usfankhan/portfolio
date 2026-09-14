/* ═══════════════════════════════════════════════════
   USFAN ALI KHAN — PORTFOLIO SCRIPTS
   File: js/main.js
   Sections:
     1. Theme Toggle
     2. Hamburger / Mobile Menu
     3. Scroll Reveal
     4. Web3Forms — Contact Form (async fetch)
═══════════════════════════════════════════════════ */

/* ══════════════════════════════════════
   1. THEME TOGGLE
══════════════════════════════════════ */
(function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const html   = document.documentElement;

  /* Apply saved preference immediately (avoids flash) */
  const saved = localStorage.getItem('uak-theme') || 'dark';
  html.setAttribute('data-theme', saved);

  toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('uak-theme', next);
  });
})();


/* ══════════════════════════════════════
   2. HAMBURGER / MOBILE MENU
══════════════════════════════════════ */
(function initMobileMenu() {
  const burger     = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
  });

  /* Close when clicking outside */
  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !mobileMenu.contains(e.target)) {
      closeMobile();
    }
  });

  /* Close on Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobile();
  });
})();

/* Exposed globally so inline onclick="closeMobile()" in HTML works */
function closeMobile() {
  const burger     = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  mobileMenu.classList.remove('open');
  burger.classList.remove('open');
}


/* ══════════════════════════════════════
   3. SCROLL REVEAL
══════════════════════════════════════ */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.10 });

  els.forEach(el => obs.observe(el));
})();


/* ══════════════════════════════════════
   4. WEB3FORMS — CONTACT FORM
   Docs: https://web3forms.com/
══════════════════════════════════════ */
(function initContactForm() {

  const form      = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('cfSubmit');
  const spinner   = document.getElementById('cfSpinner');
  const btnText   = document.getElementById('cfBtnText');
  const toast     = document.getElementById('cfToast');
  const toastIcon = document.getElementById('cfToastIcon');
  const toastMsg  = document.getElementById('cfToastMsg');

  /* ── Helpers ── */

  /** Show / hide the loading state on the button */
  function setLoading(loading) {
    submitBtn.disabled    = loading;
    spinner.style.display = loading ? 'block' : 'none';
    btnText.textContent   = loading ? 'Sending…' : 'Send message';
  }

  /** Display a toast message
   * @param {'ok'|'err'} type
   * @param {string} icon  emoji
   * @param {string} msg   message text
   * @param {number} [duration=6000] ms before auto-hide (0 = stay)
   */
  function showToast(type, icon, msg, duration = 6000) {
    toast.className       = 'cf-toast show ' + type;
    toastIcon.textContent = icon;
    toastMsg.textContent  = msg;

    if (duration > 0) {
      setTimeout(() => {
        toast.className = 'cf-toast';
      }, duration);
    }
  }

  /** Mark a field as error or ok */
  function markField(el, state) {
    el.classList.remove('field-err', 'field-ok');
    if (state) el.classList.add(state);
  }

  /** Basic client-side validation — returns true if all required fields pass */
  function validateForm() {
    let valid = true;

    const fields = form.querySelectorAll('[required]');
    fields.forEach(field => {
      const empty   = field.value.trim() === '';
      const badMail = field.type === 'email' && !empty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);

      if (empty || badMail) {
        markField(field, 'field-err');
        valid = false;
      } else {
        markField(field, 'field-ok');
      }
    });

    return valid;
  }

  /* Clear field state on user input */
  form.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', () => markField(el, null));
  });

  /* ── Submit handler ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    /* Hide any previous toast */
    toast.className = 'cf-toast';

    /* Client-side validation */
    if (!validateForm()) {
      showToast('err', '⚠️', 'Please fill in all required fields correctly.');
      return;
    }

    setLoading(true);

    /* Build FormData — Web3Forms reads it natively */
    const data = new FormData(form);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method : 'POST',
        body   : data,
        headers: { 'Accept': 'application/json' }
      });

      const json = await response.json();

      if (response.ok && json.success) {
        /* ── SUCCESS ── */
        showToast(
          'ok',
          '✅',
          'Message sent! I\'ll get back to you soon.',
          8000
        );
        form.reset();
        /* Clear all field states */
        form.querySelectorAll('input, textarea').forEach(el => markField(el, null));

      } else {
        /* ── API-level failure ── */
        const reason = json.message || 'Submission failed. Please try again.';
        showToast('err', '❌', reason, 0);
        console.error('Web3Forms error:', json);
      }

    } catch (networkErr) {
      /* ── Network / fetch error ── */
      showToast(
        'err',
        '🌐',
        'Network error — please check your connection and try again.',
        0
      );
      console.error('Fetch error:', networkErr);

    } finally {
      setLoading(false);
    }
  });

})();
