// Resolve base API URL with build-time environment variable and production domain fallback
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  if (typeof window !== 'undefined' && window.location.hostname.includes('rajnishsystems.in')) {
    return '[https://api.rajnishsystems.in/api](https://api.rajnishsystems.in/api)';
  }

  return 'http://localhost:8080/api';
};

const rawEnvUrl = resolveApiBaseUrl().replace(/\/+$/, '');
export const API_BASE_URL = rawEnvUrl.endsWith('/api') ? rawEnvUrl : `${rawEnvUrl}/api`;
export const BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
export const OAUTH2_GOOGLE_URL = `${BASE_URL}/oauth2/authorization/google`;

// Return a persistent browser device ID for guest rate-limiting
export const getDeviceId = () => {
  let deviceId = localStorage.getItem('chat_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('chat_device_id', deviceId);
  }
  return deviceId;
};

export const getToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('auth_token') || null;
};

export const getAuthToken = getToken;

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
  }
};

export const clearGuestCache = () => {
  localStorage.removeItem('guest_token');
  localStorage.removeItem('guest_username');
};

// Build request headers with JWT authorization and device fingerprint
export const getHeaders = (isFormData = false) => {
  const headers = {
    'X-Device-Id': getDeviceId(),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {};
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
};

// Authentication API methods
export const login = async (emailOrUsername, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username: emailOrUsername, password }),
  });
  const data = await handleResponse(response);
  if (data.token) {
    clearGuestCache();
    setToken(data.token);
  }
  return data;
};
export const loginUser = login;
export const signIn = login;

export const guestLogin = async (forceNew = false) => {
  const cachedGuestToken = localStorage.getItem('guest_token');
  const cachedGuestUsername = localStorage.getItem('guest_username');

  if (!forceNew && cachedGuestToken) {
    setToken(cachedGuestToken);
    return {
      token: cachedGuestToken,
      username: cachedGuestUsername || 'Guest',
      isGuest: true,
    };
  }

  const response = await fetch(`${API_BASE_URL}/auth/guest`, {
    method: 'POST',
    headers: getHeaders(),
  });
  const data = await handleResponse(response);
  if (data.token) {
    setToken(data.token);
    localStorage.setItem('guest_token', data.token);
    localStorage.setItem('guest_username', data.username);
  }
  return data;
};
export const loginAsGuest = guestLogin;

export const register = async (username, email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ username, email, password }),
  });
  const data = await handleResponse(response);
  if (data.token) {
    clearGuestCache();
    setToken(data.token);
  }
  return data;
};
export const registerUser = register;
export const signUp = register;

export const sendOtp = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  });
  return await handleResponse(response);
};

export const verifyOtpCode = async (email, otp) => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, otp }),
  });
  return await handleResponse(response);
};

export const registerWithOtp = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/auth/register-with-otp`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  const data = await handleResponse(response);
  if (data.token) {
    clearGuestCache();
    setToken(data.token);
  }
  return data;
};

export const checkEmailExists = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return await handleResponse(response);
};

export const checkUsernameExists = async (username) => {
  const response = await fetch(`${API_BASE_URL}/auth/check-username?username=${encodeURIComponent(username)}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return await handleResponse(response);
};

