import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data)
};

export const deliveryService = {
  createDelivery: (data) => api.post('/deliveries', data),
  getMyDeliveries: (params) => api.get('/deliveries', { params }),
  getDelivery: (id) => api.get(`/deliveries/${id}`),
  uploadDocument: (deliveryId, documentType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/deliveries/${deliveryId}/documents/${documentType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  submitDelivery: (id) => api.post(`/deliveries/${id}/submit`),
  deleteDelivery: (id) => api.delete(`/deliveries/${id}`)
};

export const adminService = {
  getDeliveries: (filters) => {
    // Normaliza chaves do frontend para os parâmetros que o backend espera
    const params = {};
    if (!filters) return api.get('/admin/deliveries');
    if (filters.status) params.status = filters.status;
    if (filters.searchTerm) params.q = filters.searchTerm;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    return api.get('/admin/deliveries', { params });
  },
  getStatistics: (params) => api.get('/admin/statistics', { params }),
  getDeliveryDetails: (id) => api.get(`/admin/deliveries/${id}`),
  updateDelivery: (id, data) => api.put(`/admin/deliveries/${id}`, data),
  downloadDocument: (deliveryId, documentType) => 
    api.get(`/admin/deliveries/${deliveryId}/documents/${documentType}/download`, { 
      responseType: 'blob' 
    }),
  getDriverDetails: (driverId) => api.get(`/admin/drivers/${driverId}`),
  deleteDelivery: (id) => api.delete(`/admin/deliveries/${id}`),
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  // Reconciliação
  uploadReconciliation: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/reconciliation/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  applyReconciliation: (updates) => api.post('/admin/reconciliation/apply', { updates })
};
