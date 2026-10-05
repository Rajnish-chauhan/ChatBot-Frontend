import { useState, useEffect } from "react";
import { fetchSessions, createSession, sendChatMessage } from "../api/ChatApi";

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
      if (Array.isArray(data) && data.length > 0) {
        // FIX: Ensure every session from the DB has a valid messages array to prevent mapping crashes
        const safeData = data.map(s => ({ ...s, messages: s.messages || [] }));
        setSessions(safeData);
        setCurrentSessionId(safeData[safeData.length - 1].id);
      } else {
        await handleNewChat(); 
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
      return newSession.id;
    } catch (err) {
      console.error("Failed to create session", err);
      return null;
    }
  };

  const handleSend = async (text, file) => {
    let activeSessionId = currentSessionId;

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

    // FIX: Safely extract messages array, defaulting to [] if undefined
    setSessions((prev) => prev.map((s) => {
      if (s.id === activeSessionId) {
        const currentMsgs = s.messages || [];
        return { 
          ...s, 
          title: currentMsgs.length === 0 ? text.substring(0,25) + (text.length > 25 ? '...' : '') : s.title, 
          messages: [...currentMsgs, userMsg] 
        };
      }
      return s;
    }));

    setLoading(true);
    setDroppedFile(null);

    try {
      const data = await sendChatMessage(activeSessionId, text, activeFile);
      const botMsg = { sender: "bot", text: data.reply || data.text || "No reply received." };
      
      setSessions((prev) => prev.map((s) => {
        if (s.id === activeSessionId) {
          const currentMsgs = s.messages || [];
          return { ...s, messages: [...currentMsgs, botMsg] };
        }
        return s;
      }));
    } catch (err) {
      const errorMsg = { sender: "bot", text: `Error: ${err.message}` };
      setSessions((prev) => prev.map((s) => {
        if (s.id === activeSessionId) {
           const currentMsgs = s.messages || [];
           return { ...s, messages: [...currentMsgs, errorMsg] };
        }
        return s;
      }));
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