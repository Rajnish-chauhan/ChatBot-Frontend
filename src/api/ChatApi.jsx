const BASE_URL = "http://localhost:8080/api";

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";
  return headers;
};

// Auth APIs
export const loginUser = async (username, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
};

export const registerUser = async (username, password) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  
  if (!res.ok) {
    // Extract the exact error message from the backend (e.g., "Username taken")
    const errorText = await res.text(); 
    throw new Error(errorText || "Registration failed");
  }
  
  return res.text();
};

export const guestLogin = async () => {
  const res = await fetch(`${BASE_URL}/auth/guest`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Guest login failed");
  return res.json();
};

// Chat APIs
export const fetchSessions = async () => {
  const res = await fetch(`${BASE_URL}/chat/sessions`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
};

export const createSession = async (title) => {
  const res = await fetch(`${BASE_URL}/chat/sessions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title, messages: [] })
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
};

export const sendChatMessage = async (sessionId, message, file) => {
  const body = JSON.stringify({ text: message });
  
  const response = await fetch(`${BASE_URL}/chat/${sessionId}/message`, {
    method: "POST",
    headers: getHeaders(false),
    body: body,
  });

  if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
  return response.json();
};