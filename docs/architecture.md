# Architecture

One React/TypeScript application is built by Vite into static files. HashRouter renders routes under /#/; route parameters created in the browser require no hosting rewrites. The running app currently uses local CSS tokens, Timeless font and Base UI primitives. New and changed UI must follow the accepted Poster People [design system](design-system/README.md), adapted into the existing stack; installing its reference did not convert runtime styles. There is no server data/API layer.

## Data flow

JSON marketplace/person/prepared-application fixtures → initialState → PrototypeProvider → feature views. Local operations go through transition with shared Zod schemas and explicit role/ownership/transition checks for coherent simulation. All roles still have access to the same browser data; these checks are not security.

Candidate source notes, generated draft and approved application are distinct fields. Submission snapshots CV, candidate name, job title, scenario score and summary. Employer stage events are appended, with private-in-the-UI notes. Profile/job edits do not rewrite submitted records.

Storage uses one versioned localStorage key. Import validates schema/version, unique IDs, cross-references and stage history before replacing state. Unreadable/incompatible saves are protected against automatic overwrite; settings can download the original raw save, import a valid file or explicitly reset. Failed/quota-limited persistence leaves the in-memory app usable and offers export. Import/export is capped at 2 MB; no binary CV storage.

## Features

src/features/prototype owns model/storage/state and page compositions. src/features/jobs retains reusable presentation/filter/description logic; src/components/ui owns Base UI controls. Keep changes small.

The prepared application fixture contains Anna’s approved project card and a second application without a card. `preparedExamplesVersion` is optional in version-1 saves; startup adds missing prepared examples once, preserving existing candidate/job applications, unfinished application drafts and all reviewer records. Explicit imports mark the prepared examples as handled so a subsequent reload does not change the imported dataset. Reset restores the bundled examples.

LocalStorage is origin-specific. Reload preserves state; another browser/device/port starts separately. No cross-tab live synchronization is provided. A browser Web Lock grants one tab write access; other tabs remain read-only and can export. Close the writer and reload another tab to transfer access. Every save also checks the original storage snapshot; conflicts never replace newer data. Import/reset confirm only after persistence. Web Locks requires a current browser on localhost or HTTPS. Hash links reference records in the receiving browser, not transferred records.

## Evidence and distribution

The baseline historical CSV and JSON are separate from interactive state. Future evidence must arrive in a separately reviewed package. package:participant copies only explicit allowed files/directories, including the complete docs/design-system guide/kit, and omits docs/source, historical task notes, agent run history and .git. A packet verifier checks the baseline data; packaging also verifies a pristine file/hash manifest. Ordinary checks permit participants to edit code and generate build/test output without invalidating a distribution fingerprint. Instructor repository history is never participant-safe.

## Checks

npm run check and ./scripts/verify run formatting, design-system reference integrity/example checks, lint, types, unit tests, build and Playwright against the static preview. Playwright checks external requests, complete workflows, error/recovery behavior, keyboard controls and mobile layout. A second dev/StrictMode suite verifies the writer lock, persistence failures and recovery with the real dev startup. No test starts system services. npm run dev only starts Vite.

## Release and diagnostics

See [RELEASE.md](RELEASE.md) for separate participant-package and public-demo procedures. Static build-meta.json and the in-app Help page expose a reproducible build fingerprint. The root recovery boundary offers the original save without resetting it. Diagnostic templates contain only build/time/fixed event codes, never raw exceptions, routes or scenario contents, and are downloaded locally rather than transmitted. The shadcn generator CLI is not a dependency; its MIT-licensed CSS variants are preserved in src/app/base-ui-variants.css.
