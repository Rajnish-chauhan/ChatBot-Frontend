import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// CodeBlock component with syntax highlighting, copy, and download actions
const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  // Normalize language name for the syntax highlighter and file extension
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
    a.download = `snippet.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl overflow-hidden my-4 border border-slate-700/60 bg-[#1e1e1e] shadow-md w-full max-w-full">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-white/5">
        <span className="text-xs font-semibold text-slate-300 capitalize tracking-wider">
          {language || "code"}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            title="Download code"
            className="text-slate-400 hover:text-white transition-colors flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-500"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Code body with language-specific syntax highlighting */}
      <div className="overflow-x-auto text-[13.5px] leading-relaxed">
        <SyntaxHighlighter
          language={normalizedLanguage === "code" ? "text" : normalizedLanguage}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "#1e1e1e",
            fontSize: "13.5px",
            lineHeight: "1.6",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// Formats non-code markdown text such as headings, bold words, and bullet points
const MarkdownText = ({ content }) => {
  return (
    <div className="text-[15px] leading-relaxed text-slate-900 dark:text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings styling
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold my-3 text-slate-900 dark:text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold my-2.5 text-slate-900 dark:text-white">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold my-2 text-slate-900 dark:text-white">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold my-1.5 text-slate-900 dark:text-white">
              {children}
            </h4>
          ),
          // Paragraph styling
          p: ({ children }) => (
            <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
          ),
          // List styling
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-5 mb-2.5 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-5 mb-2.5 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">{children}</li>
          ),
          // Bold text styling
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-white">
              {children}
            </strong>
          ),
          // Inline code styling
          code: ({ children }) => (
            <code className="bg-slate-200 dark:bg-[#333333] px-1.5 py-0.5 rounded text-[13.5px] font-mono text-pink-600 dark:text-pink-400">
              {children}
            </code>
          ),
          // Blockquote styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-2 bg-slate-100 dark:bg-[#252525] rounded-r italic text-slate-700 dark:text-slate-300">
              {children}
            </blockquote>
          ),
          // External link styling
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// Splits message into code blocks and normal text chunks
const formatMessage = (text) => {
  if (!text) return null;

  // Matches complete code blocks as well as active streaming code blocks
  const regex = /```([a-zA-Z0-9+#_-]*)\n?([\s\S]*?)(?:```|$)/g;
  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Append text chunk before code block
    if (match.index > lastIndex) {
      const textChunk = text.slice(lastIndex, match.index).trim();
      if (textChunk) {
        elements.push(
          <MarkdownText key={`text-${lastIndex}`} content={textChunk} />
        );
      }
    }

    const language = match[1] || "code";
    const code = match[2];

    // Render code block in the designated CodeBlock container
    if (match[0].startsWith("```")) {
      elements.push(
        <CodeBlock
          key={`code-${match.index}`}
          language={language}
          code={code}
        />
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Append remaining text after the final code block
  if (lastIndex < text.length) {
    const textChunk = text.slice(lastIndex).trim();
    if (textChunk) {
      elements.push(
        <MarkdownText key={`text-${lastIndex}`} content={textChunk} />
      );
    }
  }

  return elements.length > 0 ? elements : <MarkdownText content={text} />;
};

// Copy button component for the full message
const MessageCopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy message"
      className="ml-2 p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 rounded-full shadow-sm flex shrink-0 self-start mt-2"
    >
      {copied ? (
        <svg
          xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-emerald-500"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        <svg
          xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      )}
    </button>
  );
};

// Main ChatBox component
export default function ChatBox({ messages, loading }) {
  const endRef = useRef(null);

  // Automatically scroll down on new messages
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
          className={`flex group w-full ${
            msg.sender === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`relative flex items-start max-w-[95%] md:max-w-[85%] ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-fit px-5 py-3 rounded-3xl ${
                msg.sender === "user"
                  ? "bg-slate-100 dark:bg-[#2a2a2a] text-slate-900 dark:text-slate-100 rounded-tr-sm"
                  : "bg-transparent text-slate-900 dark:text-slate-100 w-full"
              }`}
            >
              {/* Attachment file previews */}
              {msg.files && msg.files.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {msg.files.map((filePreview, fIdx) =>
                    filePreview.isDocument ? (
                      <div
                        key={fIdx}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-700 shadow-sm w-fit"
                      >
                        <span className="text-xl">📄</span>
                        <span className="text-xs font-medium truncate max-w-[150px]">
                          {filePreview.name || "Document"}
                        </span>
                      </div>
                    ) : (
                      <img
                        key={fIdx}
                        src={filePreview.url}
                        alt="Uploaded"
                        className="h-24 w-24 md:h-32 md:w-32 rounded-xl object-cover shadow-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1e1e1e]"
                      />
                    )
                  )}
                </div>
              )}

              {/* User text displays as plain text; Bot response is formatted with markdown and syntax highlighting */}
              {msg.sender === "user" ? (
                <span className="whitespace-pre-wrap leading-relaxed text-[15px]">
                  {msg.text}
                </span>
              ) : (
                formatMessage(msg.text)
              )}
            </div>

            {/* Quick copy button */}
            {msg.text && <MessageCopyButton text={msg.text} />}
          </div>
        </div>
      ))}

      {/* Loading animation indicator */}
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