# Production readiness audit

## Intent

Assess the current teaching prototype before distribution or deployment, using
the production-readiness skill. Keep preparation, deployment verification and
real-use observation separate. Record findings in the offline Polish report at
`docs/production-readiness.html`.

## Scope and acceptance criteria

- Inspect repository instructions, source, local configuration, verification
  scripts, browser journeys and participant packaging before executing checks.
- Evaluate every baseline requirement, explain exclusions and add requirements
  for the synthetic-data boundary and stage-safe participant distribution.
- Bind observations to the assessed source fingerprint and exact local
  configuration; record missing hosting, ownership and release facts explicitly.
- Run understood local checks without installing tools, changing external data,
  committing, pushing or deploying. Preserve unrelated changes.
- Generate and validate the report with the skill renderer, and inspect its
  browser presentation where available. Keep temporary evidence outside Git.
- Present a concrete repair package for approval after the initial audit.

## Approved local repair package

The user approved all necessary local repairs after reviewing the initial audit.
The user also requested committing and pushing the verified repairs to GitHub.
Implement persistent import/reset confirmation, stale-tab write protection,
visible synthetic-demo boundaries, safe error recovery, current participant
instructions, release/restore/rollback/smoke procedures and dependency updates.
Use existing Poster People outlined paper surfaces and Base UI buttons/links;
the demo notice and recovery screen are documented host extensions, not new kit
variants. Keep the immutable reference unchanged. Verify storage failures,
cross-tab conflicts, export/restore, keyboard use and narrow layouts.

Use temporary npm tooling outside the project when needed, with an isolated
cache/configuration. Do not change external services or deploy. Hosting, audience
size, ownership, budget and real-use criteria require facts from the user and
remain open rather than invented. Reassess changed sources with `refresh`.

## Product behavior register

`FEATURES.md` was reviewed for the initial audit, which changed no behavior.
Update the register with the approved repairs in the same working-tree change.
Audit outcomes and evidence belong in the report rather than a second checklist
here.
