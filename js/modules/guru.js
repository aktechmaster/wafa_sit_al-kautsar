const GuruModule = {
  data: [],
  pengampuData: [],
  formattedData: [],
  // State Filter & Search
  searchTerm: '',
  filterUnit: '',
  filterLevel: '',
  filterStatus: '',

  init: async function(forceFetch = false) {
    document.getElementById('page-title').textContent = 'Master Guru / Karyawan';
    this.renderHeader();
    await this.loadData(forceFetch);
  },

  renderHeader: function() {
    const actionArea = document.getElementById('module-action-area');
    
    // Pilihan Filter Dropdown
    const listUnit = ['PAUD 1', 'PAUD 2', 'SD', 'SMP', 'SMA'];
    const listLevel = ['1', '2', '3', '4', '5', '6', '7', 'Pusat', 'Tahfidz'];
    const listStatus = ['Belum', 'Aktif', 'Tidak Aktif'];

    let unitFilterOpts = '<option value="">Semua Unit</option>' + listUnit.map(u => `<option value="${u}">${u}</option>`).join('');
    let levelFilterOpts = '<option value="">Semua Level</option>' + listLevel.map(l => `<option value="${l}">Level ${l}</option>`).join('');
    let statusFilterOpts = '<option value="">Semua Status Syahada</option>' + listStatus.map(s => `<option value="${s}">${s}</option>`).join('');

    let buttonsHtml = '';
    if (Auth.isAdmin()) {
      buttonsHtml = `
        <div class="d-flex flex-wrap gap-2 mb-3">
          <button class="btn btn-primary" onclick="GuruModule.openModal()">
            <i class="bi bi-person-plus me-1"></i> Tambah Guru
          </button>
          <button class="btn btn-warning text-dark fw-bold" onclick="GuruModule.openMutasiModal()">
            <i class="bi bi-arrow-repeat me-1"></i> Mutasi Massal
          </button>
          <button class="btn btn-danger fw-bold" onclick="GuruModule.deleteMassal()">
            <i class="bi bi-trash me-1"></i> Hapus Terpilih
          </button>
          <button class="btn btn-success" onclick="GuruModule.exportExcel()">
            <i class="bi bi-file-earmark-excel me-1"></i> Export Excel
          </button>
          <label class="btn btn-outline-success">
            <i class="bi bi-file-earmark-arrow-up me-1"></i> Import Excel
            <input type="file" id="excel-file-input" accept=".xlsx, .xls" style="display: none;" onchange="GuruModule.importExcel(event)">
          </label>
        </div>
      `;
    }

    // Panel Kotak Pencarian, Dropdown Filter, & Indikator Total Data
    actionArea.innerHTML = `
      ${buttonsHtml}
      <div class="card card-body bg-light mb-2 border-0 shadow-sm p-2">
        <div class="row g-2 align-items-center">
          <div class="col-md-3">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input type="text" id="search-input" class="form-control" placeholder="Cari Nama / ID Guru / Hafalan..." oninput="GuruModule.handleSearch(this.value)">
            </div>
          </div>
          <div class="col-md-2">
            <select id="filter-unit" class="form-select form-select-sm" onchange="GuruModule.handleFilterUnit(this.value)">
              ${unitFilterOpts}
            </select>
          </div>
          <div class="col-md-2">
            <select id="filter-level" class="form-select form-select-sm" onchange="GuruModule.handleFilterLevel(this.value)">
              ${levelFilterOpts}
            </select>
          </div>
          <div class="col-md-3">
            <select id="filter-status" class="form-select form-select-sm" onchange="GuruModule.handleFilterStatus(this.value)">
              ${statusFilterOpts}
            </select>
          </div>
          <div class="col-md-2 text-end d-flex align-items-center justify-content-end gap-2">
            <span id="data-counter-badge" class="badge bg-dark px-2 py-2 fw-semibold">Total: 0 Guru</span>
            <button class="btn btn-sm btn-outline-secondary" title="Reset Filter" onclick="GuruModule.resetFilters()">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  loadData: async function(forceFetch = false) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div id="table-container" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2 text-muted">Memuat data guru...</div>
      </div>
    `;

    const [resGuru, resPengampu] = await Promise.all([
      apiCall('GET', 'getGuru', null, forceFetch),
      apiCall('GET', 'getPengampu', null, forceFetch)
    ]);

    if (resGuru.status === 'success') {
      this.data = resGuru.data;
      this.pengampuData = resPengampu.status === 'success' ? resPengampu.data : [];
      this.rebuildFormattedData();
      this.renderFilteredTable();
    } else {
      mainContent.innerHTML = `<div class="alert alert-danger">Gagal memuat data guru: ${resGuru.message || 'Terjadi kesalahan server'}</div>`;
    }
  },

  rebuildFormattedData: function() {
    const pengampuMap = {};
    this.pengampuData.forEach(p => {
      const valId = String(p.id_pengampu).trim();
      pengampuMap[valId] = p.nama_pengampu 
        ? `${p.nama_pengampu} (${p.level_yang_diampu})` 
        : (p.level_yang_diampu || valId);
    });

    this.formattedData = this.data.map(g => {
      const rawPengampuId = String(g.id_pengampu !== undefined ? g.id_pengampu : (g.pengampu || '')).trim();
      return {
        ...g,
        id_pengampu: rawPengampuId,
        display_pengampu: rawPengampuId ? (pengampuMap[rawPengampuId] || rawPengampuId) : 'Pusat / Mandiri',
        tasmi: g.tasmi || 'Belum',
        keterangan_hafalan: g.keterangan_hafalan || '-'
      };
    });
  },

  renderFilteredTable: function() {
    const filtered = this.formattedData.filter(g => {
      const matchSearch = !this.searchTerm || 
        String(g.id_guru).toLowerCase().includes(this.searchTerm) ||
        String(g.nama_guru).toLowerCase().includes(this.searchTerm) ||
        String(g.keterangan_hafalan).toLowerCase().includes(this.searchTerm);

      const matchUnit = !this.filterUnit || g.unit === this.filterUnit;
      const matchLevel = !this.filterLevel || String(g.level) === String(this.filterLevel);
      const matchStatus = !this.filterStatus || g.status_syahada === this.filterStatus;

      return matchSearch && matchUnit && matchLevel && matchStatus;
    });

    // Update Badge Total Data Guru secara Real-time
    const badgeEl = document.getElementById('data-counter-badge');
    if (badgeEl) {
      if (filtered.length === this.data.length) {
        badgeEl.textContent = `Total: ${this.data.length} Guru`;
        badgeEl.className = 'badge bg-dark px-2 py-2 fw-semibold';
      } else {
        badgeEl.textContent = `Hasil: ${filtered.length} / ${this.data.length} Guru`;
        badgeEl.className = 'badge bg-primary px-2 py-2 fw-semibold';
      }
    }

    const headers = [
      { label: 'ID Guru', key: 'id_guru' },
      { label: 'Nama Guru', key: 'nama_guru' },
      { label: 'Unit', key: 'unit' },
      { label: 'Level', key: 'level' },
      { label: 'Pengampu', key: 'display_pengampu' },
      { label: 'Status Syahada', key: 'status_syahada' },
      { label: 'Tasmi\'', key: 'tasmi' },
      { label: 'Hafalan', key: 'keterangan_hafalan' }
    ];

    TableEngine.renderTable(
      'table-container',
      headers,
      filtered,
      'id_guru',
      'GuruModule.editData',
      'GuruModule.deleteData',
      true
    );
  },

  handleSearch: function(val) {
    this.searchTerm = val.toLowerCase().trim();
    this.renderFilteredTable();
  },
  handleFilterUnit: function(val) {
    this.filterUnit = val;
    this.renderFilteredTable();
  },
  handleFilterLevel: function(val) {
    this.filterLevel = val;
    this.renderFilteredTable();
  },
  handleFilterStatus: function(val) {
    this.filterStatus = val;
    this.renderFilteredTable();
  },
  resetFilters: function() {
    this.searchTerm = '';
    this.filterUnit = '';
    this.filterLevel = '';
    this.filterStatus = '';

    document.getElementById('search-input').value = '';
    document.getElementById('filter-unit').value = '';
    document.getElementById('filter-level').value = '';
    document.getElementById('filter-status').value = '';

    this.renderFilteredTable();
  },

  toggleCheckAll: function(source) {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => cb.checked = source.checked);
  },

  deleteMassal: async function() {
    const selectedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (selectedBoxes.length === 0) {
      alert('Pilih/centang minimal 1 guru yang ingin dihapus!');
      return;
    }

    const selectedIds = Array.from(selectedBoxes).map(cb => cb.value);

    if (confirm(`Apakah Anda YAKIN ingin menghapus ${selectedIds.length} data guru yang dicentang?`)) {
      const res = await apiCall('POST', 'bulkDeleteGuru', { ids: selectedIds });

      if (res.status === 'success') {
        this.data = this.data.filter(d => !selectedIds.includes(String(d.id_guru)));

        if (typeof AppCache !== 'undefined' && AppCache.set) {
          AppCache.set('getGuru', { status: 'success', data: this.data });
        }

        this.rebuildFormattedData();
        this.renderFilteredTable();
        alert(res.message);
      } else {
        alert(res.message || 'Gagal menghapus data massal');
      }
    }
  },

  openMutasiModal: async function() {
    const selectedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (selectedBoxes.length === 0) {
      alert('Pilih/centang minimal 1 guru yang ingin dimutasi!');
      return;
    }

    const selectedIds = Array.from(selectedBoxes).map(cb => cb.value);

    if (this.pengampuData.length === 0) {
      const resP = await apiCall('GET', 'getPengampu');
      if (resP.status === 'success') this.pengampuData = resP.data;
    }

    const listLevel = ['1', '2', '3', '4', '5', '6', '7', 'Pusat', 'Tahfidz'];
    let levelOptions = `<option value="">-- Tetap / Tidak Diubah --</option>`;
    listLevel.forEach(l => {
      levelOptions += `<option value="${l}">Level ${l}</option>`;
    });

    let pengampuOptions = `<option value="">-- Tetap / Tidak Diubah --</option>`;
    pengampuOptions += `<option value="">Pusat / Mandiri (Tanpa Pengampu)</option>`;
    this.pengampuData.forEach(p => {
      const pId = String(p.id_pengampu).trim();
      const labelText = p.nama_pengampu 
        ? `${p.nama_pengampu} (${p.level_yang_diampu})` 
        : `${p.level_yang_diampu} (${pId})`;
      pengampuOptions += `<option value="${pId}">${labelText}</option>`;
    });

    document.getElementById('formModalTitle').textContent = `Mutasi Massal (${selectedIds.length} Guru Dipilih)`;
    document.getElementById('formModalBody').innerHTML = `
      <div class="alert alert-info py-2">
        <i class="bi bi-info-circle me-1"></i> Anda akan mengubah Level / Pengampu untuk <strong>${selectedIds.length} guru</strong> sekaligus.
      </div>
      <form id="form-mutasi">
        <div class="mb-3">
          <label class="form-label fw-bold">Level Baru</label>
          <select id="mutasi_level" class="form-select">${levelOptions}</select>
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold">Pengampu Baru</label>
          <select id="mutasi_pengampu" class="form-select">${pengampuOptions}</select>
        </div>
      </form>
    `;

    const saveBtn = document.getElementById('btn-save-modal');
    saveBtn.onclick = () => this.saveMutasiMassal(selectedIds);

    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    modal.show();
  },

  saveMutasiMassal: async function(selectedIds) {
    const newLevel = document.getElementById('mutasi_level').value;
    const newPengampu = document.getElementById('mutasi_pengampu').value;

    if (!newLevel && newPengampu === "") {
      alert('Pilih minimal Level Baru atau Pengampu Baru yang ingin diubah!');
      return;
    }

    const saveBtn = document.getElementById('btn-save-modal');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Memproses...`;

    const payload = {
      ids: selectedIds,
      level: newLevel,
      id_pengampu: newPengampu
    };

    const res = await apiCall('POST', 'bulkMutasiGuru', payload);

    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;

    if (res.status === 'success') {
      const modalEl = document.getElementById('formModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      this.data.forEach(g => {
        if (selectedIds.includes(String(g.id_guru))) {
          if (newLevel) g.level = newLevel;
          if (newPengampu !== "") {
            g.id_pengampu = newPengampu;
            g.pengampu = newPengampu;
          }
        }
      });

      if (typeof AppCache !== 'undefined' && AppCache.set) {
        AppCache.set('getGuru', { status: 'success', data: this.data });
      }

      this.rebuildFormattedData();
      this.renderFilteredTable();
    } else {
      alert(res.message || 'Gagal melakukan mutasi massal');
    }
  },

  openModal: async function(editItem = null) {
    const isEdit = editItem !== null;
    document.getElementById('formModalTitle').textContent = isEdit ? 'Edit Data Guru' : 'Tambah Guru Baru';

    if (this.pengampuData.length === 0) {
      const resP = await apiCall('GET', 'getPengampu');
      if (resP.status === 'success') this.pengampuData = resP.data;
    }

    let rawIdNum = '';
    if (isEdit && editItem.id_guru) {
      rawIdNum = String(editItem.id_guru).replace(/^GUR-?/i, '');
    }

    const currentPengampuId = isEdit 
      ? String(editItem.id_pengampu !== undefined ? editItem.id_pengampu : (editItem.pengampu || '')).trim()
      : '';

    let pengampuOptions = `<option value="">-- Tanpa Pengampu / Pengampu Pusat --</option>`;
    this.pengampuData.forEach(p => {
      const pId = String(p.id_pengampu).trim();
      const selected = isEdit && currentPengampuId === pId ? 'selected' : '';
      const labelText = p.nama_pengampu 
        ? `${p.nama_pengampu} (${p.level_yang_diampu})` 
        : `${p.level_yang_diampu} (${pId})`;
      pengampuOptions += `<option value="${pId}" ${selected}>${labelText}</option>`;
    });

    const listUnit = ['PAUD 1', 'PAUD 2', 'SD', 'SMP', 'SMA'];
    let unitOptions = `<option value="">-- Pilih Unit --</option>`;
    listUnit.forEach(u => {
      const selected = isEdit && editItem.unit === u ? 'selected' : '';
      unitOptions += `<option value="${u}" ${selected}>${u}</option>`;
    });

    const listLevel = ['1', '2', '3', '4', '5', '6', '7', 'Pusat', 'Tahfidz'];
    let levelOptions = `<option value="">-- Pilih Level --</option>`;
    listLevel.forEach(l => {
      const selected = isEdit && String(editItem.level) === String(l) ? 'selected' : '';
      levelOptions += `<option value="${l}" ${selected}>${l}</option>`;
    });

    const listStatus = ['Belum', 'Aktif', 'Tidak Aktif'];
    let statusOptions = '<option value="">-- Pilih Status Syahada --</option>';
    listStatus.forEach(s => {
      const selected = isEdit && editItem.status_syahada === s ? 'selected' : '';
      statusOptions += `<option value="${s}" ${selected}>${s}</option>`;
    });

    const listTasmi = ['Belum', 'Sudah'];
    let tasmiOptions = '';
    listTasmi.forEach(t => {
      const selected = isEdit && editItem.tasmi === t ? 'selected' : '';
      tasmiOptions += `<option value="${t}" ${selected}>${t}</option>`;
    });

    document.getElementById('formModalBody').innerHTML = `
      <form id="form-guru">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">ID Guru</label>
            <div class="input-group">
              <span class="input-group-text fw-bold bg-light">GUR-</span>
              <input type="text" id="modal_id_guru_num" class="form-control" value="${rawIdNum}" placeholder="001" ${isEdit ? 'readonly' : 'required'}>
            </div>
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Nama Guru</label>
            <input type="text" id="modal_nama_guru" class="form-control" value="${isEdit ? editItem.nama_guru : ''}" placeholder="Masukkan nama lengkap" required>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Unit</label>
            <select id="modal_unit" class="form-select" required>${unitOptions}</select>
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Level</label>
            <select id="modal_level" class="form-select" required>${levelOptions}</select>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Pengampu</label>
          <select id="modal_pengampu" class="form-select">${pengampuOptions}</select>
        </div>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label">Status Syahada</label>
            <select id="modal_status_syahada" class="form-select" required>${statusOptions}</select>
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">Tasmi'</label>
            <select id="modal_tasmi" class="form-select" required>${tasmiOptions}</select>
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">Keterangan Hafalan</label>
            <input type="text" id="modal_keterangan_hafalan" class="form-control" value="${isEdit ? (editItem.keterangan_hafalan || '') : ''}" placeholder="Contoh: 30 Juz">
          </div>
        </div>
      </form>
    `;

    const saveBtn = document.getElementById('btn-save-modal');
    saveBtn.onclick = () => this.saveData(isEdit);

    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    modal.show();
  },

  editData: function(id_guru) {
    const item = this.data.find(d => String(d.id_guru) === String(id_guru));
    if (item) this.openModal(item);
  },

  saveData: async function(isEdit) {
    const idNum = document.getElementById('modal_id_guru_num').value.trim();
    if (!idNum) {
      alert('Nomor ID Guru wajib diisi!');
      return;
    }

    const fullId = `GUR-${idNum}`;
    const pengampuVal = document.getElementById('modal_pengampu').value;

    const payload = {
      id_guru: fullId,
      nama_guru: document.getElementById('modal_nama_guru').value,
      unit: document.getElementById('modal_unit').value,
      level: document.getElementById('modal_level').value,
      id_pengampu: pengampuVal,
      pengampu: pengampuVal,
      status_syahada: document.getElementById('modal_status_syahada').value,
      tasmi: document.getElementById('modal_tasmi').value,
      keterangan_hafalan: document.getElementById('modal_keterangan_hafalan').value
    };

    const saveBtn = document.getElementById('btn-save-modal');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Menyimpan...`;

    const action = isEdit ? 'updateGuru' : 'createGuru';
    const res = await apiCall('POST', action, payload);

    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;

    if (res.status === 'success') {
      const modalEl = document.getElementById('formModal');
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();

      if (isEdit) {
        const index = this.data.findIndex(d => String(d.id_guru) === fullId);
        if (index !== -1) {
          this.data[index] = { ...this.data[index], ...payload };
        }
      } else {
        this.data.push(payload);
      }

      if (typeof AppCache !== 'undefined' && AppCache.set) {
        AppCache.set('getGuru', { status: 'success', data: this.data });
      }

      this.rebuildFormattedData();
      this.renderFilteredTable();
    } else {
      alert(res.message || 'Gagal menyimpan data');
    }
  },

  deleteData: async function(id_guru) {
    if (confirm(`Apakah Anda yakin ingin menghapus guru ID ${id_guru}?`)) {
      const res = await apiCall('POST', 'deleteGuru', { id_guru: id_guru });
      if (res.status === 'success') {
        this.data = this.data.filter(d => String(d.id_guru) !== String(id_guru));
        
        if (typeof AppCache !== 'undefined' && AppCache.set) {
          AppCache.set('getGuru', { status: 'success', data: this.data });
        }

        this.rebuildFormattedData();
        this.renderFilteredTable();
      } else {
        alert(res.message || 'Gagal menghapus data');
      }
    }
  },

  exportExcel: function() {
    if (!this.data || this.data.length === 0) {
      alert('Tidak ada data guru untuk diexport.');
      return;
    }

    const exportData = this.data.map(g => ({
      'id_guru': g.id_guru || '',
      'nama_guru': g.nama_guru || '',
      'unit': g.unit || '',
      'level': g.level || '',
      'id_pengampu': g.id_pengampu !== undefined ? g.id_pengampu : (g.pengampu || ''),
      'status_syahada': g.status_syahada || '',
      'tasmi': g.tasmi || '',
      'keterangan_hafalan': g.keterangan_hafalan || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Karyawan");
    XLSX.writeFile(workbook, `Data_Guru_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  importExcel: function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          alert('File Excel kosong!');
          return;
        }

        const importPayload = jsonData.map(row => ({
          id_guru: String(row.id_guru || row['ID Guru'] || '').trim(),
          nama_guru: String(row.nama_guru || row['Nama Guru'] || '').trim(),
          unit: String(row.unit || row['Unit'] || '').trim(),
          level: String(row.level || row['Level'] || '').trim(),
          id_pengampu: String(row.id_pengampu || row['ID Pengampu'] || row.pengampu || '').trim(),
          status_syahada: String(row.status_syahada || row['Status Syahada'] || '').trim(),
          tasmi: String(row.tasmi || row["Tasmi'"] || row.Tasmi || '').trim(),
          keterangan_hafalan: String(row.keterangan_hafalan || row['Keterangan Hafalan'] || row.Hafalan || '').trim()
        })).filter(item => item.id_guru || item.nama_guru);

        if (confirm(`Impor ${importPayload.length} data guru dari file Excel?`)) {
          const res = await apiCall('POST', 'importGuru', importPayload);
          alert(res.message);
          if (res.status === 'success') this.loadData(true);
        }
      } catch (err) {
        alert('Gagal membaca file Excel: ' + err.message);
      }
      event.target.value = '';
    };

    reader.readAsArrayBuffer(file);
  }
};
