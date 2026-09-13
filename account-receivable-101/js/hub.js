/* ==========================================================
   HUB — Landing page behaviour
   ========================================================== */
(function () {
  'use strict';
  const AR = window.AR;

  /* ============ TYPING EFFECT ============ */
  function initTyping() {
    const el = document.querySelector('.hero-typing .typed');
    if (!el) return;
    const phrases = [
      'Piutang Usaha.',
      'Piutang Wesel.',
      'Cadangan Kerugian.',
      'Nilai Realisasi Bersih.',
      'Expected Credit Loss.'
    ];
    let pIdx = 0, cIdx = 0, deleting = false;
    const type = () => {
      const word = phrases[pIdx];
      if (!deleting) {
        cIdx++;
        el.textContent = word.slice(0, cIdx);
        if (cIdx === word.length) {
          deleting = true;
          setTimeout(type, 1400);
          return;
        }
        setTimeout(type, 60 + Math.random() * 40);
      } else {
        cIdx--;
        el.textContent = word.slice(0, cIdx);
        if (cIdx === 0) {
          deleting = false;
          pIdx = (pIdx + 1) % phrases.length;
        }
        setTimeout(type, 35);
      }
    };
    setTimeout(type, 700);
  }

  /* ============ STAT COUNTER ============ */
  function initStats() {
    const els = document.querySelectorAll('.stat-num[data-target]');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals || '0');
        let start = 0;
        const duration = 1400;
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min((t - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = start + (target - start) * eased;
          el.textContent = val.toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
  }

  /* ============ MISSION STATE ============ */
  function updateMissionStates() {
    const map = {
      materi: 'materi',
      workspace: 'workspace',
      kuis: 'kuis',
      tantangan: 'tantangan'
    };
    Object.keys(map).forEach(key => {
      const card = document.querySelector(`[data-mission="${key}"]`);
      if (!card) return;
      const statusEl = card.querySelector('.mission-status');
      if (AR.progress[key]) {
        statusEl.textContent = '✓ Selesai';
        statusEl.classList.add('done');
      } else {
        statusEl.textContent = 'Belum dimulai';
        statusEl.classList.remove('done');
      }
    });

    // Sertifikat unlocked kalau semua 4 misi selesai
    const allDone = AR.progress.materi && AR.progress.workspace && AR.progress.kuis && AR.progress.tantangan;
    const certCard = document.querySelector('[data-mission="sertifikat"]');
    if (certCard) {
      certCard.classList.toggle('locked', !allDone);
      certCard.querySelector('.mission-status').textContent = allDone ? '✓ Siap dicetak' : '🔒 Terkunci';
    }
  }

  /* ============ BADGES ============ */
  const BADGES = [
    { id: 'pembelajar', emoji: '📖', name: 'Pembelajar', desc: 'Selesai membaca materi' },
    { id: 'auditor', emoji: '💼', name: 'Auditor Muda', desc: 'Selesai workspace roleplay' },
    { id: 'ahli_ecl', emoji: '🎯', name: 'Ahli ECL', desc: 'Skor kuis ≥ 70' },
    { id: 'sprinter', emoji: '⚡', name: 'Sprinter Jurnal', desc: 'Selesai tantangan' },
    { id: 'master', emoji: '🏅', name: 'Master Piutang', desc: 'Semua misi selesai' }
  ];

  function renderBadges() {
    const grid = document.querySelector('.badge-grid');
    if (!grid) return;
    grid.innerHTML = BADGES.map(b => {
      const unlocked = AR.progress.badges.includes(b.id);
      return `
        <div class="badge-card ${unlocked ? 'unlocked' : ''}">
          <span class="badge-emoji">${b.emoji}</span>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div>
        </div>
      `;
    }).join('');
  }

  /* ============ PROGRESS RING ============ */
  function updateProgress() {
    const steps = ['materi', 'workspace', 'kuis', 'tantangan'];
    const done = steps.filter(s => AR.progress[s]).length;
    const pct = Math.round((done / steps.length) * 100);

    // Ring
    const ring = document.querySelector('.ring-fill');
    if (ring) {
      const r = 65;
      const circumference = 2 * Math.PI * r;
      ring.style.strokeDasharray = circumference;
      ring.style.strokeDashoffset = circumference;
      requestAnimationFrame(() => {
        ring.style.strokeDashoffset = circumference - (pct / 100) * circumference;
      });
    }
    const pctText = document.querySelector('.ring-pct');
    if (pctText) pctText.textContent = pct + '%';

    // Step chips
    document.querySelectorAll('.step-chip[data-step]').forEach(chip => {
      const step = chip.dataset.step;
      chip.classList.toggle('done', !!AR.progress[step]);
      const icon = chip.querySelector('i');
      if (icon) icon.className = AR.progress[step] ? 'fas fa-check-circle' : 'far fa-circle';
    });
  }

  /* ============ MISSION CLICK ============ */
  function initMissionClicks() {
    document.querySelectorAll('.mission-card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('locked')) {
          AR.toast('Selesaikan misi sebelumnya dulu ya!', 'fa-lock');
          AR.sound.play('wrong');
          return;
        }
        const url = card.dataset.url;
        if (!url) return;
        AR.sound.play('click');
        window.location.href = url;
      });
    });
  }

  /* ============ TOPBAR BUTTONS ============ */
  function initTopbarButtons() {
    const themeBtn = document.querySelector('[data-action="theme"]');
    const soundBtn = document.querySelector('[data-action="sound"]');
    const shareBtn = document.querySelector('[data-action="share"]');

    if (themeBtn) {
      const updateIcon = () => {
        const dark = document.body.classList.contains('dark');
        themeBtn.innerHTML = `<i class="fas ${dark ? 'fa-sun' : 'fa-moon'}"></i>`;
      };
      updateIcon();
      themeBtn.addEventListener('click', () => {
        AR.toggleTheme();
        updateIcon();
        AR.sound.play('click');
      });
    }

    if (soundBtn) {
      const updateIcon = () => {
        soundBtn.innerHTML = `<i class="fas ${AR.sound.isEnabled() ? 'fa-volume-high' : 'fa-volume-xmark'}"></i>`;
        soundBtn.classList.toggle('muted', !AR.sound.isEnabled());
      };
      updateIcon();
      soundBtn.addEventListener('click', () => {
        AR.sound.toggle();
        updateIcon();
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        AR.sound.play('click');
        AR.share(
          'Account Receivable 101',
          'Belajar siklus piutang & ECL lewat roleplay interaktif bareng Firhan Fahamzha (ATC 2026)!'
        );
      });
    }
  }

  /* ============ INIT ============ */
  document.addEventListener('DOMContentLoaded', () => {
    AR.init({ particles: true });
    initTyping();
    initStats();
    updateMissionStates();
    renderBadges();
    updateProgress();
    initMissionClicks();
    initTopbarButtons();

    // Refresh progress tiap balik ke tab
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        updateMissionStates();
        renderBadges();
        updateProgress();
      }
    });
  });

})();