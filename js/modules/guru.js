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
        <button class="btn btn-primary mb-3" onclick="GuruModule.openModal()">
          <i class="bi bi-person-plus me-1"></i> Tambah Guru Baru
        </button>
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

    // Ambil data Guru dan Pengampu secara simultan
    const [resGuru, resPengampu] = await Promise.all([
      apiCall('GET', 'getGuru', null, forceFetch),
      apiCall('GET', 'getPengampu', null, forceFetch)
    ]);

    if (resGuru.status === 'success') {
      this.data = resGuru.data;
      this.pengampuData = resPengampu.status === 'success' ? resPengampu.data : [];

      // Peta pencocokan ID Pengampu ke Nama Level yang Diampu
      const pengampuMap = {};
      this.pengampuData.forEach(p => {
        pengampuMap[p.id_pengampu] = p.level_yang_diampu;
      });

      // Format data untuk tabel (Ubah ID Pengampu menjadi Nama Level)
      const formattedData = this.data.map(g => ({
        ...g,
        nama_pengampu: pengampuMap[g.pengampu] || g.pengampu || '-'
      }));

      const headers = [
        { label: 'ID Guru', key: 'id_guru' },
        { label: 'Nama Guru', key: 'nama_guru' },
        { label: 'Unit', key: 'unit' },
        { label: 'Level', key: 'level' },
        { label: 'Pengampu', key: 'nama_pengampu' },
        { label: 'Status Syahada', key: 'status_syahada' }
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

    // Pastikan data pengampu sudah termuat
    if (this.pengampuData.length === 0) {
      const resP = await apiCall('GET', 'getPengampu');
      if (resP.status === 'success') this.pengampuData = resP.data;
    }

    // Ambil hanya angka dari ID saat Edit (misal: "GUR-001" -> "001")
    let rawIdNum = '';
    if (isEdit && editItem.id_guru) {
      rawIdNum = editItem.id_guru.replace(/^GUR-?/i, '');
    }

    // 1. Dropdown Pengampu (Diambil dari Master Pengampu)
    let pengampuOptions = `<option value="">-- Pilih Pengampu --</option>`;
    this.pengampuData.forEach(p => {
      const selected = isEdit && String(editItem.pengampu) === String(p.id_pengampu) ? 'selected' : '';
      pengampuOptions += `<option value="${p.id_pengampu}" ${selected}>${p.level_yang_diampu} (${p.id_pengampu})</option>`;
    });

    // 2. Dropdown Unit
    const listUnit = ['PAUD 1', 'PAUD 2', 'SD', 'SMP', 'SMA'];
    let unitOptions = `<option value="">-- Pilih Unit --</option>`;
    listUnit.forEach(u => {
      const selected = isEdit && editItem.unit === u ? 'selected' : '';
      unitOptions += `<option value="${u}" ${selected}>${u}</option>`;
    });

    // 3. Dropdown Level
    const listLevel = ['1', '2', '3', '4', '5', '6', '7', 'Pusat', 'Tahfidz'];
    let levelOptions = `<option value="">-- Pilih Level --</option>`;
    listLevel.forEach(l => {
      const selected = isEdit && String(editItem.level) === String(l) ? 'selected' : '';
      levelOptions += `<option value="${l}" ${selected}>${l}</option>`;
    });

    // 4. Dropdown Status Syahada
    const listStatus = ['Belum', 'Aktif', 'Tidak Aktif'];
    let statusOptions = '<option value="">-- Pilih Status --</option>';
    listStatus.forEach(s => {
      const selected = isEdit && editItem.status_syahada === s ? 'selected' : '';
      statusOptions += `<option value="${s}" ${selected}>${s}</option>`;
    });

    document.getElementById('formModalBody').innerHTML = `
      <form id="form-guru">
        <div class="mb-3">
          <label class="form-label">ID Guru</label>
          <div class="input-group">
            <span class="input-group-text fw-bold bg-light">GUR-</span>
            <input type="text" id="modal_id_guru_num" class="form-control" value="${rawIdNum}" placeholder="001" ${isEdit ? 'readonly' : 'required'}>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Nama Guru</label>
          <input type="text" id="modal_nama_guru" class="form-control" value="${isEdit ? editItem.nama_guru : ''}" placeholder="Masukkan nama lengkap" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Unit</label>
          <select id="modal_unit" class="form-select" required>
            ${unitOptions}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Level</label>
          <select id="modal_level" class="form-select" required>
            ${levelOptions}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Pengampu</label>
          <select id="modal_pengampu" class="form-select" required>
            ${pengampuOptions}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Status Syahada</label>
          <select id="modal_status_syahada" class="form-select" required>
            ${statusOptions}
          </select>
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

    const payload = {
      id_guru: fullId,
      nama_guru: document.getElementById('modal_nama_guru').value,
      unit: document.getElementById('modal_unit').value,
      level: document.getElementById('modal_level').value,
      pengampu: document.getElementById('modal_pengampu').value,
      status_syahada: document.getElementById('modal_status_syahada').value
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
  }
};
