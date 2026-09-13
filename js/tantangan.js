/* ==========================================================
   TANTANGAN — Sortir Cepat + Jurnal Rush (FIXED)
   ========================================================== */
(function () {
  'use strict';
  const AR = window.AR;
  if (!AR) return;

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const state = {
    sortirDone: false,
    sortirBest: AR.storage.get('sortir_best', 0),
    jrDone: false,
    jrBest: AR.storage.get('jr_best', 0)
  };

  function confettiBurst(count = 40) {
    const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.top = '-20px';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      el.style.borderRadius = Math.random() < 0.5 ? '50%' : '2px';
      el.style.animationDelay = Math.random() * 0.4 + 's';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    }
  }

  function initTabs() {
    $$('.game-tab').forEach(t => {
      t.addEventListener('click', () => {
        AR.sound.play('click');
        const id = t.dataset.game;
        $$('.game-tab').forEach(x => x.classList.toggle('active', x === t));
        $$('.game-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === id));
      });
    });
  }

  function refreshTabBadges() {
    if (state.sortirDone) {
      const t = $('.game-tab[data-game="sortir"]');
      if (t && !t.querySelector('.badge-done')) {
        const b = document.createElement('span');
        b.className = 'badge-done';
        b.textContent = '✓';
        t.appendChild(b);
      }
    }
    if (state.jrDone) {
      const t = $('.game-tab[data-game="jr"]');
      if (t && !t.querySelector('.badge-done')) {
        const b = document.createElement('span');
        b.className = 'badge-done';
        b.textContent = '✓';
        t.appendChild(b);
      }
    }
    if (state.sortirDone && state.jrDone) {
      if (!AR.progress.tantangan) {
        AR.markDone('tantangan');
        AR.unlockBadge('sprinter', '⚡', 'Sprinter Jurnal');
        AR.sound.play('jingle');
        confettiBurst(90);
      }
    }
  }

  /* ============================================================
     GAME 1 — SORTIR CEPAT
     ============================================================ */
  const TAGIHAN = [
    { text: 'Penjualan kredit ke Toko Alfa', cat: 'usaha' },
    { text: 'Promes berbunga dari PT Abadi', cat: 'wesel' },
    { text: 'Pinjaman karyawan gudang', cat: 'lain' },
    { text: 'Penjualan barang ke CV Beta', cat: 'usaha' },
    { text: 'Wesel 10% jatuh tempo 3 bulan', cat: 'wesel' },
    { text: 'Uang muka beli supplies', cat: 'lain' },
    { text: 'Faktur penjualan #INV-221', cat: 'usaha' },
    { text: 'Klaim asuransi karyawan', cat: 'lain' },
    { text: 'Piutang dari distributor Gamma', cat: 'usaha' },
    { text: 'Surat janji bayar UD Delta', cat: 'wesel' }
  ];
  const GAME1_TIME = 60;

  let g1Timer = null;
  let g1TimeLeft = GAME1_TIME;
  let g1Score = 0;
  let g1Correct = 0;
  let g1Wrong = 0;
  let g1Remaining = [];

  function renderGame1Intro() {
    $('#game-sortir-stage').innerHTML = `
      <div class="game-head">
        <h2>⚡ Sortir Cepat</h2>
        <p>Drag kartu tagihan ke kolom yang tepat. Waktu 60 detik. Skor +10 benar, −5 salah. Kejar skor tertinggimu!</p>
      </div>
      <div class="game-stats">
        <div class="stat-box">
          <div class="val" id="g1-time">${GAME1_TIME}</div>
          <div class="lbl">Detik</div>
        </div>
        <div class="stat-box success">
          <div class="val" id="g1-score">0</div>
          <div class="lbl">Skor</div>
        </div>
        <div class="stat-box">
          <div class="val" id="g1-best">${state.sortirBest}</div>
          <div class="lbl">Best</div>
        </div>
      </div>
      <div style="text-align:center;margin:26px 0">
        <button class="btn btn-primary" id="g1-start" style="padding:14px 34px;font-size:1rem">
          <i class="fas fa-play"></i> Mulai Main
        </button>
      </div>
    `;
    $('#g1-start').addEventListener('click', () => {
      AR.sound.play('click');
      startGame1();
    });
  }

  function startGame1() {
    g1TimeLeft = GAME1_TIME;
    g1Score = 0;
    g1Correct = 0;
    g1Wrong = 0;
    g1Remaining = TAGIHAN.slice().sort(() => Math.random() - 0.5);

    $('#game-sortir-stage').innerHTML = `
      <div class="game-head">
        <h2>⚡ Sortir Cepat</h2>
        <p>Drag kartu ke kolom klasifikasi yang tepat!</p>
      </div>
      <div class="game-stats">
        <div class="stat-box">
          <div class="val" id="g1-time">${g1TimeLeft}</div>
          <div class="lbl">Detik</div>
        </div>
        <div class="stat-box success">
          <div class="val" id="g1-score">0</div>
          <div class="lbl">Skor</div>
        </div>
        <div class="stat-box" id="g1-remain-box">
          <div class="val" id="g1-remain">${g1Remaining.length}</div>
          <div class="lbl">Sisa Kartu</div>
        </div>
      </div>
      <div class="countdown-track"><div class="countdown-fill" id="g1-countdown"></div></div>
      <div class="sortir-grid">
        <div class="drop-zone z-usaha" data-cat="usaha">
          <div class="zone-head">🏪 Piutang Usaha</div>
          <div class="zone-items" id="zone-usaha"></div>
        </div>
        <div class="drop-zone z-wesel" data-cat="wesel">
          <div class="zone-head">📜 Piutang Wesel</div>
          <div class="zone-items" id="zone-wesel"></div>
        </div>
        <div class="drop-zone z-lain" data-cat="lain">
          <div class="zone-head">📦 Piutang Lain-lain</div>
          <div class="zone-items" id="zone-lain"></div>
        </div>
      </div>
      <div class="cards-pool" id="cards-pool"></div>
    `;

    renderCardsPool();
    setupDropZones();
    startG1Timer();
  }

  function renderCardsPool() {
    const pool = $('#cards-pool');
    pool.innerHTML = '';
    g1Remaining.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'tagihan-card';
      el.draggable = true;
      el.dataset.idx = i;
      el.textContent = c.text;
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', i);
        e.dataTransfer.effectAllowed = 'move';
        el.classList.add('dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      el.addEventListener('click', () => {
        AR.toast('Drag kartu ini ke kolom yang tepat', 'fa-hand-pointer', 1500);
      });
      pool.appendChild(el);
    });
    const rm = $('#g1-remain');
    if (rm) rm.textContent = g1Remaining.length;
  }

  function setupDropZones() {
    $$('.drop-zone').forEach(zone => {
      zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const idx = +e.dataTransfer.getData('text/plain');
        handleDrop(idx, zone);
      });
    });
  }

  function handleDrop(idx, zone) {
    const card = g1Remaining[idx];
    if (!card) return;
    const chosenCat = zone.dataset.cat;
    const isCorrect = chosenCat === card.cat;

    const item = document.createElement('div');
    item.className = 'zone-item ' + (isCorrect ? 'correct' : 'wrong');
    item.textContent = (isCorrect ? '✓ ' : '✗ ') + card.text;
    zone.querySelector('.zone-items').appendChild(item);
    setTimeout(() => item.remove(), 1400);

    if (isCorrect) {
      g1Score += 10;
      g1Correct++;
      AR.sound.play('correct');
      zone.style.transition = 'box-shadow 0.3s';
      zone.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.4)';
      setTimeout(() => { zone.style.boxShadow = ''; }, 300);
    } else {
      g1Score = Math.max(0, g1Score - 5);
      g1Wrong++;
      AR.sound.play('wrong');
      zone.style.transition = 'box-shadow 0.3s';
      zone.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.4)';
      setTimeout(() => { zone.style.boxShadow = ''; }, 300);
    }

    g1Remaining.splice(idx, 1);
    renderCardsPool();
    const sc = $('#g1-score');
    if (sc) sc.textContent = g1Score;

    if (g1Remaining.length === 0) endGame1(true);
  }

  function startG1Timer() {
    if (g1Timer) clearInterval(g1Timer);
    g1Timer = setInterval(() => {
      g1TimeLeft--;
      const t = $('#g1-time');
      if (t) t.textContent = g1TimeLeft;
      const fill = $('#g1-countdown');
      if (fill) {
        const pct = (g1TimeLeft / GAME1_TIME) * 100;
        fill.style.width = pct + '%';
        fill.classList.toggle('warn', g1TimeLeft <= 20 && g1TimeLeft > 10);
        fill.classList.toggle('danger', g1TimeLeft <= 10);
      }
      const timeBox = $('#g1-time')?.closest('.stat-box');
      if (timeBox) {
        timeBox.classList.toggle('warn', g1TimeLeft <= 20 && g1TimeLeft > 10);
        timeBox.classList.toggle('danger', g1TimeLeft <= 10);
      }
      if (AR.vibrate && (g1TimeLeft === 10 || g1TimeLeft === 5 || g1TimeLeft === 3 || g1TimeLeft === 1)) {
        AR.vibrate(80);
      }
      if (g1TimeLeft <= 0) endGame1(false);
    }, 1000);
  }

  function endGame1(allCleared) {
    if (g1Timer) { clearInterval(g1Timer); g1Timer = null; }
    const prevBest = state.sortirBest;
    if (g1Score > state.sortirBest) {
      state.sortirBest = g1Score;
      AR.storage.set('sortir_best', g1Score);
    }
    state.sortirDone = true;
    AR.storage.set('sortir_done', true);

    const emoji = g1Score >= 90 ? '👑' : g1Score >= 70 ? '🏆' : g1Score >= 40 ? '⭐' : '🌱';
    const title = g1Score >= 90 ? 'Luar Biasa!' : g1Score >= 70 ? 'Mantap!' : g1Score >= 40 ? 'Bagus!' : 'Coba Lagi!';
    const msg = allCleared ? 'Kamu berhasil menyortir semua kartu dalam waktu!' : 'Waktu habis. Semakin cepat makin tinggi skor!';

    $('#game-sortir-stage').innerHTML = `
      <div class="game-result">
        <span class="big-emoji">${emoji}</span>
        <h2>${title}</h2>
        <p class="sub">${msg}</p>
        <div class="result-stats">
          <div class="stat-box success">
            <div class="val">${g1Score}</div>
            <div class="lbl">Skor</div>
          </div>
          <div class="stat-box">
            <div class="val">${g1Correct}</div>
            <div class="lbl">Benar</div>
          </div>
          <div class="stat-box danger">
            <div class="val">${g1Wrong}</div>
            <div class="lbl">Salah</div>
          </div>
        </div>
        ${g1Score > prevBest && g1Score > 0 ? `<p style="color:var(--emerald);font-weight:800;margin-bottom:14px"><i class="fas fa-trophy"></i> Rekor baru! Sebelumnya ${prevBest}</p>` : ''}
        <div class="actions">
          <button class="btn btn-primary" id="g1-again"><i class="fas fa-rotate"></i> Main Lagi</button>
          <button class="btn btn-ghost" id="g1-to-jr"><i class="fas fa-arrow-right"></i> Coba Jurnal Rush</button>
        </div>
      </div>
    `;
    AR.sound.play(g1Score >= 70 ? 'jingle' : 'success');
    if (g1Score >= 70) confettiBurst(60);

    $('#g1-again').addEventListener('click', () => { AR.sound.play('click'); startGame1(); });
    $('#g1-to-jr').addEventListener('click', () => {
      AR.sound.play('click');
      document.querySelector('.game-tab[data-game="jr"]').click();
    });
    refreshTabBadges();
  }

  /* ============================================================
     GAME 2 — JURNAL RUSH
     ============================================================ */
  const JR_DATA = [
    {
      text: 'Dibentuk cadangan kerugian piutang 5% dari piutang Rp 100.000.000 (metode allowance).',
      debit: ['Beban Kerugian Piutang', 'Piutang Usaha', 'Kas / Bank'],
      credit: ['Cadangan Kerugian Piutang', 'Piutang Usaha', 'Beban Kerugian Piutang'],
      ansD: 'Beban Kerugian Piutang',
      ansC: 'Cadangan Kerugian Piutang'
    },
    {
      text: 'Piutang Toko X Rp 3.000.000 dihapus karena pailit (metode allowance).',
      debit: ['Cadangan Kerugian Piutang', 'Beban Kerugian Piutang', 'Kas / Bank'],
      credit: ['Piutang Usaha', 'Cadangan Kerugian Piutang', 'Pendapatan Lain-lain'],
      ansD: 'Cadangan Kerugian Piutang',
      ansC: 'Piutang Usaha'
    },
    {
      text: 'Diterima kas pelunasan piutang yang sebelumnya telah dihapus (periode yang sama, metode allowance).',
      debit: ['Kas / Bank', 'Piutang Usaha', 'Cadangan Kerugian Piutang'],
      credit: ['Piutang Usaha', 'Kas / Bank', 'Beban Kerugian Piutang'],
      ansD: 'Kas / Bank',
      ansC: 'Piutang Usaha'
    },
    {
      text: 'Penjualan barang dagangan secara kredit sebesar Rp 15.000.000.',
      debit: ['Piutang Usaha', 'Kas / Bank', 'Penjualan'],
      credit: ['Penjualan', 'Piutang Usaha', 'Cadangan Kerugian Piutang'],
      ansD: 'Piutang Usaha',
      ansC: 'Penjualan'
    },
    {
      text: 'Piutang Rp 60.000.000 dijual ke Bank Finansia secara non-recourse dengan biaya 5%.',
      debit: ['Kas / Bank', 'Biaya Anjak Piutang', 'Piutang Usaha'],
      credit: ['Piutang Usaha', 'Kas / Bank', 'Biaya Anjak Piutang'],
      ansD: 'Kas / Bank',
      ansC: 'Piutang Usaha'
    },
    {
      text: 'Piutang Rp 2.000.000 dihapus langsung (write-off method).',
      debit: ['Beban Kerugian Piutang', 'Cadangan Kerugian Piutang', 'Kas / Bank'],
      credit: ['Piutang Usaha', 'Beban Kerugian Piutang', 'Cadangan Kerugian Piutang'],
      ansD: 'Beban Kerugian Piutang',
      ansC: 'Piutang Usaha'
    },
    {
      text: 'Konfirmasi: piutang Rp 2.000.000 yang dihapus ternyata akan dibayar (metode allowance).',
      debit: ['Piutang Usaha', 'Kas / Bank', 'Beban Kerugian Piutang'],
      credit: ['Cadangan Kerugian Piutang', 'Piutang Usaha', 'Pendapatan Lain-lain'],
      ansD: 'Piutang Usaha',
      ansC: 'Cadangan Kerugian Piutang'
    },
    {
      text: 'Diterima kas Rp 2.500.000 dari piutang yang dihapus periode lalu (metode allowance).',
      debit: ['Kas / Bank', 'Piutang Usaha', 'Cadangan Kerugian Piutang'],
      credit: ['Cadangan Kerugian Piutang', 'Piutang Usaha', 'Pendapatan Lain-lain'],
      ansD: 'Kas / Bank',
      ansC: 'Cadangan Kerugian Piutang'
    }
  ];
  const JR_TIME = 25;

  let jrIdx = 0;
  let jrScore = 0;
  let jrStreak = 0;
  let jrMaxStreak = 0;
  let jrCorrect = 0;
  let jrTimer = null;
  let jrTimeLeft = JR_TIME;
  let jrSelD = null;
  let jrSelC = null;
  let jrOrder = [];
  let jrActive = false;   // ← FIX: guard untuk cegah double submit

  function renderGame2Intro() {
    $('#game-jr-stage').innerHTML = `
      <div class="game-head">
        <h2>📓 Jurnal Rush</h2>
        <p>Setiap soal menampilkan transaksi. Pilih akun Debit dan Kredit yang tepat. Waktu 25 detik per soal, streak bonus!</p>
      </div>
      <div class="game-stats">
        <div class="stat-box">
          <div class="val">${JR_DATA.length}</div>
          <div class="lbl">Soal</div>
        </div>
        <div class="stat-box success">
          <div class="val">${state.jrBest}</div>
          <div class="lbl">Best</div>
        </div>
      </div>
      <div style="text-align:center;margin:26px 0">
        <button class="btn btn-primary" id="jr-start" style="padding:14px 34px;font-size:1rem">
          <i class="fas fa-play"></i> Mulai Main
        </button>
      </div>
    `;
    $('#jr-start').addEventListener('click', () => {
      AR.sound.play('click');
      startGame2();
    });
  }

  function startGame2() {
    jrIdx = 0;
    jrScore = 0;
    jrStreak = 0;
    jrMaxStreak = 0;
    jrCorrect = 0;
    jrOrder = JR_DATA.slice().sort(() => Math.random() - 0.5);
    renderJRQuestion();
  }

  function renderJRQuestion() {
    if (jrIdx >= jrOrder.length) { endGame2(); return; }
    jrActive = true;
    jrSelD = null;
    jrSelC = null;
    jrTimeLeft = JR_TIME;
    const q = jrOrder[jrIdx];

    $('#game-jr-stage').innerHTML = `
      <div class="game-stats">
        <div class="stat-box">
          <div class="val" id="jr-num">${jrIdx + 1} / ${jrOrder.length}</div>
          <div class="lbl">Soal</div>
        </div>
        <div class="stat-box success">
          <div class="val" id="jr-score">${jrScore}</div>
          <div class="lbl">Skor</div>
        </div>
        <div class="stat-box ${jrStreak >= 3 ? 'warn' : ''}">
          <div class="val"><span class="streak-indicator ${jrStreak >= 3 ? 'hot' : ''}" id="jr-streak"><i class="fas fa-fire"></i> ${jrStreak}</span></div>
          <div class="lbl">Streak</div>
        </div>
        <div class="stat-box" id="jr-time-box">
          <div class="val" id="jr-time">${jrTimeLeft}</div>
          <div class="lbl">Detik</div>
        </div>
      </div>
      <div class="countdown-track"><div class="countdown-fill" id="jr-countdown"></div></div>
      <div class="jr-question">
        <div class="label">// Transaksi ${jrIdx + 1}</div>
        <div class="text">${q.text}</div>
      </div>
      <div class="jr-answers">
        <div class="jr-col debit">
          <h4><i class="fas fa-arrow-down"></i> Pilih Akun Debit</h4>
          <div class="chips" id="jr-debit">
            ${q.debit.map(a => `<button class="acc-chip" data-side="d" data-acc="${a}">${a}</button>`).join('')}
          </div>
        </div>
        <div class="jr-col credit">
          <h4><i class="fas fa-arrow-up"></i> Pilih Akun Kredit</h4>
          <div class="chips" id="jr-credit">
            ${q.credit.map(a => `<button class="acc-chip" data-side="c" data-acc="${a}">${a}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="jr-feedback" id="jr-fb"></div>
      <div style="text-align:right">
        <button class="btn btn-primary" id="jr-submit" disabled>
          <i class="fas fa-check"></i> Kunci Jawaban
        </button>
      </div>
    `;

    $$('#jr-debit .acc-chip').forEach(c => {
      c.addEventListener('click', () => {
        if (!jrActive) return;
        $$('#jr-debit .acc-chip').forEach(x => x.classList.remove('selected'));
        c.classList.add('selected');
        jrSelD = c.dataset.acc;
        AR.sound.play('click');
        checkSubmit();
      });
    });
    $$('#jr-credit .acc-chip').forEach(c => {
      c.addEventListener('click', () => {
        if (!jrActive) return;
        $$('#jr-credit .acc-chip').forEach(x => x.classList.remove('selected'));
        c.classList.add('selected');
        jrSelC = c.dataset.acc;
        AR.sound.play('click');
        checkSubmit();
      });
    });
    $('#jr-submit').addEventListener('click', () => submitJR(false));
    startJRTimer();
  }

  function checkSubmit() {
    const btn = $('#jr-submit');
    if (btn) btn.disabled = !(jrSelD && jrSelC);
  }

  function startJRTimer() {
    stopJRTimer();
    jrTimer = setInterval(() => {
      if (!jrActive) return;
      jrTimeLeft--;
      const el = $('#jr-time');
      const box = $('#jr-time-box');
      const fill = $('#jr-countdown');
      if (el) el.textContent = jrTimeLeft;
      if (fill) {
        const pct = (jrTimeLeft / JR_TIME) * 100;
        fill.style.width = pct + '%';
        fill.classList.toggle('warn', jrTimeLeft <= 12 && jrTimeLeft > 6);
        fill.classList.toggle('danger', jrTimeLeft <= 6);
      }
      if (box) {
        box.classList.toggle('warn', jrTimeLeft <= 12 && jrTimeLeft > 6);
        box.classList.toggle('danger', jrTimeLeft <= 6);
      }
      if (AR.vibrate && (jrTimeLeft === 5 || jrTimeLeft === 3 || jrTimeLeft === 1)) {
        AR.vibrate(60);
      }
      if (jrTimeLeft <= 0) {
        stopJRTimer();
        submitJR(true);
      }
    }, 1000);
  }

  function stopJRTimer() {
    if (jrTimer) { clearInterval(jrTimer); jrTimer = null; }
  }

  function submitJR(timedOut = false) {
    if (!jrActive) return;
    jrActive = false;
    stopJRTimer();
    const q = jrOrder[jrIdx];
    const okD = jrSelD === q.ansD;
    const okC = jrSelC === q.ansC;
    const allCorrect = okD && okC;   // ← FIX: benar walau flag timedOut

    const fb = $('#jr-fb');
    if (allCorrect) {
      jrStreak++;
      if (jrStreak > jrMaxStreak) jrMaxStreak = jrStreak;
      const base = 10;
      const streakBonus = Math.min(10, (jrStreak - 1) * 2);
      const timeBonus = Math.max(0, Math.round(jrTimeLeft / 5));
      const gained = base + streakBonus + timeBonus;
      jrScore += gained;
      jrCorrect++;
      AR.sound.play('correct');
      confettiBurst(15);
      fb.className = 'jr-feedback correct';
      fb.innerHTML = `✓ Benar! +${gained} poin ${jrStreak >= 3 ? `· 🔥 Streak ${jrStreak}!` : ''}`;
    } else {
      jrStreak = 0;
      AR.sound.play('wrong');
      fb.className = 'jr-feedback wrong';
      const reason = timedOut ? '⏰ Waktu habis!' : '✗ Kurang tepat.';
      fb.innerHTML = `${reason} Jawaban: <strong>Dr. ${q.ansD} / Cr. ${q.ansC}</strong>`;
    }

    $$('.acc-chip').forEach(c => c.style.pointerEvents = 'none');
    const sub = $('#jr-submit');
    if (sub) sub.disabled = true;

    setTimeout(() => {
      jrIdx++;
      if (jrIdx >= jrOrder.length) endGame2();
      else renderJRQuestion();
    }, 1600);
  }

  function endGame2() {
    const prevBest = state.jrBest;
    if (jrScore > state.jrBest) {
      state.jrBest = jrScore;
      AR.storage.set('jr_best', jrScore);
    }
    state.jrDone = true;
    AR.storage.set('jr_done', true);

    const pct = Math.round((jrCorrect / jrOrder.length) * 100);
    const emoji = pct >= 90 ? '👑' : pct >= 70 ? '🏆' : pct >= 50 ? '⭐' : '🌱';
    const title = pct >= 90 ? 'Jurnalis Andal!' : pct >= 70 ? 'Mantap!' : pct >= 50 ? 'Bagus!' : 'Coba Lagi!';

    $('#game-jr-stage').innerHTML = `
      <div class="game-result">
        <span class="big-emoji">${emoji}</span>
        <h2>${title}</h2>
        <p class="sub">Kamu menjawab ${jrCorrect} dari ${jrOrder.length} soal dengan benar.</p>
        <div class="result-stats">
          <div class="stat-box success">
            <div class="val">${jrScore}</div>
            <div class="lbl">Skor</div>
          </div>
          <div class="stat-box">
            <div class="val">${jrCorrect}/${jrOrder.length}</div>
            <div class="lbl">Benar</div>
          </div>
          <div class="stat-box warn">
            <div class="val">${jrMaxStreak}</div>
            <div class="lbl">Streak Max</div>
          </div>
        </div>
        ${jrScore > prevBest && jrScore > 0 ? `<p style="color:var(--emerald);font-weight:800;margin-bottom:14px"><i class="fas fa-trophy"></i> Rekor baru! Sebelumnya ${prevBest}</p>` : ''}
        <div class="actions">
          <button class="btn btn-primary" id="jr-again"><i class="fas fa-rotate"></i> Main Lagi</button>
          <button class="btn btn-ghost" id="jr-to-sortir"><i class="fas fa-arrow-left"></i> Coba Sortir Cepat</button>
        </div>
      </div>
    `;
    AR.sound.play(pct >= 70 ? 'jingle' : 'success');
    if (pct >= 70) confettiBurst(60);

    $('#jr-again').addEventListener('click', () => { AR.sound.play('click'); startGame2(); });
    $('#jr-to-sortir').addEventListener('click', () => {
      AR.sound.play('click');
      document.querySelector('.game-tab[data-game="sortir"]').click();
    });
    refreshTabBadges();
  }

  /* ============ INIT ============ */
  document.addEventListener('DOMContentLoaded', () => {
    AR.init({ particles: true });

    if (AR.storage.get('sortir_done', false)) state.sortirDone = true;
    if (AR.storage.get('jr_done', false)) state.jrDone = true;

    initTabs();
    renderGame1Intro();
    renderGame2Intro();
    refreshTabBadges();

    const themeBtn = $('[data-action="theme"]');
    const soundBtn = $('[data-action="sound"]');
    const shareBtn = $('[data-action="share"]');
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
        AR.share('Account Receivable 101 · Tantangan', 'Coba mini games piutang & jurnal di sini!');
      });
    }
  });
})();
