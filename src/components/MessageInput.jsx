import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, Plus, X, Pause, AlertCircle } from "lucide-react";

const MAX_TOTAL_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB maximum limit enforced in background

const MessageInput = ({
  onSendMessage,
  onStopStreaming,
  onStopGeneration,
  isLoading,
  isStreaming,
}) => {
  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const [fileLimitWarning, setFileLimitWarning] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");

  const handleStop = onStopStreaming || onStopGeneration;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    baseTextRef.current = text.trim();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i];
        const transcriptText = item[0].transcript;
        if (item.isFinal) {
          finalTranscript += transcriptText + " ";
        } else {
          interimTranscript += transcriptText;
        }
      }

      const spokenText = (finalTranscript + interimTranscript).trim();
      const base = baseTextRef.current;
      const fullText = base ? (spokenText ? `${base} ${spokenText}` : base) : spokenText;

      setText(fullText);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("Speech recognition failed to start:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  // Validate file size and count in the background without cluttering the UI with byte counters
  const handleFileChange = (e) => {
    const incomingFiles = Array.from(e.target.files || []);
    if (incomingFiles.length === 0) return;

    let currentCount = selectedFiles.length;
    let runningBytes = selectedFiles.reduce((sum, f) => sum + (f.size || 0), 0);

    const acceptedBatch = [];
    const newlyRejected = [];

    for (const file of incomingFiles) {
      // Block if single file or cumulative total exceeds 20 MB
      if (file.size > MAX_TOTAL_SIZE_BYTES || runningBytes + file.size > MAX_TOTAL_SIZE_BYTES) {
        newlyRejected.push({
          id: `${file.name}_${Date.now()}_${Math.random()}`,
          name: file.name,
          message: `File size too long: "${file.name}" exceeds the maximum allowed size limit and could not be uploaded.`,
        });
        continue;
      }

      // Enforce maximum of 3 files per message
      if (currentCount >= 3) {
        setFileLimitWarning("Upload limit: You can attach a maximum of 3 files per message.");
        setTimeout(() => setFileLimitWarning(""), 4500);
        break;
      }

      runningBytes += file.size;
      currentCount += 1;
      acceptedBatch.push(file);
    }

    if (acceptedBatch.length > 0) {
      setSelectedFiles((prev) => [...prev, ...acceptedBatch]);
    }

    if (newlyRejected.length > 0) {
      setRejectedFiles((prev) => [...prev, ...newlyRejected]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setFileLimitWarning("");
  };

  const dismissRejectedFile = (idToRemove) => {
    setRejectedFiles((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && selectedFiles.length === 0) || isLoading || isStreaming) return;

    if (isRecording) {
      stopRecording();
    }

    const msgToSend = text;
    const filesToSend = [...selectedFiles];

    setText("");
    setSelectedFiles([]);
    setRejectedFiles([]);
    setFileLimitWarning("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    onSendMessage(msgToSend, filesToSend);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {fileLimitWarning && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs animate-fadeIn">
          <span>{fileLimitWarning}</span>
          <button type="button" onClick={() => setFileLimitWarning("")} className="p-1 hover:text-slate-900 dark:hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Warning banner shown only for the specific file where the size limit was exceeded */}
      {rejectedFiles.length > 0 && (
        <div className="flex flex-col gap-1.5 px-1 animate-fadeIn">
          {rejectedFiles.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl text-xs border bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300 shadow-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle size={15} className="shrink-0 text-rose-500 dark:text-rose-400" />
                <span className="leading-snug font-medium">{item.message}</span>
              </div>
              <button
                type="button"
                onClick={() => dismissRejectedFile(item.id)}
                className="text-rose-400 hover:text-rose-200 p-0.5 rounded shrink-0"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clean attached file badges without visible size or counter labels */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          {selectedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border bg-slate-100 border-slate-200 text-slate-800 dark:bg-[#1f2128] dark:border-[#2e313b] dark:text-gray-200"
            >
              <span>📄</span>
              <span className="max-w-[160px] truncate font-medium">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                title="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-center gap-2 border rounded-2xl p-2 transition-colors duration-200 bg-white border-slate-200 focus-within:border-blue-500 shadow-xs dark:bg-[#21232b] dark:border-[#2e313b] dark:focus-within:border-blue-500 dark:shadow-md">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => {
            if (selectedFiles.length >= 3) {
              setFileLimitWarning("Upload limit reached: Maximum of 3 files allowed.");
              setTimeout(() => setFileLimitWarning(""), 4000);
            } else {
              fileInputRef.current?.click();
            }
          }}
          className="p-2 rounded-xl transition-colors shrink-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-[#2c2f3a]"
          title="Attach files"
        >
          <Plus size={19} />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "Listening... Speak now" : "Ask me anything..."}
          className="flex-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-0 resize-none px-2 py-1 max-h-44 leading-relaxed text-slate-800 placeholder-slate-400 dark:text-gray-100 dark:placeholder-gray-400"
        />

        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all shrink-0 flex items-center justify-center shadow-md animate-pulse ring-2 ring-red-500/40"
            title="Stop voice input"
          >
            <Square size={12} className="fill-white text-white" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="p-2 rounded-xl transition-colors shrink-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-[#2c2f3a]"
            title="Search with voice"
          >
            <Mic size={19} />
          </button>
        )}

        {isStreaming ? (
          <button
            type="button"
            onClick={handleStop}
            className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors shrink-0 flex items-center justify-center shadow-xs"
            title="Pause response"
            aria-label="Pause response"
          >
            <Pause size={14} className="fill-white text-white" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={(!text.trim() && selectedFiles.length === 0) || isLoading}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-colors shrink-0 flex items-center justify-center"
            title="Send message"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;