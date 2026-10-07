import React, { useState, useRef, useEffect } from "react";

export default function Sidebar({ 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectSession, 
  onLogout, 
  onDeleteAccount,
  username, 
  isGuest 
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sort sessions to show the newest chats at the top
  const displaySessions = [...sessions].sort((a, b) => b.id - a.id);

  return (
    <div className="w-64 h-full bg-slate-50 dark:bg-[#1a1a1a] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors z-20 relative">
      
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#2d2d2d] rounded-full transition-colors font-medium text-sm shadow-sm"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-5 h-5 text-slate-500 dark:text-slate-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New chat
        </button>
      </div>

      {/* Sessions List - Gemini Style */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        <div className="text-[13px] font-medium text-slate-500 dark:text-[#a1a1aa] mb-2 px-3 pt-2">
          Recent
        </div>
        {displaySessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left px-4 py-2.5 rounded-full text-[14px] truncate transition-colors ${
              currentSessionId === session.id
                ? "bg-slate-200 dark:bg-[#282a2c] text-slate-900 dark:text-white font-semibold"
                : "bg-transparent text-slate-700 dark:text-[#e4e4e7] hover:bg-slate-100 dark:hover:bg-[#2d2f31]"
            }`}
          >
            {session.title || "New Chat"}
          </button>
        ))}
      </div>

      {/* User Profile Bar */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 relative" ref={menuRef}>
        
        {showProfileMenu && (
          <div className="absolute bottom-full left-3 w-[calc(100%-24px)] mb-2 bg-white dark:bg-[#252525] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {isGuest ? "Guest" : username}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {isGuest ? "Guest Account" : "Registered User"}
              </p>
            </div>
            
            <div className="p-1.5 space-y-0.5">
              {isGuest ? (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#333] rounded-xl transition-colors"
                >
                  Login / Create Account
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#333] rounded-xl transition-colors"
                  >
                    Log out
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onDeleteAccount();
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    Delete Account
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-full hover:bg-slate-200 dark:hover:bg-[#2d2d2d] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
            {isGuest ? "G" : username?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 text-left truncate">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {isGuest ? "Guest" : username}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}