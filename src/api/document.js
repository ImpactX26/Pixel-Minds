import { api } from './client';

const getActiveId = (id) => id || localStorage.getItem('educaro_applicant_id') || 'default';

export const documentApi = {
  getDocuments: (applicantId) => api.get(`/applicants/${getActiveId(applicantId)}/documents`),
  uploadDocument: (applicantId, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.client.post(`/applicants/${getActiveId(applicantId)}/documents`, formData, {
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
