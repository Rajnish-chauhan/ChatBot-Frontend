import React, { useState } from "react";

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  username, 
  isGuest, 
  sessions = [], 
  onSelectSession, 
  onDeleteAccount, 
  onOpenUpgrade 
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" or "history"

  if (!isOpen) return null;

  const totalConversations = sessions.length;
  const totalMessages = sessions.reduce((acc, s) => acc + (s.messages ? s.messages.length : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#1c1c1c] w-full max-w-lg rounded-2xl shadow-2xl border border-[#2d2d2d] overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#2d2d2d]">
          <h3 className="text-lg font-bold text-white">Account Profile & History</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2d2d2d] px-6 bg-[#161616]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
              activeTab === "overview" 
                ? "border-blue-500 text-blue-400" 
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
              activeTab === "history" 
                ? "border-blue-500 text-blue-400" 
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Chat History ({totalConversations})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === "overview" ? (
            <>
              {/* User Avatar & Info */}
              <div className="flex items-center gap-4 bg-[#262626] p-4 rounded-xl border border-[#333]">
                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold uppercase shrink-0">
                  {username ? username.charAt(0) : "U"}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Account Holder</p>
                  <p className="text-base font-semibold text-white truncate">{username}</p>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium inline-block mt-1 ${
                    isGuest ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}>
                    {isGuest ? "Guest User (Temporary)" : "Registered User (Permanent)"}
                  </span>
                </div>
              </div>

              {/* Chat Statistics Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Interaction Statistics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#242424] p-4 rounded-xl border border-[#333]">
                    <p className="text-xs text-slate-400">Total Conversations</p>
                    <p className="text-2xl font-bold text-white mt-1">{totalConversations}</p>
                  </div>
                  <div className="bg-[#242424] p-4 rounded-xl border border-[#333]">
                    <p className="text-xs text-slate-400">Total Messages</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{totalMessages}</p>
                  </div>
                </div>
              </div>

              {/* Guest Upgrade Action */}
              {isGuest && (
                <div className="bg-blue-950/30 border border-blue-800/40 p-4 rounded-xl">
                  <h4 className="text-sm font-semibold text-blue-300 mb-1">Save Your Guest Chats</h4>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Guest accounts have limited daily queries. Register to permanently link your chat history.
                  </p>
                  <button
                    onClick={onOpenUpgrade}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition"
                  >
                    Upgrade / Save Account
                  </button>
                </div>
              )}

              {/* Danger Zone */}
              {!isGuest && (
                <div className="border-t border-[#333] pt-4">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Danger Zone</h4>
                  <button
                    onClick={onDeleteAccount}
                    className="w-full py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold uppercase tracking-wider transition"
                  >
                    Delete Account & All Data
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Chat History Tab */
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No conversation history found.</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3.5 bg-[#252525] hover:bg-[#2d2d2d] rounded-xl border border-[#333] cursor-pointer transition"
                  >
                    <div className="truncate flex-1 pr-3">
                      <p className="text-sm font-medium text-white truncate">
                        {session.title || "New Chat"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {session.messages ? session.messages.length : 0} messages stored
                      </p>
                    </div>
                    <span className="text-xs text-blue-400 hover:underline shrink-0">Open →</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2d2d2d] bg-[#161616] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#333] hover:bg-[#3d3d3d] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}