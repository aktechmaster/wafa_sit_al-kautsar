document.addEventListener('DOMContentLoaded', () => {
  // 1. Cek Sesi Login
  Auth.checkAccess();

  // 2. Event Routing Navigasi Sidebar
  const navLinks = document.querySelectorAll('.sidebar-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetModule = e.currentTarget.getAttribute('data-module');
      
      // Load Modul Sesuai Navigasi
      if (targetModule === 'guru') GuruModule.init();
      else if (targetModule === 'beranda') BerandaModule.init();
      // Tambahkan modul lainnya...
    });
  });

  // Default Init Beranda/Dashboard
  BerandaModule.init();
});
