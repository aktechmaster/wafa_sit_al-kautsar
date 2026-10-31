const GuruModule = {
  data: [],
  pengampuData: [],

  init: async function(forceFetch = false) {
    document.getElementById('page-title').textContent = 'Master Guru / Karyawan';
    this.renderHeader();
    await this.loadData(forceFetch);
  },

  renderHeader: function() {
    const actionArea = document.getElementById('module-action-area');
    if (Auth.isAdmin()) {
      actionArea.innerHTML = `
        <div class="d-flex flex-wrap gap-2 mb-3">
          <button class="btn btn-primary" onclick="GuruModule.openModal()">
            <i class="bi bi-person-plus me-1"></i> Tambah Guru
          </button>
          <button class="btn btn-success" onclick="GuruModule.exportCSV()">
            <i class="bi bi-file-earmark-excel me-1"></i> Export CSV
          </button>
          <label class="btn btn-outline-secondary">
            <i class="bi bi-file-earmark-arrow-up me-1"></i> Import CSV
            <input type="file" id="csv-file-input" accept=".csv" style="display: none;" onchange="GuruModule.importCSV(event)">
          </label>
        </div>
      `;
    } else {
      actionArea.innerHTML = '';
    }
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

      const pengampuMap = {};
      this.pengampuData.forEach(p => {
        const valId = String(p.id_pengampu).trim();
        pengampuMap[valId] = p.nama_pengampu 
          ? `${p.nama_pengampu} (${p.level_yang_diampu})` 
          : (p.level_yang_diampu || valId);
      });

      const formattedData = this.data.map(g => {
        const rawPengampuId = String(g.id_pengampu !== undefined ? g.id_pengampu : (g.pengampu || '')).trim();
        return {
          ...g,
          id_pengampu: rawPengampuId,
          display_pengampu: rawPengampuId ? (pengampuMap[rawPengampuId] || rawPengampuId) : 'Pusat / Mandiri',
          tasmi: g.tasmi || 'Belum',
          keterangan_hafalan: g.keterangan_hafalan || '-'
        };
      });

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
        formattedData,
        'id_guru',
        'GuruModule.editData',
        'GuruModule.deleteData'
      );
    } else {
      mainContent.innerHTML = `<div class="alert alert-danger">Gagal memuat data guru: ${resGuru.message || 'Terjadi kesalahan server'}</div>`;
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
            <input type="text" id="modal_keterangan_hafalan" class="form-control" value="${isEdit ? (editItem.keterangan_hafalan || '') : ''}" placeholder="Contoh: 30 Juz / 5 Juz">
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

    const pengampuVal = document.getElementById('modal_pengampu').value;

    const payload = {
      id_guru: `GUR-${idNum}`,
      nama_guru: document.getElementById('modal_nama_guru').value,
      unit: document.getElementById('modal_unit').value,
      level: document.getElementById('modal_level').value,
      id_pengampu: pengampuVal,
      pengampu: pengampuVal,
      status_syahada: document.getElementById('modal_status_syahada').value,
      tasmi: document.getElementById('modal_tasmi').value,
      keterangan_hafalan: document.getElementById('modal_keterangan_hafalan').value
    };

    const action = isEdit ? 'updateGuru' : 'createGuru';
    const res = await apiCall('POST', action, payload);
    alert(res.message);

    if (res.status === 'success') {
      bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
      this.loadData(true);
    }
  },

  deleteData: async function(id_guru) {
    if (confirm(`Apakah Anda yakin ingin menghapus guru ID ${id_guru}?`)) {
      const res = await apiCall('POST', 'deleteGuru', { id_guru: id_guru });
      alert(res.message);
      if (res.status === 'success') this.loadData(true);
    }
  },

  // Fitur Export CSV (Excel Friendly)
  exportCSV: function() {
    if (!this.data || this.data.length === 0) {
      alert('Tidak ada data guru untuk diexport.');
      return;
    }

    const headers = ['id_guru', 'nama_guru', 'unit', 'level', 'id_pengampu', 'status_syahada', 'tasmi', 'keterangan_hafalan'];
    let csvContent = '\uFEFF' + headers.join(',') + '\n'; // Add BOM for Excel UTF-8 support

    this.data.forEach(row => {
      const values = headers.map(h => {
        let val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      });
      csvContent += values.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_Guru_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Fitur Import CSV (Mass Import)
  importCSV: function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split(/\r\n|\n/);
      if (lines.length < 2) {
        alert('File CSV kosong atau tidak valid!');
        return;
      }

      // Deteksi delimiter (koma atau titik koma)
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

      const importPayload = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const currentline = lines[i].split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''));
        let obj = {};
        headers.forEach((h, index) => {
          obj[h] = currentline[index] || '';
        });
        if (obj.id_guru || obj.nama_guru) {
          importPayload.push(obj);
        }
      }

      if (importPayload.length === 0) {
        alert('Tidak ada data valid yang bisa diimport.');
        return;
      }

      if (confirm(`Impor ${importPayload.length} data guru ke Google Sheets?`)) {
        const res = await apiCall('POST', 'importGuru', importPayload);
        alert(res.message);
        if (res.status === 'success') {
          this.loadData(true);
        }
      }
      event.target.value = ''; // Reset file input
    };

    reader.readAsText(file);
  }
};
