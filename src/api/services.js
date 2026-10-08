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
  getDocuments() {
    return apiClient.get("/documents");
  },

  uploadDocument(documentData) {
    return apiClient.post("/documents", documentData);
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

  sendMessage(message) {
    return apiClient.post("/chat/messages", {
      message,
    });
  },
};