/* ==========================================================
   MATERI — Slide nav + Simulator Jurnal + Modal Aging
   ========================================================== */
(function () {
  'use strict';
  const AR = window.AR;
  if (!AR) return;

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  document.addEventListener('DOMContentLoaded', () => {
    AR.init({ particles: true });

    /* ============ SLIDE NAV ============ */
    const slides = Array.from(document.querySelectorAll('.slide'));
    const total = slides.length;
    let current = 0;
    let busy = false;

    const dotsWrap = document.getElementById('dotsWrap');
    const counter = document.getElementById('counter');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressBar = document.getElementById('slideProgress');

    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'dot' + (i === 0 ? ' active' : '');
      b.setAttribute('aria-label', 'Slide ' + (i + 1));
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
      counter.textContent = (current + 1) + ' / ' + total;
      progressBar.style.width = ((current + 1) / total * 100) + '%';
    }

    function goTo(idx) {
      if (busy || idx === current || idx < 0 || idx >= total) return;
      busy = true;
      const dir = idx > current ? 'right' : 'left';
      slides[current].classList.add(dir === 'right' ? 'exit-left' : 'exit-right');
      slides[current].classList.remove('active');
      if (AR.space && AR.space.whoosh) AR.space.whoosh();
      setTimeout(() => {
        current = idx;
        updateUI();
        busy = false;
        if (current === total - 1 && !AR.progress.materi) {
          AR.markDone('materi');
          AR.unlockBadge('pembelajar', '📖', 'Pembelajar');
          AR.toast('📖 Materi selesai! Lanjut ke Workspace?', 'fa-circle-check', 3400);
        }
      }, 480);
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    document.addEventListener('keydown', (e) => {
      const modalEl = $('#modal-aging');
      if (modalEl && modalEl.classList.contains('active')) {
        if (e.key === 'Escape') closeModal();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goTo(current - 1);
      }
    });

    let tx = 0, ty = 0;
    document.addEventListener('touchstart', (e) => {
      tx = e.changedTouches[0].screenX;
      ty = e.changedTouches[0].screenY;
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - tx;
      const dy = e.changedTouches[0].screenY - ty;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
        if (dx < 0) goTo(current + 1);
        else goTo(current - 1);
      }
    }, { passive: true });

    /* ============ SIMULATOR JURNAL ============ */
    const CASES = {
      1: {
        sit: 'Perusahaan mengestimasi bahwa 5% dari total piutang usaha sebesar Rp 100.000.000 tidak akan tertagih. Manajemen memutuskan untuk membentuk <strong>cadangan kerugian piutang</strong> pada akhir periode.',
        wo: [{ note: 'Tidak ada jurnal — metode write off tidak membentuk cadangan di muka.' }],
        al: [
          { side: 'dr', acc: 'Beban Kerugian Piutang', amt: 'Rp 5.000.000' },
          { side: 'cr', acc: 'Cadangan Kerugian Piutang', amt: 'Rp 5.000.000', indent: true }
        ]
      },
      2: {
        sit: 'Pelanggan pailit dan utangnya sebesar Rp 3.000.000 <strong>dihapus</strong> dari pembukuan.',
        wo: [
          { side: 'dr', acc: 'Beban Kerugian Piutang', amt: 'Rp 3.000.000' },
          { side: 'cr', acc: 'Piutang Usaha', amt: 'Rp 3.000.000', indent: true }
        ],
        al: [
          { side: 'dr', acc: 'Cadangan Kerugian Piutang', amt: 'Rp 3.000.000' },
          { side: 'cr', acc: 'Piutang Usaha', amt: 'Rp 3.000.000', indent: true }
        ]
      },
      3: {
        sit: 'Piutang Rp 2.000.000 yang telah dihapus, kini <strong>dikonfirmasi</strong> akan dibayar.',
        wo: [
          { side: 'dr', acc: 'Piutang Usaha', amt: 'Rp 2.000.000' },
          { side: 'cr', acc: 'Beban Kerugian Piutang', amt: 'Rp 2.000.000', indent: true }
        ],
        al: [
          { side: 'dr', acc: 'Piutang Usaha', amt: 'Rp 2.000.000' },
          { side: 'cr', acc: 'Cadangan Kerugian Piutang', amt: 'Rp 2.000.000', indent: true }
        ]
      },
      4: {
        sit: 'Setelah konfirmasi (kasus #3), perusahaan <strong>menerima kas</strong> Rp 2.000.000 pada periode yang sama.',
        wo: [
          { side: 'dr', acc: 'Kas / Bank', amt: 'Rp 2.000.000' },
          { side: 'cr', acc: 'Piutang Usaha', amt: 'Rp 2.000.000', indent: true }
        ],
        al: [
          { side: 'dr', acc: 'Kas / Bank', amt: 'Rp 2.000.000' },
          { side: 'cr', acc: 'Piutang Usaha', amt: 'Rp 2.000.000', indent: true }
        ]
      },
      5: {
        sit: 'Piutang Rp 1.500.000 yang telah dihapus, <strong>langsung dibayar</strong> di periode yang sama tanpa jurnal konfirmasi.',
        wo: [
          { side: 'dr', acc: 'Kas / Bank', amt: 'Rp 1.500.000' },
          { side: 'cr', acc: 'Beban Kerugian Piutang', amt: 'Rp 1.500.000', indent: true }
        ],
        al: [
          { side: 'dr', acc: 'Kas / Bank', amt: 'Rp 1.500.000' },
          { side: 'cr', acc: 'Cadangan Kerugian Piutang', amt: 'Rp 1.500.000', indent: true }
        ]
      },
      6: {
        sit: 'Piutang Rp 2.500.000 yang dihapus <span style="color:var(--amber);font-weight:700">periode lalu</span>, <strong>langsung dibayar</strong> saat ini tanpa konfirmasi.',
        wo: [
          { side: 'dr', acc: 'Kas / Bank', amt: 'Rp 2.500.000' },
          { side: 'cr', acc: 'Pendapatan Lain-lain', amt: 'Rp 2.500.000', indent: true },
          { note: 'Beda periode → masuk pendapatan lain-lain' }
        ],
        al: [
          { side: 'dr', acc: 'Kas / Bank', amt: 'Rp 2.500.000' },
          { side: 'cr', acc: 'Cadangan Kerugian Piutang', amt: 'Rp 2.500.000', indent: true }
        ]
      }
    };

    function renderJournal(container, entries) {
      if (!container) return;
      if (!entries || entries.length === 0) {
        container.innerHTML = '<div class="jr-empty">— Tidak ada jurnal —</div>';
        return;
      }
      let html = '<div class="jr-entry">';
      entries.forEach(e => {
        if (e.note) {
          html += '<div class="jr-note">* ' + e.note + '</div>';
        } else {
          const acc = e.acc + (e.amt ? ' ......... ' + e.amt : '');
          html += '<div class="jr-row">' +
            '<span class="side ' + e.side + '">' + e.side.toUpperCase() + '</span>' +
            '<span class="acc ' + (e.indent ? 'indent' : '') + '">' + acc + '</span>' +
            '</div>';
        }
      });
      html += '</div>';
      container.innerHTML = html;
    }

    function updateSimulator(caseId) {
      const c = CASES[caseId];
      if (!c) return;
      const sitTxt = $('#sim-sit-txt');
      if (sitTxt) sitTxt.innerHTML = c.sit;
      renderJournal($('#sim-wo'), c.wo);
      renderJournal($('#sim-al'), c.al);
    }

    const simSelect = $('#sim-select');
    if (simSelect) {
      simSelect.addEventListener('change', function () {
        AR.sound.play('click');
        updateSimulator(parseInt(this.value, 10));
      });
      updateSimulator(1);
    }

    /* ============ MODAL AGING ============ */
    const modal = $('#modal-aging');
    const rowAging = $('#row-aging');
    const modalClose = $('#modal-close');

    function openModal() {
      if (!modal) return;
      modal.classList.add('active');
      AR.sound.play('success');
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      if (!modal) return;
      modal.classList.remove('active');
      AR.sound.play('click');
      document.body.style.overflow = '';
    }

    if (rowAging) {
      rowAging.addEventListener('click', openModal);
      rowAging.style.cursor = 'pointer';
    }
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    /* ============ TOPBAR ============ */
    const themeBtn = $('[data-action="theme"]');
    const soundBtn = $('[data-action="sound"]');
    const shareBtn = $('[data-action="share"]');

    if (themeBtn) {
      const upd = () => themeBtn.innerHTML = '<i class="fas ' + (document.body.classList.contains('dark') ? 'fa-sun' : 'fa-moon') + '"></i>';
      upd();
      themeBtn.addEventListener('click', () => { AR.toggleTheme(); upd(); AR.sound.play('click'); });
    }
    if (soundBtn) {
      const upd = () => {
        soundBtn.innerHTML = '<i class="fas ' + (AR.sound.isEnabled() ? 'fa-volume-high' : 'fa-volume-xmark') + '"></i>';
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

    const goWs = document.querySelector('[data-go-workspace]');
    if (goWs) goWs.addEventListener('click', () => AR.sound.play('click'));

    updateUI();
  });
})();
