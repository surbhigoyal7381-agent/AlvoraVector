# Divergence ledger: AlvoraVector vs upstream Fleetbase

Owner: vector-upstream-sync. Updated 18 Nov 2026 (slice: upgrade to v0.8.0).
Source of truth is `git diff upstream-tag..HEAD`; this table explains it.

## Position

- Base: upstream `fleetbase/fleetbase` tag `v0.8.0` (23d9e2e1) on branch `upgrade/fleetbase-v0.8.0`
  (not yet in `main`; `main` is still v0.7.75, 67b2db6). Verified: `git merge --ff-only v0.8.0`.
- **Tracked divergence: the Alvora Vector rebrand** (branch `feature/alvora-vector-brand`, 18 Nov 2026; table below). Rung 4 (shell files) only; no upstream package is forked or edited.
- Remote `upstream` = https://github.com/fleetbase/fleetbase.git (added 18 Nov 2026 with Surbhi's approval).

## Divergence table

| what | where | ladder rung | why | upstream-able? | breaks if upstream changes | AGPL side | added | removable when |
|---|---|---|---|---|---|---|---|---|
| Rebrand: host translations, 16 files (`app.name` and 10 other keys per locale; hosted-routing and "Fleetbase CLI" text kept on purpose) | `console/translations/<locale>.yaml` | 4 (shell) | product name "Alvora Vector" on screen | no (our brand) | upstream adds or edits a Fleetbase line in these files: merge conflict, small | AGPL, public | 18 Nov 2026 | we stop rebranding |
| Rebrand: generated engine overrides (228 keys in 12 locale files) | `console/translations/brand-overrides/<locale>.yaml`, made by `console/scripts/brand-overrides.mjs` | 4 (shell) | engine text (fleetops, iam, dev, storefront ...) says Fleetbase; ember-intl lets the host win | no | an engine adds or renames a string: `pnpm lint:brand` fails; re-run the script | AGPL, public | 18 Nov 2026 | we stop rebranding |
| Rebrand scripts | `console/scripts/brand-rules.mjs`, `brand-overrides.mjs`, `brand-check.mjs`; `console/package.json` scripts `lint:brand`, `brand:overrides` | 4 | generate overrides, fail CI on a visible old name | no | `package.json` is a hot file: keep both sides on merge | AGPL, public | 18 Nov 2026 | we stop rebranding |
| Rebrand: hard-coded console text | `console/app/index.html` (title), `console/public/favicon/site.webmanifest`, `console/app/templates/console/settings/notifications.hbs`, `console/app/components/configure/{oauth-apps.hbs,mail.hbs,queue.hbs,filesystem.hbs,services.js,notification-channels.js}`, `console/app/components/onboarding/{form.js,verify-email.js}`, `console/app/controllers/{onboard/verify-email.js,invite/for-user.js,console/admin.js}` | 4 | text people read | partly (generic copy) | upstream edits the same lines: conflict; the brand check finds new ones | AGPL, public | 18 Nov 2026 | we stop rebranding |
| Rebrand: tests that assert the old text | `console/tests/**` (for-user, verify-email, form, notification-channels, admin tests) | 4 | follow the text | no | as above | AGPL, public | 18 Nov 2026 | with the rows above |
| Rebrand: compose settings | `docker-compose.yml` `APP_NAME`, `MAIL_FROM_NAME` | 4 | emails and 2FA label read "Alvora Vector" | no | upstream edits those lines | AGPL, public | 18 Nov 2026 | we stop rebranding |

## Local, untracked or uncommitted (not divergence in the release sense)

| what | where | note |
|---|---|---|
| `CLAUDE.md`, `.claude/` | repo root, untracked | our agent instructions; never part of an upstream merge; not Fleetbase code, not published as part of the service |
| `docs/product/`, `docs/upstream/` | untracked | our documents |
| Local installer edits | `console/environments/.env.development`, `.env.production`, `console/fleetbase.config.json` (uncommitted modifications; written by the install script: socket host/port, `API_HOST`) | local machine settings. Keep out of commits. They do not conflict with v0.8.0 (upstream changed none of them). |
| `docker-compose.override.yml`, `api/.env` | git-ignored | local secrets and settings |

## Pinned versions (from `api/composer.json`, `api/composer.lock`, `console/package.json`, `RELEASE.md` at v0.8.0)

| package | constraint | locked / released | latest upstream seen |
|---|---|---|---|
| fleetbase/core-api | ^2.0 | 2.0.0 (lock) | 2.0.1 published 17 Nov 2026 (not locked; `composer update fleetbase/core-api` would take it) |
| fleetbase/fleetops-api | ^0.7.0 | 0.7.0 | 0.7.0 |
| fleetbase/ledger-api | ^0.1.0 | 0.1.0 | 0.1.0 |
| fleetbase/storefront-api | ^0.5.0 | 0.5.0 | not checked |
| fleetbase/customer-portal-api | ^0.1.0 | 0.1.0 | not checked |
| fleetbase/registry-bridge | ^0.2.0 | 0.2.0 | not checked |
| fleetbase/ai, valhalla-api, vroom-api | ^0.1.0 | 0.1.0 each | not checked |
| laravel/framework | ^12.69 | v12.72.0 | n/a |
| console (`@fleetbase/console`) | 0.8.0 | | |
| @fleetbase/ember-ui / ember-core / dev-engine / iam-engine / fleetops-data | ^0.4.6 / ^0.3.26 / ^0.2.18 / ^0.1.13 / ^0.2.4 | per RELEASE.md | not checked |

## Submodule pointers

`packages/*` (14 entries in `.gitmodules`) are **not initialised** in this checkout; the build
installs the packages from Composer and npm, not from these pointers. At v0.8.0 upstream moved
pointers for ai, core-api, customer-portal, fleetops, fleetops-data, ledger, pallet,
registry-bridge, storefront. No `.gitmodules` URL points anywhere but `fleetbase/*` (not
re-verified line by line; git warns of duplicate `.gitmodules` keys for fleetops-data and socket
in upstream's own file).

## Our extensions' dependencies on upstream internals

None yet (no extension written). First row to add when the ERPNext connector or a gig extension
exists. Candidates to record then: webhook endpoint API and `X-Fleetbase-Signature`, order config
policies/triggers, `Model::addSortHandler()` (core-api 2.0.1), `Request::inputArray()`.

## Held-back or skipped upstream releases

| release | decision | reason | review date |
|---|---|---|---|
| core-api 2.0.1 | not locked in v0.8.0 | additive (runtime sort keys), "Upgrade steps: none" | next sync |
