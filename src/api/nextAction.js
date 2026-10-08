import { api } from './client';

export const nextActionApi = {
  getRecommendedAction: (applicantId) => api.get(`/applicants/${applicantId}/next-action`),
  executeAction: (applicantId, actionId, data = {}) => api.post(`/applicants/${applicantId}/actions/${actionId}/execute`, data),
};

