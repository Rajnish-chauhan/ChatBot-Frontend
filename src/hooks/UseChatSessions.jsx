import { useState, useEffect } from "react";
import { fetchSessions, createSession, sendChatMessage } from "../api/chatApi";

export function useChatSessions(isAuthenticated) {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadSessionsFromDB();
    }
  }, [isAuthenticated]);

  const loadSessionsFromDB = async () => {
    try {
      const data = await fetchSessions();
      if (data && data.length > 0) {
        setSessions(data);
        setCurrentSessionId(data[data.length - 1].id);
      } else {
        handleNewChat(); 
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId) || { messages: [] };

  const handleNewChat = async () => {
    try {
      const newSession = await createSession("New Chat");
      setSessions((prev) => [...prev, newSession]);
      setCurrentSessionId(newSession.id);
      return newSession.id; // Return the new ID so handleSend can use it immediately
    } catch (err) {
      console.error("Failed to create session", err);
      return null;
    }
  };

  const handleSend = async (text, file) => {
    let activeSessionId = currentSessionId;

    // FIX: If there is no active session, automatically create one before sending
    if (!activeSessionId) {
      activeSessionId = await handleNewChat();
      if (!activeSessionId) {
        alert("Failed to create a session to send your message.");
        return; 
      }
    }

    const activeFile = file || droppedFile;
    const userMsg = { 
      sender: "user", 
      text, 
      image: activeFile ? URL.createObjectURL(activeFile) : null,
      isDocument: activeFile && (activeFile.type.includes("pdf") || activeFile.name.endsWith(".doc")),
      fileName: activeFile ? activeFile.name : null
    };

    // Optimistically update UI using the activeSessionId
    setSessions((prev) => prev.map((s) => 
      s.id === activeSessionId 
        ? { ...s, title: s.messages.length === 0 ? text.substring(0,25) : s.title, messages: [...s.messages, userMsg] } 
        : s
    ));

    setLoading(true);
    setDroppedFile(null);

    try {
      const data = await sendChatMessage(activeSessionId, text, activeFile);
      // Ensure we safely pull the response string whether backend returns {text: "..."} or {reply: "..."}
      const botMsg = { sender: "bot", text: data.reply || data.text || "No reply received." };
      
      setSessions((prev) => prev.map((s) =>
        s.id === activeSessionId ? { ...s, messages: [...s.messages, botMsg] } : s
      ));
    } catch (err) {
      const errorMsg = { sender: "bot", text: `Error: ${err.message}` };
      setSessions((prev) => prev.map((s) =>
        s.id === activeSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s
      ));
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