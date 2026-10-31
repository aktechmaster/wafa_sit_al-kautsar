document.addEventListener('DOMContentLoaded', () => {
  // 1. Cek Sesi Login & Terapkan Hak Akses Role
  Auth.checkAccess();

  // 2. Event Listener Navigasi Sidebar
  const navLinks = document.querySelectorAll('.sidebar-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Kelola highlight class 'active' pada menu
      navLinks.forEach(item => item.classList.remove('active'));
      e.currentTarget.classList.add('active');

      // Ambil target modul dari attribute data-module
      const targetModule = e.currentTarget.getAttribute('data-module');

      // Eksekusi init modul sesuai pilihan menu
      switch (targetModule) {
        case 'beranda':
          BerandaModule.init();
          break;
        case 'guru':
          GuruModule.init();
          break;
        case 'pengampu':
          PengampuModule.init();
          break;
        case 'users':
          UsersModule.init();
          break;
        default:
          BerandaModule.init();
      }
    });
  });

  // Default Init (Beranda) saat pertama kali halaman dimuat
  BerandaModule.init();
});
