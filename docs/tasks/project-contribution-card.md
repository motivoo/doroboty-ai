# Project contribution card

## Intent

Implement the user-supplied 2026-11-20 `usage-scenario.md` for I01/E01 in the existing browser-local prototype. One optional project belongs to one submitted application. Candidate drafts remain private in the role UI; only approved immutable versions enter the recruiter view. Recruiter conclusions are internal and never change the application stage or send messages.

## Acceptance

- Offer the optional step after submission and from the candidate application detail; skipping preserves the application and score.
- Provide project, material and preview steps, inline errors, draft recovery, explicit unknown/solo/confidential paths and named recipient.
- Share only an up-to-date preview with explicit approval and successful browser persistence. Editing creates a new draft and preserves prior published versions.
- Render approved claims with candidate-answer/material provenance in an accessible source drawer. Never fetch or fabricate external source contents.
- Provide a company-scoped review list, version-pinned autosaved conclusions, evidence references, role interpretation, justified next step, edit and next-application navigation.
- Support an optional frozen E01 session with A/B formats of identical supplied facts, shared task/notes and one format per reviewer/application. Do not invent the missing source key, research results or participant recruitment.
- Preserve hash routes, submitted CV/answer snapshots, existing stage actions, scenario scores, import/export/reset and old version-1 saves.

## Design and integration

Use the project's immutable Poster People kit: C01–C04 controls, C07 metadata, C13 navigation, C18 named modal and C22 reading anatomy; compose the existing `record-sheet`, `BackLink`, Base UI controls and local Geist Serif. The wizard, source drawer and review column are host extensions. One ink contour, white/paper surfaces, pink actions, serif 400 headings; stack at 850px and retain complete content at 320px. Keep all source-kit files unchanged.

## Implementation

- Added candidate/recruiter hash routes, post-submit/detail entry points and role-filtered list metadata. Original application records, stage actions, CV snapshots and fixed scores remain intact.
- Added optional version-1 contribution/review schemas. Existing saves still parse. Approved snapshots, draft revisions, review authors/version references and evidence references are validated on mutation/import.
- Added durable final sharing/save operations: failed persistence leaves the existing draft in memory and never confirms publication. E01 assignment also persists before exposing its selected material.
- Sources are candidate declarations or supplied excerpts/HTTP(S) links. Link contents are never fetched or generated. The text-organization helper is explicitly simulated; editable proposals retain the original answers as provenance.
- Updated README, BRIEF, FEATURES and host component documentation.

## Execution evidence

- `./scripts/verify` executed: formatting, 67-file immutable-kit integrity/six kit tests, lint, TypeScript, 35 unit tests, 120-journey baseline packet verification and static build passed. Its default browser stage could not launch because the expected Playwright Chromium binary is absent. No browser/OS packages were installed.
- Ran the complete 40-journey browser suite against already installed Google Chrome through an external temporary config (`/private/tmp/doroboty-project-playwright.config.mjs`, two workers, preview port 3106). The existing 34 journeys passed. All six new project-card journeys passed after the focused corrections below. The unmodified default config still requires provisioned Playwright Chromium.
- Checked new recruiter layout at 1280, 1100, 851, 850, 700, 600, 390 and 320 CSS px; no horizontal overflow. Checked actual modal bounds and close/Escape focus restoration at 320px. Ran Axe on the open source drawer and the new project page; no findings in those scopes.
- Captured `artifacts/project-card/recruiter-1280.png`, `recruiter-390.png`, `recruiter-overview.png`, `source-320.png` and `candidate-preview.png`. Compared the local reference offer on port 8952 and its documented C01/C02/C18/C22 foundations with the actual candidate/recruiter views: local Geist Serif 400 headings, Arial controls, ink contours, white/paper surfaces, pink primary actions and r24 reading surfaces. This is a host composition rather than a canonical v1 screen.
- Browser regressions cover draft privacy/reload, solo/unknown/no-material path, explicit approval, a separate next draft, source provenance, retained/autosaved notes, clarification validation, final internal-save privacy, failed durable sharing, equal A/B facts, material URL validation, editable simulated AI and source-drawer/mobile behavior.

## Separate review and corrections

- Closed: centered primitive animation/translation shifted the source drawer outside a 320px viewport. Reset its animation and translation variables; bounds/close interaction now pass.
- Closed: ambiguous accessible claim/unknown-action names. Explicit descriptive names distinguish each action and preserve keyboard access.
- Closed: explicit draft/final-save acknowledgements could precede durable storage. Explicit draft saves, card sharing and final review saves now require successful persistence; normal autosaves retain the existing memory/export recovery behavior.
- Closed: changing a published card could overwrite the material associated with a review. Reviews pin the immutable version/role context; later drafts/versions and edited conclusions preserve prior records.
- Closed: empty edits to the proposed card text could hide required sections. Empty proposal sections cannot be applied or published.
- Updated two existing browser assertions to match their intended scope: browser-internal Chrome PDF-viewer requests are not external HTTP requests, and terminal stage-action checks are scoped to the recruiting record rather than the new independent project navigation.
- Open, existing shared-shell issue: a full-page Axe best-practice scan at mobile width reports two moderate `region` findings for the existing mobile header/topbar. The new feature scan is scoped to `.project-page`; the source drawer passes its full active-modal scan. Existing company-page audit findings remain outside this task.
- Research boundary: no source assessment key, recruited participants, help log or study outcomes are invented. E01 records local task notes/timing/source openings only; manual study preparation/coding and real human use remain necessary.
