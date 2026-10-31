const UsersModule = {
  data: [],

  init: async function() {
    document.getElementById('page-title').textContent = 'Master Users';
    this.renderHeader();
    await this.loadData();
  },

  renderHeader: function() {
    const actionArea = document.getElementById('module-action-area');
    if (Auth.isAdmin()) {
      actionArea.innerHTML = `
        <button class="btn btn-primary mb-3" onclick="UsersModule.openModal()">
          <i class="bi bi-person-plus me-1"></i> Tambah User Baru
        </button>
      `;
    } else {
      actionArea.innerHTML = '';
    }
  },

  loadData: async function() {
    const container = document.getElementById('main-content');
    container.innerHTML = `<div id="table-container"></div>`;

    const res = await apiCall('GET', 'getUsers');
    if (res.status === 'success') {
      this.data = res.data;
      const headers = [
        { label: 'ID User', key: 'id_user' },
        { label: 'Nama User', key: 'nama_user' },
        { label: 'Username', key: 'username' },
        { label: 'Role', key: 'role' }
      ];
      TableEngine.renderTable(
        'table-container',
        headers,
        this.data,
        'id_user',
        'UsersModule.editData',
        'UsersModule.deleteData'
      );
    }
  },

  openModal: function(editItem = null) {
    const isEdit = editItem !== null;
    document.getElementById('formModalTitle').textContent = isEdit ? 'Edit User' : 'Tambah User';
    
    document.getElementById('formModalBody').innerHTML = `
      <form id="form-user">
        <div class="mb-3">
          <label class="form-label">ID User</label>
          <input type="text" id="modal_id_user" class="form-control" value="${isEdit ? editItem.id_user : ''}" ${isEdit ? 'readonly' : 'required'}>
        </div>
        <div class="mb-3">
          <label class="form-label">Nama User</label>
          <input type="text" id="modal_nama_user" class="form-control" value="${isEdit ? editItem.nama_user : ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Username</label>
          <input type="text" id="modal_username" class="form-control" value="${isEdit ? editItem.username : ''}" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Password ${isEdit ? '(Kosongkan jika tidak diganti)' : ''}</label>
          <input type="password" id="modal_password" class="form-control" ${isEdit ? '' : 'required'}>
        </div>
        <div class="mb-3">
          <label class="form-label">Role Akses</label>
          <select id="modal_role" class="form-select">
            <option value="Readonly" ${isEdit && editItem.role === 'Readonly' ? 'selected' : ''}>Readonly</option>
            <option value="Admin" ${isEdit && editItem.role === 'Admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
      </form>
    `;

    const saveBtn = document.getElementById('btn-save-modal');
    saveBtn.onclick = () => this.saveData(isEdit);

    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    modal.show();
  },

  editData: function(id_user) {
    const item = this.data.find(d => String(d.id_user) === String(id_user));
    if (item) this.openModal(item);
  },

  saveData: async function(isEdit) {
    const passwordInput = document.getElementById('modal_password').value;
    const payload = {
      id_user: document.getElementById('modal_id_user').value,
      nama_user: document.getElementById('modal_nama_user').value,
      username: document.getElementById('modal_username').value,
      role: document.getElementById('modal_role').value
    };
    
    if (passwordInput !== '') {
      payload.password = passwordInput;
    }

    const action = isEdit ? 'updateUser' : 'createUser';
    const res = await apiCall('POST', action, payload);
    alert(res.message);

    if (res.status === 'success') {
      bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
      this.loadData();
    }
  },

  deleteData: async function(id_user) {
    if (confirm(`Hapus user ID ${id_user}?`)) {
      const res = await apiCall('POST', 'deleteUser', { id_user });
      alert(res.message);
      if (res.status === 'success') this.loadData();
    }
  }
};
