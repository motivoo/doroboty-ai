# Prepared project examples across browsers

## Intent

Make Anna’s approved BrightLabs AI Product Manager card available in a fresh external browser at the local application URL. Also prepare a second Anna application for AI Operations Specialist without a contribution card, so the add-card journey can be demonstrated.

## Acceptance criteria

- Bundle the existing approved card (current version 2, four excerpts, exact application ID), omitting candidate drafts and internal recruiter notes. Keep the requested paragraph absent from the current version and preserve historical version numbering.
- Fresh/reset scenarios include the completed card and a separate submitted application without a card.
- Upgrade older browser saves once without replacing existing applications, candidate drafts, recruiter notes, profiles or active persona; avoid duplicate candidate/job pairs and invalid references.
- Card removal and subsequent reload must not restore a bundled card. Explicit imports remain authoritative.
- Verify recruiter visibility and the candidate add-card entry in isolated browser sessions and verify persistence after reload.
- This remains a frontend prototype: future edits are browser-local, not synchronized between browsers.

## Validation

- `./scripts/verify` passed formatting, the immutable 67-file kit/six example checks, lint, TypeScript, all 42 unit tests, the 120-journey baseline packet and production build. Its browser stage could not launch the missing Playwright Chromium binary; no browsers or OS dependencies were installed.
- Ran all 46 browser journeys in installed Google Chrome. The first run passed 44; two older assertions assumed only one application had no card. Scoped those assertions to Marek’s application and reran both successfully. All 46 cases passed across these runs, including the three new prepared-example journeys.
- Independent fresh browser contexts both showed the same approved version 2 with four materials, then Anna’s separate AI Operations Specialist application opened a blank project editor. The older-save test showed both examples without a reset, preserved Marek’s answer/active recruiter, and exported the upgrade marker. Explicit legacy import remained authoritative after reload.
- Separate review checked the additive migration for stable IDs, duplicate candidate/job pairs, candidate drafts, missing job/person references and application limits. The marker prevents resurrecting removed cards. Existing project histories/notes are preserved; the bundled fixture excludes private drafts and recruiter conclusions.
- Inspected the live port-3001 application after reload: Anna has the completed Product Manager card and the Operations application without a card. Screenshot: `artifacts/project-card-demo-anna/two-anna-applications.jpg`. Documentation and FEATURES SYS-12 describe the shared initial examples and browser-local subsequent editing.
- The existing submission tests explicitly start before Anna applies; prepared initial state is covered separately. No screen composition or immutable design-kit assets changed in this task.
