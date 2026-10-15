import React, { useState, useEffect, useRef } from 'react';
import { PanelLeft, User, LogIn, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatBox from './components/ChatBox';
import MessageInput from './components/MessageInput';
import ThemeToggle from './components/ThemeToggle';
import Logo from './components/Logo';
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
  clearGuestCache,
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

  const streamQueueRef = useRef('');
  const displayedContentRef = useRef('');
  const streamTimerRef = useRef(null);
  const networkDoneRef = useRef(false);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Authenticate user from OAuth2 redirect parameters or existing token
  useEffect(() => {
    const initAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const urlUsername = urlParams.get('username');
      const isNewOAuth = urlParams.get('new_oauth') === 'true';

      if (urlToken) {
        clearGuestCache();
        setToken(urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);

        if (urlUsername) {
          setUser({
            username: urlUsername,
            isGuest: false,
            isPasswordSet: !isNewOAuth,
          });
        }
        if (isNewOAuth) {
          setIsOAuthPasswordOpen(true);
        }
      }

      const token = getToken();

      if (!token) {
        setUser(null);
        setLoginInitialMode('welcome');
        setIsLoginOpen(true);
        return;
      }

      try {
        const profile = await getUserProfile();
        setUser(profile);
        setIsLoginOpen(false);

        const isGuestUser = profile?.isGuest ?? profile?.guest ?? false;
        const hasPassword = profile?.isPasswordSet ?? profile?.passwordSet ?? false;

        if (!isGuestUser && !hasPassword) {
          setIsOAuthPasswordOpen(true);
        }
      } catch (err) {
        console.warn('Profile validation warning:', err);
        if (!urlToken) {
          logout();
          setUser(null);
          setLoginInitialMode('welcome');
          setIsLoginOpen(true);
        }
      }
    };

    initAuth();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      const list = Array.isArray(data) ? data : [];
      setSessions(list);
      if (list.length > 0 && !activeSessionId) {
        setActiveSessionId(list[0].id);
      }
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    if (user) {
      loadSessions();
    } else {
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [user]);

  const handleProfileUpdated = async () => {
    try {
      const updatedProfile = await getUserProfile();
      setUser(updatedProfile);
    } catch (err) {
      console.error('Failed to reload user profile:', err);
    }
  };

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
      console.error('Failed to create new session:', err);
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
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
    streamQueueRef.current = '';
    networkDoneRef.current = true;
    setIsStreaming(false);
    isStreamingRef.current = false;
  };

  const startSmoothTicker = (sessionIdForSync) => {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
    }

    streamTimerRef.current = setInterval(() => {
      const queue = streamQueueRef.current;
      if (queue.length > 0) {
        const charsToTake = Math.max(2, Math.min(14, Math.ceil(queue.length / 8)));
        const nextSlice = queue.slice(0, charsToTake);
        streamQueueRef.current = queue.slice(charsToTake);
        displayedContentRef.current += nextSlice;
        const snapshot = displayedContentRef.current;

        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: snapshot,
              content: snapshot,
            };
          }
          return updated;
        });
      } else if (networkDoneRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
        setIsStreaming(false);
        isStreamingRef.current = false;
        abortControllerRef.current = null;

        if (sessionIdForSync) {
          getSessionMessages(sessionIdForSync)
            .then((history) => {
              if (Array.isArray(history) && history.length > 0) {
                const lastMsg = history[history.length - 1];
                if (lastMsg && lastMsg.sender?.toLowerCase() !== 'user') {
                  const finalFormattedText = lastMsg.text || lastMsg.content || '';
                  if (finalFormattedText) {
                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastIdx = updated.length - 1;
                      if (
                        lastIdx >= 0 &&
                        updated[lastIdx].role === 'assistant' &&
                        !updated[lastIdx].isRateLimitError &&
                        !updated[lastIdx].isFileSizeError
                      ) {
                        updated[lastIdx] = {
                          ...updated[lastIdx],
                          text: finalFormattedText,
                          content: finalFormattedText,
                        };
                      }
                      return updated;
                    });
                  }
                }
              }
            })
            .catch(() => {});
        }
      }
    }, 18);
  };

  const handleSendMessage = async (text, files = []) => {
    if ((!text.trim() && files.length === 0) || isStreaming) return;

    const token = getToken();
    if (!token || !user) {
      setLoginInitialMode('welcome');
      setIsLoginOpen(true);
      return;
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
          },
        ]);
        return;
      }
    } else {
      const currentSession = sessions.find((s) => s.id === currentSessionId);
      if (currentSession && (currentSession.title === 'New chat' || currentSession.title === 'New Chat')) {
        const newTitle = text.trim().slice(0, 25) || (files[0] ? files[0].name : 'New chat');
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

    streamQueueRef.current = '';
    displayedContentRef.current = '';
    networkDoneRef.current = false;

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setIsStreaming(true);
    isStreamingRef.current = true;

    abortControllerRef.current = new AbortController();
    startSmoothTicker(currentSessionId);

    await streamMessage({
      sessionId: currentSessionId,
      message: text.trim(),
      files,
      signal: abortControllerRef.current.signal,
      onChunk: (chunk, isRateLimit = false, isGuestLimit = false) => {
        if (isRateLimit) {
          if (streamTimerRef.current) {
            clearInterval(streamTimerRef.current);
            streamTimerRef.current = null;
          }
          streamQueueRef.current = '';
          networkDoneRef.current = true;
          setIsStreaming(false);
          isStreamingRef.current = false;

          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                text: chunk,
                content: chunk,
                isRateLimitError: true,
                isGuestError: Boolean(isGuestLimit),
              };
            }
            return updated;
          });
          return;
        }

        streamQueueRef.current += chunk;
      },
      onError: (err) => {
        console.error('SSE Stream error:', err);
        if (streamTimerRef.current) {
          clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
        }
        streamQueueRef.current = '';
        networkDoneRef.current = true;
        setIsStreaming(false);
        isStreamingRef.current = false;

        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: displayedContentRef.current || 'An error occurred while generating the response. Please check server logs.',
              content: displayedContentRef.current || 'An error occurred while generating the response. Please check server logs.',
              isError: true,
            };
          }
          return updated;
        });
      },
      onFinish: () => {
        networkDoneRef.current = true;
      },
    });
  };

  const handleLoginSuccess = async (userData, isNewRegistration = false) => {
    setActiveSessionId(null);
    setMessages([]);
    setSessions([]);

    try {
      const fullProfile = await getUserProfile();
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

    if (isNewRegistration) {
      setActiveSessionId(null);
      setMessages([]);
      setSessions([]);
      return;
    }

    try {
      const userSessions = await getChatSessions();
      const sessionList = Array.isArray(userSessions) ? userSessions : [];
      setSessions(sessionList);

      if (sessionList.length > 0) {
        const firstSessionId = sessionList[0].id;
        setActiveSessionId(firstSessionId);
        const history = await getSessionMessages(firstSessionId);
        if (Array.isArray(history)) {
          setMessages(
            history.map((m) => ({
              id: m.id,
              role: m.sender?.toLowerCase() === 'user' ? 'user' : 'assistant',
              sender: m.sender,
              text: m.text,
              content: m.text,
            }))
          );
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

  const handleLogout = () => {
    if (isStreaming) {
      handleStopGeneration();
    }
    logout();
    setUser(null);
    setSessions([]);
    setActiveSessionId(null);
    setMessages([]);
    setIsProfileOpen(false);
    setIsLogoutConfirmOpen(false);
    setLoginInitialMode('login');
    setIsLoginOpen(true);
  };

  const handleAccountDeleted = () => {
    if (isStreaming) {
      handleStopGeneration();
    }
    logout();
    setUser(null);
    setSessions([]);
    setActiveSessionId(null);
    setMessages([]);
    setIsDeleteConfirmOpen(false);
    setIsProfileOpen(false);
    setLoginInitialMode('welcome');
    setIsLoginOpen(true);
  };

  const isGuest = Boolean(!user || user.isGuest === true || user.guest === true);

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors">
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs"
        />
      )}

      <div
        className={`${
          isMobile
            ? 'fixed inset-y-0 left-0 z-40 shadow-2xl'
            : 'relative'
        }`}
      >
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
          onProfileUpdated={handleProfileUpdated}
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
          <div className="flex items-center gap-2.5">
            {(!isSidebarOpen || isMobile) && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/60 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition"
                aria-label="Toggle sidebar"
              >
                {isMobile ? <Menu className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
              </button>
            )}

            {(!isSidebarOpen || isMobile) && (
              <div className="flex items-center gap-2 select-none">
                <Logo size={28} />
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm sm:text-base">
                    Chat<span className="text-blue-500">Bot</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md border border-blue-500/20 dark:border-blue-500/30">
                    AI
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {isMobile && isGuest && user && (
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

            {isMobile && !isGuest && user && (
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 overflow-hidden text-white flex items-center justify-center font-bold text-xs shadow-xs"
                title="Profile & Settings"
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

        <main className="flex-1 overflow-y-auto px-4 md:px-0 flex flex-col">
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
        canClose={Boolean(user)}
        onClose={() => {
          if (user) setIsLoginOpen(false);
        }}
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