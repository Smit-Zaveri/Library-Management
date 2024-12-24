// src/AppWrapper.js
import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles"; // Import the context provider and createTheme
import App from "./App"; // Import your App component
import { Analytics } from "@vercel/analytics/react";

const AppWrapper = () => {
    const [darkMode, setDarkMode] = useState(false); // State for dark mode

    // Load theme preference from localStorage on mount
    useEffect(() => {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        setDarkMode(true);
      }
    }, []);
  
    // Function to toggle the theme
    const toggleTheme = useCallback(() => {
      setDarkMode((prev) => {
        const newTheme = !prev ? "dark" : "light";
        localStorage.setItem("theme", newTheme); // Save to localStorage
        return !prev;
      });
    }, []);
  
    // Create the theme based on the darkMode state
    const theme = createTheme({
      palette: {
        mode: darkMode ? "dark" : "light", // Set mode based on darkMode
        primary: {
          main: "#673bb7", // Customize your primary color
        },
      },
    });
  return (
    <ThemeProvider theme={theme}>
      <Router>
      <App  darkMode={darkMode} toggleTheme={toggleTheme} />
        <Analytics />
      </Router>
    </ThemeProvider>
  );
};

export default AppWrapper;
