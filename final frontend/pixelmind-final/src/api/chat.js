import { api } from './client';

export const chatApi = {
  getHistory: (applicantId) => Promise.resolve([]),
  sendMessage: (applicantId, message) => api.post(`/ai/chat`, { applicantId, message }),
};

