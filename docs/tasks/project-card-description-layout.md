# Candidate project card: expanded role context

## Intent and acceptance

Fix the user-reported layout of `/#/app/aplikacje/:id/projekt` when the role description is expanded. Keep role context and the project wizard next to each other when the available workspace width permits it; opening the description must not push the editor below a long text column. Use the shared JobDescription renderer so headings and lists are readable instead of showing raw Markdown.

- Compose one narrow role-context surface and a wider wizard column using existing Poster People r24/ink/white reading surfaces and typography.
- Bound and independently scroll expanded role reading on desktop. Stack context before the wizard in narrow workspaces; retain complete content at 390/320px.
- Preserve inputs, current wizard step, focus, draft persistence and candidate approval while opening/closing the description.
- Scope geometry to the candidate project page. Keep recruiter/E01 context and the immutable design kit unchanged.

## Validation

- Implemented a candidate-only named container layout: narrow role context on the left and a wider wizard on the right; stack when the actual workspace is <=760px. The role panel uses the existing record-sheet recipe and shared JobDescription rendering. The expanded reading region scrolls independently and accepts keyboard focus.
- `./scripts/verify`: formatting, immutable-kit checks/six kit tests, lint, TypeScript, all 35 unit tests, baseline-packet verification and build passed. Default E2E launch remains blocked by the absent provisioned Playwright Chromium binary.
- The 40 existing browser journeys passed against installed Google Chrome using the external local config. The new focused regression also passed after waiting for native keyboard-scroll completion and comparing editor position in document coordinates (rather than coordinates affected by browser focus scrolling).
- Focused regression checks side-by-side geometry, formatted headings without raw Markdown, independent keyboard scrolling, opening/closing without moving the editor, unchanged form input and persisted reload. Checked 1480/1280/1100/850/760/390/320px and mobile stacking/no horizontal overflow.
- Visually reviewed `artifacts/project-card-description-layout/desktop-1280.png` and `mobile-390.png` against the existing Poster People reading/form roles. Separate review confirmed CSS is candidate-scoped, the recruiter/E01 composition is untouched, disclosure remains native and the immutable kit is unchanged.
- FEATURES CAN-19 and the host-component guide now describe this layout. Existing scenario/data/approval behavior did not change.
