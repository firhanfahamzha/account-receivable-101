/* ==========================================================
   WORKSPACE — Roleplay Staf AR · Multi-Proyek
   PT default: PT Tekno Mandiri Jaya (bisa diganti user)
   ========================================================== */
(function () {
  'use strict';
  const AR = window.AR;
  if (!AR) return;

  const PROJECTS_KEY = 'ar101_projects';
  const currentKey = 'ar101_current_project';

  let projects = [];
  let currentProject = null;

  /* ============ HELPERS ============ */
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const fmt = n => Math.round(n || 0).toLocaleString('id-ID');
  const unfmt = str => parseFloat(String(str || '').replace(/\./g, '').replace(/[^\d-]/g, '')) || 0;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function loadProjects() {
    projects = AR.storage.get(PROJECTS_KEY, []);
    if (!Array.isArray(projects)) projects = [];
    return projects;
  }
  function saveProjects() { AR.storage.set(PROJECTS_KEY, projects); }
  function saveCurrent() {
    if (!currentProject) return;
    const idx = projects.findIndex(p => p.id === currentProject.id);
    if (idx >= 0) {
      projects[idx] = currentProject;
      saveProjects();
    }
  }
  function getDefaultProject(name, company, period) {
    return {
      id: uid(),
      name,
      company,
      period,
      createdAt: new Date().toISOString(),
      mod1: false, mod2: false, mod3: false, mod4: false, mod5: false,
      klasifikasi: [
        { nama: 'Customer', nominal: 150000000, klasifikasi: 'Piutang Usaha' },
        { nama: 'PT Abadi Sakti', nominal: 25000000, klasifikasi: 'Piutang Wesel' },
        { nama: 'Karyawan', nominal: 8000000, klasifikasi: 'Piutang Lain-lain' }
      ],
      m2bruto: '183.000.000',
      m2termin: '2/10, n/30',
      aging: [
        { pelanggan: 'Toko Alfa', kategori: 'Belum Jatuh Tempo', hari: null, saldo: 60000000, alokasi: '', estimasi: 0 },
        { pelanggan: 'CV Beta Computindo', kategori: 'Menunggak 1 - 30 Hari', hari: 21, saldo: 40000000, alokasi: '', estimasi: 0 },
        { pelanggan: 'PT Gamma Tech', kategori: 'Menunggak 31 - 60 Hari', hari: 46, saldo: 25000000, alokasi: '', estimasi: 0 },
        { pelanggan: 'Toko Delta', kategori: 'Menunggak > 60 Hari', hari: 82, saldo: 15000000, alokasi: '', estimasi: 0 },
        { pelanggan: 'UD Epsilon', kategori: 'Pailit', hari: null, saldo: 10000000, alokasi: '', estimasi: 0 }
      ],
      journals: [],
      m5ar: '183.000.000',
      m5all: '',
      m5nrv: '',
      m5desc: ''
    };
  }

  /* ============ CONFETTI ============ */
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

  /* ============ ROUTER ============ */
  function showView(id) {
    $$('.view-section').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* ============ AUTH ============ */
  function initAuth() {
    const pwd = $('#auth-pwd');
    const btn = $('#auth-btn');
    if (!btn) return;
    const submit = () => {
      const val = (pwd.value || '').trim().toUpperCase();
      if (val === 'MAUT') {
        AR.sound.play('success');
        AR.toast('Akses diterima! Selamat bekerja ✨', 'fa-unlock');
        setTimeout(() => {
          if (projects.length === 0) showView('view-onboard');
          else renderProjectsList();
        }, 600);
      } else {
        AR.sound.play('wrong');
        AR.toast('Kata kunci salah. Petunjuk: 4 huruf, "Piutang adalah ___"', 'fa-lock');
        pwd.select();
      }
    };
    btn.addEventListener('click', submit);
    pwd.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  }

  /* ============ ONBOARD (CREATE PROJECT) ============ */
  function initOnboard() {
    const btn = $('#onboard-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const name = ($('#in-name').value || '').trim() || 'Staf AR';
      const company = ($('#in-company').value || '').trim() || 'PT Tekno Mandiri Jaya';
      const period = ($('#in-period').value || '').trim() || '31 Desember 2025';

      const proj = getDefaultProject(name, company, period);
      projects.push(proj);
      saveProjects();
      currentProject = proj;
      AR.storage.set(currentKey, proj.id);
      AR.user = { name, role: 'Staf AR' };
      AR.saveUser();
      AR.sound.play('success');
      AR.toast(`Proyek "${company}" dibuat! Selamat datang, ${name}.`, 'fa-rocket', 3200);
      setTimeout(() => {
        renderDashboard();
        showView('view-dashboard');
      }, 500);
    });
  }

  /* ============ PROJECTS LIST ============ */
  function renderProjectsList() {
    const wrap = $('#projects-list');
    if (!wrap) return;
    if (projects.length === 0) {
      showView('view-onboard');
      return;
    }
    wrap.innerHTML = `
      <h2>📁 Proyek Kamu</h2>
      <p class="sub">Pilih proyek untuk dilanjutkan, atau buat yang baru.</p>
      <div id="proj-items"></div>
      <button class="btn btn-primary" id="new-project-btn" style="width:100%;margin-top:14px">
        <i class="fas fa-plus"></i> Buat Proyek Baru
      </button>
    `;
    const items = $('#proj-items');
    projects.slice().reverse().forEach(p => {
      const done = [p.mod1, p.mod2, p.mod3, p.mod4, p.mod5].filter(Boolean).length;
      const status = done === 5 ? '✅ Selesai' : `${done}/5 modul`;
      const item = document.createElement('div');
      item.className = 'project-item';
      item.innerHTML = `
        <div class="project-info">
          <div class="project-name">${escapeHtml(p.company)}</div>
          <div class="project-meta">${escapeHtml(p.name)} · ${escapeHtml(p.period)} · ${status}</div>
        </div>
        <div class="project-actions">
          <button class="open" title="Buka"><i class="fas fa-folder-open"></i></button>
          <button class="del" title="Hapus"><i class="fas fa-trash"></i></button>
        </div>
      `;
      item.querySelector('.open').addEventListener('click', e => {
        e.stopPropagation();
        openProject(p.id);
      });
      item.querySelector('.del').addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`Hapus proyek "${p.company}"?`)) {
          projects = projects.filter(x => x.id !== p.id);
          saveProjects();
          AR.toast('Proyek dihapus', 'fa-trash');
          renderProjectsList();
        }
      });
      item.addEventListener('click', () => openProject(p.id));
      items.appendChild(item);
    });
    $('#new-project-btn').addEventListener('click', () => {
      AR.sound.play('click');
      showView('view-onboard');
    });
    showView('view-projects');
  }

  function openProject(id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    currentProject = p;
    AR.storage.set(currentKey, p.id);
    AR.user = { name: p.name, role: 'Staf AR' };
    AR.saveUser();
    AR.sound.play('click');
    renderDashboard();
    showView('view-dashboard');
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ============ DASHBOARD ============ */
  function renderDashboard() {
    if (!currentProject) return;
    const p = currentProject;
    $('#dash-company').textContent = p.company;
    $('#dash-meta').innerHTML = `Penyusun: <strong>${escapeHtml(p.name)}</strong> · Periode: <span class="mono">${escapeHtml(p.period)}</span>`;

    const mods = [
      { id: 'mod1', n: 1, icon: 'i1', fas: 'fa-tags', title: 'Klasifikasi Piutang', desc: 'Pisahkan piutang usaha, wesel, dan lain-lain.' },
      { id: 'mod2', n: 2, icon: 'i2', fas: 'fa-ruler-combined', title: 'Pengukuran Awal', desc: 'Total piutang bruto & syarat termin pembayaran.' },
      { id: 'mod3', n: 3, icon: 'i3', fas: 'fa-chart-bar', title: 'Analisis Umur', desc: 'Drag % ECL ke kolom pelanggan sesuai kebijakan.' },
      { id: 'mod4', n: 4, icon: 'i4', fas: 'fa-book-journal-whills', title: 'Penjurnalan Siklus', desc: 'Smart Journal Builder untuk 3 jurnal krusial.' },
      { id: 'mod5', n: 5, icon: 'i5', fas: 'fa-file-invoice-dollar', title: 'Interpretasi NRV', desc: 'Sajikan NRV di neraca & tulis interpretasi likuiditas.' }
    ];

    const allPrevDone = ['mod1','mod2','mod3','mod4'].every(m => p[m]);
    const grid = $('#bento');
    grid.innerHTML = '';
    mods.forEach(m => {
      const done = p[m.id];
      const locked = m.id === 'mod5' && !allPrevDone;
      const card = document.createElement('div');
      card.className = 'bento-card' + (locked ? ' locked' : '');
      card.innerHTML = `
        ${locked ? '<div class="lock-overlay"><i class="fas fa-lock"></i></div>' : ''}
        <div class="bento-icon ${m.icon}"><i class="fas ${m.fas}"></i></div>
        <div class="bento-title">${m.n}. ${m.title}</div>
        <div class="bento-desc">${m.desc}</div>
        <div class="bento-status ${done ? 'done' : ''}">
          ${done ? '✓ Selesai' : (locked ? '🔒 Terkunci' : 'Belum selesai')}
        </div>
      `;
      if (!locked) {
        card.addEventListener('click', () => {
          AR.sound.play('click');
          openModule(m.id);
        });
      }
      grid.appendChild(card);
    });

    const expWrap = $('#export-cta-wrap');
    if (p.mod5) {
      expWrap.style.display = 'block';
    } else {
      expWrap.style.display = 'none';
    }
  }

  function openModule(id) {
    if (id === 'mod1') { renderMod1(); showView('view-mod1'); }
    if (id === 'mod2') { renderMod2(); showView('view-mod2'); }
    if (id === 'mod3') { renderMod3(); showView('view-mod3'); }
    if (id === 'mod4') { renderMod4(); showView('view-mod4'); }
    if (id === 'mod5') { renderMod5(); showView('view-mod5'); }
  }

  function backToDash() {
    saveCurrent();
    AR.sound.play('click');
    renderDashboard();
    showView('view-dashboard');
  }

  function markMod(id) {
    if (!currentProject) return;
    currentProject[id] = true;
    saveCurrent();
    AR.sound.play('success');
    AR.toast('Modul tersimpan ✓', 'fa-circle-check');
    backToDash();
    if (currentProject.mod1 && currentProject.mod2 && currentProject.mod3 && currentProject.mod4 && currentProject.mod5) {
      if (!AR.progress.workspace) {
        AR.markDone('workspace');
        AR.unlockBadge('auditor', '💼', 'Auditor Muda');
        confettiBurst(60);
        AR.sound.play('jingle');
      }
    }
  }

  /* ============ MOD 1 — KLASIFIKASI ============ */
  function renderMod1() {
    const tbody = $('#m1-body');
    const data = currentProject.klasifikasi || [];
    tbody.innerHTML = '';
    data.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" value="${escapeHtml(row.nama)}" data-k="nama" data-i="${i}" placeholder="Nama klien..."></td>
        <td><input type="text" class="amt" value="${fmt(row.nominal)}" data-k="nominal" data-i="${i}" placeholder="0"></td>
        <td>
          <select data-k="klasifikasi" data-i="${i}">
            <option value="Piutang Usaha"${row.klasifikasi === 'Piutang Usaha' ? ' selected' : ''}>Piutang Usaha</option>
            <option value="Piutang Wesel"${row.klasifikasi === 'Piutang Wesel' ? ' selected' : ''}>Piutang Wesel</option>
            <option value="Piutang Lain-lain"${row.klasifikasi === 'Piutang Lain-lain' ? ' selected' : ''}>Piutang Lain-lain</option>
          </select>
        </td>
        <td><button class="icon-btn-sm" data-del="${i}"><i class="fas fa-trash"></i></button></td>
      `;
      tbody.appendChild(tr);
    });
    tbody.oninput = e => {
      const i = e.target.dataset.i;
      const k = e.target.dataset.k;
      if (i == null || !k) return;
      if (k === 'nominal') e.target.value = fmt(unfmt(e.target.value));
      currentProject.klasifikasi[i][k] = k === 'nominal' ? unfmt(e.target.value) : e.target.value;
      saveCurrent();
    };
    tbody.onclick = e => {
      const del = e.target.closest('[data-del]');
      if (del) {
        currentProject.klasifikasi.splice(+del.dataset.del, 1);
        saveCurrent();
        renderMod1();
      }
    };
  }

  /* ============ MOD 2 — PENGUKURAN ============ */
  function renderMod2() {
    $('#m2-bruto').value = currentProject.m2bruto || '';
    $('#m2-termin').value = currentProject.m2termin || '';
    $('#m2-bruto').oninput = e => {
      e.target.value = fmt(unfmt(e.target.value));
      currentProject.m2bruto = e.target.value;
      saveCurrent();
    };
    $('#m2-termin').oninput = e => {
      currentProject.m2termin = e.target.value;
      saveCurrent();
    };
  }

  /* ============ MOD 3 — AGING ============ */
  const RULES = [
    { kat: 'Belum Jatuh Tempo', pct: '1%' },
    { kat: 'Menunggak 1 - 30 Hari', pct: '3%' },
    { kat: 'Menunggak 31 - 60 Hari', pct: '5%' },
    { kat: 'Menunggak > 60 Hari', pct: '10%' },
    { kat: 'Pailit', pct: '100%' }
  ];
  const KATEGORI = ['Belum Jatuh Tempo', 'Menunggak 1 - 30 Hari', 'Menunggak 31 - 60 Hari', 'Menunggak > 60 Hari', 'Pailit'];
  const needsHari = k => k !== 'Belum Jatuh Tempo' && k !== 'Pailit';

  function renderMod3() {
    const tbody = $('#m3-body');
    const data = currentProject.aging || [];
    tbody.innerHTML = '';
    data.forEach((row, i) => {
      const showHari = needsHari(row.kategori);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" value="${escapeHtml(row.pelanggan)}" data-k="pelanggan" data-i="${i}"></td>
        <td>
          <select data-k="kategori" data-i="${i}">
            ${KATEGORI.map(k => `<option value="${k}"${row.kategori === k ? ' selected' : ''}>${k}</option>`).join('')}
          </select>
          <input type="number" class="day-input ${showHari ? 'visible' : ''}" value="${row.hari || ''}" placeholder="hari" data-k="hari" data-i="${i}">
        </td>
        <td><input type="text" class="amt" value="${fmt(row.saldo)}" data-k="saldo" data-i="${i}"></td>
        <td class="text-center">
          <span class="slot ${row.alokasi ? 'filled' : ''}" data-slot="${i}" draggable="false">${row.alokasi || '[drop %]'}</span>
        </td>
        <td><input type="text" class="amt readonly-val" value="${fmt(row.estimasi)}" readonly></td>
        <td><button class="icon-btn-sm" data-del="${i}"><i class="fas fa-trash"></i></button></td>
      `;
      tbody.appendChild(tr);
    });

    // Chips
    const chipWrap = $('#m3-chips');
    chipWrap.innerHTML = '';
    ['1%', '3%', '5%', '10%', '100%'].forEach(pct => {
      const chip = document.createElement('div');
      chip.className = 'pct-chip';
      chip.textContent = pct;
      chip.draggable = true;
      chip.dataset.pct = pct;
      chip.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', pct);
        AR.sound.play('click');
      });
      // fallback click for touch
      chip.addEventListener('click', () => {
        AR.toast('Drag chip ke slot pelanggan di tabel', 'fa-hand-pointer');
      });
      chipWrap.appendChild(chip);
    });

    // Slots — drag events
    $$('[data-slot]').forEach(slot => {
      const idx = +slot.dataset.slot;
      slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', e => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        const pct = e.dataTransfer.getData('text/plain');
        if (!pct) return;
        currentProject.aging[idx].alokasi = pct;
        // Auto-calc estimasi
        const saldo = currentProject.aging[idx].saldo || 0;
        const pctNum = parseFloat(pct) / 100;
        currentProject.aging[idx].estimasi = Math.round(saldo * pctNum);
        saveCurrent();
        AR.sound.play('drop');
        renderMod3();
      });
      // click to clear
      slot.addEventListener('click', () => {
        if (currentProject.aging[idx].alokasi) {
          currentProject.aging[idx].alokasi = '';
          currentProject.aging[idx].estimasi = 0;
          saveCurrent();
          renderMod3();
        }
      });
    });

    // Input events
    tbody.oninput = e => {
      const i = e.target.dataset.i;
      const k = e.target.dataset.k;
      if (i == null || !k) return;
      if (k === 'saldo') {
        e.target.value = fmt(unfmt(e.target.value));
        currentProject.aging[i].saldo = unfmt(e.target.value);
        // Recalc estimasi if alokasi exists
        if (currentProject.aging[i].alokasi) {
          const pct = parseFloat(currentProject.aging[i].alokasi) / 100;
          currentProject.aging[i].estimasi = Math.round(currentProject.aging[i].saldo * pct);
        }
      } else if (k === 'hari') {
        currentProject.aging[i].hari = parseInt(e.target.value) || null;
      } else {
        currentProject.aging[i][k] = e.target.value;
      }
      saveCurrent();
      // Live update
      if (k === 'saldo') {
        const est = tbody.querySelectorAll('tr')[i].querySelector('.readonly-val');
        est.value = fmt(currentProject.aging[i].estimasi);
        updateAgingTotal();
      }
    };
    tbody.onchange = e => {
      const i = e.target.dataset.i;
      const k = e.target.dataset.k;
      if (k === 'kategori') {
        currentProject.aging[i].kategori = e.target.value;
        saveCurrent();
        renderMod3();
      }
    };
    tbody.onclick = e => {
      const del = e.target.closest('[data-del]');
      if (del) {
        currentProject.aging.splice(+del.dataset.del, 1);
        saveCurrent();
        renderMod3();
      }
    };

    updateAgingTotal();
  }

  function updateAgingTotal() {
    const total = (currentProject.aging || []).reduce((s, r) => s + (r.estimasi || 0), 0);
    $('#m3-total').textContent = 'Rp ' + fmt(total);
  }

  /* ============ MOD 4 — JURNAL ============ */
  const AKUN = [
    'Kas / Bank',
    'Piutang Usaha',
    'Cadangan Kerugian Piutang',
    'Beban Kerugian Piutang',
    'Biaya Anjak Piutang',
    'Pendapatan Lain-lain',
    'Piutang Wesel'
  ];

  function renderMod4() {
    const wrap = $('#m4-rows');
    wrap.innerHTML = '';
    for (let i = 0; i < 3; i++) addJournalRow();
    $('#m4-date').value = new Date().toISOString().slice(0, 10);
    renderSavedJournals();
  }

  function addJournalRow() {
    const wrap = $('#m4-rows');
    const row = document.createElement('div');
    row.className = 'j-row';
    row.innerHTML = `
      <select>${AKUN.map(a => `<option>${a}</option>`).join('')}</select>
      <input type="text" class="mono dr" placeholder="0" data-side="dr">
      <input type="text" class="mono cr" placeholder="0" data-side="cr">
      <button class="icon-btn-sm"><i class="fas fa-times"></i></button>
    `;
    row.querySelector('.icon-btn-sm').addEventListener('click', () => row.remove());
    row.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', e => {
        e.target.value = fmt(unfmt(e.target.value));
      });
    });
    wrap.appendChild(row);
  }

  function renderSavedJournals() {
    const wrap = $('#m4-saved');
    const jr = currentProject.journals || [];
    if (jr.length === 0) {
      wrap.innerHTML = '<div class="empty-state">Belum ada jurnal yang disimpan.</div>';
      return;
    }
    wrap.innerHTML = '';
    jr.forEach((j, ji) => {
      const card = document.createElement('div');
      card.className = 'saved-journal-card';
      let lines = '';
      j.entries.forEach(e => {
        lines += `
          <div class="sj-line">
            <div class="acc ${e.cr > 0 ? 'cr' : ''}">${escapeHtml(e.acc)}</div>
            <div class="num dr">${e.dr > 0 ? fmt(e.dr) : ''}</div>
            <div class="num cr">${e.cr > 0 ? fmt(e.cr) : ''}</div>
          </div>
        `;
      });
      card.innerHTML = `
        <div class="head">
          <div>
            <div class="date">${j.date}</div>
            <div class="desc">${escapeHtml(j.desc)}</div>
          </div>
          <button class="icon-btn-sm del" data-ji="${ji}"><i class="fas fa-trash"></i></button>
        </div>
        ${lines}
      `;
      card.querySelector('.del').addEventListener('click', () => {
        currentProject.journals.splice(ji, 1);
        saveCurrent();
        renderSavedJournals();
        AR.toast('Jurnal dihapus', 'fa-trash');
      });
      wrap.appendChild(card);
    });
  }

  function saveJournalEntry() {
    const date = $('#m4-date').value;
    const desc = $('#m4-desc').value.trim() || 'Jurnal Umum';
    if (!date) { AR.toast('Isi tanggal dulu ya!', 'fa-triangle-exclamation'); AR.sound.play('wrong'); return; }
    const rows = $$('#m4-rows .j-row');
    const entries = [];
    let dr = 0, cr = 0;
    rows.forEach(r => {
      const acc = r.querySelector('select').value;
      const drv = unfmt(r.querySelector('.dr').value);
      const crv = unfmt(r.querySelector('.cr').value);
      if (drv > 0 || crv > 0) {
        entries.push({ acc, dr: drv, cr: crv });
        dr += drv; cr += crv;
      }
    });
    if (entries.length < 2) {
      AR.toast('Jurnal minimal 2 baris!', 'fa-triangle-exclamation');
      AR.sound.play('wrong');
      return;
    }
    if (Math.round(dr) !== Math.round(cr)) {
      AR.toast(`Tidak balance! Dr ${fmt(dr)} ≠ Cr ${fmt(cr)}`, 'fa-triangle-exclamation');
      AR.sound.play('wrong');
      return;
    }
    currentProject.journals = currentProject.journals || [];
    currentProject.journals.push({ date, desc, entries });
    saveCurrent();
    AR.sound.play('correct');
    AR.toast('Jurnal tersimpan ✓', 'fa-circle-check');
    $('#m4-desc').value = '';
    // reset rows
    const wrap = $('#m4-rows');
    wrap.innerHTML = '';
    for (let i = 0; i < 3; i++) addJournalRow();
    renderSavedJournals();
  }

  /* ============ MOD 5 — NRV ============ */
  function renderMod5() {
    $('#m5-ar').value = currentProject.m5ar || '';
    $('#m5-all').value = currentProject.m5all || '';
    $('#m5-desc').value = currentProject.m5desc || '';
    calcNRV();
    $('#m5-ar').oninput = e => {
      e.target.value = fmt(unfmt(e.target.value));
      currentProject.m5ar = e.target.value;
      saveCurrent();
      calcNRV();
    };
    $('#m5-all').oninput = e => {
      e.target.value = fmt(unfmt(e.target.value));
      currentProject.m5all = e.target.value;
      saveCurrent();
      calcNRV();
    };
    $('#m5-desc').oninput = e => {
      currentProject.m5desc = e.target.value;
      saveCurrent();
    };
  }

  function calcNRV() {
    const ar = unfmt($('#m5-ar').value);
    const all = unfmt($('#m5-all').value);
    const nrv = ar - all;
    $('#m5-nrv').textContent = 'Rp ' + fmt(nrv);
    currentProject.m5nrv = nrv;
    saveCurrent();
  }

  /* ============ EXPORT PDF ============ */
  function initExport() {
    const btn = $('#export-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!currentProject) return;
      AR.sound.play('click');
      exportPDF();
    });
  }

  function exportPDF() {
    const p = currentProject;
    const win = window.open('', '_blank');
    if (!win) {
      AR.toast('Popup diblokir browser', 'fa-triangle-exclamation');
      return;
    }
    const totalEst = (p.aging || []).reduce((s, r) => s + (r.estimasi || 0), 0);
    const nrv = unfmt(p.m5ar) - unfmt(p.m5all);
    const journalsHTML = (p.journals || []).map(j => {
      let lines = j.entries.map(e => `
        <tr>
          <td style="${e.cr > 0 ? 'padding-left:28px;color:#666;' : ''}">${escapeHtml(e.acc)}</td>
          <td style="text-align:right;font-family:monospace;color:#059669;">${e.dr > 0 ? fmt(e.dr) : ''}</td>
          <td style="text-align:right;font-family:monospace;color:#d97706;">${e.cr > 0 ? fmt(e.cr) : ''}</td>
        </tr>`).join('');
      return `
        <div class="journal">
          <div class="jhead"><strong>${j.date}</strong> — ${escapeHtml(j.desc)}</div>
          <table>${lines}</table>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="id"><head>
<meta charset="UTF-8">
<title>Portofolio Analisis Piutang — ${escapeHtml(p.company)}</title>
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; line-height: 1.55; margin: 0; padding: 20px; }
  h1 { font-size: 22px; margin: 0 0 4px; text-align: center; letter-spacing: -0.02em; }
  .sub { text-align: center; color: #64748b; font-size: 12px; margin-bottom: 24px; }
  .sub strong { color: #7c3aed; }
  h2 { font-size: 15px; color: #7c3aed; margin: 28px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #ede9fe; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
  th { background: #f1f0f7; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e3ef; }
  td.amt, th.amt { text-align: right; font-family: 'JetBrains Mono', monospace; }
  .total-row td { background: #ede9fe; font-weight: 800; color: #5b21b6; }
  .journal { border: 1px solid #e5e3ef; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; background: #fafafb; }
  .jhead { font-size: 12px; margin-bottom: 6px; color: #7c3aed; }
  .journal table { margin: 0; }
  .journal td { border: none; padding: 4px 8px; font-size: 11px; }
  .nrv-box { background: linear-gradient(135deg, #ede9fe, #cffafe); border: 1px solid #a78bfa; border-radius: 10px; padding: 18px 22px; margin-top: 14px; }
  .nrv-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
  .nrv-row.total { border-top: 2px solid #7c3aed; margin-top: 8px; padding-top: 12px; font-weight: 800; font-size: 15px; color: #5b21b6; }
  .interpret { background: #f8fafc; border-left: 4px solid #06b6d4; padding: 12px 16px; border-radius: 6px; margin-top: 12px; font-size: 12px; line-height: 1.7; }
  .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 40px; padding-top: 16px; border-top: 1px dashed #cbd5e1; font-family: monospace; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style>
</head><body>
<h1>PORTOFOLIO ANALISIS PIUTANG (ECL)</h1>
<div class="sub">
  <strong>${escapeHtml(p.company)}</strong> · Periode ${escapeHtml(p.period)}<br>
  Disusun oleh: ${escapeHtml(p.name)} · ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
</div>

<h2>A. Klasifikasi Piutang</h2>
<table>
  <thead><tr><th>Deskripsi Tagihan</th><th class="amt">Nominal (Rp)</th><th>Klasifikasi</th></tr></thead>
  <tbody>
    ${(p.klasifikasi || []).map(k => `<tr><td>${escapeHtml(k.nama)}</td><td class="amt">${fmt(k.nominal)}</td><td>${escapeHtml(k.klasifikasi)}</td></tr>`).join('')}
  </tbody>
</table>

<h2>B. Pengukuran Awal</h2>
<table>
  <tbody>
    <tr><td>Total Piutang Usaha Bruto</td><td class="amt">Rp ${escapeHtml(p.m2bruto || '0')}</td></tr>
    <tr><td>Syarat Pembayaran (Termin)</td><td class="amt">${escapeHtml(p.m2termin || '—')}</td></tr>
  </tbody>
</table>

<h2>C. Analisis Umur Piutang (Aging Schedule)</h2>
<table>
  <thead><tr><th>Pelanggan</th><th>Kategori Umur</th><th class="amt">Saldo (Rp)</th><th class="amt">Alokasi %</th><th class="amt">Estimasi (Rp)</th></tr></thead>
  <tbody>
    ${(p.aging || []).map(r => `<tr>
      <td>${escapeHtml(r.pelanggan)}</td>
      <td>${escapeHtml(r.kategori)}${r.hari ? ` (${r.hari} hari)` : ''}</td>
      <td class="amt">${fmt(r.saldo)}</td>
      <td class="amt">${r.alokasi || '—'}</td>
      <td class="amt">${fmt(r.estimasi)}</td>
    </tr>`).join('')}
    <tr class="total-row"><td colspan="4" style="text-align:right">Total Cadangan Kerugian Piutang</td><td class="amt">Rp ${fmt(totalEst)}</td></tr>
  </tbody>
</table>

<h2>D. Historis Jurnal</h2>
${journalsHTML || '<p style="font-size:12px;color:#94a3b8;">Belum ada jurnal tersimpan.</p>'}

<h2>E. Penyajian Laporan & Interpretasi NRV</h2>
<div class="nrv-box">
  <div class="nrv-row"><span>Piutang Usaha Bruto</span><span style="font-family:monospace;">Rp ${fmt(unfmt(p.m5ar))}</span></div>
  <div class="nrv-row"><span>Dikurangi: Cadangan Kerugian Piutang</span><span style="font-family:monospace;color:#dc2626;">(Rp ${fmt(unfmt(p.m5all))})</span></div>
  <div class="nrv-row total"><span>NILAI REALISASI BERSIH (NRV)</span><span style="font-family:monospace;">Rp ${fmt(nrv)}</span></div>
</div>
${p.m5desc ? `<div class="interpret"><strong>Interpretasi:</strong><br>${escapeHtml(p.m5desc).replace(/\n/g, '<br>')}</div>` : ''}

<div class="footer">Firhan Fahamzha · ATC 2026 · ITB Asia Malang<br>Dibuat dengan Account Receivable 101</div>

<div class="no-print" style="text-align:center;margin-top:30px;">
  <button onclick="window.print()" style="padding:12px 26px;border:none;border-radius:30px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:white;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 8px 20px rgba(124,58,237,0.3);">
    🖨️ Cetak / Simpan sebagai PDF
  </button>
</div>
</body></html>`;

    win.document.write(html);
    win.document.close();

    AR.toast('Portofolio siap! Klik tombol cetak di halaman baru.', 'fa-file-pdf', 3600);
    AR.sound.play('success');
    confettiBurst(50);
  }

  /* ============ INIT ============ */
  document.addEventListener('DOMContentLoaded', () => {
    AR.init({ particles: true });
    loadProjects();

    // Buttons
    initAuth();
    initOnboard();
    initExport();

    // Back buttons
    $$('[data-back-dash]').forEach(b => b.addEventListener('click', backToDash));

    // Mod 1 add row
    $('#m1-add')?.addEventListener('click', () => {
      currentProject.klasifikasi = currentProject.klasifikasi || [];
      currentProject.klasifikasi.push({ nama: '', nominal: 0, klasifikasi: 'Piutang Usaha' });
      saveCurrent();
      renderMod1();
    });
    $('#m1-save')?.addEventListener('click', () => markMod('mod1'));

    // Mod 2
    $('#m2-save')?.addEventListener('click', () => markMod('mod2'));

    // Mod 3
    $('#m3-add')?.addEventListener('click', () => {
      currentProject.aging = currentProject.aging || [];
      currentProject.aging.push({ pelanggan: '', kategori: 'Belum Jatuh Tempo', hari: null, saldo: 0, alokasi: '', estimasi: 0 });
      saveCurrent();
      renderMod3();
    });
    $('#m3-save')?.addEventListener('click', () => {
      const allFilled = (currentProject.aging || []).every(r => r.alokasi);
      if (!allFilled) {
        AR.toast('Masih ada slot % yang kosong. Drag chip ke semua baris!', 'fa-triangle-exclamation', 3200);
        AR.sound.play('wrong');
        return;
      }
      markMod('mod3');
    });

    // Mod 4
    $('#m4-add-row')?.addEventListener('click', addJournalRow);
    $('#m4-save-entry')?.addEventListener('click', saveJournalEntry);
    $('#m4-save')?.addEventListener('click', () => {
      if ((currentProject.journals || []).length < 1) {
        AR.toast('Simpan minimal 1 jurnal dulu!', 'fa-triangle-exclamation');
        AR.sound.play('wrong');
        return;
      }
      markMod('mod4');
    });

    // Mod 5
    $('#m5-save')?.addEventListener('click', () => {
      const desc = ($('#m5-desc').value || '').trim();
      if (!desc) {
        AR.toast('Tulis interpretasi NRV dulu ya!', 'fa-triangle-exclamation');
        AR.sound.play('wrong');
        return;
      }
      const nrv = unfmt($('#m5-ar').value) - unfmt($('#m5-all').value);
      if (nrv <= 0) {
        AR.toast('NRV masih ≤ 0. Cek input Piutang & CKPN!', 'fa-triangle-exclamation');
        AR.sound.play('wrong');
        return;
      }
      markMod('mod5');
    });

    // Topbar
    const themeBtn = $('[data-action="theme"]');
    const soundBtn = $('[data-action="sound"]');
    const shareBtn = $('[data-action="share"]');
    const homeBtn = $('#home-btn');

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
        AR.share('Account Receivable 101 · Workspace', 'Coba roleplay jadi staf AR di PT Tekno Mandiri Jaya!');
      });
    }
    if (homeBtn) {
      homeBtn.addEventListener('click', e => {
        e.preventDefault();
        if (currentProject) {
          saveCurrent();
          renderProjectsList();
        } else {
          window.location.href = 'index.html';
        }
      });
    }
  });
})();