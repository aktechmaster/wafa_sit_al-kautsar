const TableEngine = {
  renderTable: function(containerId, headers, data, idKey, editCallback, deleteCallback, enableCheckbox = false) {
    let container = document.getElementById(containerId);
    
    if (!container) {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.innerHTML = `<div id="${containerId}"></div>`;
        container = document.getElementById(containerId);
      } else {
        return;
      }
    }

    const isAdmin = Auth.isAdmin();

    // Container tabel dengan batas tinggi responsif sesuai layar
    let html = `
      <div class="table-responsive shadow-sm rounded border bg-white" style="max-height: calc(100vh - 320px); overflow-y: auto; position: relative;">
        <table class="table table-striped table-hover m-0 align-middle">
          <thead class="table-dark" style="position: sticky; top: 0; z-index: 5;">
            <tr>
              ${enableCheckbox && isAdmin ? `<th style="width: 40px; background-color: #212529; color: #fff; position: sticky; top: 0;" class="text-center"><input type="checkbox" class="form-check-input" id="check-all" onclick="GuruModule.toggleCheckAll(this)"></th>` : ''}
              ${headers.map(h => `<th style="background-color: #212529; color: #fff; position: sticky; top: 0;">${h.label}</th>`).join('')}
              ${isAdmin ? `<th style="width: 120px; background-color: #212529; color: #fff; position: sticky; top: 0;">Aksi</th>` : ''}
            </tr>
          </thead>
          <tbody>
    `;

    if (!data || data.length === 0) {
      const totalCol = headers.length + (isAdmin ? 1 : 0) + (enableCheckbox && isAdmin ? 1 : 0);
      html += `<tr><td colspan="${totalCol}" class="text-center py-4 text-muted">Data tidak ditemukan / belum ada data</td></tr>`;
    } else {
      data.forEach(row => {
        html += `<tr>`;
        if (enableCheckbox && isAdmin) {
          html += `<td class="text-center"><input type="checkbox" class="form-check-input row-checkbox" value="${row[idKey]}"></td>`;
        }
        headers.forEach(h => {
          html += `<td>${row[h.key] !== undefined && row[h.key] !== '' ? row[h.key] : '-'}</td>`;
        });

        if (isAdmin) {
          html += `
            <td>
              <button class="btn btn-sm btn-warning me-1" title="Edit" onclick="${editCallback}('${row[idKey]}')">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger" title="Hapus" onclick="${deleteCallback}('${row[idKey]}')">
                <i class="bi bi-trash"></i>
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
