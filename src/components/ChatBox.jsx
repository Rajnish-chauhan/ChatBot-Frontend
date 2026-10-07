import React, { useRef, useEffect, useState } from "react";

const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = language === "javascript" || language === "js" ? "js" 
              : language === "python" ? "py" 
              : language === "java" ? "java" 
              : language === "html" ? "html" 
              : language === "css" ? "css" 
              : language === "json" ? "json" : "txt";
    a.download = `snippet.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl overflow-hidden my-4 border border-slate-700/60 bg-[#0d0d0d] shadow-md w-full max-w-full">
      <div className="flex items-center justify-between px-4 py-2 bg-[#212121] border-b border-white/5">
        <span className="text-xs font-medium text-slate-400 capitalize tracking-wider">
          {language || "code"}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            title="Download code"
            className="text-slate-400 hover:text-white transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button
            onClick={handleCopy}
            title="Copy code"
            className="text-slate-400 hover:text-white transition-colors flex items-center justify-center"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto text-[13.5px] text-slate-300 font-mono leading-relaxed">
        <pre><code className="block whitespace-pre">{code}</code></pre>
      </div>
    </div>
  );
};

const formatMessage = (text) => {
  if (!text) return null;
  const regex = /```([a-zA-Z0-9+#_-]*)\s*([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }
    parts.push(
      <CodeBlock key={`code-${match.index}`} language={match[1]} code={match[2]} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
        {text.slice(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : <span className="whitespace-pre-wrap leading-relaxed">{text}</span>;
};

export default function ChatBox({ messages, loading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 rounded-xl bg-transparent flex flex-col">
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center pb-20">
          <h2 className="text-2xl md:text-4xl font-medium text-slate-800 dark:text-slate-200">
            Hello, how can I assist you today?
          </h2>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex flex-col ${
            msg.sender === "user" ? "items-end" : "items-start"
          }`}
        >
          <div
            className={`w-fit max-w-[95%] md:max-w-[85%] px-5 py-3 rounded-3xl text-[15px] ${
              msg.sender === "user"
                ? "bg-slate-100 dark:bg-[#2a2a2a] text-slate-900 dark:text-slate-100"
                : "bg-transparent text-slate-900 dark:text-slate-100 w-full"
            }`}
          >
            {msg.image && (
              <div className="mb-3">
                {msg.isDocument ? (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 shadow-sm w-fit">
                    <span className="text-xl">📄</span>
                    <span className="text-xs font-medium truncate max-w-[200px]">{msg.fileName || "Document"}</span>
                  </div>
                ) : (
                  <img
                    src={msg.image}
                    alt="Uploaded context"
                    className="h-24 w-24 md:h-32 md:w-32 rounded-xl object-cover shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1e1e1e]"
                  />
                )}
              </div>
            )}
            
            {formatMessage(msg.text)}
            
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex items-center space-x-2 text-slate-400 text-sm pl-4 pt-2">
          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-.3s]" />
          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-.5s]" />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}