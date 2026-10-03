import React from "react";
import ThemeToggle from "./components/ThemeToggle";
import ChatBox from "./components/ChatBox";
import MessageInput from "./components/MessageInput";
import DropZone from "./components/DropZone";
import Sidebar from "./components/Sidebar";
import { useChatSessions } from "./hooks/UseChatSessions";

export default function App() {
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
  } = useChatSessions();

  return (
    <DropZone onDrop={(file) => setDroppedFile(file)}>
      <div className="h-full w-full flex bg-white dark:bg-[#121212] transition-colors overflow-hidden">
        
        {/* Sidebar Component */}
        <Sidebar 
          sessions={sessions} 
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat} 
          onSelectSession={setCurrentSessionId}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <header className="h-16 shrink-0 px-6 flex items-center justify-end z-10 border-b border-transparent dark:border-slate-800/50">
            <ThemeToggle />
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
  );
}