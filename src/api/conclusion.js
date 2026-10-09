import { api } from './client';

const getActiveId = (id) => id || localStorage.getItem('educaro_applicant_id') || 'default';

export const conclusionApi = {
  getConclusionReport: (applicantId) =>
    api.get(`/applicants/${getActiveId(applicantId)}/conclusion`),
  getRootConclusion: () =>
    api.get('/conclusion'),
};
