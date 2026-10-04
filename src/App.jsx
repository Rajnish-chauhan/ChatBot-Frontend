import React, { useState, useEffect } from "react";
import ThemeToggle from "./components/ThemeToggle";
import ChatBox from "./components/ChatBox";
import MessageInput from "./components/MessageInput";
import DropZone from "./components/DropZone";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import { useChatSessions } from "./hooks/UseChatSessions";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Inspect tokens across OAuth2 callbacks, localStorage, and sessionStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (tokenFromUrl) {
      // 1. Google OAuth2 Redirect Callback
      localStorage.setItem("token", tokenFromUrl);
      localStorage.setItem("username", "Google User");
      // Clean query parameter from browser address bar
      window.history.replaceState({}, document.title, window.location.pathname);
      setUsername("Google User");
      setIsGuest(false);
      setIsAuthenticated(true);
    } else if (localStorage.getItem("token")) {
      // 2. Persistent Registered User
      setIsAuthenticated(true);
      setUsername(localStorage.getItem("username") || "User");
      setIsGuest(false);
    } else if (sessionStorage.getItem("token")) {
      // 3. Ephemeral Guest Session (clears on tab close/refresh if sessionStorage is used)
      setIsAuthenticated(true);
      setUsername(sessionStorage.getItem("username") || "Guest");
      setIsGuest(true);
    }
  }, []);

  // Show profile setup modal ONLY for registered users who haven't completed it
  useEffect(() => {
    if (isAuthenticated && !isGuest && !localStorage.getItem("profileCompleted")) {
      setShowProfileModal(true);
    }
  }, [isAuthenticated, isGuest]);

  const handleLoginSuccess = (token, user, guestStatus) => {
    if (guestStatus) {
      // Guest data is strictly scoped to this session
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("username", user);
    } else {
      // Registered user data persists in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("username", user);
    }
    setUsername(user);
    setIsGuest(guestStatus);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("profileCompleted");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    setIsAuthenticated(false);
    setUsername("");
    setIsGuest(false);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem("profileCompleted", "true");
    setShowProfileModal(false);
  };

  const {
    sessions,
    currentSession,
    currentSessionId,
    setCurrentSessionId,
    loading,
    droppedFile,
    setDroppedFile,
    handleNewChat,
    handleSend
  } = useChatSessions(isAuthenticated);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      {/* Onboarding Profile Modal: Never shown to Guests */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Welcome, {username}!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Complete your profile setup to personalize your AI responses.
            </p>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  defaultValue={username}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#2d2d2d] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition"
              >
                Complete Setup
              </button>
            </form>
          </div>
        </div>
      )}

      <DropZone onDrop={(file) => setDroppedFile(file)}>
        <div className="h-full w-full flex bg-white dark:bg-[#121212] transition-colors overflow-hidden">
          
          <Sidebar 
            sessions={sessions} 
            currentSessionId={currentSessionId}
            onNewChat={handleNewChat} 
            onSelectSession={setCurrentSessionId}
            onLogout={handleLogout}
          />

          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* Header with Gemini-Style Profile Indicator */}
            <header className="h-16 shrink-0 px-6 flex items-center justify-end gap-6 z-10 border-b border-slate-200/50 dark:border-slate-800/50">
              <ThemeToggle />
              
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {isGuest ? "Guest User" : username}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isGuest ? "text-amber-500" : "text-emerald-500"
                  }`}>
                    {isGuest ? "Temporary" : "Account"}
                  </span>
                </div>
                
                {/* Profile Avatar Circle */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md border-2 border-white dark:border-[#121212] select-none">
                  <span className="text-white font-bold text-sm">
                    {username ? username.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
              </div>
            </header>

            <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 py-4 gap-4 overflow-hidden">
              <ChatBox messages={currentSession.messages} loading={loading} />
              <MessageInput 
                onSend={handleSend} 
                disabled={loading} 
                externalFile={droppedFile}
                onClearExternalFile={() => setDroppedFile(null)}
              />
            </main>
          </div>
        </div>
      </DropZone>
    </>
  );
}