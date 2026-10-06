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

  return (
    <div className="w-64 h-full bg-slate-50 dark:bg-[#1a1a1a] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors z-20 relative">
      
      {/* Outlined New Chat Button with Pencil Icon */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-5 h-5 text-slate-500 dark:text-slate-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
          </svg>
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3 px-2 uppercase tracking-wider">
          Recent
        </div>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors ${
              currentSessionId === session.id
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2d2d2d]"
            }`}
          >
            {session.title || "New Chat"}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 relative" ref={menuRef}>
        
        {showProfileMenu && (
          <div className="absolute bottom-full left-3 w-[calc(100%-24px)] mb-2 bg-white dark:bg-[#252525] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {isGuest ? "Guest" : username}
              </p>
              {!isGuest && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Registered Account
                </p>
              )}
            </div>
            <div className="p-1">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#333] rounded-md transition-colors"
              >
                {isGuest ? "Login / Create Account" : "Log out"}
              </button>
              
              {!isGuest && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onDeleteAccount();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  Delete Account
                </button>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#2d2d2d] transition-colors"
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