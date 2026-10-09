import { api } from './client';

const getActiveId = (id) => id || localStorage.getItem('educaro_applicant_id') || 'default';

export const chatApi = {
  getHistory: (applicantId) => api.get(`/applicants/${getActiveId(applicantId)}/chat/history`),
  clearHistory: (applicantId) => api.delete(`/applicants/${getActiveId(applicantId)}/chat/history`),
  sendMessage: (applicantId, message) => api.post('/ai/chat', { applicantId: getActiveId(applicantId), message }),
  sendVoiceMessage: (applicantId, audioBlob, mimeType) => {
    if (audioBlob instanceof Blob) {
      const formData = new FormData();
      formData.append('applicantId', getActiveId(applicantId));
      formData.append('audio', audioBlob, 'voice_recording.webm');
      if (mimeType) formData.append('mimeType', mimeType);
      return api.post('/ai/voice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/ai/voice', { applicantId: getActiveId(applicantId), audioBase64: audioBlob, mimeType });
  },
  getRequirements: (applicantId) => api.get(`/ai/requirements/${getActiveId(applicantId)}`),
  getProfile: (applicantId) => api.get(`/ai/profile/${getActiveId(applicantId)}`),
  generateRequirements: (applicantId, goal) => api.post('/ai/requirements/generate', { applicantId: getActiveId(applicantId), goal }),
  saveRequirements: (applicantId, payload) => api.post('/ai/requirements/save', { applicantId: getActiveId(applicantId), ...payload }),
};


