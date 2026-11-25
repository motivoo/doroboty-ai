import { describe, expect, it } from "vitest";
import type { CaptureResult } from "posthog-js";
import { ANALYTICS_ORIGIN, publicEventUrl, sanitizeAnalyticsEvent } from "./policy";

const anonymousId = "019aa431-8e74-7000-8012-873b7c17f227";
function event(overrides: Partial<CaptureResult> = {}): CaptureResult {
  return {
    uuid: anonymousId,
    event: "$pageview",
    properties: {
      token: "phc_test",
      distinct_id: anonymousId,
      $current_url: `${ANALYTICS_ORIGIN}/?email=PRIVATE#/oferty/PRIVATE?q=PRIVATE`,
      $referrer: "https://example.com/PRIVATE",
      name: "PRIVATE",
      $set: { email: "PRIVATE" },
      $set_once: { note: "PRIVATE" },
      $session_id: anonymousId,
    },
    $set: { name: "PRIVATE" },
    ...overrides,
  };
}

describe("the outbound analytics boundary", () => {
  it("normalizes public URLs and excludes every private or unknown route", () => {
    expect(publicEventUrl(`${ANALYTICS_ORIGIN}/?private=1#/oferty?q=PRIVATE`)).toBe(
      `${ANALYTICS_ORIGIN}/#/oferty`,
    );
    expect(publicEventUrl(`${ANALYTICS_ORIGIN}/#/firmy/PRIVATE`)).toBe(
      `${ANALYTICS_ORIGIN}/#/firmy/:slug`,
    );
    for (const route of ["/app", "/app/profil", "/auth/sign-in", "/aplikuj/PRIVATE", "/unknown"])
      expect(publicEventUrl(`${ANALYTICS_ORIGIN}/#${route}`)).toBeNull();
    expect(publicEventUrl("https://deploy-preview-2--doroboty-ai-nq8v.netlify.app/")).toBeNull();
  });

  it("removes person updates, raw URLs, referrers and unexpected enrichment", () => {
    const result = sanitizeAnalyticsEvent(event());
    expect(result?.properties.$current_url).toBe(`${ANALYTICS_ORIGIN}/#/oferty/:slug`);
    expect(result?.properties.$session_id).toBe(anonymousId);
    expect(result?.properties.$process_person_profile).toBe(false);
    expect(result?.properties.$ip).toBe("0.0.0.0");
    expect(result?.properties.$geoip_disable).toBe(true);
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
    expect(result).not.toHaveProperty("$set");
  });

  it("keeps a fixed public action label and discards DOM text and ancestors", () => {
    const raw = event();
    raw.event = "$autocapture";
    Object.assign(raw.properties, {
      $event_type: "click",
      public_action: "browse-jobs",
      $elements: [
        { tag_name: "svg", $el_text: "PRIVATE" },
        { tag_name: "a", attr__href: "PRIVATE", $el_text: "PRIVATE" },
        { tag_name: "div", attr__id: "PRIVATE" },
      ],
    });
    const clean = sanitizeAnalyticsEvent(raw);
    expect(clean?.properties.$elements).toEqual([{ tag_name: "a", $el_text: "Zobacz oferty" }]);
    expect(JSON.stringify(clean)).not.toContain("PRIVATE");
    raw.properties.public_action = "__proto__";
    expect(sanitizeAnalyticsEvent(raw)?.properties).not.toHaveProperty("public_action");
  });

  it("rejects identity, replay, exceptions, form events and identifying IDs", () => {
    for (const name of ["$identify", "$exception", "$snapshot", "profile_saved", "$set"])
      expect(sanitizeAnalyticsEvent(event({ event: name }))).toBeNull();
    const privateEvent = event();
    privateEvent.properties.$current_url = `${ANALYTICS_ORIGIN}/#/app/kandydaci/PRIVATE`;
    expect(sanitizeAnalyticsEvent(privateEvent)).toBeNull();
    const identified = event();
    identified.properties.distinct_id = "person@example.com";
    expect(sanitizeAnalyticsEvent(identified)).toBeNull();
    const input = event({ event: "$autocapture" });
    Object.assign(input.properties, { $event_type: "change", $input_value: "PRIVATE" });
    expect(sanitizeAnalyticsEvent(input)).toBeNull();
  });
});
