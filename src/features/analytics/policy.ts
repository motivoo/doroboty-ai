import type { CaptureResult } from "posthog-js";

export const ANALYTICS_ORIGIN = "https://doroboty-ai-nq8v.netlify.app";

const publicRoutes = new Set(["/", "/oferty", "/metodologia", "/pomoc", "/polityka-prywatnosci"]);
const actions: Record<string, string> = {
  "browse-jobs": "Zobacz oferty",
  methodology: "Jak wybieramy role",
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function publicRoute(pathname: string): string | null {
  if (publicRoutes.has(pathname)) return pathname;
  if (/^\/oferty\/[^/]+$/.test(pathname)) return "/oferty/:slug";
  if (/^\/firmy\/[^/]+$/.test(pathname)) return "/firmy/:slug";
  return null;
}

export function publicEventUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.origin !== ANALYTICS_ORIGIN || url.pathname !== "/") return null;
    const pathname = url.hash ? url.hash.slice(1).split(/[?#]/)[0] : "/";
    const route = publicRoute(pathname);
    return route === null ? null : `${ANALYTICS_ORIGIN}/#${route}`;
  } catch {
    return null;
  }
}

// Rebuild the payload rather than maintaining an ever-growing list of PII keys.
// This also strips person updates, DOM ancestors and future SDK enrichment.
export function sanitizeAnalyticsEvent(event: CaptureResult): CaptureResult | null {
  if (event.event !== "$pageview" && event.event !== "$autocapture") return null;
  const original = event.properties;
  const url = publicEventUrl(String(original.$current_url ?? ""));
  if (!url || typeof original.distinct_id !== "string" || !uuid.test(original.distinct_id))
    return null;

  const properties: CaptureResult["properties"] = {
    token: original.token,
    distinct_id: original.distinct_id,
    $current_url: url,
    $pathname: "/",
    $host: new URL(ANALYTICS_ORIGIN).host,
    $lib: "web",
    $process_person_profile: false,
    $ip: "0.0.0.0",
    $geoip_disable: true,
    app_build: __APP_BUILD__,
  };
  for (const key of ["$device_id", "$session_id", "$window_id"]) {
    const value: unknown = original[key];
    if (typeof value === "string" && uuid.test(value)) properties[key] = value;
  }
  if (typeof original.$lib_version === "string" && /^[\d.]+$/.test(original.$lib_version))
    properties.$lib_version = original.$lib_version;

  if (event.event === "$autocapture") {
    if (original.$event_type !== "click") return null;
    const elements: unknown = original.$elements;
    if (!Array.isArray(elements)) return null;
    const control = elements.find(
      (element) => element?.tag_name === "a" || element?.tag_name === "button",
    );
    if (!control) return null;
    const action: unknown = original.public_action;
    const label =
      typeof action === "string" && Object.hasOwn(actions, action) ? actions[action] : undefined;
    properties.$event_type = "click";
    properties.$ce_version = 1;
    properties.$elements = [{ tag_name: control.tag_name, ...(label ? { $el_text: label } : {}) }];
    if (label) properties.public_action = action;
  }
  return {
    uuid: event.uuid,
    event: event.event,
    timestamp: event.timestamp,
    properties,
  };
}
