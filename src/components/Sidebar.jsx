import React, { useState } from "react";

export default function Sidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onLogout,
  username,
  isGuest
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowMenu(false); // Close the popover menu
    setShowLogoutModal(true); // Open the custom confirmation modal
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <>
      {/* Professional Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-center">
              Confirm Logout
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-64 bg-slate-50 dark:bg-[#1e1e1e] border-r border-slate-200 dark:border-slate-800 flex flex-col h-full transition-colors relative z-10">
        
        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#2d2d2d] border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-[#3d3d3d] text-slate-800 dark:text-slate-200 text-sm font-medium transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New chat
          </button>
        </div>

        {/* Chat Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-2 uppercase tracking-wider">
            Recent
          </div>
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                currentSessionId === session.id
                  ? "bg-slate-200 dark:bg-[#2d2d2d] text-slate-900 dark:text-white font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#252525]"
              }`}
            >
              {session.messages?.[0]?.text || "New Chat"}
            </button>
          ))}
        </div>

        {/* Bottom Profile Section */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 relative mt-auto">
          
          {/* Popover Logout Menu */}
          {showMenu && (
            <div className="absolute bottom-full left-0 w-full pb-2 px-3 z-20">
              <div className="bg-white dark:bg-[#2d2d2d] border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors font-medium"
                >
                  Log out
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Profile Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-full flex items-center justify-end gap-3 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-[#2d2d2d] transition-colors"
          >
            <div className="flex flex-col items-end truncate">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {isGuest ? "Guest User" : (username || "User")}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                isGuest ? "text-amber-500" : "text-emerald-500"
              }`}>
                {isGuest ? "Temporary" : "Verified"}
              </span>
            </div>
            
            <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md border-2 border-slate-50 dark:border-[#1e1e1e] select-none">
              <span className="text-white font-bold text-sm">
                {username ? username.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
          </button>
        </div>

      </div>
    </>
  );
}