# Privacy-limited PostHog analytics

## Intent and acceptance criteria

Connect the public Netlify prototype to the owner's PostHog project 767004. Rework
the existing wizard PR #2 rather than shipping its identity, replay, logs and
private-workspace instrumentation.

- Initialize the official SDK once, only on the canonical production origin and
  when both public build variables are present. Missing configuration and failed
  requests must not stop the prototype. Local and preview builds do not report.
- Capture pageviews for public hash routes, including client-side navigation.
  Strip query strings and replace job/company slugs with route templates.
- Enable click Autocapture for public links/buttons. Exclude forms, inputs,
  editable content, sensitive markers, persona selection, applications and the
  entire workspace. Mask DOM text and attributes. A final event allowlist drops
  everything except sanitized public pageviews and clicks.
- Keep identity anonymous and in memory. Never identify a simulated persona or
  send a name, form value, note, CV, export, exception, referrer or raw URL.
  Disable replay, console logs, performance, heatmaps, surveys and other SDK
  products even when enabled in the remote project.
- Use the existing homepage action **Zobacz oferty** as the live click test.
- Document VITE_POSTHOG_KEY and VITE_POSTHOG_HOST in Netlify's build environment,
  update the privacy explanation and behavior register, run ./scripts/verify,
  separately review the change, then publish manually on the existing site.
- Verify Pageview and Autocapture in the target project's Activity / Live,
  including the event URL and timestamp. Do not count a local intercept as
  proof of ingestion.

## Validation

- 2026-11-25: ./scripts/verify passed with official Node 24.22.3, npm 11.19.1
  and installed Chrome: formatting, immutable design-kit checks, lint, types,
  47 unit tests, baseline packet, production build, 53 static browser journeys,
  7 dev/StrictMode journeys and 3 analytics SDK interception tests.
- npm run package:participant passed with a pristine baseline manifest. The new
  analytics config is included; the ignored local env file is not distributed.
- Independent review pass compared the final tree against main and checked
  initialization, route exclusions, anonymous IDs, allowlisted payloads,
  recorded configuration/build identity, packaging and the absence of the
  wizard's identify/captureException/logging/private-workspace hooks. No blocker
  found. The existing design components/styles are unchanged; the only visible
  addition is explanatory text on the privacy page.
- Netlify now has VITE_POSTHOG_KEY and VITE_POSTHOG_HOST for the live app. On the
  Free plan, scope selection is unavailable. Non-production contexts explicitly
  use disabled / https://disabled.invalid, and the runtime canonical-origin
  check provides a second boundary. No routing/proxy or paid add-on is needed.
- Project 767004 has no Autocapture opt-out. Its remote session recording,
  console and performance settings are enabled; this application's explicit
  SDK configuration disables those products and drops all log records.
- CI, publication and actual PostHog event ingestion are still pending.
