import { api } from './client';

export const applicantApi = {
  getProfile: (applicantId) => api.get(`/applicants/${applicantId}`),
  updateProfile: (applicantId, data) => api.put(`/applicants/${applicantId}`, data),
};

