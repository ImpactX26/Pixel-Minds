import { api } from './client';

export const journeyApi = {
  getJourney: (applicantId) => api.get(`/applicants/${applicantId}/journey`),
  getJourneyStages: (applicantId) => api.get(`/applicants/${applicantId}/journey/stages`),
};

