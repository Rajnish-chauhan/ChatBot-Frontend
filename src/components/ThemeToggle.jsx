import React, { useEffect, useState } from "react";

export default function themeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const isDark = theme === "dark";

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [isDark, theme]);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <div className="flex flex-col items-center justify-center gap-1 mt-1">
      <button
        onClick={toggleTheme}
        // Finely tuned dimensions: w-10 (40px) h-5 (20px)
        className="relative inline-flex h-5 w-10 items-center rounded-full border-2 border-slate-900 dark:border-white transition-colors duration-300 focus:outline-none bg-transparent"
        aria-label="Toggle Dark Mode"
      >
        <span
          // Inner circle scaled to h-3 w-3 (12px)
          className={`inline-flex h-3 w-3 transform items-center justify-center rounded-full bg-slate-900 dark:bg-white transition-transform duration-300 ${
            isDark ? "translate-x-[1.2rem]" : "translate-x-0.5"
          }`}
        >
          {isDark ? (
            <svg className="w-2 h-2 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </span>
      </button>
      <span className="text-[9px] font-bold tracking-wider text-slate-900 dark:text-white uppercase">
        {isDark ? "Dark Mode" : "Light Mode"}
      </span>
    </div>
  );
}