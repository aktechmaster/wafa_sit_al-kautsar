const TableEngine = {
  renderTable: function(containerId, headers, data, idKey, editCallback, deleteCallback) {
    let container = document.getElementById(containerId);
    
    // Penanganan jika container belum ada di DOM
    if (!container) {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.innerHTML = `<div id="${containerId}"></div>`;
        container = document.getElementById(containerId);
      } else {
        console.error(`Container '${containerId}' tidak ditemukan di DOM.`);
        return;
      }
    }

    const isAdmin = Auth.isAdmin();

    let html = `
      <div class="table-responsive">
        <table class="table table-striped table-hover bg-white rounded shadow-sm border">
          <thead class="table-dark">
            <tr>
              ${headers.map(h => `<th>${h.label}</th>`).join('')}
              ${isAdmin ? `<th>Aksi</th>` : ''}
            </tr>
          </thead>
          <tbody>
    `;

    if (!data || data.length === 0) {
      html += `<tr><td colspan="${headers.length + (isAdmin ? 1 : 0)}" class="text-center py-3 text-muted">Data belum ada</td></tr>`;
    } else {
      data.forEach(row => {
        html += `<tr>`;
        headers.forEach(h => {
          html += `<td>${row[h.key] !== undefined && row[h.key] !== '' ? row[h.key] : '-'}</td>`;
        });

        if (isAdmin) {
          html += `
            <td>
              <button class="btn btn-sm btn-warning me-1" onclick="${editCallback}('${row[idKey]}')">
                <i class="bi bi-pencil"></i> Edit
              </button>
              <button class="btn btn-sm btn-danger btn-sm" onclick="${deleteCallback}('${row[idKey]}')">
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
