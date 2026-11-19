# Rename the application from Fleetbase to AlvoraVector

Date: 18 Nov 2026 · Author: product manager · Risk tier: 2 (screens, emails, legal notices). The licence and trademark points are tier 1 in weight and go to counsel. **I am not a lawyer. Everything marked `[counsel to confirm]` needs a real legal answer before we act on it.**

Status: recommendation for Surbhi to decide. Nothing in the repo was changed.

## 0 · Answer first

**Yes, we can rename almost everything a person sees, cheaply. We cannot, and should not, rename the code underneath. One thing needs a lawyer: the small "Fleetbase · Legal" notice in the console sidebar and login pages.**

- Recommended: **option B**. Change the strings people read, in our own console files only, plus a CI check that fails if a visible string says "Fleetbase". No fork of any upstream package.
- About **41 translation lines** (English) plus about **10 other places** cover what users and customers actually read. That is far below the 2,000-plus raw count, which is mostly code.
- The AGPL notice and copyright line stay. Hiding or replacing them is the one thing I will not recommend without counsel `[counsel to confirm]`.
- Spelling: Surbhi wrote "Alvora Vector" (two words). The repo is "AlvoraVector". See Open question 1.

## 1 · The real need

**Ask, in Surbhi's words:** "Can we rename the whole application to Alvora Vector instead of Fleetbase?"

**The need behind it (Assumption):** a client or rider who opens the product should see Alvora's product, not someone else's name. This matters most on screens a client's customers see (tracking page, emails, SMS, the Navigator app name). It matters least on screens only a developer sees.

**Questioning the ask.** "Whole application" can mean three different things:
1. What people read (screens, emails, app names). Cheap. Do this.
2. What developers read (package names, imports, API key prefixes, database names). Costly and breaks upgrades. Do not do this.
3. What the licence says (copyright, "Legal" notice). A legal question, not an engineering one.

I answer 1, refuse 2, and send 3 to counsel.

## 2 · Who is affected

| Persona | What changes | Example |
|---|---|---|
| Operator admin | Sees "AlvoraVector" in the browser tab, login, emails to their staff, help text | Tab reads "AlvoraVector Console", not "Fleetbase Console" |
| Dispatcher | Same screens; help texts read "AlvoraVector will optimise the route" | Fleet-Ops order form hint |
| Gig rider | Navigator app name and the location-consent text. Matters for trust | Consent says "sent securely to AlvoraVector", not "Fleetbase" |
| End customer | Tracking page, delivery emails, SMS sender, "Powered by" line | Email footer and logo come from branding settings; no code change |
| Finance | Invoice and label output | Verified: labels only mention "Fleetbase" as a PHP namespace, not as visible text. Nothing to change |
| Alvora (us) | One product name across sales, support, docs | |

Nobody is harmed. A rider whose phone already has Navigator installed sees a new name after an app update, so tell riders beforehand.

## 3 · What exists today (verified 18 Nov 2026 in the repo; paths given)

**Stock branding setting is too small.** The core-api branding setting holds only `logo_uuid`, `icon_uuid` and `default_theme`. There is no product-name field (as stated in the brief). So logo, icon and theme are rung 1 (admin screen at `console/app/templates/console/admin/branding.hbs`). The name is not.

**One host key drives most screens.** `console/translations/en-us.yaml` line 2, `app.name: Fleetbase`, is used by `page-title`, the login and onboarding pages, the invitation page, the verification toast and the forgot-password text (`console/app/templates/*.hbs`, `console/app/controllers/auth/verification.js`). The two-factor app label also reads `config('app.name')` in the API. **Changing one key renames all of those.**

**Visible "Fleetbase" strings, English only (a count of lines, which I read):**

| Where | Lines | Can we change it without forking? |
|---|---|---|
| Host `console/translations/en-us.yaml` (app name, sign-in, "Continue with Fleetbase", hosted routing, install-not-configured) | 14 | Yes, our own file |
| Engine translations (`node_modules/@fleetbase/*/translations/en-us.yaml`): fleetops 17, iam 3, dev 3, registry-bridge 2, customer-portal 1, storefront 1; ai, ledger, valhalla, vroom 0 | 27 | Yes, by overriding the same key in the host file (see below) |
| Host hardcoded text: `console/app/index.html` title "Fleetbase Console"; `console/public/favicon/site.webmanifest` name and short_name; `console/app/templates/console/settings/notifications.hbs` (SMS sender help, about 3 lines); logo fallback `console/public/images/fleetbase-logo-svg.svg` | about 7 | Yes, our own files (rung 4) |
| `@fleetbase/ember-ui` hardcoded in templates (not translatable): attribution link, legal notice modal, logo alt text, chat "Fleetbase user", template-builder help (3 lines), docs panel "Open Fleetbase documentation" | about 10 | **No, only by editing the package (rung 5)** |
| API/env: `APP_NAME` and `MAIL_FROM_NAME` in `docker-compose.yml` lines 132-133; config defaults in `api/config/app.php` and `mail.php` | 2 settings | Yes, config |
| Emails (`vendor/fleetbase/core-api/views`): header uses the branding logo and `config('app.name')`; only the test email says "from Fleetbase" | 1 | Test email only: low value, leave or accept |
| PDF labels (`fleetops-api/.../labels/*.php`) | 0 visible | Nothing to do |
| API hosted-routing messages and CLI text ("Fleetbase Cloud", "Hosted Routing") | about 3 | Leave. They are accurate: that service really is Fleetbase's |
| Navigator (`/Users/mac/AlvoraVector/navigator-app`): `translations/en.json` 2 lines (one is the location-consent text), `.env APP_NAME` | 2-3 | Yes, but needs a new app build and store listing |
| Storefront app (`storefront-app/translations/en.json`) | 1 | Yes, same story |