export const sendForgotPasswordOtp = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password/send-otp`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  });
  return await handleResponse(response);
};
export const forgotPassword = sendForgotPasswordOtp;
export const sendPasswordResetOtp = sendForgotPasswordOtp;

export const resetPasswordWithOtp = async (email, otp, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, otp, newPassword }),
  });
  return await handleResponse(response);
};
export const resetPassword = resetPasswordWithOtp;
export const resetUserPassword = resetPasswordWithOtp;

// User profile and credential management methods
export const getUserProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return await handleResponse(response);
};
export const getCurrentUser = getUserProfile;
export const getProfile = getUserProfile;
export const fetchUserProfile = getUserProfile;
export const getUser = getUserProfile;

export const updateUserProfile = async (profileData) => {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(profileData),
  });
  return await handleResponse(response);
};
export const updateProfile = updateUserProfile;

export const setCredentials = async (username, password) => {
  const payload = typeof username === 'object' ? username : { username, password };
  const response = await fetch(`${API_BASE_URL}/auth/set-credentials`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(response);
  if (data.token) {
    clearGuestCache();
    setToken(data.token);
  }
  return data;
};
export const setUserCredentials = setCredentials;
export const setupCredentials = setCredentials;

export const changePassword = async (oldPassword, newPassword) => {
  const response = await fetch(`${API_BASE_URL}/users/change-password`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  return await handleResponse(response);
};
export const changeUserPassword = changePassword;
export const updatePassword = changePassword;
export const updateUserPassword = changePassword;

export const deleteAccount = async (password) => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({ password }),
  });
  const result = await handleResponse(response);
  setToken(null);
  clearGuestCache();
  return result;
};
export const deleteUserAccount = deleteAccount;
export const deleteUser = deleteAccount;

export const logout = () => {
  setToken(null);
  clearGuestCache();
};
export const logoutUser = logout;
export const signOut = logout;

// Chat session management methods
export const getChatSessions = async () => {
  const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return await handleResponse(response);
};
export const getSessions = getChatSessions;
export const fetchSessions = getChatSessions;
export const getAllSessions = getChatSessions;

export const createSession = async (title = 'New chat') => {
  const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title }),
  });
  return await handleResponse(response);
};
export const createChatSession = createSession;
export const createNewSession = createSession;

export const getSessionMessages = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
    method: 'GET',
    headers: getHeaders(),
  });
  return await handleResponse(response);
};
export const getMessages = getSessionMessages;
export const fetchMessages = getSessionMessages;
export const fetchSessionMessages = getSessionMessages;

export const renameSession = async (sessionId, title) => {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ title }),
  });
  return await handleResponse(response);
};
export const updateSessionTitle = renameSession;
export const renameChatSession = renameSession;

export const deleteSession = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return await handleResponse(response);
};
export const deleteChatSession = deleteSession;
export const removeSession = deleteSession;

// Stream AI responses over Server-Sent Events (SSE) with multipart file support
export const streamMessage = async ({
  sessionId,
  message,
  files = [],
  onChunk,
  onError,
  onFinish,
  signal,
}) => {
  try {
    const hasFiles = files && files.length > 0;
    let fetchOptions;

    if (hasFiles) {
      const formData = new FormData();
      formData.append('text', message || '');
      files.slice(0, 3).forEach((file) => {
        formData.append('files', file);
      });

      fetchOptions = {
        method: 'POST',
        headers: {
          'X-Device-Id': getDeviceId(),
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          Accept: 'text/event-stream, text/plain, */*',
        },
        body: formData,
        signal,
      };
    } else {
      fetchOptions = {
        method: 'POST',
        headers: {
          ...getHeaders(),
          Accept: 'text/event-stream, text/plain, */*',
        },
        body: JSON.stringify({ text: message }),
        signal,
      };
    }

    const response = await fetch(`${API_BASE_URL}/chat/${sessionId}/stream`, fetchOptions);

    if (response.status === 429) {
      let errJson = null;
      try {
        errJson = await response.json();
      } catch {}
      const limitMsg = errJson?.message || 'Daily quota exceeded. Please sign in or try again after 24 hours.';
      if (onChunk) onChunk(limitMsg, true, errJson?.isGuest);
      if (onFinish) onFinish();
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Streaming failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.replace(/\r\n/g, '\n').split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        if (!event) continue;
        const lines = event.split('\n');
        const dataLines = [];

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataContent = line.slice(5);
            if (dataContent.trim() === '[DONE]') {
              if (onFinish) onFinish();
              return;
            }
            dataLines.push(dataContent);
          }
        }

        if (dataLines.length > 0 && onChunk) {
          // Preserve single empty SSE data frames as newline characters for multi-line code blocks
          const chunkText = dataLines.length === 1 && dataLines[0] === '' ? '\n' : dataLines.join('\n');
          onChunk(chunkText);
        }
      }
    }

    if (buffer.trim()) {
      const lines = buffer.replace(/\r\n/g, '\n').split('\n');
      const dataLines = [];
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const dataContent = line.slice(5);
          if (dataContent.trim() !== '[DONE]') {
            dataLines.push(dataContent);
          }
        }
      }
      if (dataLines.length > 0 && onChunk) {
        const chunkText = dataLines.length === 1 && dataLines[0] === '' ? '\n' : dataLines.join('\n');
        onChunk(chunkText);
      }
    }

    if (onFinish) onFinish();
  } catch (err) {
    if (err.name === 'AbortError') {
      if (onFinish) onFinish();
      return;
    }
    if (onError) {
      onError(err);
    } else {
      console.error('SSE Stream error:', err);
    }
  }
};

export const sendMessageStream = streamMessage;
export const streamChatMessage = streamMessage;
export const streamChat = streamMessage;
export const sendChatMessage = streamMessage;

const ChatApi = {
  API_BASE_URL,
  BASE_URL,
  OAUTH2_GOOGLE_URL,
  getDeviceId,
  getToken,
  getAuthToken,
  setToken,
  clearGuestCache,
  getHeaders,
  login,
  loginUser,
  signIn,
  guestLogin,
  loginAsGuest,
  register,
  registerUser,
  signUp,
  sendOtp,
  verifyOtpCode,
  registerWithOtp,
  checkEmailExists,
  checkUsernameExists,
  sendForgotPasswordOtp,
  forgotPassword,
  sendPasswordResetOtp,
  resetPasswordWithOtp,
  resetPassword,
  resetUserPassword,
  getUserProfile,
  getCurrentUser,
  getProfile,
  fetchUserProfile,
  getUser,
  updateUserProfile,
  updateProfile,
  setCredentials,
  setUserCredentials,
  setupCredentials,
  changePassword,
  changeUserPassword,
  updatePassword,
  updateUserPassword,
  deleteAccount,
  deleteUserAccount,
  deleteUser,
  logout,
  logoutUser,
  signOut,
  getChatSessions,
  getSessions,
  fetchSessions,
  getAllSessions,
  createSession,
  createChatSession,
  createNewSession,
  getSessionMessages,
  getMessages,
  fetchMessages,
  fetchSessionMessages,
  renameSession,
  updateSessionTitle,
  renameChatSession,
  deleteSession,
  deleteChatSession,
  removeSession,
  streamMessage,
  sendMessageStream,
  streamChatMessage,
  streamChat,
  sendChatMessage,
};

export default ChatApi;