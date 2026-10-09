import { apiClient } from "./client";

export const applicantApi = {
  getProfile() {
    return apiClient.get("/applicant/profile");
  },

  updateProfile(profileData) {
    return apiClient.patch("/applicant/profile", profileData);
  },
};

export const journeyApi = {
  getJourney() {
    return apiClient.get("/journey");
  },
};

const getActiveId = (id) => id || localStorage.getItem('educaro_applicant_id') || 'default';

export const documentApi = {
  getDocuments(applicantId) {
    return apiClient.get(`/applicants/${getActiveId(applicantId)}/documents`);
  },

  uploadDocument(applicantId, file, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/applicants/${getActiveId(applicantId)}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  processDocument(documentId, rawText) {
    return apiClient.post(`/documents/${documentId}/process`, { rawText });
  },

  getVerificationResult(documentId) {
    return apiClient.get(`/documents/${documentId}/verification`);
  },
};

export const qualificationApi = {
  getQualification() {
    return apiClient.get("/qualification");
  },
};

export const nextActionApi = {
  getNextAction() {
    return apiClient.get("/next-action");
  },

  executeAction(actionId) {
    return apiClient.post(`/next-action/${actionId}/execute`);
  },
};

export const chatApi = {
  getHistory() {
    return apiClient.get("/chat/history");
  },

  getProfile(applicantId) {
    return apiClient.get(`/applicants/${getActiveId(applicantId)}/profile`).catch(() => apiClient.get("/applicant/profile"));
  },

  sendMessage(message, applicantId) {
    return apiClient.post("/ai/chat", {
      applicantId: getActiveId(applicantId),
      message,
    });
  },
};