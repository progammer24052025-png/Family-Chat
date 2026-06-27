import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router";

// Initialize theme from localStorage before app renders
const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme === "light" || (!savedTheme && !prefersDark)) {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.add("dark");
  document.documentElement.classList.remove("light");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
