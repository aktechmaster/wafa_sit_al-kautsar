const GuruModule = {
  data: [],

  init: async function() {
    document.getElementById('page-title').textContent = 'Master Guru / Karyawan';
    this.renderHeader();
    await this.loadData();
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

  loadData: async function() {
    const mainContent = document.getElementById('main-content');
    // Bersihkan kartu beranda & tampilkan indikator loading
    mainContent.innerHTML = `
      <div id="table-container" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2 text-muted">Memuat data guru...</div>
      </div>
    `;

    const res = await apiCall('GET', 'getGuru');
    if (res.status === 'success') {
      this.data = res.data;
      const headers = [
        { label: 'ID Guru', key: 'id_guru' },
        { label: 'Nama Guru', key: 'nama_guru' },
        { label: 'Unit', key: 'unit' },
        { label: 'Level', key: 'level' },
        { label: 'Pengampu', key: 'pengampu' },
        { label: 'Status', key: 'status_aktif' }
      ];
      TableEngine.renderTable(
        'table-container',
        headers,
        this.data,
        'id_guru',
        'GuruModule.editData',
        'GuruModule.deleteData'
      );
    } else {
      mainContent.innerHTML = `<div class="alert alert-danger">Gagal memuat data guru: ${res.message || 'Terjadi kesalahan server'}</div>`;
    }
  },

  openModal: function(editItem = null) {
    const isEdit = editItem !== null;
    document.getElementById('formModalTitle').textContent = isEdit ? 'Edit Data Guru' : 'Tambah Guru Baru';
    
    document.getElementById('formModalBody').innerHTML = `
      <form id="form-guru">
        <div class="mb-3">
          <label class="form-label">ID Guru</label>
          <input type="text" id="modal_id_guru" class="form-control" value="${isEdit ? editItem.id_guru : ''}" ${isEdit ? 'readonly' : 'required'}>
        </div>
        <div class="mb-3">
          <label class="form-label">Nama Guru</label>
          <input type="text" id="modal_nama_guru" class="form-control" value="${isEdit ? editItem.nama_guru : ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Unit</label>
          <input type="text" id="modal_unit" class="form-control" value="${isEdit ? editItem.unit : ''}" placeholder="SDIT / SMPIT" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Level</label>
          <input type="text" id="modal_level" class="form-control" value="${isEdit ? editItem.level : ''}" placeholder="Tahsin 1" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Pengampu</label>
          <input type="text" id="modal_pengampu" class="form-control" value="${isEdit ? editItem.pengampu : ''}" placeholder="Jilid 1" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Status Aktif</label>
          <select id="modal_status_aktif" class="form-select">
            <option value="Aktif" ${isEdit && editItem.status_aktif === 'Aktif' ? 'selected' : ''}>Aktif</option>
            <option value="Nonaktif" ${isEdit && editItem.status_aktif === 'Nonaktif' ? 'selected' : ''}>Nonaktif</option>
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
    const payload = {
      id_guru: document.getElementById('modal_id_guru').value,
      nama_guru: document.getElementById('modal_nama_guru').value,
      unit: document.getElementById('modal_unit').value,
      level: document.getElementById('modal_level').value,
      pengampu: document.getElementById('modal_pengampu').value,
      status_aktif: document.getElementById('modal_status_aktif').value
    };

    const action = isEdit ? 'updateGuru' : 'createGuru';
    const res = await apiCall('POST', action, payload);
    alert(res.message);

    if (res.status === 'success') {
      bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
      this.loadData();
    }
  },

  deleteData: async function(id_guru) {
    if (confirm(`Apakah Anda yakin ingin menghapus guru ID ${id_guru}?`)) {
      const res = await apiCall('POST', 'deleteGuru', { id_guru: id_guru });
      alert(res.message);
      if (res.status === 'success') this.loadData();
    }
  }
};
