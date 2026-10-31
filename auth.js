const Auth = {
  getUserSession: function() {
    const session = localStorage.getItem(CONFIG.USER_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  isAdmin: function() {
    const user = this.getUserSession();
    return user && user.role === 'Admin';
  },

  checkAccess: function() {
    const user = this.getUserSession();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    this.renderUserInfo(user);
  },

  renderUserInfo: function(user) {
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    if (nameEl) nameEl.textContent = user.nama_user || 'User';
    if (roleEl) roleEl.textContent = user.role || 'Readonly';
  },

  logout: function() {
    localStorage.removeItem(CONFIG.USER_SESSION_KEY);
    window.location.href = 'login.html';
  }
};
