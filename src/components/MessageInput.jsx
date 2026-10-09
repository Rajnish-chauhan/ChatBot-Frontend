import React, { useState, useRef, useEffect } from "react";

export default function MessageInput({ onSend, disabled, externalFile, onClearExternalFile }) {
  const [text, setText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [localFiles, setLocalFiles] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  const forbiddenWords = ["idiot", "stupid", "abuse"];

  // Display professional in-app toast notification instead of browser alerts
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Auto-resize textarea height as user types or inserts newlines
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [text, interimText]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event) => {
        let currentInterim = "";
        let currentFinal = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          const isAbusive = forbiddenWords.some((word) =>
            transcript.toLowerCase().includes(word)
          );

          if (isAbusive) {
            recognition.stop();
            setIsListening(false);
            setInterimText("");
            showToast("Please use polite words and ask your doubt professionally.");
            return;
          }

          if (event.results[i].isFinal) {
            currentFinal += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        if (currentFinal) {
          setText((prev) => (prev ? prev + " " : "") + currentFinal);
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = () => setIsListening(false);

      recognition.onend = () => {
        setIsListening(false);
        setInterimText((prevInterim) => {
          if (prevInterim) setText((prev) => (prev ? prev + " " : "") + prevInterim);
          return "";
        });
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (externalFile) {
      handleFileSelection([externalFile]);
    }
  }, [externalFile]);

  // Validates file uploads and limits
  const handleFileSelection = (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;

    let validFiles = [];
    let hasVideoAudio = false;
    let hasOversized = false;

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const fileType = file.type || "";
      const fileName = file.name ? file.name.toLowerCase() : "";

      const isVideoOrAudio =
        fileType.includes("video") ||
        fileType.includes("audio") ||
        fileName.endsWith(".mp4") ||
        fileName.endsWith(".mp3") ||
        fileName.endsWith(".m4a") ||
        fileName.endsWith(".mov");

      // Check max 10MB per file
      const isOversized = file.size > 10 * 1024 * 1024;

      if (isVideoOrAudio) {
        hasVideoAudio = true;
      } else if (isOversized) {
        hasOversized = true;
      } else {
        validFiles.push(file);
      }
    }

    if (hasVideoAudio) {
      showToast("Video and audio files are not supported. Only images and documents were added.");
    }

    if (hasOversized) {
      showToast("Files exceeding 10MB limit were skipped.");
    }

    setLocalFiles((prev) => {
      const totalFiles = prev.length + validFiles.length;
      if (totalFiles > 10) {
        showToast("Upload limit reached: Maximum 10 files allowed at once.");
        return [...prev, ...validFiles].slice(0, 10);
      }
      return [...prev, ...validFiles];
    });

    if (onClearExternalFile) onClearExternalFile();
  };

  const removeFile = (index) => {
    setLocalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = (e) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFileSelection(e.clipboardData.files);
    }
  };

  // Submit message handler
  const handleSendMessage = () => {
    const finalText = (text + " " + interimText).trim();

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (!finalText && localFiles.length === 0) return;

    onSend(finalText, localFiles.length > 0 ? localFiles : []);

    setText("");
    setInterimText("");
    setLocalFiles([]);
    if (onClearExternalFile) onClearExternalFile();

    // Reset textarea height back to single line
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Enter to send, Shift + Enter for a new line
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      showToast("Microphone not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="flex flex-col gap-2 shrink-0 pb-4 relative w-full">
      {/* Professional In-App Toast Notification */}
      {toastMessage && (
        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-slate-900/95 dark:bg-[#252526] border border-slate-700 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium z-50 flex items-center gap-2.5 backdrop-blur-md animate-fade-in-up">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            className="text-amber-400 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Selected file preview chips */}
      {localFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {localFiles.map((f, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#2a2a2a] border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <span className="text-xs font-medium truncate max-w-[120px] dark:text-white text-slate-800">
                {f.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-[#3a3a3a] rounded-full text-slate-500 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input bar container */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-2.5 rounded-[28px] bg-slate-100 dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-800 shadow-sm transition-all"
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,.pdf,.doc,.docx"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length > 0) {
              handleFileSelection(e.target.files);
            }
          }}
        />

        {/* File upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-[#2a2a2a] text-slate-600 dark:text-slate-300 transition shrink-0 mb-0.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        {/* Speech wave animation or multiline textarea without visible scrollbars */}
        {isListening ? (
          <div className="flex-1 flex items-center justify-center gap-[3px] h-10 overflow-hidden px-4">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-blue-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.max(20, Math.random() * 100)}%`,
                  animationDelay: `${Math.random()}s`,
                  animationDuration: "0.5s",
                }}
              />
            ))}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={1}
            value={text + (interimText ? (text ? " " : "") + interimText : "")}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Ask me anything..."
            disabled={disabled}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            className="flex-1 bg-transparent px-2 py-2 text-[15px] focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-500 disabled:opacity-50 resize-none max-h-44 leading-relaxed overflow-y-auto [&::-webkit-scrollbar]:hidden"
          />
        )}

        {/* Microphone action */}
        {isListening ? (
          <button
            type="button"
            onClick={handleMicClick}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-300 dark:bg-[#3a3a3a] hover:bg-slate-400 dark:hover:bg-[#4a4a4a] transition shrink-0 mb-0.5"
          >
            <div className="w-3 h-3 bg-slate-800 dark:bg-slate-200 rounded-[2px]"></div>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleMicClick}
            className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-[#2a2a2a] text-slate-600 dark:text-slate-300 transition shrink-0 mb-0.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
        )}

        {/* Send message button */}
        <button
          type="submit"
          disabled={disabled || (!text.trim() && !interimText.trim() && localFiles.length === 0)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:hover:bg-blue-600 transition shrink-0 mb-0.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </button>
      </form>
    </div>
  );
}