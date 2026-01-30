const axios = require('axios');

(async () => {
  try {
    console.log('GET /api/health...');
    const h = await axios.get('http://localhost:5000/api/health', { timeout: 5000 });
    console.log('health:', h.data);
  } catch (e) {
    console.error('health error:', e.message);
  }

  try {
    console.log('POST /api/auth/login...');
    const r = await axios.post('http://localhost:5000/api/auth/login', { username: 'admin', password: 'admin123' }, { timeout: 5000 });
    console.log('login:', r.data);
  } catch (e) {
    console.error('login error:', e.message, e.response && e.response.status, e.response && e.response.data);
  }
})();