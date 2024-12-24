// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import AppWrapper from "./AppWrapper"; // Import the AppWrapper component

// Render the application
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
