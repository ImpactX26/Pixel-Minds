import { api } from './client';

export const documentApi = {
  getDocuments: (applicantId) => api.get(`/applicants/${applicantId}/documents`),
  uploadDocument: (applicantId, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicantId', applicantId);
    return api.client.post(`/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    }).then(res => res.data);
  },
  getDocumentStatus: (documentId) => api.get(`/documents/${documentId}`),
};

