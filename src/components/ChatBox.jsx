import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Logo from "./Logo";

// Syntax highlighted code snippet container
const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const normalizedLanguage = language ? language.toLowerCase().trim() : "text";

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

    const extensionMap = {
      javascript: "js",
      js: "js",
      jsx: "jsx",
      typescript: "ts",
      ts: "ts",
      tsx: "tsx",
      python: "py",
      py: "py",
      java: "java",
      html: "html",
      css: "css",
      json: "json",
      cpp: "cpp",
      c: "c",
      sql: "sql",
      sh: "sh",
      bash: "sh",
    };

    const ext = extensionMap[normalizedLanguage] || "txt";
    a.download = `code_snippet.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl overflow-hidden my-3 border border-slate-700/60 bg-[#1e1e1e] shadow-md w-full max-w-full">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#252526] border-b border-slate-700/60 select-none">
        <span className="text-xs font-medium text-slate-400 font-mono lowercase">
          {language || "code"}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            title="Download code snippet"
            className="text-slate-400 hover:text-white transition-colors flex items-center justify-center p-1 rounded hover:bg-slate-700/40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          <button
            onClick={handleCopy}
            title="Copy code"
            className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs py-0.5 px-2 rounded hover:bg-slate-700/50"
          >
            {copied ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-emerald-400"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy code</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto text-[13.5px]">
        <SyntaxHighlighter
          language={normalizedLanguage === "code" ? "text" : normalizedLanguage}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "0.85rem 1rem",
            background: "#1e1e1e",
            fontSize: "13.5px",
            lineHeight: "1.6",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default function ChatBox({
  messages = [],
  isStreaming = false,
  onOpenLogin,
}) {
  const endRef = useRef(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 rounded-xl bg-transparent flex flex-col max-w-4xl mx-auto w-full">
      {/* Empty State Welcome Screen */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center pb-20 text-center max-w-lg mx-auto">
          <div className="mb-4">
            <Logo size={52} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2.5 tracking-tight">
            How can I assist you today?
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
            Ask questions, explore ideas, analyze documents, or collaborate on code with intelligent AI assistance.
          </p>
        </div>
      )}

      {/* Conversation Messages */}
      {messages.map((msg, idx) => {
        const isUser =
          msg.role === "user" ||
          msg.sender === "user" ||
          msg.sender === "USER";
        const msgText = msg.content || msg.text || "";
        const msgId = msg.id || `msg_${idx}`;
        const isCurrentlyStreaming =
          !isUser && idx === messages.length - 1 && isStreaming;
        const isRateLimit = msg.isRateLimitError;
        const isGuestLimit = msg.isGuestError;

        return (
          <div
            key={msgId}
            className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
          >
            {isUser ? (
              <div className="flex flex-col items-end max-w-[90%] md:max-w-[75%]">
                <div className="px-4 py-2.5 rounded-3xl rounded-tr-md bg-[#f4f4f6] dark:bg-[#27272a] text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/60 text-[14.5px] leading-relaxed shadow-xs">
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-2">
                      {msg.attachments.map((file, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#18181b] border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200"
                        >
                          <span>📄</span>
                          <span className="truncate max-w-[140px] font-medium">
                            {file.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="whitespace-pre-wrap">{msgText}</span>
                </div>

                <div className="flex items-center mt-1 mr-1">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(msgText, msgId)}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200 px-1 py-0.5 rounded transition-colors"
                    title="Copy user message"
                  >
                    {copiedMsgId === msgId ? (
                      <>
                        <svg
                          className="w-3.5 h-3.5 text-emerald-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3.5 h-3.5 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3.5 max-w-[95%] md:max-w-[85%] w-full">
                <div className="shrink-0 mt-1">
                  <Logo size={32} />
                </div>

                {isRateLimit ? (
                  <div className="flex-1 max-w-lg rounded-2xl p-4 border border-amber-500/30 bg-amber-500/10 text-amber-200 space-y-3 shadow-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-300">
                          Limit Reached
                        </h4>
                        <span className="text-[11px] text-amber-400/80">
                          {isGuestLimit ? "Guest session notice" : "Quota resets in 24 hours"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-amber-200/90 leading-relaxed">
                      {msgText}
                    </p>

                    {isGuestLimit && (
                      <button
                        type="button"
                        onClick={onOpenLogin}
                        className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                          <polyline points="10 17 15 12 10 7" />
                          <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                        <span>Create Free Account / Log In</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 text-slate-900 dark:text-slate-100 text-[15px] leading-relaxed overflow-hidden pt-0.5">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          const codeString = String(children).replace(/\n$/, "");

                          if (
                            !inline &&
                            (match ||
                              codeString.includes("\n") ||
                              (className && className.includes("language-")))
                          ) {
                            return (
                              <CodeBlock
                                language={match ? match[1] : ""}
                                code={codeString}
                              />
                            );
                          }

                          return (
                            <code
                              className="bg-slate-200/80 dark:bg-[#2c2f38] text-blue-600 dark:text-blue-400 font-mono text-[13px] px-1.5 py-0.5 rounded border border-slate-300/80 dark:border-slate-700/60"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        pre({ children }) {
                          return <div className="w-full my-1">{children}</div>;
                        },
                        p: ({ children }) => (
                          <p className="mb-3.5 leading-relaxed last:mb-0">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-outside ml-5 mb-3.5 space-y-1.5">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-outside ml-5 mb-3.5 space-y-1.5">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed">{children}</li>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold my-3 text-slate-900 dark:text-white">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-bold my-2.5 text-slate-900 dark:text-white">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-semibold my-2 text-slate-900 dark:text-white">
                            {children}
                          </h3>
                        ),
                      }}
                    >
                      {msgText}
                    </ReactMarkdown>

                    {!isCurrentlyStreaming && msgText.trim().length > 0 && (
                      <div className="flex items-center mt-2 animate-fadeIn">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msgText, msgId)}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded-md hover:bg-slate-700/20 transition-colors"
                          title="Copy response"
                        >
                          {copiedMsgId === msgId ? (
                            <>
                              <svg
                                className="w-3.5 h-3.5 text-emerald-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span className="text-emerald-400 font-medium">
                                Copied!
                              </span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3.5 h-3.5 text-gray-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="13"
                                  height="13"
                                  rx="2"
                                  ry="2"
                                />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {isStreaming && (
        <div className="flex items-center space-x-2 text-slate-400 text-sm pl-11 pt-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-.3s]" />
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-.5s]" />
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}