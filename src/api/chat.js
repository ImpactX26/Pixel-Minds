import { api } from './client';

export const chatApi = {
  getHistory: (applicantId) => api.get(`/applicants/${applicantId}/chat/history`),
  sendMessage: (applicantId, message) => api.post('/ai/chat', { applicantId, message }),
  sendVoiceMessage: (applicantId, audioBlob, mimeType) => {
    if (audioBlob instanceof Blob) {
      const formData = new FormData();
      formData.append('applicantId', applicantId || '123');
      formData.append('audio', audioBlob, 'voice_recording.webm');
      if (mimeType) formData.append('mimeType', mimeType);
      return api.post('/ai/voice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/ai/voice', { applicantId, audioBase64: audioBlob, mimeType });
  },
  getRequirements: (applicantId) => api.get(`/ai/requirements/${applicantId}`),
  getProfile: (applicantId) => api.get(`/ai/profile/${applicantId}`),
};


