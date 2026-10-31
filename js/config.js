const CONFIG = {
  // Ganti dengan Web App URL dari GAS
  API_URL: "https://script.google.com/macros/s/AKfycbx49XrGWi1ifQe-vT6o4zR6-1AeQfxjPvdXY5TvGs43rJ0PCrwet4oWZQsxZpBjYs8E/exec", 
  
  // Storage Key Helper
  USER_SESSION_KEY: "app_user_session"
};

// Helper Fetching Data
async function apiCall(method = 'GET', action = '', bodyData = null) {
  if (method === 'GET') {
    const response = await fetch(`${CONFIG.API_URL}?action=${action}`);
    return await response.json();
  } else {
    const userSession = Auth.getUserSession();
    const payload = {
      action: action,
      userRole: userSession ? userSession.role : 'Readonly',
      data: bodyData
    };
    
    // Web App GAS memerlukan parameter text/plain untuk CORS via POST
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return await response.json();
  }
}
