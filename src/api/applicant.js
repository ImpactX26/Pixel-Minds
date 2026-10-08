import { api } from './client';

export const applicantApi = {
  create: (data) => api.post('/applicants', data),
  getProfile: (applicantId) => api.get(`/applicants/${applicantId}`),
  getByEmail: (email) => api.get(`/applicants/by-email/${encodeURIComponent(email)}`),
  updateProfile: (applicantId, data) => api.put(`/applicants/${applicantId}`, data),
};


