import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./layouts/App";
import { Analytics } from '@vercel/analytics/react';

// Main AppWrapper component to manage theme and routing
/**
 * AppWrapper component that manages the theme (dark/light mode) and provides it to the application.
 * 
 * This component:
 * - Initializes the dark mode state based on the user's preference stored in localStorage.
 * - Provides a function to toggle the theme and save the preference to localStorage.
 * - Creates a theme object using Material-UI's createTheme function based on the dark mode state.
 * - Wraps the application in a ThemeProvider and Router.
 * 
 * @returns {JSX.Element} The AppWrapper component.
 */
const AppWrapper = () => {
  // Default theme is dark
  const [darkMode, setDarkMode] = useState(true); // Set default to true for dark mode

  // Load theme preference from localStorage on mount, if available
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setDarkMode(false);
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
        main: "#4A90E2", // Blue for primary actions
      },
      secondary: {
        main: "#FF6F61", // Coral for secondary accents
      },
      background: {
        default: darkMode ? "#121212" : "#F4F6F8", // Dark mode and light mode background
        paper: darkMode ? "#1D1D1D" : "#FFFFFF", // Paper background for cards, modals, etc.
      },
      text: {
        primary: darkMode ? "#EAEAEA" : "#333333", // Text color in dark/light modes
        secondary: "#757575", // Secondary text color for less important text
      },
      error: {
        main: "#D32F2F", // Red for error messages
      },
      success: {
        main: "#388E3C", // Green for success messages
      },
    },
    typography: {
      fontFamily: '"Roboto", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 500,
      },
      body1: {
        fontWeight: 400,
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Router> {/* Ensure App is wrapped in Router */}
        <App darkMode={darkMode} toggleTheme={toggleTheme} />
        <Analytics />
      </Router>
    </ThemeProvider>
  );
};

// Render the application
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
