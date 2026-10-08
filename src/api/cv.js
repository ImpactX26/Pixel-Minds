import { api } from './client';

export const cvApi = {
  generateCv: (applicantId = '123', data = {}) =>
    api.post(`/applicants/${applicantId}/cv/generate`, data),
  saveCv: (applicantId = '123', cvData = {}) =>
    api.post(`/applicants/${applicantId}/cv/save`, { applicantId, cvData }),
  getCv: (applicantId = '123') =>
    api.get(`/applicants/${applicantId}/cv`),
};
