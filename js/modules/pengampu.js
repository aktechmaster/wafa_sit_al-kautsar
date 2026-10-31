const PengampuModule = {
  data: [],

  init: async function() {
    document.getElementById('page-title').textContent = 'Master Pengampu';
    this.renderHeader();
    await this.loadData();
  },

  renderHeader: function() {
    const actionArea = document.getElementById('module-action-area');
    if (Auth.isAdmin()) {
      actionArea.innerHTML = `
        <button class="btn btn-primary mb-3" onclick="PengampuModule.openModal()">
          <i class="bi bi-plus-circle me-1"></i> Tambah Pengampu
        </button>
      `;
    } else {
      actionArea.innerHTML = '';
    }
  },

  loadData: async function() {
    const container = document.getElementById('main-content');
    container.innerHTML = `<div id="table-container"></div>`;

    const res = await apiCall('GET', 'getPengampu');
    if (res.status === 'success') {
      this.data = res.data;
      const headers = [
        { label: 'ID Pengampu', key: 'id_pengampu' },
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
    }
  },

  openModal: function(editItem = null) {
    const isEdit = editItem !== null;
    document.getElementById('formModalTitle').textContent = isEdit ? 'Edit Pengampu' : 'Tambah Pengampu';
    
    document.getElementById('formModalBody').innerHTML = `
      <form id="form-pengampu">
        <div class="mb-3">
          <label class="form-label">ID Pengampu</label>
          <input type="text" id="modal_id_pengampu" class="form-control" value="${isEdit ? editItem.id_pengampu : ''}" ${isEdit ? 'readonly' : 'required'}>
        </div>
        <div class="mb-3">
          <label class="form-label">Level yang Diampu</label>
          <input type="text" id="modal_level_yang_diampu" class="form-control" value="${isEdit ? editItem.level_yang_diampu : ''}" required>
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
    const payload = {
      id_pengampu: document.getElementById('modal_id_pengampu').value,
      level_yang_diampu: document.getElementById('modal_level_yang_diampu').value
    };

    const action = isEdit ? 'updatePengampu' : 'createPengampu';
    const res = await apiCall('POST', action, payload);
    alert(res.message);

    if (res.status === 'success') {
      bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
      this.loadData();
    }
  },

  deleteData: async function(id_pengampu) {
    if (confirm(`Hapus pengampu ID ${id_pengampu}?`)) {
      const res = await apiCall('POST', 'deletePengampu', { id_pengampu });
      alert(res.message);
      if (res.status === 'success') this.loadData();
    }
  }
};
