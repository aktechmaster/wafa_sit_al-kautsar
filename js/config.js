const CONFIG = {
  // Ganti dengan Web App URL dari GAS
  API_URL: "https://script.google.com/macros/s/AKfycbx49XrGWi1ifQe-vT6o4zR6-1AeQfxjPvdXY5TvGs43rJ0PCrwet4oWZQsxZpBjYs8E/exec", 
  
  // Storage Key Helper
  USER_SESSION_KEY: "app_user_session"
};

// Engine Cache Sederhana di Memori Client
const AppCache = {
  storage: {},

  // Ambil data dari cache jika ada
  get: function(key) {
    return this.storage[key] || null;
  },

  // Simpan data ke cache
  set: function(key, data) {
    this.storage[key] = data;
  },

  // Hapus cache spesifik atau seluruh cache
  clear: function(key = null) {
    if (key) {
      delete this.storage[key];
    } else {
      this.storage = {}; // Reset total
    }
  }
};

/**
 * Helper Fetching Data Terintegrasi Cache
 * @param {string} method 'GET' atau 'POST'
 * @param {string} action Nama endpoint action
 * @param {object} bodyData Payload data (untuk POST)
 * @param {boolean} forceFetch Paksa ambil dari GAS (abaikan cache)
 */
async function apiCall(method = 'GET', action = '', bodyData = null, forceFetch = false) {
  if (method === 'GET') {
    // 1. Cek apakah data sudah tersimpan di Cache
    if (!forceFetch) {
      const cachedResponse = AppCache.get(action);
      if (cachedResponse) {
        return cachedResponse; // Return instan tanpa request jaringan
      }
    }

    // 2. Request ke GAS jika cache kosong atau forceFetch = true
    const response = await fetch(`${CONFIG.API_URL}?action=${action}`);
    const result = await response.json();

    // 3. Simpan hasil response ke Cache jika sukses
    if (result.status === 'success') {
      AppCache.set(action, result);
    }
    return result;

  } else {
    // Handling Request POST (Create / Update / Delete)
    const userSession = Auth.getUserSession();
    const payload = {
      action: action,
      userRole: userSession ? userSession.role : 'Readonly',
      data: bodyData
    };
    
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    // 4. Invalidasi/Reset Cache otomatis jika terjadi manipulasi data
    if (result.status === 'success') {
      AppCache.clear();
    }

    return result;
  }
}
