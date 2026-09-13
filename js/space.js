/* ==========================================================
   SPACE — Starfield + Ambient Music (Web Audio API)
   Auto-inject toggle button. No external files needed.
   ========================================================== */
(function () {
  'use strict';
  const AR = window.AR;
  if (!AR) { console.warn('[space] AR core belum siap'); return; }

  /* ============ STARFIELD ============ */
  function initStarfield() {
    if (document.getElementById('stars')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'stars';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, stars = [], shooters = [];

    function resize() {
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      buildStars();
    }
    function buildStars() {
      const count = Math.min(220, Math.floor((window.innerWidth * window.innerHeight) / 5500));
      stars = [];
      for (let i = 0; i < count; i++) {
        const r = (Math.random() * 1.1 + 0.3) * dpr;
        stars.push({
          x: Math.random() * w, y: Math.random() * h, r,
          baseAlpha: Math.random() * 0.6 + 0.25,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.0008 + Math.random() * 0.0018,
          vx: (Math.random() - 0.5) * 0.015 * dpr,
          vy: (Math.random() - 0.5) * 0.015 * dpr,
          hue: Math.random() < 0.85 ? 'white' : (Math.random() < 0.5 ? 'violet' : 'cyan')
        });
      }
    }
    window.addEventListener('resize', resize);
    resize();

    function spawnShooter() {
      const speed = (5 + Math.random() * 3) * dpr;
      const angle = Math.PI / 6;
      shooters.push({
        x: Math.random() * w * 0.7,
        y: Math.random() * h * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        len: 14 + Math.random() * 8,
        life: 1
      });
    }

    function loop(now) {
      ctx.clearRect(0, 0, w, h);
      const isDark = document.body.classList.contains('dark');
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x += w; else if (s.x > w) s.x -= w;
        if (s.y < 0) s.y += h; else if (s.y > h) s.y -= h;
        const tw = 0.55 + 0.45 * Math.sin(now * s.twinkleSpeed + s.phase);
        const a = s.baseAlpha * tw * (isDark ? 1 : 0.5);
        let color;
        if (s.hue === 'white') color = `rgba(255,255,255,${a})`;
        else if (s.hue === 'violet') color = `rgba(167,139,250,${a})`;
        else color = `rgba(34,211,238,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        if (s.r > 1.2 * dpr) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = color.replace(/[\d.]+\)$/, (a * 0.12) + ')');
          ctx.fill();
        }
      }
      if (Math.random() < 0.0015) spawnShooter();
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.012;
        if (sh.life <= 0 || sh.x > w + 100 || sh.y > h + 100) { shooters.splice(i, 1); continue; }
        const tailX = sh.x - sh.vx * sh.len;
        const tailY = sh.y - sh.vy * sh.len;
        const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${sh.life})`);
        grad.addColorStop(0.4, `rgba(167,139,250,${sh.life * 0.5})`);
        grad.addColorStop(1, 'rgba(124,58,237,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 * dpr;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sh.x, sh.y, 1.6 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${sh.life})`;
        ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ============ AMBIENT SPACE MUSIC ============ */
  let audioCtx = null;
  let masterGain = null;
  let droneOscs = [];
  let arpeggioTimer = null;
  let musicOn = false;
  let musicStarting = false;

  const PENTATONIC = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];

  function ensureCtx() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function startMusic() {
    if (musicStarting || musicOn) return;
    musicStarting = true;
    const ctx = ensureCtx();
    if (!ctx) { musicStarting = false; return; }

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.085, ctx.currentTime + 3.5);
    masterGain.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    filter.Q.value = 1.2;
    filter.connect(masterGain);

    // Deep drone oscillators
    const freqs = [55, 82.41, 110, 164.81];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i < 2 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      osc.detune.value = (Math.random() - 0.5) * 10;
      const g = ctx.createGain();
      g.gain.value = i < 2 ? 0.32 : 0.10;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      droneOscs.push(osc);
    });

    // Slow filter LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.06;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 260;
    lfo.connect(lfoG);
    lfoG.connect(filter.frequency);
    lfo.start();
    droneOscs.push(lfo);

    // Slow breathing on master gain
    const breath = ctx.createOscillator();
    breath.frequency.value = 0.035;
    const breathG = ctx.createGain();
    breathG.gain.value = 0.02;
    breath.connect(breathG);
    breathG.connect(masterGain.gain);
    breath.start();
    droneOscs.push(breath);

    musicOn = true;
    musicStarting = false;
    scheduleArpeggio();
  }

  function scheduleArpeggio() {
    if (!musicOn) return;
    const delay = 2600 + Math.random() * 5200;
    arpeggioTimer = setTimeout(() => {
      if (!musicOn) return;
      playNote();
      if (Math.random() < 0.55) {
        setTimeout(() => musicOn && playNote(), 380 + Math.random() * 300);
        if (Math.random() < 0.45) {
          setTimeout(() => musicOn && playNote(), 1050 + Math.random() * 500);
        }
      }
      scheduleArpeggio();
    }, delay);
  }

  function playNote() {
    const ctx = audioCtx;
    if (!ctx || !masterGain) return;
    const freq = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
    const osc = ctx.createOscillator();
    osc.type = Math.random() < 0.55 ? 'sine' : 'triangle';
    osc.frequency.value = freq;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.2);

    const delay = ctx.createDelay();
    delay.delayTime.value = 0.36;
    const fb = ctx.createGain();
    fb.gain.value = 0.36;
    const wet = ctx.createGain();
    wet.gain.value = 0.45;

    osc.connect(g);
    g.connect(masterGain);
    g.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 3.4);
  }

  function stopMusic() {
    musicOn = false;
    if (arpeggioTimer) { clearTimeout(arpeggioTimer); arpeggioTimer = null; }
    if (masterGain && audioCtx) {
      const t = audioCtx.currentTime;
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      const toStop = droneOscs.slice();
      setTimeout(() => {
        toStop.forEach(o => { try { o.stop(); } catch (e) {} });
        droneOscs = [];
        masterGain = null;
      }, 1500);
    }
  }

  function toggleMusic() {
    if (musicOn) {
      stopMusic();
      AR.storage.set('music', false);
      AR.toast('Musik luar angkasa: OFF', 'fa-volume-xmark');
    } else {
      startMusic();
      AR.storage.set('music', true);
      AR.toast('Musik luar angkasa: ON 🎵', 'fa-music');
    }
    updateMusicIcon();
  }

  function updateMusicIcon() {
    const btn = document.querySelector('[data-action="music"]');
    if (!btn) return;
    btn.classList.toggle('active', musicOn);
    btn.title = musicOn ? 'Matikan musik' : 'Nyalakan musik';
    const icon = btn.querySelector('i');
    if (icon) icon.className = musicOn ? 'fas fa-music' : 'fas fa-music';
  }

  /* ============ SPACE SFX ============ */
  AR.space = {
    whoosh() {
      const ctx = ensureCtx();
      if (!ctx) return;
      const dur = 0.42;
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(220, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + dur);
      filter.Q.value = 2.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      src.start();
      src.stop(ctx.currentTime + dur + 0.05);
    },
    warp() {
      const ctx = ensureCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      osc.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    },
    isPlaying: () => musicOn
  };

  /* ============ AUTO-INJECT BUTTON ============ */
  function injectMusicButton() {
    const actions = document.querySelector('.topbar-actions');
    if (!actions || actions.querySelector('[data-action="music"]')) return;
    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.dataset.action = 'music';
    btn.title = 'Musik Luar Angkasa';
    btn.innerHTML = '<i class="fas fa-music"></i>';
    actions.insertBefore(btn, actions.firstChild);
    btn.addEventListener('click', toggleMusic);
  }

  /* ============ AUTO-START IF USER ENABLED BEFORE ============ */
  function autoStartIfEnabled() {
    const saved = AR.storage.get('music', null);
    if (saved === true) {
      const kickoff = () => {
        if (!musicOn) startMusic();
        updateMusicIcon();
        window.removeEventListener('click', kickoff);
        window.removeEventListener('keydown', kickoff);
        window.removeEventListener('touchstart', kickoff);
      };
      window.addEventListener('click', kickoff, { once: true });
      window.addEventListener('keydown', kickoff, { once: true });
      window.addEventListener('touchstart', kickoff, { once: true });
    }
  }

  /* ============ INIT ============ */
  document.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    injectMusicButton();
    autoStartIfEnabled();
  });

  // Expose init for pages that dynamically add stars
  AR.initSpace = function () {
    initStarfield();
    injectMusicButton();
  };

})();