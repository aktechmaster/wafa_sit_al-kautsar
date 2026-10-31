let currentActiveModule = 'beranda';

document.addEventListener('DOMContentLoaded', () => {
  Auth.checkAccess();

  const navLinks = document.querySelectorAll('.sidebar-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      navLinks.forEach(item => item.classList.remove('active'));
      e.currentTarget.classList.add('active');

      const targetModule = e.currentTarget.getAttribute('data-module');
      loadModule(targetModule);
    });
  });

  // Default Init Beranda
  loadModule('beranda');
});

// Central Module Router
function loadModule(moduleName, forceFetch = false) {
  currentActiveModule = moduleName;

  switch (moduleName) {
    case 'beranda':
      BerandaModule.init(forceFetch);
      break;
    case 'guru':
      GuruModule.init(forceFetch);
      break;
    case 'pengampu':
      PengampuModule.init(forceFetch);
      break;
    case 'users':
      UsersModule.init(forceFetch);
      break;
    default:
      BerandaModule.init(forceFetch);
  }
}

// Handler Tombol Refresh Data Topbar
function refreshCurrentModule() {
  AppCache.clear(); // Bersihkan seluruh cache di memori
  loadModule(currentActiveModule, true); // Paksa ambil data baru dari GAS
}
