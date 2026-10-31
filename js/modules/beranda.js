const BerandaModule = {
  init: async function() {
    document.getElementById('page-title').textContent = 'Overview';
    document.getElementById('module-action-area').innerHTML = '';
    
    const container = document.getElementById('main-content');
    container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>`;

    const res = await apiCall('GET', 'getOverview');
    if (res.status === 'success') {
      const data = res.data;
      container.innerHTML = `
        <div class="row g-3">
          <div class="col-md-4">
            <div class="card stat-card card-blue p-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="card-title">Total Guru</div>
                  <div class="card-value">${data.totalGuru || 0}</div>
                </div>
                <i class="bi bi-people-fill fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card stat-card card-green p-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="card-title">Total Level Pengampu</div>
                  <div class="card-value">${data.totalPengampu || 0}</div>
                </div>
                <i class="bi bi-book-fill fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card stat-card card-teal p-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="card-title">Total User Registered</div>
                  <div class="card-value">${data.totalUsers || 0}</div>
                </div>
                <i class="bi bi-person-badge-fill fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `<div class="alert alert-danger">Gagal memuat data overview</div>`;
    }
  }
};
