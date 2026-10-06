const BASE_URL = "http://localhost:8080/api";

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";
  return headers;
};

const handleResponse = async (res) => {
  if (res.status === 401 || res.status === 403) {
    const isGuest = localStorage.getItem("isGuest") === "true";
    if (isGuest) {
      throw new Error("AUTH_REQUIRED: Please log in or create an account.");
    } else {
      localStorage.clear();
      window.location.reload();
      throw new Error("AUTH_REQUIRED: Your session has expired.");
    }
  }
  
  if (res.status === 429) {
    const isGuest = localStorage.getItem("isGuest") === "true";
    if (isGuest) {
      // Guest hit their 10-call limit
      throw new Error("GUEST_LIMIT_REACHED: Please log in to continue.");
    } else {
      // Registered user hit their 100-call limit
      throw new Error("LIMIT_REACHED: 429 Too Many Requests");
    }
  }
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown Error");
    throw new Error(errorText || `HTTP Error ${res.status}`);
  }
  return res;
};

// ==========================================
// Auth APIs
// ==========================================
export const sendOtp = async (email) => {
  const res = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  await handleResponse(res);
  return res.text();
};

export const registerWithOtp = async (email, otp, username, password) => {
  const res = await fetch(`${BASE_URL}/auth/register-with-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, username, password })
  });
  await handleResponse(res);
  return res.json();
};

export const loginUser = async (username, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  await handleResponse(res);
  return res.json();
};

export const guestLogin = async () => {
  const res = await fetch(`${BASE_URL}/auth/guest`, {
    method: "POST"
  });
  await handleResponse(res);
  return res.json();
};

export const setCredentials = async (username, password) => {
  const res = await fetch(`${BASE_URL}/auth/set-credentials`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ username, password })
  });
  await handleResponse(res);
  return res.json();
};

export const upgradeGuest = async (email, otp, username, password) => {
  const res = await fetch(`${BASE_URL}/auth/upgrade-guest`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email, otp, username, password })
  });
  await handleResponse(res);
  return res.json();
};

// ==========================================
// Chat APIs
// ==========================================
export const fetchSessions = async () => {
  const res = await fetch(`${BASE_URL}/chat/sessions`, {
    headers: getHeaders()
  });
  await handleResponse(res);
  return res.json();
};

export const createSession = async (title) => {
  const res = await fetch(`${BASE_URL}/chat/sessions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title, messages: [] })
  });
  await handleResponse(res);
  const data = await res.json();
  data.messages = data.messages || [];
  return data;
};

export const sendChatMessage = async (sessionId, message) => {
  const res = await fetch(`${BASE_URL}/chat/${sessionId}/message`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ text: message }),
  });
  await handleResponse(res);
  return res.json();
};

// Real-time Streaming Chat API with SSE Parsing
export const streamChatMessage = async (sessionId, message, onChunk) => {
  const res = await fetch(`${BASE_URL}/chat/${sessionId}/stream`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ text: message }),
  });

  await handleResponse(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const cleanText = line.substring(5);
        onChunk(cleanText); 
      }
    }
  }
};

// ==========================================
// User Profile APIs
// ==========================================
export const deleteAccount = async () => {
  const res = await fetch(`${BASE_URL}/users/me`, {
    method: "DELETE",
    headers: getHeaders()
  });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown Error");
    throw new Error(errorText || `HTTP Error ${res.status}`);
  }
  return true;
};