import React, { useState, useEffect } from "react";
import ThemeToggle from "./components/ThemeToggle";
import ChatBox from "./components/ChatBox";
import MessageInput from "./components/MessageInput";
import DropZone from "./components/DropZone";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import OAuthPasswordSetupModal from "./components/OAuthPasswordSetupModal";
import GuestUpgradeModal from "./components/GuestUpgradeModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import ProfileModal from "./components/ProfileModal";
import { deleteAccount } from "./api/ChatApi";
import { useChatSessions } from "./hooks/UseChatSessions";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    const userFromUrl = urlParams.get("username");
    const reqPassword = urlParams.get("requiresPasswordSetup") === "true";

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      localStorage.setItem("username", userFromUrl || "User");
      localStorage.setItem("isGuest", "false");
      localStorage.setItem("requiresPasswordSetup", String(reqPassword));

      window.history.replaceState({}, document.title, window.location.pathname);

      setUsername(userFromUrl || "User");
      setRequiresPasswordSetup(reqPassword);
      setIsGuest(false);
      setIsAuthenticated(true);
    } else if (localStorage.getItem("token")) {
      setIsAuthenticated(true);
      setUsername(localStorage.getItem("username") || "User");
      setIsGuest(localStorage.getItem("isGuest") === "true");
      setRequiresPasswordSetup(localStorage.getItem("requiresPasswordSetup") === "true");
    }
  }, []);

  const handleLoginSuccess = (token, user, guestStatus, needsPasswordSetup) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", user);
    localStorage.setItem("isGuest", String(guestStatus));
    localStorage.setItem("requiresPasswordSetup", String(needsPasswordSetup));

    setUsername(user);
    setIsGuest(guestStatus);
    setRequiresPasswordSetup(needsPasswordSetup);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUsername("");
    setIsGuest(false);
    setRequiresPasswordSetup(false);
    setShowDeleteModal(false);
    setShowUpgradeModal(false);
    setShowProfileModal(false);
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount();
      handleLogout();
    } catch (error) {
      alert("Failed to delete account: " + error.message);
      setShowDeleteModal(false);
    }
  };

  const onOAuthSetupSuccess = (token, newUsername) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", newUsername);
    localStorage.setItem("requiresPasswordSetup", "false");
    setUsername(newUsername);
    setRequiresPasswordSetup(false);
  };

  const onGuestUpgradeSuccess = (token, newUsername) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", newUsername);
    localStorage.setItem("isGuest", "false");
    setUsername(newUsername);
    setIsGuest(false);
    setShowUpgradeModal(false);
  };

  const handleAuthRequired = () => {
    if (isGuest) {
      setShowUpgradeModal(true);
    } else {
      handleLogout();
    }
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
  } = useChatSessions(isAuthenticated, handleAuthRequired);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <OAuthPasswordSetupModal 
        isOpen={requiresPasswordSetup} 
        initialUsername={username}
        onSuccess={onOAuthSetupSuccess} 
      />

      <GuestUpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={onGuestUpgradeSuccess} 
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAccount}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        username={username}
        isGuest={isGuest}
        sessions={sessions}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          setShowProfileModal(false);
        }}
        onDeleteAccount={() => {
          setShowProfileModal(false);
          setShowDeleteModal(true);
        }}
        onOpenUpgrade={() => {
          setShowProfileModal(false);
          setShowUpgradeModal(true);
        }}
      />

      <DropZone onDrop={(file) => setDroppedFile(file)}>
        <div className="h-full w-full flex bg-white dark:bg-[#121212] transition-colors overflow-hidden">
          
          <Sidebar 
            sessions={sessions} 
            currentSessionId={currentSessionId}
            onNewChat={handleNewChat} 
            onSelectSession={setCurrentSessionId}
            onLogout={handleLogout}
            onDeleteAccount={() => setShowDeleteModal(true)}
            onOpenProfile={() => setShowProfileModal(true)}
            username={username} 
            isGuest={isGuest}
          />

          <div className="flex-1 flex flex-col relative overflow-hidden">
            <header className="h-16 shrink-0 px-6 flex items-center justify-between z-10 border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                {isGuest && (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full font-medium transition shadow-sm"
                  >
                    Login to Save Chat
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </header>

            <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 py-4 gap-4 overflow-hidden">
              <ChatBox messages={currentSession?.messages || []} loading={loading} />
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