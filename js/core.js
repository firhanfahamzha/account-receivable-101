/* ==========================================================
   CORE — Sound, Storage, Theme, Toast, Cursor, Particles, Haptic
   Account Receivable 101 · Firhan Fahamzha · ATC 2026
   ========================================================== */
(function (window) {
  'use strict';

  const AR = window.AR = window.AR || {};

  /* ============ STORAGE ============ */
  const STORAGE = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem('ar101_' + key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem('ar101_' + key, JSON.stringify(val)); } catch (e) {}
    },
    remove(key) {
      try { localStorage.removeItem('ar101_' + key); } catch (e) {}
    }
  };
  AR.storage = STORAGE;

  /* ============ PROGRESS ============ */
  const defaultProgress = {
    materi: false,
    workspace: false,
    kuis: false,
    tantangan: false,
    quizScore: 0,
    badges: []
  };
  AR.progress = Object.assign({}, defaultProgress, STORAGE.get('progress', {}));

  AR.saveProgress = function () { STORAGE.set('progress', AR.progress); };

  AR.markDone = function (key) {
    if (AR.progress[key] !== true) {
      AR.progress[key] = true;
      AR.saveProgress();
    }
  };

  AR.unlockBadge = function (badgeId, badgeEmoji, badgeName) {
    if (!AR.progress.badges.includes(badgeId)) {
      AR.progress.badges.push(badgeId);
      AR.saveProgress();
      if (badgeEmoji) {
        AR.toast(`${badgeEmoji} Badge terbuka: ${badgeName || badgeId}`);
        AR.sound.play('success');
      }
    }
  };

  /* ============ USER ============ */
  AR.user = STORAGE.get('user', { name: '', role: 'Staf AR' });
  AR.saveUser = function () { STORAGE.set('user', AR.user); };

  /* ============ THEME ============ */
  AR.initTheme = function () {
    const stored = STORAGE.get('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    document.body.classList.toggle('dark', isDark);
    return isDark;
  };
  AR.toggleTheme = function () {
    const isDark = document.body.classList.toggle('dark');
    STORAGE.set('theme', isDark ? 'dark' : 'light');
    return isDark;
  };

  /* ============ AUDIO CONTEXT ============ */
  let audioCtx = null;
  let soundEnabled = STORAGE.get('sound', true);

  function ensureCtx() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function beep(freq, duration, type = 'sine', vol = 0.08, when = 0) {
    if (!soundEnabled) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime + when;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  /* ============ HAPTIC / VIBRATE ============ */
  AR.vibrate = function (pattern) {
    if (!('vibrate' in navigator)) return;
    if (STORAGE.get('haptic', true) === false) return;
    try { navigator.vibrate(pattern); } catch (e) {}
  };
  AR.setHaptic = function (enabled) {
    STORAGE.set('haptic', !!enabled);
  };
  AR.isHapticEnabled = function () {
    return STORAGE.get('haptic', true) !== false;
  };

  /* ============ SOUND ============ */
  AR.sound = {
    play(type) {
      switch (type) {
        case 'click':
          beep(660, 0.08, 'sine', 0.05);
          AR.vibrate(15);
          break;
        case 'hover':
          beep(880, 0.04, 'sine', 0.02);
          break;
        case 'correct':
          beep(523, 0.12, 'sine', 0.08);
          beep(659, 0.12, 'sine', 0.08, 0.08);
          beep(784, 0.18, 'sine', 0.08, 0.16);
          AR.vibrate([40, 30, 40]);
          break;
        case 'wrong':
          beep(220, 0.18, 'sawtooth', 0.07);
          beep(180, 0.22, 'sawtooth', 0.06, 0.1);
          AR.vibrate([100, 50, 100, 50, 200]);
          break;
        case 'success':
          beep(523, 0.1, 'triangle', 0.09);
          beep(659, 0.1, 'triangle', 0.09, 0.1);
          beep(784, 0.1, 'triangle', 0.09, 0.2);
          beep(1047, 0.3, 'triangle', 0.1, 0.3);
          AR.vibrate([30, 20, 30, 20, 80]);
          break;
        case 'jingle':
          [523, 659, 784, 1047, 1319].forEach((f, i) =>
            beep(f, 0.22, 'triangle', 0.09, i * 0.13));
          AR.vibrate([50, 40, 50, 40, 50, 40, 150]);
          break;
        case 'drop':
          beep(440, 0.06, 'square', 0.06);
          AR.vibrate(25);
          break;
        case 'warn':
          beep(330, 0.1, 'square', 0.06);
          beep(280, 0.12, 'square', 0.06, 0.08);
          AR.vibrate([60, 40, 60]);
          break;
        case 'alert':
          beep(220, 0.2, 'sawtooth', 0.08);
          beep(180, 0.28, 'sawtooth', 0.08, 0.12);
          AR.vibrate([150, 80, 150, 80, 200]);
          break;
        default:
          beep(660, 0.08, 'sine', 0.05);
      }
    },
    isEnabled: () => soundEnabled,
    setEnabled(v) {
      soundEnabled = v;
      STORAGE.set('sound', v);
      if (v) AR.sound.play('click');
    },
    toggle() {
      soundEnabled = !soundEnabled;
      STORAGE.set('sound', soundEnabled);
      if (soundEnabled) AR.sound.play('click');
      return soundEnabled;
    }
  };

  // Unlock audio context on first interaction
  ['click', 'keydown', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, () => ensureCtx(), { once: true, passive: true })
  );

  /* ============ TOAST ============ */
  let toastTimer = null;
  AR.toast = function (message, icon = 'fa-circle-check', duration = 2600) {
    let el = document.getElementById('ar-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ar-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  };

  /* ============ RIPPLE ============ */
  AR.attachRipple = function (selector = '.btn') {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest(selector);
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  };

  /* ============ CURSOR ============ */
  AR.initCursor = function () {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add('has-custom-cursor');

    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });

    (function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, .mission-card, .btn, input, select')) {
        ring.classList.add('hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, .mission-card, .btn, input, select')) {
        ring.classList.remove('hover');
      }
    });
  };

  /* ============ SCROLL PROGRESS ============ */
  AR.initScrollProgress = function () {
    const bar = document.querySelector('.scroll-bar');
    if (!bar) return;
    const update = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  };

  /* ============ TOPBAR SCROLL ============ */
  AR.initTopbarScroll = function () {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    const update = () => topbar.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', update, { passive: true });
    update();
  };

  /* ============ REVEAL ============ */
  AR.initReveal = function () {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  };

  /* ============ PARTICLES ============ */
  AR.initParticles = function (canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    const count = window.innerWidth < 700 ? 30 : 60;
    const mouse = { x: -1000, y: -1000 };

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8
      });
    }
    document.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });

    function loop() {
      ctx.clearRect(0, 0, w, h);
      const isDark = document.body.classList.contains('dark');
      const dotColor = isDark ? 'rgba(167, 139, 250, 0.55)' : 'rgba(124, 58, 237, 0.55)';
      const lineColor = isDark ? 'rgba(167, 139, 250, 0.10)' : 'rgba(124, 58, 237, 0.10)';

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        const mdx = particles[i].x - mouse.x;
        const mdy = particles[i].y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 160) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = isDark ? 'rgba(34, 211, 238, 0.18)' : 'rgba(6, 182, 212, 0.18)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      requestAnimationFrame(loop);
    }
    loop();
  };

  /* ============ SHARE ============ */
  AR.share = async function (title, text, url) {
    const shareData = { title, text, url: url || window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return true;
      } else {
        await navigator.clipboard.writeText(`${text}\n${shareData.url}`);
        AR.toast('Link disalin ke clipboard!', 'fa-link');
        return true;
      }
    } catch (e) { return false; }
  };

  /* ============ LOADER ============ */
  AR.initLoader = function () {
    const loader = document.querySelector('.loader');
    if (!loader) return;
    const fill = loader.querySelector('.loader-bar-fill');
    const txt = loader.querySelector('.loader-text');
    const steps = ['Memuat aset...', 'Menyiapkan workspace...', 'Siap!'];
    let pct = 0, stepIdx = 0;
    const int = setInterval(() => {
      pct += Math.random() * 18 + 6;
      if (pct > 100) pct = 100;
      if (fill) fill.style.width = pct + '%';
      if (txt && stepIdx < steps.length - 1 && pct > (stepIdx + 1) * 33) {
        stepIdx++;
        txt.textContent = steps[stepIdx];
      }
      if (pct >= 100) {
        clearInterval(int);
        setTimeout(() => {
          loader.classList.add('hide');
          document.dispatchEvent(new CustomEvent('ar:loaded'));
        }, 400);
      }
    }, 180);
  };

  /* ============ INIT ============ */
  AR.init = function (opts = {}) {
    AR.initTheme();
    AR.initLoader();
    AR.initCursor();
    AR.initScrollProgress();
    AR.initTopbarScroll();
    AR.attachRipple();
    if (opts.particles !== false) AR.initParticles('particles');
    AR.initReveal();
  };

})(window);
