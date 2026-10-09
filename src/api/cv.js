import { api } from './client';

const getActiveId = (id) => id || localStorage.getItem('educaro_applicant_id') || 'default';

export const cvApi = {
  generateCv: (applicantId, data = {}) =>
    api.post(`/applicants/${getActiveId(applicantId)}/cv/generate`, data),
  saveCv: (applicantId, cvData = {}) =>
    api.post(`/applicants/${getActiveId(applicantId)}/cv/save`, { applicantId: getActiveId(applicantId), cvData }),
  getCv: (applicantId) =>
    api.get(`/applicants/${getActiveId(applicantId)}/cv`),
};
