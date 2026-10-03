import { useState, useEffect } from "react";
import { sendChatMessage } from "../api/ChatApi";

export function useChatSessions() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem("chat_sessions");
    if (saved) return JSON.parse(saved);
    return [{ id: Date.now(), title: "New Chat", messages: [] }];
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const savedId = localStorage.getItem("current_session_id");
    return savedId ? Number(savedId) : sessions[0]?.id;
  });

  const [loading, setLoading] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);

  useEffect(() => {
    localStorage.setItem("chat_sessions", JSON.stringify(sessions));
    localStorage.setItem("current_session_id", currentSessionId);
  }, [sessions, currentSessionId]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  const handleNewChat = () => {
    if (sessions[0].messages.length === 0) {
      setCurrentSessionId(sessions[0].id);
      return;
    }
    const newSession = { id: Date.now(), title: "New Chat", messages: [] };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleSend = async (text, file) => {
    const activeFile = file || droppedFile;
    const isDoc = activeFile && (activeFile.type.includes("pdf") || activeFile.name.endsWith(".doc") || activeFile.name.endsWith(".docx"));
    
    const userMsg = { 
      sender: "user", 
      text, 
      image: activeFile ? URL.createObjectURL(activeFile) : null,
      isDocument: isDoc,
      fileName: activeFile ? activeFile.name : null
    };

    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id === currentSessionId) {
          const newTitle = session.messages.length === 0 
            ? text.substring(0, 30) + (text.length > 30 ? "..." : "")
            : session.title;
            
          return {
            ...session,
            title: newTitle,
            messages: [...session.messages, userMsg],
          };
        }
        return session;
      })
    );

    setLoading(true);
    setDroppedFile(null);

    try {
      const data = await sendChatMessage(text, activeFile);
      const botMsg = { sender: "bot", text: data.reply || "No reply received." };
      
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === currentSessionId
            ? { ...session, messages: [...session.messages, botMsg] }
            : session
        )
      );
    } catch (err) {
      const errorMsg = { sender: "bot", text: `Error: ${err.message}` };
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === currentSessionId
            ? { ...session, messages: [...session.messages, errorMsg] }
            : session
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    sessions,
    currentSession,
    currentSessionId,
    setCurrentSessionId,
    loading,
    droppedFile,
    setDroppedFile,
    handleNewChat,
    handleSend
  };
}