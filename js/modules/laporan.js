const LaporanModule = {
  rawJurnalData: [],
  pengampuList: [],
  selectedYear: new Date().getFullYear().toString(),
  selectedPeriode: 'all',
  selectedPengampu: '',

  init: async function(forceFetch = false) {
    document.getElementById('page-title').textContent = 'Laporan Perkuliahan Wafa';
    
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2 text-muted">Memuat data Laporan Perkuliahan...</div>
      </div>
    `;

    // Ambil data Jurnal Kehadiran & Pengampu secara paralel
    const [resJurnal, resPengampu] = await Promise.all([
      apiCall('GET', 'getJurnal', null, forceFetch),
      apiCall('GET', 'getPengampu', null, forceFetch)
    ]);

    if (resJurnal.status === 'success') {
      this.rawJurnalData = resJurnal.data || [];
      this.pengampuList = resPengampu.status === 'success' ? (resPengampu.data || []) : [];

      this.renderHeaderAndFilters();
      this.renderReport();
    } else {
      container.innerHTML = `<div class="alert alert-danger">Gagal memuat data jurnal presensi: ${resJurnal.message || 'Terjadi kesalahan'}</div>`;
    }
  },

  renderHeaderAndFilters: function() {
    const actionArea = document.getElementById('module-action-area');

    // Dapatkan daftar tahun unik dari data Tanggal
    const yearsSet = new Set();
    const currentYearStr = new Date().getFullYear().toString();
    yearsSet.add(currentYearStr);

    this.rawJurnalData.forEach(row => {
      if (row.Tanggal) {
        const y = new Date(row.Tanggal).getFullYear().toString();
        if (!isNaN(y) && y.length === 4) yearsSet.add(y);
      }
    });

    const yearsOptions = Array.from(yearsSet).sort((a,b) => b - a).map(y => 
      `<option value="${y}" ${y === this.selectedYear ? 'selected' : ''}>Tahun ${y}</option>`
    ).join('');

    // Option Pengampu
    let pengampuOptions = '<option value="">Semua Pengampu</option>';
    this.pengampuList.forEach(p => {
      const pName = p.nama_pengampu || p.id_pengampu;
      pengampuOptions += `<option value="${pName}">${pName}</option>`;
    });

    actionArea.innerHTML = `
      <div class="card card-body bg-light mb-3 border-0 shadow-sm p-3">
        <div class="row g-2 align-items-center">
          <div class="col-md-3">
            <label class="form-label small fw-bold mb-1">Tahun Akademik</label>
            <select id="filter-laporan-tahun" class="form-select form-select-sm" onchange="LaporanModule.handleFilterChange()">
              ${yearsOptions}
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-bold mb-1">Periode Triwulan</label>
            <select id="filter-laporan-periode" class="form-select form-select-sm" onchange="LaporanModule.handleFilterChange()">
              <option value="all" ${this.selectedPeriode === 'all' ? 'selected' : ''}>Semua Periode (1 Tahun)</option>
              <option value="jul-sep" ${this.selectedPeriode === 'jul-sep' ? 'selected' : ''}>Juli – September (Triwulan 1)</option>
              <option value="okt-des" ${this.selectedPeriode === 'okt-des' ? 'selected' : ''}>Oktober – Desember (Triwulan 2)</option>
              <option value="jan-mar" ${this.selectedPeriode === 'jan-mar' ? 'selected' : ''}>Januari – Maret (Triwulan 3)</option>
              <option value="apr-jun" ${this.selectedPeriode === 'apr-jun' ? 'selected' : ''}>April – Juni (Triwulan 4)</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label small fw-bold mb-1">Pengampu</label>
            <select id="filter-laporan-pengampu" class="form-select form-select-sm" onchange="LaporanModule.handleFilterChange()">
              ${pengampuOptions}
            </select>
          </div>
          <div class="col-md-3 text-end d-flex align-items-end justify-content-end gap-2 pt-3">
            <button class="btn btn-sm btn-success w-100 fw-bold" onclick="LaporanModule.exportExcel()">
              <i class="bi bi-file-earmark-excel me-1"></i> Export Laporan
            </button>
          </div>
        </div>
      </div>
    `;
  },

  handleFilterChange: function() {
    this.selectedYear = document.getElementById('filter-laporan-tahun').value;
    this.selectedPeriode = document.getElementById('filter-laporan-periode').value;
    this.selectedPengampu = document.getElementById('filter-laporan-pengampu').value;
    this.renderReport();
  },

  renderReport: function() {
    const container = document.getElementById('main-content');

    // 1. Filter raw data berdasarkan periode & pengampu
    const filteredRows = this.rawJurnalData.filter(row => {
      if (!row.Tanggal) return false;
      
      const dt = new Date(row.Tanggal);
      const rowYear = dt.getFullYear().toString();
      const rowMonth = dt.getMonth() + 1; // 1 - 12

      if (rowYear !== this.selectedYear) return false;

      // Check Filter Periode
      if (this.selectedPeriode === 'jul-sep' && !(rowMonth >= 7 && rowMonth <= 9)) return false;
      if (this.selectedPeriode === 'okt-des' && !(rowMonth >= 10 && rowMonth <= 12)) return false;
      if (this.selectedPeriode === 'jan-mar' && !(rowMonth >= 1 && rowMonth <= 3)) return false;
      if (this.selectedPeriode === 'apr-jun' && !(rowMonth >= 4 && rowMonth <= 6)) return false;

      // Check Filter Pengampu
      if (this.selectedPengampu && row.Pengampu !== this.selectedPengampu) return false;

      return true;
    });

    // 2. Agregasi per Guru
    const guruMap = {};
    let grandHadir = 0, grandSakit = 0, grandIzin = 0, grandAlpha = 0;

    filteredRows.forEach(row => {
      const namaGuru = row['Nama Guru'] || row['nama_guru'] || 'Tanpa Nama';
      const pengampu = row['Pengampu'] || '-';
      const st = String(row['Status Kehadiran'] || row['status_kehadiran'] || '').trim().toUpperCase();

      if (!guruMap[namaGuru]) {
        guruMap[namaGuru] = {
          nama: namaGuru,
          pengampu: pengampu,
          H: 0, S: 0, I: 0, A: 0, total: 0
        };
      }

      if (st === 'H') { guruMap[namaGuru].H++; grandHadir++; }
      else if (st === 'S') { guruMap[namaGuru].S++; grandSakit++; }
      else if (st === 'I') { guruMap[namaGuru].I++; grandIzin++; }
      else if (st === 'A') { guruMap[namaGuru].A++; grandAlpha++; }
      
      guruMap[namaGuru].total++;
    });

    const reportList = Object.values(guruMap).map(g => {
      const pct = g.total > 0 ? Math.round((g.H / g.total) * 100) : 0;
      return {
        ...g,
        persentase: pct
      };
    });

    const grandTotal = grandHadir + grandSakit + grandIzin + grandAlpha;
    const avgPct = grandTotal > 0 ? Math.round((grandHadir / grandTotal) * 100) : 0;

    // 3. Render Widget & Tabel (dengan Scrollbar Vertikal)
    let tableRows = '';
    if (reportList.length === 0) {
      tableRows = `<tr><td colspan="8" class="text-center py-4 text-muted">Tidak ada data presensi pada periode ini.</td></tr>`;
    } else {
      tableRows = reportList.map((g, idx) => {
        let badgeClass = 'bg-success';
        if (g.persentase < 75) badgeClass = 'bg-danger';
        else if (g.persentase < 85) badgeClass = 'bg-warning text-dark';

        return `
          <tr>
            <td class="text-center fw-bold">${idx + 1}</td>
            <td class="fw-semibold">${g.nama}</td>
            <td>${g.pengampu}</td>
            <td class="text-center text-success fw-bold">${g.H}</td>
            <td class="text-center text-warning fw-bold">${g.S}</td>
            <td class="text-center text-info fw-bold">${g.I}</td>
            <td class="text-center text-danger fw-bold">${g.A}</td>
            <td class="text-center">
              <span class="badge ${badgeClass} px-2 py-1 fs-7">${g.persentase}% (${g.H}/${g.total})</span>
            </td>
          </tr>
        `;
      }).join('');
    }

    container.innerHTML = `
      <!-- Row Ringkasan Widget -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-primary text-white p-3">
            <div class="card-title small opacity-75">TOTAL ENTRI PRESENSI</div>
            <div class="fs-2 fw-bold">${grandTotal}</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-success text-white p-3">
            <div class="card-title small opacity-75">TOTAL HADIR (H)</div>
            <div class="fs-2 fw-bold">${grandHadir}</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm bg-warning text-dark p-3">
            <div class="card-title small opacity-75">TOTAL IZIN / SAKIT (I/S)</div>
            <div class="fs-2 fw-bold">${grandIzin + grandSakit}</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-0 shadow-sm text-white p-3" style="background-color: #0d9488;">
            <div class="card-title small opacity-75">RATA-RATA KEHADIRAN</div>
            <div class="fs-2 fw-bold">${avgPct}%</div>
          </div>
        </div>
      </div>

      <!-- Tabel Laporan Rekapitulasi (Scrollbar Vertikal + Sticky Header) -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-white py-3 border-bottom-0">
          <h6 class="m-0 fw-bold text-secondary">
            <i class="bi bi-table me-2 text-primary"></i>Rekapitulasi Kehadiran Guru Wafa
          </h6>
        </div>
        <div class="table-responsive" style="max-height: 520px; overflow-y: auto;">
          <table class="table table-hover align-middle m-0">
            <thead class="table-dark" style="position: sticky; top: 0; z-index: 10;">
              <tr>
                <th class="text-center" style="width: 50px;">No</th>
                <th>Nama Guru</th>
                <th>Pengampu</th>
                <th class="text-center">Hadir (H)</th>
                <th class="text-center">Sakit (S)</th>
                <th class="text-center">Izin (I)</th>
                <th class="text-center">Alpha (A)</th>
                <th class="text-center">% Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Simpan hasil agregasi untuk fitur export
    this.currentReportList = reportList;
  },

  exportExcel: function() {
    if (!this.currentReportList || this.currentReportList.length === 0) {
      alert('Tidak ada data laporan untuk diexport.');
      return;
    }

    const exportData = this.currentReportList.map((g, idx) => ({
      'No': idx + 1,
      'Nama Guru': g.nama,
      'Pengampu': g.pengampu,
      'Hadir (H)': g.H,
      'Sakit (S)': g.S,
      'Izin (I)': g.I,
      'Alpha (A)': g.A,
      'Total Presensi': g.total,
      'Persentase Kehadiran': `${g.persentase}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Perkuliahan");
    XLSX.writeFile(workbook, `Laporan_Perkuliahan_Wafa_${this.selectedYear}_${this.selectedPeriode}.xlsx`);
  }
};
