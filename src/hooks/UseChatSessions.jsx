import { useState, useEffect, useRef } from "react";
import { fetchSessions, createSession, streamChatMessage } from "../api/ChatApi";

export function useChatSessions(isAuthenticated, onRequireLogin) {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const saved = localStorage.getItem("currentSessionId");
    return saved ? Number(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);

  const hasFetchedRef = useRef(false);
  const isCreatingRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      loadSessionsFromDB();
    }
  }, [isAuthenticated]);

  // Persist selected session ID in localStorage
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("currentSessionId", String(currentSessionId));
    }
  }, [currentSessionId]);

  const loadSessionsFromDB = async () => {
    try {
      const data = await fetchSessions();
      
      if (Array.isArray(data) && data.length > 0) {
        // Normalize sender casing so ChatBox renders user/bot bubbles correctly
        const safeData = data.map(s => ({ 
          ...s, 
          messages: (s.messages || []).map(m => ({
            ...m,
            sender: m.sender ? m.sender.toLowerCase() : "bot"
          })) 
        }));
        
        safeData.sort((a, b) => a.id - b.id);
        setSessions(safeData);

        // Restore saved session ID or pick the most recent
        const savedId = Number(localStorage.getItem("currentSessionId"));
        const exists = safeData.some(s => s.id === savedId);

        if (exists) {
          setCurrentSessionId(savedId);
        } else {
          // Select the last active session
          const lastActive = [...safeData].reverse().find(s => s.messages.length > 0);
          const chosen = lastActive ? lastActive.id : safeData[safeData.length - 1].id;
          setCurrentSessionId(chosen);
        }
      } else {
        await handleNewChat(); 
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
      hasFetchedRef.current = false; 
    }
  };

  const currentSession = sessions.find((s) => s.id === currentSessionId) || { messages: [] };

  const handleNewChat = async () => {
    const existingEmptySession = sessions.find(s => !s.messages || s.messages.length === 0);
    
    if (existingEmptySession) {
      setCurrentSessionId(existingEmptySession.id);
      return existingEmptySession.id;
    }

    if (isCreatingRef.current) return null;
    isCreatingRef.current = true;

    try {
      const newSession = await createSession("New Chat");
      newSession.messages = [];
      let finalId = newSession.id;

      setSessions((prev) => {
        const stillHasEmpty = prev.find(s => !s.messages || s.messages.length === 0);
        if (stillHasEmpty) {
          finalId = stillHasEmpty.id;
          return prev;
        }
        return [...prev, newSession];
      });

      setCurrentSessionId(finalId);
      return finalId;

    } catch (err) {
      console.error("Failed to create session", err);
      if (err.message?.includes("GUEST_LIMIT") || err.message?.includes("AUTH_REQUIRED")) {
        if (onRequireLogin) onRequireLogin();
      } else {
        alert("Session creation failed: " + err.message);
      }
      return null;
    } finally {
      isCreatingRef.current = false;
    }
  };

  const handleSend = async (text, file) => {
    let activeSessionId = currentSessionId;

    if (!activeSessionId) {
      activeSessionId = await handleNewChat();
      if (!activeSessionId) return; 
    }

    const activeFile = file || droppedFile;
    const userMsg = { 
      sender: "user", 
      text, 
      image: activeFile ? URL.createObjectURL(activeFile) : null,
      isDocument: activeFile && (activeFile.type.includes("pdf") || activeFile.name.endsWith(".doc") || activeFile.name.endsWith(".docx")),
      fileName: activeFile ? activeFile.name : null
    };

    const botPlaceholder = { sender: "bot", text: "" };

    setSessions((prev) => prev.map((s) => {
      if (s.id === activeSessionId) {
        const currentMsgs = s.messages || [];
        return { 
          ...s, 
          title: currentMsgs.length === 0 ? text.substring(0, 25) + (text.length > 25 ? '...' : '') : s.title, 
          messages: [...currentMsgs, userMsg, botPlaceholder] 
        };
      }
      return s;
    }));

    setLoading(true);
    setDroppedFile(null);

    try {
      let fullBotText = "";

      await streamChatMessage(activeSessionId, text, activeFile, (chunk) => {
        setLoading(false);
        fullBotText += chunk;

        setSessions((prev) => prev.map((s) => {
          if (s.id === activeSessionId) {
            const updatedMsgs = [...(s.messages || [])];
            if (updatedMsgs.length > 0) {
              updatedMsgs[updatedMsgs.length - 1].text = fullBotText;
            }
            return { ...s, messages: updatedMsgs };
          }
          return s;
        }));
      });

    } catch (err) {
      console.error("Streaming error:", err);
      const errorMessage = err.message || "Unknown error occurred.";
      let finalMessage = "";
      
      if (errorMessage.includes("GUEST_LIMIT_REACHED") || errorMessage.includes("AUTH_REQUIRED") || errorMessage.includes("403")) {
        finalMessage = "Please sign in or create a free account to continue chatting.";
        if (onRequireLogin) onRequireLogin();
      } else if (errorMessage.includes("LIMIT_REACHED") || errorMessage.includes("429")) {
        finalMessage = "You have reached your daily interaction limit. Please try again tomorrow.";
      } else {
        finalMessage = `Error: ${errorMessage}. Please check your backend console.`;
      }

      setSessions((prev) => prev.map((s) => {
        if (s.id === activeSessionId) {
          const updatedMsgs = [...(s.messages || [])];
          if (updatedMsgs.length > 0) {
            updatedMsgs[updatedMsgs.length - 1].text = finalMessage;
          }
          return { ...s, messages: updatedMsgs };
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