# Teaching package and public demo release

This is a static, synthetic-data prototype. All personas share one scenario in
each browser profile. An actual recruitment service is outside this release
contract. Do not enter real CVs, private notes or personal data.

## Decisions required before distribution

The organizer must record the audience size, release owner/contact, acceptable
interruption and acceptable loss of exercise work. For the public demo, also
select a static hosting provider, exact HTTPS address, traffic/transfer budget,
logs access and an alert recipient. These decisions have not been made. This
procedure does not constitute approval to publish or start a course.

## Prepare a known version

1. Use Node 24 and npm in a clean checkout or baseline participant package.
   Run `npm ci`, then `./scripts/verify`. Inspect failures instead of bypassing
   checks. Browser binaries must already be provisioned; installed Chrome is an
   explicit alternative (`PLAYWRIGHT_USE_INSTALLED_CHROME=1`).
   The gate covers both the static preview and dev/StrictMode startup; its
   independent test ports are 3106 and 3118, leaving a user's port 3001 alone.
2. The build writes `dist/build-meta.json`. Its SHA-256 ID covers sorted source
   files, public assets, package/lock files, tokens, Vite/TypeScript configuration and the
   identity script. The same ID appears in the Help page and diagnostic text.
   Record the Git commit, clean/dirty state, this ID and a hash inventory of the
   final artifact. Restart dev after source changes to refresh its identity.
3. Teaching: run `npm run package:participant -- /absolute/empty/output` outside
   this repository. Verify its pristine manifest. Never distribute a repository
   ZIP, Git history, docs/source or instructor task history. Give a participant
   the clean package and check installation and the exercise instructions on
   their machine before class.
4. Public demo: publish only `dist/`, using a static host. Preserve its relative
   asset layout. Hash routes do not need a server rewrite. Set HTTPS, appropriate
   content types, short/no-cache for index.html and build-meta.json, and immutable
   caching only for content-hashed assets. Keep the prior artifact available.
   Do not expose the Vite development or preview server as public hosting.
   Before switching versions, ask people to export and close all existing tabs;
   earlier prototype versions do not participate in the new writer lock.
5. Set the chosen support contact next to the shared demo URL and in the Help
   page before admission. Verify the host's access-log retention and update the
   privacy description for those actual settings. Do not add form contents,
   exports, CVs or notes to diagnostics. Do not embed secrets in client builds.

## Admission smoke check

The named release owner performs and records this list for each release. Stop
admission if any required check fails. On a previously working public address,
restore the recorded prior artifact when a failed check cannot be resolved
within the owner's agreed interruption budget.

1. Fresh browser/profile: load the teaching server or exact public HTTPS URL.
   Compare build-meta.json and the Help page with the approved artifact ID.
   Verify that .git and instructor/source documents are not published.
2. Open a copied offer hash link; reload it. Confirm the synthetic-data notice,
   local assets, local PDF download and narrow-screen keyboard navigation.
3. With synthetic data, publish a role, submit an approved answer, attach a
   project, switch to the employer, record a justified review and reload. Check
   that application and source versions remain intact.
4. Export the changed scenario, import it in an isolated browser profile, and
   compare applications, project versions, saved roles and notes. Test invalid
   import preservation. Never test recovery by overwriting another user's data.
5. Open a second tab in the same profile: verify read-only behavior and export.
   Close the writer, reload the second tab and verify that writes now work.
6. Public demo: inspect actual hosting configuration, useful availability/error
   signals and a harmless delivered test alert to the named recipient. Do not
   generate a real outage, email anyone or enable a paid service without separate
   authorization. A local test does not complete these deployment checks.

## Browser data recovery and upgrades

Export after every exercise and before import, reset, origin changes or rollback.
An export contains every persona and internal-in-the-UI note. Keep it on the
participant's device; do not attach it to support reports. The hosting provider
cannot back up localStorage from visitors' browsers.

If saving fails, keep the tab open and export the in-memory scenario. A malformed
or unsupported save is not overwritten automatically; download the original in
settings, then import a verified copy or explicitly reset. A reset restores only
synthetic examples. If an unexpected rendering error occurs, the recovery screen
offers the original raw save and a separate diagnostic template. Download the
save before reloading; do not clear site data as a first response.

Test schema changes with a representative synthetic export in a separate browser
profile. This release keeps storage version 1; new locking and diagnostics add
no fields to the scenario. Existing project/example upgrades retain their tests.
Changing origin (scheme/host/port) requires explicit export/import. A shared URL
does not transfer records, and restarting a static host does not recover them.

## Roll back safely

1. Identify the previous artifact and recorded build ID, rather than assuming
   that any earlier commit is working. Keep a copy before replacing an artifact.
2. Export the current synthetic scenario. In an isolated profile, import its
   copy into the previous artifact and inspect applications, project versions,
   notes and CV snapshots. A schema parse alone does not establish preservation:
   compare the exported result, including optional fields.
3. If the prior version loses fields or cannot read the save, stop rollback and
   preserve both artifacts and exports. Choose a forward repair or a tested
   conversion; do not silently reset data. Never use production data for a trial.
4. Teaching: distribute the verified prior package with its identity and guide.
   Public demo: the authorized owner restores the prior artifact under the same
   origin using the chosen provider's documented controls, checks caching and
   repeats the admission smoke check. Provider-specific steps and access remain
   to be established after hosting selection.

## Diagnose and communicate

The owner first checks the reported build ID and whether the problem concerns
one browser or everyone. For one browser, preserve/export data and check the
writer-tab notice, browser support, storage access/quota and copied route. For a
site-wide problem, inspect hosting availability and deployment/asset versions;
use the verified rollback when appropriate. Tell participants/visitors the
impact, workaround and next update via the previously agreed channel.

The Help page generates a diagnostic template containing only a build ID, UTC
time and up to ten fixed technical event codes held in memory. Browser/system,
screen, actions and expected result are filled in manually. No raw exception,
URL/query, user agent, form value, scenario or private free text is collected or
transmitted. The recovery boundary catches render failures; it cannot recover a
missing JavaScript bundle or a browser crash. Host monitoring covers that gap.

## Observe real use later

Before inviting people, agree an appropriate sample/window and criteria for
successful installation or first load, completion, errors, interruption, support
load, transfer and costs. For class, observe whether participants finish without
author intervention; for the public demo, compare actual service and billing
signals with the agreed limits. No traffic is not proof of capacity. Record
results only after the agreed real use; no universal duration/target is assumed.
