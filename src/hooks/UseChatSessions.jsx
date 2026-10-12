import { useState, useEffect, useRef, useCallback } from "react";
import {
  getSessions,
  createSession,
  deleteSession as apiDeleteSession,
  getMessages,
  streamChatMessage,
  loginAsGuest,
} from "../api/ChatApi";

const getLocalMessages = (sessionId) => {
  if (!sessionId) return [];
  try {
    const cached = localStorage.getItem(`chat_session_${sessionId}_msgs`);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

const saveLocalMessages = (sessionId, msgs) => {
  if (!sessionId) return;
  try {
    localStorage.setItem(`chat_session_${sessionId}_msgs`, JSON.stringify(msgs));
  } catch (e) {
    console.warn("Failed to cache messages:", e);
  }
};

const useChatSessions = (currentUser) => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef(null);

  const loadSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      const sessionList = Array.isArray(data) ? data : [];
      setSessions(sessionList);

      if (sessionList.length > 0) {
        setActiveSessionId((prev) => {
          const exists = sessionList.some((s) => s.id === prev);
          return exists ? prev : sessionList[0].id;
        });
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.warn("Failed to load sessions:", err);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [currentUser?.username, loadSessions]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const cached = getLocalMessages(activeSessionId);
    if (cached && cached.length > 0) {
      setMessages(cached);
    }

    const fetchRemote = async () => {
      try {
        const data = await getMessages(activeSessionId);
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((m, idx) => ({
            id: m.id || `msg_${idx}`,
            role: m.role || (m.type === "BOT" || m.sender === "bot" || m.sender === "BOT" ? "assistant" : "user"),
            content: m.content || m.message || m.text || "",
          }));
          setMessages(normalized);
          saveLocalMessages(activeSessionId, normalized);
        }
      } catch (err) {
        console.warn(`Backend message load failed for session ${activeSessionId}:`, err);
      }
    };

    fetchRemote();
  }, [activeSessionId]);

  const createNewSession = () => {
    if (messages.length === 0 && activeSessionId === null) {
      return;
    }
    setActiveSessionId(null);
    setMessages([]);
  };

  const selectSession = (sessionId) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
  };

  const deleteSession = async (sessionId) => {
    try {
      await apiDeleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      try {
        localStorage.removeItem(`chat_session_${sessionId}_msgs`);
      } catch {}

      if (activeSessionId === sessionId) {
        setSessions((prev) => {
          const remaining = prev.filter((s) => s.id !== sessionId);
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
          } else {
            setActiveSessionId(null);
            setMessages([]);
          }
          return remaining;
        });
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const sendMessage = async (userQuery, files = null) => {
    if ((!userQuery || !userQuery.trim()) && (!files || files.length === 0)) return;
    if (isLoading) return;

    // Enforce max 3 files limit at front boundary
    const sanitizedFiles = files ? files.slice(0, 3) : null;
    const trimmedQuery = (userQuery || "").trim();

    let token = localStorage.getItem("token");
    if (!token) {
      try {
        const guestData = await loginAsGuest();
        token = guestData.token;
      } catch (e) {
        console.warn("Guest auth initiation failed:", e);
      }
    }

    const userMsg = {
      id: "u_" + Date.now(),
      role: "user",
      content: trimmedQuery,
      files: sanitizedFiles || [],
    };

    const assistantMsgId = "a_" + (Date.now() + 1);
    const initialAssistantMsg = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setIsLoading(true);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let targetSessionId = activeSessionId;

      if (!targetSessionId) {
        try {
          const titleSnippet =
            trimmedQuery.length > 25
              ? trimmedQuery.slice(0, 25) + "..."
              : trimmedQuery || (sanitizedFiles && sanitizedFiles[0] ? sanitizedFiles[0].name : "New Chat");
          const newSession = await createSession(titleSnippet);
          const rawId = newSession?.id || newSession?.sessionId;
          if (rawId) {
            targetSessionId = Number(rawId);
            setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== targetSessionId)]);
            setActiveSessionId(targetSessionId);
          }
        } catch (sessionErr) {
          console.warn("Session creation error:", sessionErr);
        }
      } else {
        const currentSession = sessions.find((s) => s.id === targetSessionId);
        if (currentSession && (!currentSession.title || currentSession.title.toLowerCase() === "new chat")) {
          const titleSnippet =
            trimmedQuery.length > 25
              ? trimmedQuery.slice(0, 25) + "..."
              : trimmedQuery;
          setSessions((prev) =>
            prev.map((s) => (s.id === targetSessionId ? { ...s, title: titleSnippet } : s))
          );
        }
      }

      const response = await streamChatMessage(
        targetSessionId,
        trimmedQuery,
        sanitizedFiles,
        abortController.signal
      );

      // Handle Rate Limit 429 Status cleanly with Warning Card
      if (response.status === 429) {
        let errJson = null;
        try {
          errJson = await response.json();
        } catch {}

        const isGuestLimit = errJson?.isGuest ?? (currentUser?.isGuest || !currentUser);
        const warningText =
          errJson?.message ||
          (isGuestLimit
            ? "Daily limit reached. Please create a free account or sign in to continue chatting."
            : "Daily limit reached. Your quota will reset after 24 hours. Please try again tomorrow.");

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  isRateLimitError: true,
                  isGuestError: isGuestLimit,
                  content: warningText,
                }
              : msg
          )
        );
        return;
      }

      if (!response.ok) {
        let errText = "Server error";
        try {
          const errJson = await response.json();
          errText = errJson.message || errJson.error || response.statusText;
        } catch {
          errText = await response.text();
        }
        throw new Error(errText || `Server returned ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        const finalReply =
          json.response ||
          json.content ||
          json.message ||
          json.text ||
          json.answer ||
          JSON.stringify(json);

        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: finalReply } : msg
          );
          if (targetSessionId) saveLocalMessages(targetSessionId, updated);
          return updated;
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamBuffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const events = streamBuffer.replace(/\r\n/g, "\n").split("\n\n");
        streamBuffer = events.pop() || "";

        for (const event of events) {
          if (!event) continue;
          const dataLines = [];
          const lines = event.split("\n");

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const val = line.slice(5);
              if (val === "[DONE]") continue;
              dataLines.push(val);
            }
          }

          if (dataLines.length > 0) {
            assistantContent += dataLines.join("\n");
            setMessages((prev) => {
              const updated = prev.map((msg) =>
                msg.id === assistantMsgId ? { ...msg, content: assistantContent } : msg
              );
              if (targetSessionId) saveLocalMessages(targetSessionId, updated);
              return updated;
            });
          }
        }
      }

      if (streamBuffer) {
        const dataLines = [];
        const lines = streamBuffer.replace(/\r\n/g, "\n").split("\n");
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const val = line.slice(5);
            if (val !== "[DONE]") dataLines.push(val);
          }
        }
        if (dataLines.length > 0) {
          assistantContent += dataLines.join("\n");
          setMessages((prev) => {
            const updated = prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: assistantContent } : msg
            );
            if (targetSessionId) saveLocalMessages(targetSessionId, updated);
            return updated;
          });
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Stream generation stopped by user.");
      } else {
        console.error("Stream generation error:", err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    `Error: ${err.message || "Could not process request. Please try again."}`,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  return {
    sessions,
    activeSessionId,
    messages,
    isLoading,
    isStreaming,
    createNewSession,
    selectSession,
    deleteSession,
    sendMessage,
    stopGeneration,
    reloadSessions: loadSessions,
  };
};

export default useChatSessions;