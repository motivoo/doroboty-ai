import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./features/prototype/app";
import "./app/globals.css";
import { PrototypeErrorBoundary } from "./features/prototype/error-boundary";
import { recordDiagnostic } from "./features/prototype/diagnostics";

window.addEventListener("error", () => recordDiagnostic("runtime-error"));
window.addEventListener("unhandledrejection", () => recordDiagnostic("unhandled-rejection"));
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PrototypeErrorBoundary>
      <App />
    </PrototypeErrorBoundary>
  </StrictMode>,
);
