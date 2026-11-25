import posthog from "posthog-js/no-external";
import { ANALYTICS_ORIGIN, publicRoute, sanitizeAnalyticsEvent } from "./policy";

let enabled = false;

export function initializeAnalytics() {
  if (enabled) return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST;
  if (
    !import.meta.env.PROD ||
    location.origin !== ANALYTICS_ORIGIN ||
    !key?.startsWith("phc_") ||
    !host
  )
    return;
  try {
    posthog.init(key, {
      api_host: host,
      defaults: "2026-08-30",
      persistence: "memory",
      disable_persistence: true,
      person_profiles: "never",
      ip: false,
      respect_dnt: true,
      save_campaign_params: false,
      save_referrer: false,
      disable_capture_url_hashes: false,
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: {
        dom_event_allowlist: ["click"],
        element_allowlist: ["a", "button"],
        url_ignorelist: [/#\/(?:app|auth|aplikuj)(?:[/?#]|$)/],
        css_selector_ignorelist: [
          ".ph-no-capture",
          ".ph-no-autocapture",
          "[data-ph-no-autocapture]",
          "[data-sensitive]",
          "form",
          "input",
          "textarea",
          "select",
          "[contenteditable]",
        ],
        capture_copied_text: false,
        capture_value_css_selector_allowlist: [],
      },
      mask_all_text: true,
      mask_all_element_attributes: true,
      disable_session_recording: true,
      enable_recording_console_log: false,
      session_recording: { maskAllInputs: true, maskTextSelector: "*", blockSelector: "body" },
      capture_exceptions: false,
      capture_performance: false,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      rageclick: false,
      capture_webmcp: false,
      logs: { captureConsoleLogs: false, beforeSend: () => null },
      disable_surveys: true,
      disable_web_experiments: true,
      disable_conversations: true,
      disable_product_tours: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      // Only the isolated, intercepted browser fixture accepts automated traffic.
      opt_out_useragent_filter: import.meta.env.MODE === "analytics-test",
      disable_compression: true,
      request_queue_config: { flush_interval_ms: 1000 },
      before_send: sanitizeAnalyticsEvent,
    });
    enabled = true;
  } catch {
    // Analytics must never prevent local prototype work or recovery.
  }
}

export function capturePublicPageview(pathname: string) {
  if (enabled && publicRoute(pathname)) posthog.capture("$pageview");
}
