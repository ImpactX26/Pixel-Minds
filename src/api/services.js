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

export const documentApi = {
  getDocuments(applicantId = '123') {
    return apiClient.get(`/applicants/${applicantId}/documents`);
  },

  uploadDocument(applicantId = '123', file, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/applicants/${applicantId}/documents`, formData, {
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

  getProfile(applicantId = '123') {
    return apiClient.get(`/applicants/${applicantId}/profile`).catch(() => apiClient.get("/applicant/profile"));
  },

  sendMessage(message, applicantId = 'default') {
    return apiClient.post("/ai/chat", {
      applicantId,
      message,
    });
  },
};