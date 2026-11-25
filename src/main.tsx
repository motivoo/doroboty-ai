import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./features/prototype/app";
import "./app/globals.css";
import { PrototypeErrorBoundary } from "./features/prototype/error-boundary";
import { recordDiagnostic } from "./features/prototype/diagnostics";
import { logPostHogInitialized } from "./lib/posthog-logs";
import posthog from "posthog-js";

const posthogToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

if (posthogToken && posthogHost) {
  posthog.init(posthogToken, {
    api_host: posthogHost,
    defaults: "2026-08-30",
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
    logs: {
      serviceName: "doroboty-ai-web",
      environment: import.meta.env.MODE,
    },
  });
  logPostHogInitialized();
} else if (import.meta.env.DEV) {
  const missingVariable = posthogToken
    ? "VITE_PUBLIC_POSTHOG_HOST"
    : "VITE_PUBLIC_POSTHOG_PROJECT_TOKEN";

  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

window.addEventListener("error", () => recordDiagnostic("runtime-error"));
window.addEventListener("unhandledrejection", () => recordDiagnostic("unhandled-rejection"));
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PrototypeErrorBoundary>
      <App />
    </PrototypeErrorBoundary>
  </StrictMode>,
);
