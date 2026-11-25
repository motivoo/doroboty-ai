# Participant guide

## Start

Use the prepared baseline package and Node.js 24 with npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3001. If Node or registry access is blocked by your organization, ask your instructor/IT rather than bypassing the policy.

## Try a complete flow

1. Choose Anna Kowalska and browse offers.
2. Save an offer, edit the profile, write the application answer directly and approve submission. The optional project card is a separate next step; its simulated helper does not write the application answer.
3. Choose Karolina Wiśniewska for BrightLabs and review its candidates.
4. Record review, invitation, conversation and the next decision.
5. Return to Anna and inspect the application history.

Karolina and Tomasz see their respective companies in the interface; this is role simulation. All data is local and synthetic. CVs are prepared text examples, not real uploads. AI proposals and scores simulate the scenario.

## Save, share and recover

Changes survive reload in this browser when saving succeeds. Settings can export a JSON file, import a scenario or reset to fixtures. Import/reset asks before replacing state and confirms success only after persistence. If a save is incompatible, download the original before resetting. Storage failure is shown explicitly; export before closing the tab. One tab per browser scenario holds write access; another tab remains read-only. Close the writer tab and reload the other tab to transfer access. Preserve/export work before reload; unsubmitted form fields are not part of the export. Use a current browser over localhost or HTTPS (Web Locks is required for writes).

A URL shares the interface, not your local changes. To transfer a scenario, share the exported file and import it in the other browser. Exports include all personas, applications and notes; never enter real personal data.

Export at the end of each exercise and before imports, resets or changing the app address/version. Restore by opening a separate browser profile, importing the file in settings and comparing the saved profile, applications, project versions and notes. Keep the original file until this check succeeds. The hosting provider cannot back up browser-local work. See the in-app **Pomoc i odzyskiwanie danych** page for a safe issue template; send the template to your instructor, never your scenario export.

## Static build

Run npm run build. Serve dist/ through any static HTTP host. No provider account is needed for local development. Do not open index.html via file://; ES modules need HTTP. Hash links work without route rewrite configuration.

## Verification

Run ./scripts/verify or npm run check. Browser tests require provisioned Playwright Chromium; a missing test browser does not prevent npm run dev. Do not let an agent install system dependencies automatically.

An already installed Google Chrome can be selected explicitly with `PLAYWRIGHT_USE_INSTALLED_CHROME=1 ./scripts/verify`; record that browser choice with the results. The default remains provisioned Chromium. Release, rollback and recovery procedures are in [RELEASE.md](RELEASE.md).
