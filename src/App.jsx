import React, { useState, useEffect, useRef } from 'react';
import { PanelLeft, Plus, User, LogIn, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatBox from './components/ChatBox';
import MessageInput from './components/MessageInput';
import ThemeToggle from './components/ThemeToggle';
import Login from './components/Login';
import ProfileModal from './components/ProfileModal';
import OAuthPasswordSetupModal from './components/OAuthPasswordSetupModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import {
  getChatSessions,
  createSession,
  deleteSession,
  renameSession,
  getSessionMessages,
  streamMessage,
  getUserProfile,
  getToken,
  setToken,
  loginAsGuest,
  logout,
} from './api/ChatApi';

const App = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [user, setUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginInitialMode, setLoginInitialMode] = useState('welcome');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOAuthPasswordOpen, setIsOAuthPasswordOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef(null);
  const isStreamingRef = useRef(false);
  const newCreatedSessionIdRef = useRef(null);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize authentication and user session
  useEffect(() => {
    const initAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');

      if (urlToken) {
        setToken(urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      let token = getToken();

      if (!token) {
        try {
          const guestData = await loginAsGuest();
          setUser({ username: guestData.username, isGuest: true });
        } catch (e) {
          console.error("Guest login initialization failure:", e);
        }
        setLoginInitialMode('welcome');
        setIsLoginOpen(true);
      } else {
        try {
          const profile = await getUserProfile();
          setUser(profile);

          const isGuestUser = profile?.isGuest ?? profile?.guest ?? false;
          const hasPassword = profile?.isPasswordSet ?? profile?.passwordSet ?? false;

          if (!isGuestUser && !hasPassword) {
            setIsOAuthPasswordOpen(true);
          }
        } catch (err) {
          console.warn("Session invalid or expired, renewing guest session:", err);
          try {
            setToken(null);
            localStorage.removeItem('guest_token');
            localStorage.removeItem('guest_username');
            const guestData = await loginAsGuest(true);
            setUser({ username: guestData.username, isGuest: true });
          } catch {}
          setLoginInitialMode('welcome');
          setIsLoginOpen(true);
        }
      }
    };

    initAuth();
  }, []);

  // Fetch session history for current user
  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id);
      }
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  // Reload current user profile to update avatar across the UI
  const handleProfileUpdated = async () => {
    try {
      const updatedProfile = await getUserProfile();
      setUser(updatedProfile);
    } catch (err) {
      console.error('Failed to reload user profile:', err);
    }
  };

  // Load chat messages when activeSessionId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }

      if (isStreamingRef.current || newCreatedSessionIdRef.current === activeSessionId) {
        newCreatedSessionIdRef.current = null;
        return;
      }

      try {
        const history = await getSessionMessages(activeSessionId);
        if (Array.isArray(history)) {
          const normalized = history.map((m) => ({
            id: m.id,
            role: m.sender?.toLowerCase() === 'user' ? 'user' : 'assistant',
            sender: m.sender,
            text: m.text,
            content: m.text,
          }));
          setMessages(normalized);
        }
      } catch {
        setMessages([]);
      }
    };

    loadMessages();
  }, [activeSessionId]);

  // Create a new chat session
  const handleNewChat = async () => {
    if (isStreaming) {
      handleStopGeneration();
    }

    if (messages.length === 0 && activeSessionId) {
      const currentSession = sessions.find((s) => s.id === activeSessionId);
      if (currentSession && (currentSession.title === 'New chat' || currentSession.title === 'New Chat')) {
        if (isMobile) setIsSidebarOpen(false);
        return;
      }
    }

    try {
      const newSession = await createSession('New chat');
      newCreatedSessionIdRef.current = newSession.id;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new session immediately:', err);
      setActiveSessionId(null);
      setMessages([]);
    }

    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectSession = (sessionId) => {
    if (isStreaming) {
      handleStopGeneration();
    }
    newCreatedSessionIdRef.current = null;
    setActiveSessionId(sessionId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete chat session:', err);
    }
  };

  const handleRenameSession = async (sessionId, newTitle) => {
    try {
      await renameSession(sessionId, newTitle);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
      );
    } catch (err) {
      console.error('Failed to rename session:', err);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    isStreamingRef.current = false;
  };

  // Send message and stream reply
  const handleSendMessage = async (text, files = []) => {
    if ((!text.trim() && files.length === 0) || isStreaming) return;

    let token = getToken();
    if (!token) {
      try {
        const guestData = await loginAsGuest();
        token = guestData.token;
        setUser({ username: guestData.username, isGuest: true });
      } catch (e) {
        console.error("Auto guest login error:", e);
      }
    }

    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      try {
        const sessionTitle = text.trim().slice(0, 25) || (files[0] ? files[0].name : 'New chat');
        const newSession = await createSession(sessionTitle);
        currentSessionId = newSession.id;
        newCreatedSessionIdRef.current = currentSessionId;
        setActiveSessionId(currentSessionId);
        setSessions((prev) => [newSession, ...prev]);
      } catch (err) {
        console.error('Failed to create new session:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            role: 'assistant',
            sender: 'assistant',
            text: 'Failed to create chat session. Please verify your connection or sign in again.',
            content: 'Failed to create chat session. Please verify your connection or sign in again.',
            isError: true,
          }
        ]);
        return;
      }
    } else {
      const currentSession = sessions.find((s) => s.id === currentSessionId);
      if (currentSession && (currentSession.title === 'New chat' || currentSession.title === 'New Chat')) {
        const newTitle = text.trim().slice(0, 25) || 'New chat';
        setSessions((prev) =>
          prev.map((s) => (s.id === currentSessionId ? { ...s, title: newTitle } : s))
        );
      }
    }

    const userMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      role: 'user',
      text: text.trim(),
      content: text.trim(),
      attachments: files.map((f) => ({ name: f.name })),
    };

    const assistantPlaceholder = {
      id: 'msg_ai_' + Date.now(),
      sender: 'assistant',
      role: 'assistant',
      text: '',
      content: '',
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsStreaming(true);
    isStreamingRef.current = true;

    abortControllerRef.current = new AbortController();
    let accumulatedContent = '';

    await streamMessage({
      sessionId: currentSessionId,
      message: text.trim(),
      files,
      signal: abortControllerRef.current.signal,
      onChunk: (chunk) => {
        accumulatedContent += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: accumulatedContent,
              content: accumulatedContent,
            };
            return updated;
          }
          return [
            ...updated,
            {
              id: 'msg_ai_' + Date.now(),
              role: 'assistant',
              sender: 'assistant',
              text: accumulatedContent,
              content: accumulatedContent,
            }
          ];
        });
      },
      onError: (err) => {
        console.error('SSE Stream error:', err);
        setIsStreaming(false);
        isStreamingRef.current = false;
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: accumulatedContent || 'An error occurred while generating the response. Please check server logs.',
              content: accumulatedContent || 'An error occurred while generating the response. Please check server logs.',
              isError: true,
            };
          }
          return updated;
        });
      },
      onFinish: () => {
        setIsStreaming(false);
        isStreamingRef.current = false;
        abortControllerRef.current = null;
      },
    });
  };

  const handleLoginSuccess = async (userData) => {
    setActiveSessionId(null);
    setMessages([]);

    let currentUserProfile = userData;
    try {
      const fullProfile = await getUserProfile();
      currentUserProfile = fullProfile;
      setUser(fullProfile);

      const isGuestUser = fullProfile?.isGuest ?? fullProfile?.guest ?? false;
      const hasPassword = fullProfile?.isPasswordSet ?? fullProfile?.passwordSet ?? false;

      if (!isGuestUser && !hasPassword) {
        setIsOAuthPasswordOpen(true);
      }
    } catch {
      setUser(userData);
    }

    setIsLoginOpen(false);

    try {
      const userSessions = await getChatSessions();
      const sessionList = Array.isArray(userSessions) ? userSessions : [];
      setSessions(sessionList);

      if (sessionList.length > 0) {
        const firstSessionId = sessionList[0].id;
        setActiveSessionId(firstSessionId);
        try {
          const history = await getSessionMessages(firstSessionId);
          if (Array.isArray(history)) {
            setMessages(history.map((m) => ({
              id: m.id,
              role: m.sender?.toLowerCase() === 'user' ? 'user' : 'assistant',
              sender: m.sender,
              text: m.text,
              content: m.text,
            })));
          }
        } catch {
          setMessages([]);
        }
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch {
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const handleLogout = async () => {
    logout();
    setUser(null);
    setActiveSessionId(null);
    setMessages([]);
    setIsProfileOpen(false);
    setIsLogoutConfirmOpen(false);

    try {
      const guestData = await loginAsGuest();
      setUser({ username: guestData.username, isGuest: true });

      const guestSessions = await getChatSessions();
      const sessionList = Array.isArray(guestSessions) ? guestSessions : [];
      setSessions(sessionList);

      if (sessionList.length > 0) {
        setActiveSessionId(sessionList[0].id);
        const history = await getSessionMessages(sessionList[0].id);
        if (Array.isArray(history)) {
          setMessages(history.map((m) => ({
            id: m.id,
            role: m.sender?.toLowerCase() === 'user' ? 'user' : 'assistant',
            sender: m.sender,
            text: m.text,
            content: m.text,
          })));
        }
      }
    } catch (e) {
      setSessions([]);
    }

    setLoginInitialMode('welcome');
    setIsLoginOpen(true);
  };

  const handleAccountDeleted = async () => {
    logout();
    setUser(null);
    setActiveSessionId(null);
    setMessages([]);
    setIsDeleteConfirmOpen(false);
    setIsProfileOpen(false);

    try {
      const guestData = await loginAsGuest();
      setUser({ username: guestData.username, isGuest: true });

      const guestSessions = await getChatSessions();
      setSessions(Array.isArray(guestSessions) ? guestSessions : []);
    } catch (e) {
      setSessions([]);
    }

    setLoginInitialMode('welcome');
    setIsLoginOpen(true);
  };

  const isGuest = Boolean(!user || user.isGuest === true || user.guest === true);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors">
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs"
        />
      )}

      {/* Sidebar container */}
      <div className={`${isMobile ? 'fixed inset-y-0 left-0 z-40' : 'relative'}`}>
        <Sidebar
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          onClose={() => setIsSidebarOpen(false)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          user={user}
          onOpenLogin={(initialView = 'welcome') => {
            setLoginInitialMode(initialView);
            setIsLoginOpen(true);
          }}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSettings={() => setIsProfileOpen(true)}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-10 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            {(!isSidebarOpen || isMobile) && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
                aria-label="Toggle sidebar"
              >
                {isMobile ? <Menu className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Mobile header profile button */}
            {isMobile && isGuest && (
              <button
                type="button"
                onClick={() => {
                  setLoginInitialMode('welcome');
                  setIsLoginOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            )}

            {isMobile && !isGuest && (
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="w-8 h-8 rounded-full bg-blue-600 overflow-hidden text-white flex items-center justify-center font-bold text-xs shadow-xs"
              >
                {user?.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  user?.username?.[0]?.toUpperCase() || <User className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-0">
          <ChatBox
            messages={messages}
            isStreaming={isStreaming}
            onOpenLogin={() => {
              setLoginInitialMode('welcome');
              setIsLoginOpen(true);
            }}
          />
        </main>

        <footer className="shrink-0 p-4 max-w-4xl w-full mx-auto">
          <MessageInput
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            onStopStreaming={handleStopGeneration}
            onStopGeneration={handleStopGeneration}
          />
        </footer>
      </div>

      <Login
        isOpen={isLoginOpen}
        initialMode={loginInitialMode}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        onLoginSuccess={handleLoginSuccess}
      />

      {isProfileOpen && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={user}
          onProfileUpdated={handleProfileUpdated}
          onOpenLogoutConfirm={() => {
            setIsProfileOpen(false);
            setIsLogoutConfirmOpen(true);
          }}
          onOpenDeleteConfirm={() => {
            setIsProfileOpen(false);
            setIsDeleteConfirmOpen(true);
          }}
          onOpenLogin={() => {
            setIsProfileOpen(false);
            setLoginInitialMode('welcome');
            setIsLoginOpen(true);
          }}
        />
      )}

      {isLogoutConfirmOpen && (
        <LogoutConfirmModal
          isOpen={isLogoutConfirmOpen}
          onClose={() => setIsLogoutConfirmOpen(false)}
          onConfirm={handleLogout}
        />
      )}

      {isOAuthPasswordOpen && (
        <OAuthPasswordSetupModal
          isOpen={isOAuthPasswordOpen}
          initialUsername={user?.username}
          onSuccess={() => {
            setIsOAuthPasswordOpen(false);
            getUserProfile().then((data) => setUser(data));
          }}
        />
      )}

      {isDeleteConfirmOpen && (
        <DeleteConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          currentUser={user}
          onDeleted={handleAccountDeleted}
          onSuccess={handleAccountDeleted}
        />
      )}
    </div>
  );
};

export default App;