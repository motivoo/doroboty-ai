# Poster People — React host component catalog

This is the receiving application's component map, checked against the implemented code on November 2, 2026. Use it with the immutable [source API](agent-kit/components/API.md), [integration rules](IMPLEMENTATION.md), [record APIs](RECORDS.md) and [acceptance checklist](VERIFICATION.md). These host components implement user-requested extensions; they do not create a new v1 kit release. [STATUS.md](STATUS.md) separates implementation evidence from unresolved audit findings.

## Choose an existing owner

| Need                                  | Reuse                                                                            | Contract / documentation                                                                                                                                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base interaction control              | [Button and other primitives](../../src/components/ui/)                          | Base UI behavior and `render` composition; keep one shared control family.                                                                                                                                                                  |
| Role listing/card                     | [JobCard](../../src/features/jobs/job-card.tsx)                                  | Actual job/company, shared conditions, noninteractive facts; supply candidate-specific `saved` state to expose the existing save action. Company pages now supply candidate-specific saved state; targeted checks are in readiness.spec.ts. |
| Amount and agreement basis            | [SalaryFact](../../src/features/jobs/salary-fact.tsx)                            | `job: Job`; amount/currency and supporting contract/kind/period, or explicit absence.                                                                                                                                                       |
| Contextual return                     | [BackLink](../../src/components/back-link.tsx)                                   | `to: LinkProps["to"]`, `children: ReactNode`; destination-specific label, shared arrow and feedback. See below.                                                                                                                             |
| Candidate/employer application detail | [ApplicationRecord](../../src/features/prototype/application-record.tsx)         | Shared snapshot/header/history composition; controllers authorize and project history, [contract](RECORDS.md#shared-application-composition).                                                                                               |
| Submitted materials with tabs         | [RecordSheet](../../src/components/record-sheet.tsx)                             | `label`, nonempty `sections`, optional `attachment`/`children`/`footer`; [full API](RECORDS.md#recordsheet).                                                                                                                                |
| Saved local CV                        | [CvAttachment](../../src/features/prototype/cv-attachment.tsx)                   | Snapshot-safe stack/row, context label and optional native PDF preview; [full API](RECORDS.md#cvattachment).                                                                                                                                |
| Recorded event history                | [ProcessTimeline](../../src/components/process-timeline.tsx)                     | Ordered actual events, dates and optional role-filtered notes; [full API](RECORDS.md#processtimeline).                                                                                                                                      |
| Scenario percentage                   | [MatchScore](../../src/features/prototype/match-score.tsx)                       | `score: number` validated by the domain; noninteractive shared color scale, [thresholds](RECORDS.md#matchscore).                                                                                                                            |
| Job context during application        | [ApplicationOfferPreview](../../src/features/jobs/application-offer-preview.tsx) | `job: JobWithCompany`; real company/title/facts/pay/summary plus in-place full description.                                                                                                                                                 |
| Mobile filter surface                 | [ResponsivePanel](../../src/components/responsive-panel.tsx)                     | `title`, `description`, `children`, `resultCount`; inline above 850px, named Base UI dialog at <=850px. Search remains outside.                                                                                                             |
| Successful submission decoration      | [ConfettiBurst](../../src/components/confetti-burst.tsx)                         | `origin: { x: number; y: number } \| null` in viewport CSS pixels; one decorative burst per mount. See below.                                                                                                                               |

Do not create another job card, score badge, return link or file-row family for a new route. Reuse the composition and document genuinely missing semantics before adding a variant.

## BackLink

```tsx
<BackLink to={`/oferty/${job.slug}`}>Wróć do oferty</BackLink>
<BackLink to="/oferty">Wróć do ofert</BackLink>
```

C13 host treatment: Arial/system sans 13px, 12px at <=700px; ink; 17px decorative arrow; 9px gap; 36px minimum height. The shared `.back-link` recipe lives in [poster-people.css](../../src/app/poster-people.css). Hover uses the shared background/pointer plus a 4px-offset underline; keyboard focus uses the existing anchor focus recipe. Native React Router links preserve copied URLs and Enter activation. Page CSS owns surrounding layout, not independent arrow/link styling. C17 recovery CTAs remain separate controls.

## Score facts and ordinary facts

MatchScore uses the source fact-pill anatomy with dedicated **host** colors: 0–39 red, 40–59 orange, 60–79 yellow, 80–100 vivid green. The exact tokens and contrast evidence are in [RECORDS.md](RECORDS.md#matchscore) and the score task (`docs/tasks/match-score-colors.md`). Salary facts remain light pink. Score colors do not redefine error/success controls or assess arbitrary CVs. Always keep the numerical percentage readable.

## Pointer, hover and focus

[interactions.css](../../src/app/interactions.css) owns feedback for enabled anchors, native buttons, button-role controls and submit/button/reset inputs, including portal consumers. Every enabled action gets a pointer and a visible background/text color change. Disabled/native/Base UI unavailable states are excluded and use an unavailable cursor.

Button variants set `--control-hover-bg`; `--control-hover-text` can preserve selected-state contrast. Primary pink becomes #ffacef; quiet controls/plain links use supporting pink; selected ink navigation remains ink/white and lightens on hover. Preserve existing outlines, geometry and state semantics. A disclosure `summary` has its own equivalent pointer/hover/focus recipe in the application composition. Noninteractive scores, salary and labels receive no action hover.

## Application offer preview and form

Owners: [ApplyPage](../../src/features/prototype/workspace.tsx), [ApplicationOfferPreview](../../src/features/jobs/application-offer-preview.tsx), [application.css](../../src/app/application.css). The preview composes CompanyLogo, SalaryFact and JobDescription from the actual published job, without fetching external content. A native disclosure reveals the complete description without navigating, changing consent or resetting the answer.

Wide screens place offer context beside one outlined form sheet. At <=850px context precedes the form. Expanded description disables sticky positioning. The form contains the existing CV row, editable answer, trimmed character count, explicit consent and shared actions; CV is not another nested card. Its context label is “CV z Twojego profilu”. Employer submitted materials instead use the snapshot label and CV-only tab/preview. Preserve explicit draft saving, hidden legacy fields, consent reset after answer edits, validation focus, role gates and immutable submission data.

Offer detail keeps a 10px gap between adjacent Apply/Save React links/buttons. The source `.button + .button` rule cannot apply when the receiving markup has different classes.

## ConfettiBurst

The portal renders 30 deterministic particles in the existing pink/yellow/ink palette for 850ms. Supply the successful button's `getBoundingClientRect()` center in viewport coordinates. `null` renders nothing. The viewport-clipped, aria-hidden overlay never intercepts input or creates scrollbars; the owner removes it on unmount. Reset to null before starting a later, independently authorized burst; simply moving an existing non-null origin is not a replay API.

The application owns success semantics: run the existing submit operation first, guard against repeats, show “Wysłano!” and disable editing/actions briefly, then redirect after 900ms. One live status region carries draft/success messages; animation is never the only confirmation. Errors, draft saves and existing-record visits do not celebrate. The owner skips decoration and delay with reduced motion; CSS also hides an active burst if that preference changes. Clear the redirect timer when leaving the page. Do not attach this behavior to generic Button clicks, infer persistence success beyond the local operation, or add a remote asset/dependency.

## Style ownership

### Project contribution and review

The optional application-specific project flow uses `project-card-candidate.tsx`, `project-card-reading.tsx`, `project-card-recruiter.tsx` and `project-card.css`. These are host compositions of C01–C04 controls, C07 provenance metadata, C13 BackLink and C22 reading sections. They do not change the immutable reference kit.

The candidate project page places a narrow r24 role-context surface beside the wider three-step wizard when the actual workspace is wider than 760px; a named container query stacks context above the editor in narrower workspaces. The native disclosure uses JobDescription for headings/lists inside an independently scrolling keyboard-reachable reading region. Opening it preserves editor position and draft state. The three-step candidate wizard retains recipient/role context, autosaves a private draft and requires an up-to-date preview plus explicit approval before publishing a numbered snapshot. Unknown/solo/confidential paths are valid. A simulated text organizer retains the source answers and requires candidate review; it does not fetch sources or assess authorship. Controls use the existing Base UI primitives; FormSelect optionally accepts `invalid` and `describedBy` for associated inline errors.

The source drawer composes Base UI Dialog with a fixed header/close control and independently scrolling body. Reset the centered-dialog translation variables and animation in this drawer, as in ResponsivePanel; otherwise the centered primitive can shift it outside narrow viewports. Escape/close restore the invoking claim button. Reading the source never unmounts the review editor.

Recruiter reading and notes use two outlined surfaces that stack at <=850px. Final internal notes reference an immutable card version; candidate UI receives no notes. A new shared version does not replace material under an ongoing review. E01 assigns one format, freezes role/source/version, and reveals the identical notes panel only at the response stage. The default record view preserves existing answer/CV/history/stage controls.

The attached-card action is labelled `Edytuj`. `Usuń kartę` uses an inline confirmation/cancel group with focus management, followed by `Cofnij usunięcie`. Removal clears current shared availability and the active private draft, retaining an undo snapshot and immutable versions referenced by existing conclusions. Historical reviews explicitly identify a removed source; new reviews/list metadata do not treat the retained history as a current attachment. Starting a new project dismisses undo and opens an empty draft.

Do not label a draft as shared, a card as removed/restored or a final note as saved until browser persistence succeeds. General browser-storage recovery remains in the shared store. Current execution evidence and viewport captures are recorded in `docs/tasks/project-contribution-card.md`.

| Owner                                                | Scope                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| [tokens.css](../../tokens.css)                       | Source-role aliases plus explicitly documented host score/status colors.      |
| [poster-people.css](../../src/app/poster-people.css) | Shared host typography, facts, BackLink and decorative confetti.              |
| [records.css](../../src/app/records.css)             | Record-sheet/timeline/file-row recipes and recruiting geometry.               |
| [application.css](../../src/app/application.css)     | Candidate application layout, disclosure, form spacing and successful button. |
| [interactions.css](../../src/app/interactions.css)   | Shared enabled/disabled cursor and hover contract.                            |
| [marketplace.css](../../src/app/marketplace.css)     | React/Base UI source adaptations and offer action separation.                 |

Keep common recipe styling separate from route geometry. Existing code remains subject to review; a component's presence in this catalog does not verify every caller or resolve the open company-page audit.
