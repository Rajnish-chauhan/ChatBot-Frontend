import React, { useRef, useEffect } from "react";

export default function chatBox({ messages, loading }) {
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
            className={`w-fit max-w-[85%] md:max-w-[75%] px-5 py-3 rounded-3xl text-[15px] leading-relaxed ${
              msg.sender === "user"
                ? "bg-slate-100 dark:bg-[#2f2f2f] text-slate-900 dark:text-slate-100"
                : "bg-transparent text-slate-900 dark:text-slate-100"
            }`}
          >
            {msg.image && (
              <div className="mb-2">
                {/* Check if it's an image or a document */}
                {msg.isDocument ? (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xl">📄</span>
                    <span className="text-xs font-medium truncate max-w-[150px]">{msg.fileName || "Document"}</span>
                  </div>
                ) : (
                  <img
                    src={msg.image}
                    alt="Uploaded context"
                    className="h-16 w-16 md:h-20 md:w-20 rounded-xl object-cover shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1e1e1e]"
                  />
                )}
              </div>
            )}
            <p className="whitespace-pre-wrap">{msg.text}</p>
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex items-center space-x-2 text-slate-400 text-sm pl-4">
          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-.3s]" />
          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-.5s]" />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}