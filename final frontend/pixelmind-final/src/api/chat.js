import { api } from './client';

export const chatApi = {
  getHistory: (applicantId) => api.get(`/applicants/${applicantId}/chat/history`),
  sendMessage: (applicantId, message) => api.post(`/applicants/${applicantId}/chat/messages`, { message }),
};

