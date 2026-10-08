import { api } from './client';

export const documentApi = {
  getDocuments: (applicantId = '123') => api.get(`/applicants/${applicantId}/documents`),
  uploadDocument: (applicantId = '123', file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.client.post(`/applicants/${applicantId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    }).then(res => res.data);
  },
  processDocument: (documentId, rawText) => api.post(`/documents/${documentId}/process`, { rawText }),
  getVerificationResult: (documentId) => api.get(`/documents/${documentId}/verification`),
  getDocumentStatus: (documentId) => api.get(`/documents/${documentId}/status`),
};