**Other locales:** 16 locale files in the console carry "Fleetbase". English-only changes leave the other 15 saying Fleetbase for those users. A key edited only in en-us does not reach a language that has its own value. Which locales does the first client use? (Open question 5.)

**Translation override: verified in source, not yet proven by a build.** `console/node_modules/ember-intl/lib/broccoli/translation-reducer/index.js` lines 89-138 sorts addon files first and the app last ("the application wins if there is a translation conflict"), then deep-merges them. So a key in `console/translations/en-us.yaml` beats the same key from an engine. **Not yet checked:** that the Fleetbase engines' translation files go through this same merge in our build. A one-key test settles it in minutes (Open question 6).

**The legal notice is deliberate.** `ember-ui` `fleetbase-attribution` shows "Fleetbase v0.8.0 · Legal" in the sidebar and on login, install, invite and OAuth pages. The "Legal" button opens a modal with the Fleetbase Pte. Ltd. copyright, the AGPL text and links. A host switch exists: `DISABLE_FLEETBASE_ATTRIBUTION` in `console/config/environment.js` line 28. **Upstream built a switch, but I could find no statement of when it is allowed to be used** (README, LICENSE.md, fleetbase.io/licensing). `[counsel to confirm]`.

**Licence text read:**
- `LICENSE.md` is AGPL-3.0. Section 5(d): interactive interfaces must display "Appropriate Legal Notices", unless the Program does not already. Section 7 allows the licensor to add terms such as keeping notices, and declining trademark rights (7(b), 7(e)). I found no such added terms in this repo's `LICENSE.md` or README. Fleetbase may still hold the trademark `[counsel to confirm]`.
- README lines 334-346: dual licence. The commercial licence "lets you … white-label or distribute it under your own brand". Copyright line: "© 2026 Fleetbase Pte. Ltd."
- `fleetbase.io/licensing` (read 18 Nov 2026): lists "OEM and white-label distribution to your customers" as a commercial-licence use and as **not suitable** for AGPL. It says nothing on trademarks or on removing the name. No price is stated.

**Read this carefully.** Fleetbase itself puts "white-label" on the paid side. Whether changing the visible name under AGPL is white-labelling in their sense, or just normal modification, is a legal question. `[counsel to confirm]`. My reading as a non-lawyer: a **rename** of strings is a modification that AGPL permits. **Removing the legal notice or copyright** is the risky part. The two are separate and we only need to do the first.

**Unrelated finding, not part of this ask.** The core API has a `telemetry:ping` command ("Send periodic Fleetbase telemetry") and hosted routing sends the install address and admin email to Fleetbase Cloud. I did not check what telemetry sends. For a product with DPDP duties this deserves a security-engineer look. I list it separately.

## 4 · Evidence and demand

- Observed: Surbhi's request, one line.
- Client-stated: none; no client has asked. `[ASSUMPTION]` the first client will see the console and customers will see tracking and emails.
- Competitor: Shipday, Tookan and Onfleet are sold as their own brands; none says "built on" another product. `[recall - verify]`, no source read today.
- Kano class (proxy): **Must-be for anything customers or riders read** (a rival brand on an email undermines us); **Indifferent for admin-only screens**. This matches the split in section 3.

## 5 · Practical cases

