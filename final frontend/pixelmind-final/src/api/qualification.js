import { api } from './client';

export const qualificationApi = {
  getRequirements: (applicantId) => api.get(`/applicants/${applicantId}/qualifications/requirements`),
  getResults: (applicantId) => api.get(`/applicants/${applicantId}/qualifications/results`),
};

