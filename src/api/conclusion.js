import { api } from './client';

export const conclusionApi = {
  getConclusionReport: (applicantId = '123') =>
    api.get(`/applicants/${applicantId}/conclusion`),
  getRootConclusion: () =>
    api.get('/conclusion'),
};
