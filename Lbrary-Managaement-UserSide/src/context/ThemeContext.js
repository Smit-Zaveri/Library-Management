// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Create a context for the theme
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// ThemeProvider component to wrap the app and provide theme context
export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false); // State for dark mode

  useEffect(() => {
    // Load theme preference from localStorage on mount
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => {
      const newTheme = !prev ? "dark" : "light";
      localStorage.setItem("theme", newTheme); // Save to localStorage
      return !prev;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
