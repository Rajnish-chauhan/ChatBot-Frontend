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
    localStorage.clear();
    window.location.reload();
    throw new Error("Session expired. Please log in again.");
  }
  if (res.status === 429) {
    throw new Error("Daily limit of 100 requests reached. Please try again tomorrow.");
  }
  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown Error");
    throw new Error(errorText || `HTTP Error ${res.status}`);
  }
  return res;
};

// Auth APIs
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

// Chat APIs
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

  const remaining = res.headers.get("X-Rate-Limit-Remaining");
  if (remaining !== null) {
    localStorage.setItem("requestsRemaining", remaining);
  }

  return res.json();
};