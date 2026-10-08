import { api } from './client';

export const qualificationApi = {
  getRequirements: (applicantId) => api.get(`/applicants/${applicantId}/requirements`),
  getResults: (applicantId) => api.get(`/applicants/${applicantId}/qualification`),
};

