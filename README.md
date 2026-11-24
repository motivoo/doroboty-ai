# DoRoboty.ai — AIPH3 prototype

A frontend-only job marketplace for participants to extend and test. Built with React, TypeScript and Vite, using Base UI components. The required visual direction for new and changed screens is the accepted Poster People design system.

## Design system — start here for UI work

Read [project integration instructions](docs/design-system/README.md), [host implementation rules](docs/design-system/IMPLEMENTATION.md) and [application acceptance checklist](docs/design-system/VERIFICATION.md), then [design.md](docs/design-system/agent-kit/design.md), [component API](docs/design-system/agent-kit/components/API.md) and the relevant [human documentation](docs/design-system/agent-kit/reference/index.html). The complete 67-file kit is stored under docs/design-system/agent-kit, including reusable CSS/JS, component states, listing/offer examples, screenshots, Geist Serif with license and illustration. No other chat or global skill is required.

```sh
npm run design-system:check
npm run design-system:dev
```

With Node 24, the first command verifies the preserved kit and examples; the second serves a separate local preview at http://127.0.0.1:8952/. No kit installation is needed. The main app uses port 3001 as below.

Build UI from this system, adapting its anatomy and visual roles into the existing React/Base UI components and host tokens. Preserve application behavior and hash routing; do not replace product state with the standalone demo fixtures/controllers. The application has a host adaptation. For every UI task, compare the affected anatomy, type roles, state and keyboard behavior with the reference; passing kit checks alone does not establish visual acceptance. See the integration guide for exact reading order, assets, React mapping, responsive rules and verification. AGENTS.md and CLAUDE.md enforce the same direction.

## Run

Requirements: **Node.js 24 and npm**.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3001. No environment file, account, database or additional service is required. Package installation requires access to the npm registry.

Select Anna or Marek as a candidate, Karolina or Tomasz as an employer, or the instructor. Publish a job, apply, switch person and record the employer decision. Changes survive reload in this browser; settings provide export, import and reset. AI and scores simulate prepared scenarios. Use example CVs only.

After applying, choose **Dodaj projekt** to describe your contribution, attach a permitted excerpt/link and approve a version for the recruiting team. You can also open a submitted application to add a project later. Private drafts and explicit unknown/no-material answers are supported. Use **Edytuj** to change an attached card or **Usuń kartę** to remove it with confirmation; **Cofnij usunięcie** restores the card and its draft. Removing a card preserves the submitted application and previously recorded recruiter source versions. As an employer, open **Kandydaci → Otwórz zgłoszenie** to read approved sources and save internal, version-specific conclusions. A next-step note does not send a message or change the recruiting stage.

The bundled scenario includes two Anna applications in every browser: **AI Product Manager / BrightLabs** has the approved project card (version 2 and four excerpts), while **AI Operations Specialist / BrightLabs** has no project card and offers **Dodaj projekt**. These synthetic examples are stored in `src/features/prototype/data/prepared-applications.json`. Older browser saves receive missing examples once on reload without replacing existing applications, candidate drafts or notes. Explicit imports remain authoritative, and reset restores the prepared examples. Later edits remain local to each browser; this is not live synchronization.

The optional **Sesja E01** entry assigns one reviewer to one format of the same approved material. Prepare the source key and participant allocation separately; the prototype freezes source/version/role context and provides the same task and answer panel in both formats. It does not establish authorship or research results.

## Build and verify

```sh
npm run build
npm run preview
./scripts/verify
```

The static output is dist/. Browser checks require an already provisioned Playwright Chromium; starting the app never installs it. See [participant guide](docs/PARTICIPANT_GUIDE.md), [architecture](docs/architecture.md), [current features](FEATURES.md) and [case protocol](docs/case/CASE_PROTOCOL.md).

To distribute a baseline participant package, run npm run package:participant -- /absolute/output/directory. This excludes Git history and instructor source material. Never distribute this repository’s history as a stage-safe packet.
