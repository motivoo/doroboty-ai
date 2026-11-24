# Edit and remove an application project card

## Intent and acceptance

- Replace the existing-card primary action with the Polish label `Edytuj`, retaining the current draft/version approval flow.
- Add a candidate-owned `Usuń kartę` action with an inline confirmation and cancellation. Remove the current card and private draft from the application without withdrawing the application, changing its score/stage or deleting recruiter conclusions.
- Persist removal before confirming success, provide undo and preserve existing immutable versions referenced by prior recruiter reviews/E01 sessions. New reviews/list metadata must treat a removed card as absent; historical reviews must identify their retained source version.
- Restore focus after confirm/cancel/undo. Keep legacy version-1 saves readable, and validate active/removed version references on import.

## Design and scope

Reuse the existing ProjectInvitation surface, Base UI buttons and the candidate withdrawal's inline-confirmation pattern. Preserve Poster People typography/contours, responsive wrapping and the immutable kit. No changes to job/application submission or recruiting stages.

## Validation

- `./scripts/verify` passed formatting, immutable-kit integrity/six kit tests, lint, TypeScript, all 38 unit tests, baseline-packet verification and static build. The default browser stage still cannot launch the absent Playwright Chromium binary. No browser/OS tools were installed.
- All 43 browser journeys passed using installed Google Chrome and the existing external local config. New cases cover edit naming, confirmation/cancel focus, durable removal, reload, recruiter-list omission, undo/focus, opening a fresh replacement draft, and failed persistence retaining the card and confirmation.
- Model regressions cover candidate ownership, complete undo of the published pointer/private draft, legacy imports, invalid references, preservation of frozen reviews, no card for new reviews, and version numbering when re-adding a project.
- Reviewed the actual attached-card screenshot at `artifacts/project-card-edit-delete/actions.png`: existing surface/typography, primary `Edytuj`, secondary outlined `Usuń kartę`, visible labels and consistent spacing. Existing mobile and keyboard journeys also passed.
- Separate review confirmed that all current-attachment consumers use the same published-version selector; historical review lookups intentionally use immutable versions. Removal/restore commit only after storage succeeds, and candidate actions never mutate recruiting notes, score, answer/CV or application stage. A review of a removed card is explicitly labelled as historical.
- README, FEATURES CAN-20/SYS-10 and the host-component guide document the behavior. The source kit is unchanged.
