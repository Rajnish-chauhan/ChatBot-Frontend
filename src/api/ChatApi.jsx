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
      throw new Error("GUEST_LIMIT_REACHED: Please log in to continue.");
    } else {
      throw new Error("LIMIT_REACHED: 429 Too Many Requests");
    }
  }
  
  if (!res.ok) {
    let errorText = await res.text().catch(() => "Unknown Error");
    try {
      const jsonError = JSON.parse(errorText);
      errorText = jsonError.message || jsonError.error || errorText;
    } catch (e) {}
    
    errorText = errorText.replace(/^\d{3} [A-Z_]+ "/, "").replace(/"$/, "");
    throw new Error(errorText || `HTTP Error ${res.status}`);
  }
  return res;
};

export const checkEmailExists = async (email) => {
  try {
    const res = await fetch(`${BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`, {
      method: "GET",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.exists;
  } catch (e) {
    return false;
  }
};

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

export const streamChatMessage = async (sessionId, message, onChunk) => {
  const res = await fetch(`${BASE_URL}/chat/${sessionId}/stream`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ text: message }),
  });

  await handleResponse(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  
  let buffer = "";
  let eventData = []; 

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    let lines = buffer.split('\n');
    buffer = lines.pop(); 

    for (const line of lines) {
      if (line.startsWith('data:')) {
        eventData.push(line.substring(5));
      } else if (line === "") {
        if (eventData.length > 0) {
          onChunk(eventData.join('\n'));
          eventData = [];
        }
      }
    }
  }
};

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