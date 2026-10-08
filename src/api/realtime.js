// Example implementation for SSE/WebSocket
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:5173/api/ws";

export const createWebSocketConnection = (applicantId, onMessage) => {
  const ws = new WebSocket(`${WS_BASE_URL}?applicantId=${applicantId}`);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('Failed to parse WebSocket message', e);
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Implement reconnection logic here if needed
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return ws;
};

// Or SSE alternative
const SSE_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const createSSEConnection = (applicantId, onMessage) => {
  const eventSource = new EventSource(`${SSE_BASE_URL}/applicants/${applicantId}/events`);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('Failed to parse SSE message', e);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
  };
  
  return eventSource;
};

