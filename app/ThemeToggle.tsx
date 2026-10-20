"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    setDark(isDark);
    try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="pb-1 text-[#555] hover:text-white transition-colors text-lg leading-none"
    >
      {dark ? "☀︎" : "◑"}
    </button>
  );
}
