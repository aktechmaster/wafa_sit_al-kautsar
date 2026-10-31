const GuruModule = {
  data: [],

  init: async function() {
    this.renderHeader();
    await this.loadData();
  },

  renderHeader: function() {
    const actionArea = document.getElementById('module-action-area');
    // Hanya tampilkan Tombol Tambah Guru jika role = Admin
    if (Auth.isAdmin()) {
      actionArea.innerHTML = `
        <button class="btn btn-primary mb-3" onclick="GuruModule.openFormModal()">
          + Tambah Guru
        </button>
      `;
    } else {
      actionArea.innerHTML = '';
    }
  },

  loadData: async function() {
    const res = await apiCall('GET', 'getGuru');
    if (res.status === 'success') {
      this.data = res.data;
      const headers = [
        { label: 'ID Guru', key: 'id_guru' },
        { label: 'Nama Guru', key: 'nama_guru' },
        { label: 'Unit', key: 'unit' },
        { label: 'Level', key: 'level' },
        { label: 'Pengampu', key: 'pengampu' }
      ];
      TableEngine.renderTable(
        'table-container',
        headers,
        this.data,
        'id_guru',
        'GuruModule.editData',
        'GuruModule.deleteData'
      );
    }
  },

  deleteData: async function(id_guru) {
    if (confirm(`Yakin ingin menghapus guru dengan ID ${id_guru}?`)) {
      const res = await apiCall('POST', 'deleteGuru', { id_guru: id_guru });
      alert(res.message);
      if (res.status === 'success') this.loadData();
    }
  }
};
