import { api } from './client';

export const documentApi = {
  getDocuments: (applicantId) => api.get(`/applicants/${applicantId}/documents`),
  uploadDocument: (applicantId, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.client.post(`/applicants/${applicantId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    }).then(res => res.data);
  },
  getDocumentStatus: (documentId) => api.get(`/documents/${documentId}/status`),
};

