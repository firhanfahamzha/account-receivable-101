/* ==========================================================
   KUIS — 10 soal · timer · skor · confetti · badge
   ========================================================== */
(function () {
  'use strict';
  const AR = window.AR;
  if (!AR) return;

  const QUESTIONS = [
    {
      q: 'Piutang usaha pada dasarnya timbul dari transaksi...',
      opts: [
        'Pembelian barang secara tunai',
        'Penjualan barang atau jasa secara kredit',
        'Penerimaan pinjaman bank',
        'Setoran modal pemilik'
      ],
      ans: 1
    },
    {
      q: 'Metode akuntansi yang sesuai dengan PSAK 109 untuk mengantisipasi piutang tak tertagih adalah...',
      opts: [
        'Write-off langsung saat piutang benar-benar dihapus',
        'Cadangan kerugian piutang (allowance / ECL)',
        'Mengabaikan piutang macet',
        'Menambah nilai nominal piutang'
      ],
      ans: 1
    },
    {
      q: 'Rumus Nilai Realisasi Bersih (NRV) piutang adalah...',
      opts: [
        'Piutang Usaha + Cadangan Kerugian',
        'Piutang Usaha − Cadangan Kerugian Piutang',
        'Cadangan Kerugian − Piutang Usaha',
        'Piutang Usaha × % Cadangan'
      ],
      ans: 1
    },
    {
      q: 'Diketahui Piutang Usaha Rp 100.000.000 dan CKPN Rp 5.000.000. Berapa NRV-nya?',
      opts: ['Rp 105.000.000', 'Rp 100.000.000', 'Rp 95.000.000', 'Rp 5.000.000'],
      ans: 2
    },
    {
      q: 'Kategori umur piutang "Menunggak 31 – 60 Hari" biasanya diberi persentase ECL sebesar...',
      opts: ['1%', '3%', '5%', '100%'],
      ans: 2
    },
    {
      q: 'Piutang Wesel berbeda dari piutang usaha karena...',
      opts: [
        'Tidak berbunga dan tanpa tanggal jatuh tempo',
        'Ada komitmen formal tertulis, umumnya berbunga',
        'Selalu timbul dari penjualan tunai',
        'Tidak dapat dianjak-piutangkan'
      ],
      ans: 1
    },
    {
      q: 'Jurnal untuk membentuk cadangan kerugian piutang (metode allowance) adalah...',
      opts: [
        'Dr. Cadangan Kerugian / Cr. Piutang Usaha',
        'Dr. Beban Kerugian Piutang / Cr. Cadangan Kerugian Piutang',
        'Dr. Kas / Cr. Piutang Usaha',
        'Dr. Piutang Usaha / Cr. Penjualan'
      ],
      ans: 1
    },
    {
      q: 'Jika debitur dinyatakan pailit oleh pengadilan, persentase ECL yang dikenakan menurut kebijakan konservatif adalah...',
      opts: ['1%', '5%', '10%', '100%'],
      ans: 3
    },
    {
      q: 'Anjak piutang (factoring) dengan skema non-recourse berarti...',
      opts: [
        'Risiko gagal bayar tetap pada penjual piutang',
        'Penjual piutang wajib mengganti jika debitur gagal bayar',
        'Risiko gagal bayar sepenuhnya dialihkan ke pihak pembeli piutang (factor)',
        'Piutang tidak boleh dijual ke bank'
      ],
      ans: 2
    },
    {
      q: 'Piutang Rp 60.000.000 dijual ke bank non-recourse dengan biaya anjak piutang 5%. Kas yang diterima penjual adalah...',
      opts: ['Rp 60.000.000', 'Rp 57.000.000', 'Rp 3.000.000', 'Rp 63.000.000'],
      ans: 1
    }
  ];

  const TIME_PER_Q = 30; // detik
  const PASS_SCORE = 70;

  let current = 0;
  let score = 0;
  let correctCount = 0;
  let answered = false;
  let timerId = null;
  let timeLeft = TIME_PER_Q;
  let startTime = 0;
  let history = [];

  /* ============ RENDER ============ */
  const $ = s => document.querySelector(s);

  function renderIntro() {
    $('#quiz-stage').innerHTML = `
      <div class="quiz-intro">
        <span class="big">🎯</span>
        <h2>Kuis Cepat: Siklus Piutang</h2>
        <p>10 soal pilihan ganda seputar piutang, ECL, NRV, dan penjurnalan. Waktu 30 detik per soal. Skor ≥ 70 untuk lulus & buka badge.</p>
        <div class="info-grid">
          <div class="info-item"><span class="val">10</span><div class="lbl">Soal</div></div>
          <div class="info-item"><span class="val">30s</span><div class="lbl">Per Soal</div></div>
          <div class="info-item"><span class="val">70</span><div class="lbl">Lulus</div></div>
        </div>
        <button class="btn btn-primary" id="btn-start" style="padding:14px 34px;font-size:1rem">
          <i class="fas fa-play"></i> Mulai Kuis
        </button>
      </div>
    `;
    $('#btn-start').addEventListener('click', () => {
      AR.sound.play('click');
      startQuiz();
    });
  }

  function startQuiz() {
    current = 0;
    score = 0;
    correctCount = 0;
    history = [];
    startTime = Date.now();
    renderQuestion();
  }

  function renderQuestion() {
    answered = false;
    timeLeft = TIME_PER_Q;
    const q = QUESTIONS[current];
    const total = QUESTIONS.length;
    const pct = (current / total) * 100;

    $('#quiz-stage').innerHTML = `
      <div class="quiz-top">
        <span class="quiz-counter">${current + 1} / ${total}</span>
        <div class="quiz-progress-track"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        <span class="quiz-timer" id="q-timer"><i class="fas fa-clock"></i> <span id="q-time">${TIME_PER_Q}</span>s</span>
      </div>
      <div class="quiz-body">
        <div class="q-num">Soal ${String(current + 1).padStart(2, '0')}</div>
        <div class="q-text">${q.q}</div>
        <div class="options" id="q-opts">
          ${q.opts.map((o, i) => `
            <button class="option" data-i="${i}">
              <span class="key">${String.fromCharCode(65 + i)}</span>
              <span>${o}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="quiz-foot">
        <span class="quiz-score-live">Skor: <strong id="q-score">${score}</strong></span>
        <button class="btn btn-primary" id="q-next" disabled>
          ${current === QUESTIONS.length - 1 ? 'Lihat Hasil' : 'Soal Berikutnya'} <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    `;

    // animate progress
    requestAnimationFrame(() => {
      const fill = document.querySelector('.quiz-progress-fill');
      if (fill) fill.style.width = ((current + 1) / total * 100) + '%';
    });

    document.querySelectorAll('.option').forEach(btn => {
      btn.addEventListener('click', () => selectOption(+btn.dataset.i));
    });
    $('#q-next').addEventListener('click', () => {
      AR.sound.play('click');
      if (current === QUESTIONS.length - 1) {
        showResult();
      } else {
        current++;
        renderQuestion();
      }
    });

    startTimer();
  }

 function startTimer() {
  stopTimer();
  const tick = () => {
    timeLeft--;
    const el = document.getElementById('q-time');
    const wrap = document.getElementById('q-timer');
    if (el) el.textContent = timeLeft;
    if (wrap) {
      wrap.classList.toggle('warn', timeLeft <= 15 && timeLeft > 8);
      wrap.classList.toggle('danger', timeLeft <= 8);
    }
    // 🔔 Getar di detik kritis
    if (AR.vibrate && (timeLeft === 8 || timeLeft === 5 || timeLeft === 3)) {
      AR.vibrate(60);
    }
    if (timeLeft <= 0) {
      stopTimer();
      if (!answered) timeUp();
    }
  };
  timerId = setInterval(tick, 1000);
}

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function timeUp() {
    answered = true;
    const q = QUESTIONS[current];
    document.querySelectorAll('.option').forEach((btn, i) => {
      btn.classList.add('disabled');
      if (i === q.ans) btn.classList.add('reveal-correct');
    });
    history.push({ q: q.q, chosen: -1, correct: q.ans });
     function timeUp() {
  answered = true;
  const q = QUESTIONS[current];
  document.querySelectorAll('.option').forEach((btn, i) => {
    btn.classList.add('disabled');
    if (i === q.ans) btn.classList.add('reveal-correct');
  });
  history.push({ q: q.q, chosen: -1, correct: q.ans });
  AR.vibrate([150, 80, 150]);       // ← getar: alert pattern (lebih kuat dari wrong biasa)
  AR.sound.play('wrong');
  AR.toast('Waktu habis!', 'fa-clock', 2000);
  document.getElementById('q-next').disabled = false;
}
    AR.sound.play('wrong');
    AR.toast('Waktu habis!', 'fa-clock', 2000);
    document.getElementById('q-next').disabled = false;
  }

  function selectOption(i) {
    if (answered) return;
    answered = true;
    stopTimer();
    const q = QUESTIONS[current];
    const options = document.querySelectorAll('.option');
    options.forEach(o => o.classList.add('disabled'));
    options[i].classList.add(i === q.ans ? 'correct' : 'wrong');
    if (i !== q.ans) options[q.ans].classList.add('reveal-correct');

    const isCorrect = i === q.ans;
    if (isCorrect) {
      // Bonus skor berdasarkan sisa waktu
      const bonus = Math.max(0, Math.round(timeLeft / 3));
      const gained = 10 + bonus;
      score += gained;
      correctCount++;
      AR.sound.play('correct');
      confettiBurst(12);
      const sc = document.getElementById('q-score');
      if (sc) sc.textContent = score;
    } else {
      AR.sound.play('wrong');
    }

    history.push({ q: q.q, chosen: i, correct: q.ans });

    const nextBtn = document.getElementById('q-next');
    nextBtn.disabled = false;
  }

  function showResult() {
    const total = QUESTIONS.length;
    const maxScore = total * 10 + Math.round(TIME_PER_Q / 3) * total; // perkiraan max
    const pct = Math.round((correctCount / total) * 100);
    const finalScore = Math.min(100, pct);
    const passed = finalScore >= PASS_SCORE;
    const duration = Math.round((Date.now() - startTime) / 1000);

    // Simpan progress
    const prevScore = AR.progress.quizScore || 0;
    if (finalScore > prevScore) AR.progress.quizScore = finalScore;
    AR.saveProgress();

    if (passed) {
      AR.markDone('kuis');
      AR.unlockBadge('ahli_ecl', '🎯', 'Ahli ECL');
      AR.sound.play('jingle');
      confettiBurst(80);
      setTimeout(() => confettiBurst(60), 500);
    }

    let emoji = '🌱', title = 'Belum Lulus', msg = 'Coba lagi ya! Baca ulang materi sambil perhatikan contoh perhitungan.';
    if (finalScore >= 100) { emoji = '👑'; title = 'Sempurna!'; msg = 'Kamu benar-benar paham siklus piutang & ECL. Luar biasa!'; }
    else if (finalScore >= 85) { emoji = '🏆'; title = 'Excellent!'; msg = 'Skormu tinggi. Sedikit lagi menuju sempurna!'; }
    else if (finalScore >= 70) { emoji = '🎉'; title = 'Lulus!'; msg = 'Kamu berhasil melewati kuis. Lanjut ke tantangan!'; }

    const r = 65;
    const circ = 2 * Math.PI * r;

    $('#quiz-stage').innerHTML = `
      <div class="quiz-result">
        <span class="emoji">${emoji}</span>
        <h2>${title}</h2>
        <p class="sub">${correctCount} benar dari ${total} soal · Durasi ${duration} detik</p>
        <div class="score-ring">
          <svg viewBox="0 0 160 160">
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${passed ? '#10b981' : '#f59e0b'}"/>
                <stop offset="100%" stop-color="#06b6d4"/>
              </linearGradient>
            </defs>
            <circle class="ring-bg-c" cx="80" cy="80" r="${r}"/>
            <circle class="ring-fill-c" cx="80" cy="80" r="${r}"
              stroke-dasharray="${circ}"
              stroke-dashoffset="${circ}"/>
          </svg>
          <div class="inner">
            <div>
              <div class="big-score" id="final-score">0</div>
              <div class="small">Skor / 100</div>
            </div>
          </div>
        </div>
        <p class="result-msg">${msg}</p>
        <div class="result-actions">
          <button class="btn btn-ghost" id="btn-again">
            <i class="fas fa-rotate"></i> Coba Lagi
          </button>
          ${passed ? `
            <a href="tantangan.html" class="btn btn-primary">
              <i class="fas fa-bolt"></i> Lanjut Tantangan
            </a>
          ` : `
            <a href="materi.html" class="btn btn-primary">
              <i class="fas fa-book-open-reader"></i> Baca Materi Ulang
            </a>
          `}
          <button class="btn btn-ghost" id="btn-share">
            <i class="fas fa-share-nodes"></i> Bagikan
          </button>
        </div>
      </div>
    `;

    // Animate ring
    const fillEl = document.querySelector('.ring-fill-c');
    setTimeout(() => {
      fillEl.style.strokeDashoffset = circ - (finalScore / 100) * circ;
    }, 60);

    // Animate score counter
    const scoreEl = document.getElementById('final-score');
    let s = 0;
    const int = setInterval(() => {
      s += 2;
      if (s >= finalScore) { s = finalScore; clearInterval(int); }
      scoreEl.textContent = s;
    }, 22);

    $('#btn-again').addEventListener('click', () => {
      AR.sound.play('click');
      startQuiz();
    });
    $('#btn-share').addEventListener('click', () => {
      AR.sound.play('click');
      AR.share(
        `Aku dapat skor ${finalScore}/100 di Kuis Account Receivable 101!`,
        `Coba juga kuis piutang & ECL seru di sini. #AR101 #ATC2026`
      );
    });
  }

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

  /* ============ INIT ============ */
  document.addEventListener('DOMContentLoaded', () => {
    AR.init({ particles: true });
    renderIntro();

    // Topbar
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
        AR.share('Account Receivable 101 · Kuis', 'Uji pemahaman siklus piutang & ECL di sini!');
      });
    }
  });
})();
