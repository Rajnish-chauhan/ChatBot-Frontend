import { useState, useEffect } from "react";
import { fetchSessions, createSession, streamChatMessage } from "../api/ChatApi";

export function useChatSessions(isAuthenticated, onRequireLogin) {
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
    const existingEmptySession = sessions.find(s => !s.messages || s.messages.length === 0);
    
    if (existingEmptySession) {
      setCurrentSessionId(existingEmptySession.id);
      return existingEmptySession.id;
    }

    try {
      const newSession = await createSession("New Chat");
      setSessions((prev) => [...prev, newSession]);
      setCurrentSessionId(newSession.id);
      return newSession.id;
    } catch (err) {
      console.error("Failed to create session", err);
      
      const errorMessage = err.message || "";
      if (
        errorMessage.includes("GUEST_LIMIT_REACHED") || 
        errorMessage.includes("AUTH_REQUIRED") || 
        errorMessage.includes("403")
      ) {
        if (onRequireLogin) onRequireLogin();
      } else if (errorMessage.includes("LIMIT_REACHED") || errorMessage.includes("429")) {
        const resetTime = new Date();
        resetTime.setHours(resetTime.getHours() + 24);
        const timeStr = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        alert(`You have reached your daily interaction limit. Please try again tomorrow after ${timeStr}.`);
      }
      return null;
    }
  };

  const handleSend = async (text, file) => {
    let activeSessionId = currentSessionId;

    if (!activeSessionId) {
      activeSessionId = await handleNewChat();
      if (!activeSessionId) {
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

    const botPlaceholder = { sender: "bot", text: "" };

    setSessions((prev) => prev.map((s) => {
      if (s.id === activeSessionId) {
        const currentMsgs = s.messages || [];
        return { 
          ...s, 
          title: currentMsgs.length === 0 ? text.substring(0,25) + (text.length > 25 ? '...' : '') : s.title, 
          messages: [...currentMsgs, userMsg, botPlaceholder] 
        };
      }
      return s;
    }));

    setLoading(true);
    setDroppedFile(null);

    try {
      let fullBotText = "";

      await streamChatMessage(activeSessionId, text, (chunk) => {
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
      
      const errorMessage = err.message || "";
      let finalMessage = errorMessage;
      let triggerLoginWindow = false;
      
      // 1. GUEST HIT LIMIT OR AUTH EXPIRED -> Prompt Login
      if (
        errorMessage.includes("GUEST_LIMIT_REACHED") || 
        errorMessage.includes("AUTH_REQUIRED") || 
        errorMessage.includes("403")
      ) {
        triggerLoginWindow = true;
        finalMessage = "Please sign in or create a free account to continue chatting.";
      } 
      // 2. REGISTERED USER HIT LIMIT -> Show 24 Hour Message
      else if (errorMessage.includes("LIMIT_REACHED") || errorMessage.includes("429")) {
        const resetTime = new Date();
        resetTime.setHours(resetTime.getHours() + 24);
        const timeString = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        finalMessage = `You have reached your daily interaction limit. Please try again tomorrow after ${timeString}.`;
      } 
      // 3. SERVER OR NETWORK ISSUE
      else {
        finalMessage = "We encountered an issue connecting to the server. Please try again.";
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

      if (triggerLoginWindow && onRequireLogin) {
        onRequireLogin();
      }

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