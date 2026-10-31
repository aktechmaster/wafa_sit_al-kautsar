const TableEngine = {
  renderTable: function(containerId, headers, data, idKey, editCallback, deleteCallback) {
    const container = document.getElementById(containerId);
    const isAdmin = Auth.isAdmin();

    let html = `
      <div class="table-responsive">
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              ${headers.map(h => `<th>${h.label}</th>`).join('')}
              ${isAdmin ? `<th>Aksi</th>` : ''}
            </tr>
          </thead>
          <tbody>
    `;

    if (data.length === 0) {
      html += `<tr><td colspan="${headers.length + (isAdmin ? 1 : 0)}" class="text-center">Data tidak ditemukan</td></tr>`;
    } else {
      data.forEach(row => {
        html += `<tr>`;
        headers.forEach(h => {
          html += `<td>${row[h.key] || '-'}</td>`;
        });

        // Tampilkan tombol Aksi HANYA untuk Admin
        if (isAdmin) {
          html += `
            <td>
              <button class="btn btn-sm btn-warning me-1" onclick="${editCallback}('${row[idKey]}')">
                <i class="bi bi-pencil"></i> Edit
              </button>
              <button class="btn btn-sm btn-danger" onclick="${deleteCallback}('${row[idKey]}')">
                <i class="bi bi-trash"></i> Hapus
              </button>
            </td>
          `;
        }
        html += `</tr>`;
      });
    }

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }
};
