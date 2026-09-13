function getDefaultProject(name, company, period) {
  return {
    id: uid(),
    name,
    company,
    period,
    createdAt: new Date().toISOString(),
    mod1: false, mod2: false, mod3: false, mod4: false, mod5: false,
    klasifikasi: [{ nama: '', nominal: 0, klasifikasi: 'Piutang Usaha' }],
    m2bruto: '',
    m2termin: '',
    aging: [{ pelanggan: '', kategori: 'Belum Jatuh Tempo', hari: null, saldo: 0, alokasi: '', estimasi: 0 }],
    journals: [],
    m5ar: '',
    m5all: '',
    m5nrv: '',
    m5desc: ''
  };
}
