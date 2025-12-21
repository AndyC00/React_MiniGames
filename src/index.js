import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style/Main.css";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);