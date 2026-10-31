const PengampuModule = {
  data: [],

  init: async function(forceFetch = false) {
    document.getElementById('page-title').textContent = 'Master Pengampu';
    this.renderHeader();
    await this.loadData(forceFetch);
  },

  renderHeader: function() {
    const actionArea = document.getElementById('module-action-area');
    if (Auth.isAdmin()) {
      actionArea.innerHTML = `
        <button class="btn btn-primary mb-3" onclick="PengampuModule.openModal()">
          <i class="bi bi-plus-circle me-1"></i> Tambah Pengampu Baru
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
        <div class="mt-2 text-muted">Memuat data pengampu...</div>
      </div>
    `;

    const res = await apiCall('GET', 'getPengampu', null, forceFetch);
    if (res.status === 'success') {
      this.data = res.data;
      const headers = [
        { label: 'ID Pengampu', key: 'id_pengampu' },
        { label: 'Nama Pengampu', key: 'nama_pengampu' },
        { label: 'Level yang Diampu', key: 'level_yang_diampu' }
      ];
      TableEngine.renderTable(
        'table-container',
        headers,
        this.data,
        'id_pengampu',
        'PengampuModule.editData',
        'PengampuModule.deleteData'
      );
    } else {
      mainContent.innerHTML = `<div class="alert alert-danger">Gagal memuat data pengampu.</div>`;
    }
  },

  openModal: function(editItem = null) {
    const isEdit = editItem !== null;
    document.getElementById('formModalTitle').textContent = isEdit ? 'Edit Pengampu' : 'Tambah Pengampu';
    
    let rawIdNum = '';
    if (isEdit && editItem.id_pengampu) {
      rawIdNum = editItem.id_pengampu.replace(/^PGM-?/i, '');
    }

    document.getElementById('formModalBody').innerHTML = `
      <form id="form-pengampu">
        <div class="mb-3">
          <label class="form-label">ID Pengampu</label>
          <div class="input-group">
            <span class="input-group-text fw-bold bg-light">PGM-</span>
            <input type="text" id="modal_id_pengampu_num" class="form-control" value="${rawIdNum}" placeholder="001" ${isEdit ? 'readonly' : 'required'}>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Nama Pengampu</label>
          <input type="text" id="modal_nama_pengampu" class="form-control" value="${isEdit ? (editItem.nama_pengampu || '') : ''}" placeholder="Contoh: Ust. Ahmad" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Level yang Diampu</label>
          <input type="text" id="modal_level_yang_diampu" class="form-control" value="${isEdit ? editItem.level_yang_diampu : ''}" placeholder="Contoh: Jilid 1 & 2" required>
        </div>
      </form>
    `;

    const saveBtn = document.getElementById('btn-save-modal');
    saveBtn.onclick = () => this.saveData(isEdit);

    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    modal.show();
  },

  editData: function(id_pengampu) {
    const item = this.data.find(d => String(d.id_pengampu) === String(id_pengampu));
    if (item) this.openModal(item);
  },

  saveData: async function(isEdit) {
    const idNum = document.getElementById('modal_id_pengampu_num').value.trim();
    if (!idNum) {
      alert('Nomor ID Pengampu wajib diisi!');
      return;
    }

    const payload = {
      id_pengampu: `PGM-${idNum}`,
      nama_pengampu: document.getElementById('modal_nama_pengampu').value,
      level_yang_diampu: document.getElementById('modal_level_yang_diampu').value
    };

    const action = isEdit ? 'updatePengampu' : 'createPengampu';
    const res = await apiCall('POST', action, payload);
    alert(res.message);

    if (res.status === 'success') {
      bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
      this.loadData(true);
    }
  },

  deleteData: async function(id_pengampu) {
    if (confirm(`Hapus pengampu ID ${id_pengampu}?`)) {
      const res = await apiCall('POST', 'deletePengampu', { id_pengampu });
      alert(res.message);
      if (res.status === 'success') this.loadData(true);
    }
  }
};
