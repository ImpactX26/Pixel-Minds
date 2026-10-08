import { api } from './client';

export const applicantApi = {
  getProfile: (applicantId) => api.get(`/applicants/${applicantId}/profile`),
  updateProfile: (applicantId, data) => api.patch(`/applicants/${applicantId}/profile`, data),
};

