import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Sun & Moon theme toggle component.
 * Switches between Dark and Light modes with both Sun and Moon rendered in white.
 */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      // Default to dark mode if no previous preference is stored
      return true;
    }
    return true;
  });

  // Apply dark/light class to both root <html> and <body> elements
  const applyTheme = (dark) => {
    const root = document.documentElement;
    const body = document.body;

    if (dark) {
      root.classList.add("dark");
      body.classList.add("dark");
      root.style.colorScheme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
      root.style.colorScheme = "light";
      localStorage.setItem("theme", "light");
    }

    // Broadcast theme update event across components
    window.dispatchEvent(new Event("themeChanged"));
  };

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  // Synchronize state if theme changed across tabs or storage
  useEffect(() => {
    const handleSync = () => {
      const current = localStorage.getItem("theme") || "dark";
      setIsDark(current === "dark");
    };

    window.addEventListener("themeChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("themeChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-xl border transition-all duration-200 flex items-center justify-center bg-[#1e2029] hover:bg-[#282a36] border-slate-700/60 shadow-xs active:scale-95 cursor-pointer"
      title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
      aria-label="Toggle Dark and Light Mode"
    >
      {isDark ? (
        // Sun icon rendered in white
        <Sun
          size={18}
          className="text-white hover:rotate-45 transition-transform duration-300"
        />
      ) : (
        // Moon icon rendered in white
        <Moon
          size={18}
          className="text-white hover:-rotate-12 transition-transform duration-300"
        />
      )}
    </button>
  );
}