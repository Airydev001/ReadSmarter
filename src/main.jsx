import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AppProvider } from "./store";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <HashRouter><AppProvider><App /></AppProvider></HashRouter>
);
