const BerandaModule = {
  init: async function() {
    document.getElementById('page-title').textContent = 'Overview';
    document.getElementById('module-action-area').innerHTML = '';
    
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2 text-muted">Memuat data infografis...</div>
      </div>
    `;

    // Mengambil data overview & data master guru secara paralel
    const [resOverview, resGuru] = await Promise.all([
      apiCall('GET', 'getOverview'),
      apiCall('GET', 'getGuru')
    ]);

    if (resOverview.status === 'success') {
      const dataOverview = resOverview.data;
      const guruList = (resGuru.status === 'success' && Array.isArray(resGuru.data)) ? resGuru.data : [];

      // 1. Agregasi Statistik Utama
      const totalGuru = guruList.length || dataOverview.totalGuru || 0;
      const syahadahCount = guruList.filter(g => g.status_syahada === 'Aktif').length;
      const tasmiCount = guruList.filter(g => String(g.tasmi).toLowerCase() === 'sudah').length;

      // 2. Agregasi Jumlah Guru Per Level
      const listLevel = ['1', '2', '3', '4', '5', '6', '7', 'Tahfidz', 'Pusat'];
      const levelCounts = {};
      listLevel.forEach(lvl => levelCounts[lvl] = 0);

      guruList.forEach(g => {
        const lvlKey = String(g.level || '').trim();
        if (levelCounts[lvlKey] !== undefined) {
          levelCounts[lvlKey]++;
        } else if (lvlKey) {
          levelCounts[lvlKey] = (levelCounts[lvlKey] || 0) + 1;
        }
      });

      // 3. Template Card Infografis Per Level
      const levelCardsHtml = Object.keys(levelCounts).map(lvl => {
        const count = levelCounts[lvl];
        const percentage = totalGuru > 0 ? Math.round((count / totalGuru) * 100) : 0;
        const labelLevel = (lvl === 'Pusat' || lvl === 'Tahfidz') ? lvl : `Level ${lvl}`;
        
        return `
          <div class="col-6 col-md-4 col-lg-3">
            <div class="card border border-light-subtle shadow-sm h-100">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-bold text-dark">${labelLevel}</span>
                  <span class="badge bg-primary rounded-pill px-2 py-1">${count} Guru</span>
                </div>
                <div class="progress" style="height: 6px;">
                  <div class="progress-bar bg-primary" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <div class="mt-1 text-end">
                  <small class="text-muted" style="font-size: 0.725rem;">${percentage}% dari total</small>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // 4. Render ke Layar
      container.innerHTML = `
        <!-- Ringkasan Kartu Utama (Row 1) -->
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <div class="card stat-card card-blue p-3 shadow-sm border-0">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="card-title text-white-50 small fw-semibold">TOTAL GURU</div>
                  <div class="card-value fs-2 fw-bold text-white">${totalGuru}</div>
                </div>
                <i class="bi bi-people-fill fs-1 text-white opacity-50"></i>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card bg-success p-3 shadow-sm border-0 text-white">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="card-title text-white-50 small fw-semibold">GURU SYAHADAH</div>
                  <div class="card-value fs-2 fw-bold">${syahadahCount}</div>
                </div>
                <i class="bi bi-patch-check-fill fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card bg-warning p-3 shadow-sm border-0 text-dark">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="card-title text-dark-50 small fw-semibold">SUDAH TASMI'</div>
                  <div class="card-value fs-2 fw-bold">${tasmiCount}</div>
                </div>
                <i class="bi bi-award-fill fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card card-teal p-3 shadow-sm border-0">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="card-title text-white-50 small fw-semibold">PENGAMPU</div>
                  <div class="card-value fs-2 fw-bold text-white">${dataOverview.totalPengampu || 0}</div>
                </div>
                <i class="bi bi-book-fill fs-1 text-white opacity-50"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Box Infografis Distribusi Level Guru (Row 2) -->
        <div class="card border-0 shadow-sm p-3">
          <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <h6 class="m-0 fw-bold text-secondary">
              <i class="bi bi-bar-chart-line-fill me-2 text-primary"></i>Rangkuman Jumlah Guru per Level
            </h6>
            <span class="badge bg-light text-dark border">Total ${totalGuru} Terdaftar</span>
          </div>
          <div class="row g-3">
            ${levelCardsHtml}
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `<div class="alert alert-danger">Gagal memuat data overview</div>`;
    }
  }
};