| Case | What should happen |
|---|---|
| Upstream ships a new release with a new string saying "Fleetbase" | The CI brand check fails on the upgrade branch. Someone adds an override line. Costs minutes. |
| Upstream changes or renames a key we override | Our override silently stops working; the string reverts to Fleetbase. The check catches it. |
| Language other than English | Falls back to the engine's own text, still says Fleetbase. Decide which locales we ship. |
| Rider has Navigator installed | New name arrives with an app update. Tell riders first. App-store review adds days. |
| A customer's existing email templates or saved SMS sender "Fleetbase" | They are the operator's data, not ours. Do not edit. Tell operators. |
| Developer docs, API keys `flb_…`, webhooks, SDK | Keep. Integrations in the field depend on them. Renaming breaks every client's code. |
| Support asks "Is this Fleetbase?" | Honest answer: built on open-source Fleetbase; the Legal notice says so. We do not hide it. |
| Client later wants their own brand (not Alvora's) | The existing logo, icon and theme setting does it. The name still reads AlvoraVector. Out of scope here. |

## 6 · Options (cheapest first)

**A. Brand-only, rung 1 and rung 4.** Upload logo and icon in the existing branding screen; set `APP_NAME` and `MAIL_FROM_NAME`; change the 14 host translation lines, `index.html` title, `site.webmanifest`, the 3 hardcoded notification lines and replace the fallback logo file.
- Cost: under a day. Risk: low. Merge debt: nothing new (our own files; `index.html` and the host translations are already conflict-prone but small).
- Leaves: about 27 engine-owned strings saying Fleetbase (order form hints, invite emails inside the console, webhook help). Visible to admin staff, mostly not to customers.

**B. A plus host overrides of engine strings, plus a CI brand check. Rung 4.** Copy the 27 engine keys into `console/translations/en-us.yaml` with "AlvoraVector". Add one test that scans the English translations and templates for "Fleetbase" outside an allow-list (the Legal notice, hosted routing and code), like Alvora HR's spelling test.
- Cost: about 1 to 2 days, mostly the test. Run cost: none. Risk: low. Merge debt: one text file of 27 keys to re-check on each upstream release; the check does that for us.
- Leaves: the 10 hardcoded ember-ui strings (attribution, legal notice, logo alt text). These are the legal notice or very hidden.
- **Recommended.** It reaches everything a customer, rider or operator staff member reads without touching a package we cannot publish privately.

**C. Fork `ember-ui` and engines to change every string. Rung 5.** Needs Surbhi's explicit yes (CLAUDE.md §5).
- Cost: days now, then permanent merge debt on every release (upstream ships every 1 to 2 weeks). Anything we change inside is AGPL and published (CLAUDE.md §4).
- Buys: about 10 more strings. **None of them is worth it:** most are the legal notice, which we are told not to hide. Rejected.

**D. Buy the Fleetbase Commercial License.** Price not published. Removes AGPL duties and, per their own README, allows white-label. It also gives indemnification and a clean route to ship Navigator under our name and to keep our extensions private.
- Cost: unknown. Evidence required: a quote. It is a business decision for Surbhi and counsel `[counsel to confirm]`.
- Not needed to do option B. It becomes the clean answer if we want the legal notice gone, private extensions, or an app-store listing without "Fleetbase" in the source.

**Could we not do this at all?** We could leave Fleetbase everywhere. Cost: every customer-facing surface advertises another product. Not acceptable for emails and the rider app.

**My recommendation: B now. D is a separate decision for Surbhi; do not delay B for it.**

## 7 · Risks and compliance

- **Licence (AGPL).** Strings in our own `console/` shell are our code and, if we serve users, assume they are published (CLAUDE.md §4). Same as today; the rename adds no new exposure. Keep `LICENSE.md`, copyright lines and the Legal notice. Never copy Fleetbase code into a private codebase. `[counsel to confirm]`.
- **Trademark.** Whether "Fleetbase" is a registered mark and what its policy allows is **unknown**. I found no trademark text. Removing their name from our product is generally lower-risk than using it; claiming the product is ours alone is the risk. Our "built on" statement should stay true. `[counsel to confirm]`.
- **Our own mark.** Does "Alvora Vector" or "AlvoraVector" conflict with an existing mark? Not checked. `[counsel to confirm]`.
- **Money and personal data.** None. The rename does not touch payments or rider data. Rider consent text in Navigator names who receives location: it must still say the truth (data goes to the operator and the system). Keep the wording accurate when "Fleetbase" becomes "AlvoraVector".
- **Rider lens.** Fair offers: no effect. Transparent pay: no effect. Dark patterns: none. Inclusion: one gain, a rider sees the same name on the app and on the operator's messages; a loss if the rename reaches only some languages.
- **Regulatory read.** (1) None binding, plus DPDP for the consent text. (2) Ours. (3) Nothing new is collected. (4) Inside the AGPL product for strings; counsel needed on notices. (5) We would defend a rename. We would not defend a quiet removal of the legal notice.
- **Technical risk.** A global find-and-replace would break package names, imports, API prefixes and DB names. **Do not do that.**

## 8 · What must NOT be renamed, and why

| Keep | Why |
|---|---|
| Package and import names: `@fleetbase/*`, `fleetbase/core-api`, PHP namespace `Fleetbase\…` | Every upgrade, build and extension loads by these names. Renaming is a permanent fork. |
| `flb_` API key prefix, `X-Fleetbase-*` headers, `fleetbase` config keys | Integrations, webhooks and the socket service rely on them. Clients' code breaks. |
| Database, table and class names | Migrations and upstream upgrades expect them. |
| Console build identity (`@fleetbase/console`, `fleetbase.config.json`, `extensions.json`) | Build and registry paths. Invisible to users. |
| `LICENSE.md`, "© Fleetbase Pte. Ltd.", the Legal notice and the "Fleetbase" attribution | Legal notices. AGPL 4 and 5 require them kept intact. Hide only on counsel's word. |
| Hosted-routing text that names Fleetbase Cloud | It is true: a Fleetbase service. |
| Developer docs and SDK names (`fleetbase-js`, console "Open Fleetbase documentation") | They are Fleetbase's docs, not ours. Say "built on Fleetbase" if needed. |
| Upstream Git history and release notes | Needed for the upstream sync. |

## 9 · Surfaces covered

- **Operator console:** yes (A, B).
- **Tracking page and Customer Portal:** the customer-portal engine has 1 visible string (about notification rules in "Fleetbase"). Also has a "Powered by Fleetbase" toggle in the fleetops translation (lines 4111, 4164, 4185). The toggle exists in stock, so operators can turn it off. Needs the exact default checked `[Needs validation]`.
- **Emails and SMS:** name and logo come from `APP_NAME` and the branding logo. SMS sender is the operator's own setting.
- **PDFs and labels:** nothing visible to change.
- **Driver app (Navigator):** 2 strings and the app display name. Requires a rebuild and app-store entries (name, bundle ID, icons). The bundle ID should not change after publishing. Separate small slice, not part of the console change.
- **Storefront app:** 1 string. Same as Navigator.
- **API docs and developer console:** dev-engine has 3 strings ("Fleetbase will not retry…"). These are changed by B. The docs site is Fleetbase's; leave.

## 10 · Out of scope

- Renaming any code, packages or API contracts.
- Hiding the Legal notice or attribution (counsel first).
- Navigator and Storefront rebuilds and store listings (separate decision).
- Non-English locales (until Surbhi names the ones that matter).
- Custom domain, email domain and logo design (needs Alvora brand assets; domains use `alvoraa`).
- The telemetry and hosted-routing data flows to Fleetbase (separate security review).

## 11 · Subtract pass

Removed from my own draft: a proposed "brand config page" (the host translation key is enough), a plan to translate all 16 locales (not until a client needs them), and a proposal to fork `ember-ui` for the 10 hardcoded strings (they are mostly the legal notice). Nothing else.

## Success criteria

- Zero visible "Fleetbase" outside the allow-list (legal notice, hosted routing, developer docs) in English screens, emails and the Navigator name. Measured by the CI brand check (baseline: about 41 translation lines plus about 7 other places).
- Upstream upgrade: the brand check passes or is fixed within the upgrade slice. Measured at the next upstream merge.
- Zero broken API calls or builds from the rename. Measured by the existing test suites staying green.

## Kill criteria

Stop and reconsider if: counsel says the visible rename itself is not permitted under AGPL without the commercial licence; or the one-key spike shows engine translations cannot be overridden from the host (then B shrinks to A and we ask about rung 5 or option D).

## Open questions (for Surbhi)

1. **Spelling in the UI.** "AlvoraVector" (one word, matches repo, easier to test) or "Alvora Vector" (your spelling)? Blocks every string. **Recommend "AlvoraVector"** in the UI and the CI check; "Alvora" alone where it reads naturally.
2. **Legal notice.** Keep the "Fleetbase · Legal" notice as it is, until counsel says otherwise? **Recommend keep.** Blocks the last 10 strings.
3. **Counsel.** Who reviews licence, trademark and our own mark? Blocks D and any removal of notices. **Recommend** one short written opinion before any client pitch says "white label".
4. **Commercial licence.** Ask Fleetbase for a quote? **Recommend yes, just to learn the price.** Does not block B.
5. **Languages.** Which locales does the first client use? **Recommend English only** in phase 1.
6. **One-key spike.** OK to test overriding a fleetops key from the host on the local stack (one line, one build, then revert)? **Recommend yes**, before B is approved.
7. **Navigator and Storefront apps.** Rename now or when the first client's app is published? **Recommend later,** as its own slice.
8. **Telemetry.** Ask the security engineer what `telemetry:ping` and hosted routing send out? **Recommend yes,** as a separate item.

## Assumptions

- `[ASSUMPTION]` Customers and riders matter more than admin-only screens.
- `[ASSUMPTION]` English is enough for phase 1.
- `[ASSUMPTION]` The "Powered by Fleetbase" toggle defaults to off or can be turned off by operators. Not verified.
- Not checked: the tracking page's own source, the Customer Portal build, SMS text in the API, the ember-core package strings, and Navigator's native bundle and store files.
