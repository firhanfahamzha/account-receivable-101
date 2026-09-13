/* ==========================================================
   MATERI — Slide navigation
   ========================================================== */
(function () {
  'use strict';
  const AR = window.AR;
  if (!AR) return;

  document.addEventListener('DOMContentLoaded', () => {
    AR.init({ particles: true });

    const slides = Array.from(document.querySelectorAll('.slide'));
    const total = slides.length;
    let current = 0;
    let busy = false;

    const dotsWrap = document.getElementById('dotsWrap');
    const counter = document.getElementById('counter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBar = document.getElementById('slideProgress');

    // Build dots
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'dot' + (i === 0 ? ' active' : '');
      b.setAttribute('aria-label', `Slide ${i + 1}`);
      b.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(b);
    });
    const dots = Array.from(dotsWrap.children);

    function updateUI() {
      slides.forEach((s, i) => {
        s.classList.toggle('active', i === current);
        s.classList.remove('exit-left', 'exit-right');
      });
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
      counter.textContent = `${current + 1} / ${total}`;
      const pct = ((current + 1) / total) * 100;
      progressBar.style.width = pct + '%';
    }

    function goTo(idx) {
      if (busy || idx === current || idx < 0 || idx >= total) return;
      busy = true;
      const dir = idx > current ? 'right' : 'left';
      slides[current].classList.add(dir === 'right' ? 'exit-left' : 'exit-right');
      slides[current].classList.remove('active');
      // Space whoosh SFX
      if (AR.space && AR.space.whoosh) AR.space.whoosh();
      setTimeout(() => {
        current = idx;
        updateUI();
        busy = false;
        // Mark done when reaching last slide
        if (current === total - 1 && !AR.progress.materi) {
          AR.markDone('materi');
          AR.unlockBadge('pembelajar', '📖', 'Pembelajar');
          AR.toast('📖 Materi selesai! Lanjut ke Workspace?', 'fa-circle-check', 3400);
        }
      }, 480);
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault(); goTo(current + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault(); goTo(current - 1);
      }
    });

    // Touch swipe
    let tx = 0, ty = 0;
    document.addEventListener('touchstart', (e) => {
      tx = e.changedTouches[0].screenX;
      ty = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - tx;
      const dy = e.changedTouches[0].screenY - ty;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
        if (dx < 0) goTo(current + 1); else goTo(current - 1);
      }
    }, { passive: true });

    // Topbar buttons (theme, sound, share)
    const themeBtn = document.querySelector('[data-action="theme"]');
    const soundBtn = document.querySelector('[data-action="sound"]');
    const shareBtn = document.querySelector('[data-action="share"]');

    if (themeBtn) {
      const upd = () => themeBtn.innerHTML = `<i class="fas ${document.body.classList.contains('dark') ? 'fa-sun' : 'fa-moon'}"></i>`;
      upd();
      themeBtn.addEventListener('click', () => { AR.toggleTheme(); upd(); AR.sound.play('click'); });
    }
    if (soundBtn) {
      const upd = () => {
        soundBtn.innerHTML = `<i class="fas ${AR.sound.isEnabled() ? 'fa-volume-high' : 'fa-volume-xmark'}"></i>`;
        soundBtn.classList.toggle('muted', !AR.sound.isEnabled());
      };
      upd();
      soundBtn.addEventListener('click', () => { AR.sound.toggle(); upd(); });
    }
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        AR.sound.play('click');
        AR.share('Account Receivable 101 · Materi', 'Belajar piutang & ECL dengan aksen luar angkasa!');
      });
    }

    // CTA button sound
    document.querySelector('[data-go-workspace]')?.addEventListener('click', () => {
      AR.sound.play('click');
    });

    updateUI();
  });
})();