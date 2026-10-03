import React, { useState } from "react";

export default function Sidebar({ onNewChat, sessions, currentSessionId, onSelectSession }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div 
      className={`h-full bg-[#f9f9f9] dark:bg-[#1e1f20] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      }`}
    >
      {/* Top Header & Toggle Button */}
      <div className="p-3 flex items-center justify-between">
        {isExpanded ? (
          <div className="flex items-center gap-2 px-2">
            <span className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight">ChatBot</span>
          </div>
        ) : (
          <div className="mx-auto w-6 h-6 flex items-center justify-center"></div>
        )}
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-[#2d2f31] text-slate-600 dark:text-slate-300 transition-colors"
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {/* Split Panel Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
            <line x1="9" y1="6" x2="9" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button 
          onClick={onNewChat}
          className={`flex items-center gap-3 w-full rounded-full bg-slate-200/50 dark:bg-[#2d2f31] hover:bg-slate-300/50 dark:hover:bg-[#3b3d3f] transition-colors text-sm font-medium text-slate-800 dark:text-slate-200 ${
            isExpanded ? "px-4 py-2.5" : "p-2.5 justify-center"
          }`}
          title="New chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          {isExpanded && <span>New chat</span>}
        </button>
      </div>

      {/* Chat History Section (Icon Removed) */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
        {isExpanded && <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-2 px-3 uppercase tracking-wider">Recent</p>}
        
        {sessions.map((session) => (
          <button 
            key={session.id} 
            onClick={() => onSelectSession(session.id)}
            title={session.title}
            className={`w-full text-left truncate rounded-lg text-sm transition-colors flex items-center ${
              isExpanded ? "px-3 py-2.5" : "p-2.5 justify-center"
            } ${
              currentSessionId === session.id
                ? "bg-slate-200 dark:bg-[#2d2f31] text-slate-900 dark:text-white font-medium" 
                : "hover:bg-slate-200/50 dark:hover:bg-[#2d2f31]/50 text-slate-700 dark:text-slate-300"
            }`}
          >
            {isExpanded ? (
              <span className="truncate w-full">{session.title}</span>
            ) : (
              /* When collapsed, show just the first letter or a dot/icon substitute */
              <span className="text-xs font-semibold">{session.title.charAt(0)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}