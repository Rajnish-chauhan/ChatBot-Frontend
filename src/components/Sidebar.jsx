import React, { useState } from "react";
import {
  MessageSquare,
  SquarePen,
  Trash2,
  Pencil,
  Check,
  Settings,
  LogIn,
  PanelLeft,
  X,
} from "lucide-react";
import Logo from "./Logo";

export default function Sidebar({
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  user,
  onOpenSettings,
  onOpenProfile,
  onOpenLogin,
  isOpen = true,
  isMobile = false,
  onClose,
  onToggle,
}) {
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const isGuest = Boolean(
    !user ||
    user.isGuest === true ||
    user.guest === true ||
    (typeof user?.username === "string" && user.username.toLowerCase().startsWith("guest_"))
  );

  const displayName = user?.username || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  const startEditing = (e, session) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title || "New Chat");
  };

  const submitRename = (e, sessionId) => {
    e.stopPropagation();
    if (editingTitle.trim() && onRenameSession) {
      onRenameSession(sessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
    setEditingTitle("");
  };

  return (
    <aside
      className={`h-[100dvh] flex flex-col border-r transition-all duration-300 select-none ${
        isOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
      } bg-slate-50 border-slate-200 text-slate-700 dark:bg-[#0d0f12] dark:border-slate-800/80 dark:text-slate-300`}
    >
      {/* Brand header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/50">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base">
              Chat<span className="text-blue-500">Bot</span>
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md border border-blue-500/20 dark:border-blue-500/30">
              AI
            </span>
          </div>
        </div>

        {onToggle && (
          <button
            type="button"
            onClick={isMobile && onClose ? onClose : onToggle}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
            title="Toggle Sidebar"
          >
            {isMobile ? <X size={18} /> : <PanelLeft size={18} />}
          </button>
        )}
      </div>

      {/* New chat button */}
      <div className="p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:text-white text-sm font-medium transition-all shadow-xs active:scale-[0.98]"
        >
          <SquarePen size={16} className="text-slate-500 dark:text-slate-300" />
          <span>New chat</span>
        </button>
      </div>

      {/* ChatGPT / Claude style session list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
        <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Recent chats
        </div>

        {sessions && sessions.length > 0 ? (
          sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            const isEditing = editingSessionId === s.id;

            return (
              <div
                key={s.id}
                onClick={() => !isEditing && onSelectSession(s.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm cursor-pointer transition-all ${
                  isActive
                    ? "bg-slate-200 text-slate-900 font-medium dark:bg-slate-800 dark:text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-1">
                  <MessageSquare
                    size={16}
                    className={`shrink-0 ${
                      isActive ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingTitle}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitRename(e, s.id);
                        if (e.key === "Escape") setEditingSessionId(null);
                      }}
                      onBlur={(e) => submitRename(e, s.id)}
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs px-2 py-1 rounded border border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <span className="truncate">{s.title || "New Chat"}</span>
                  )}
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={(e) => submitRename(e, s.id)}
                      className="p-1 text-emerald-500 hover:text-emerald-400 rounded-md"
                      title="Save title"
                    >
                      <Check size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => startEditing(e, s)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-500 rounded-md hover:bg-slate-300/50 dark:hover:bg-slate-700/50 transition-all"
                      title="Rename chat"
                    >
                      <Pencil size={13} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-300/50 dark:hover:bg-slate-700/50 transition-all"
                    title="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No chat history yet.
          </div>
        )}
      </div>

      {/* Bottom user profile card */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0d0f12]">
        {isGuest ? (
          <button
            type="button"
            onClick={() => onOpenLogin && onOpenLogin("welcome")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all duration-200 shadow-xs active:scale-[0.98]"
            title="Register or sign in to save chat history"
          >
            <LogIn size={16} className="shrink-0" />
            <span>Register / Log In</span>
          </button>
        ) : (
          <div
            onClick={onOpenProfile}
            className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 dark:bg-slate-800/40 dark:border-slate-700/50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 overflow-hidden flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-xs">
                {user?.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  userInitial
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400">
                  Profile & Settings
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenSettings) onOpenSettings();
                else if (onOpenProfile) onOpenProfile();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors shrink-0"
              title="Profile & Settings"
            >
              <Settings size={17} />
            </button>
          </div>
        )}

        <div className="mt-3 text-center">
          <a
            href="/privacy-policy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400 transition-colors"
          >
            Privacy and Policy
          </a>
        </div>
      </div>
    </aside>
  );
}