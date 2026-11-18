# CLAUDE.md — AlvoraVector

AlvoraVector is Alvora's fleet and delivery management product for gig-workforce
operators. It is built **on top of Fleetbase** (open-source logistics OS, v0.7.75 at the
start) and must integrate with **ERPNext**. Read `.claude/context/product-context.md` for
the product, and `.claude/context/fleetbase-conventions.md` before touching code.

Owner and decision-maker: Surbhi. Agents recommend; she decides every scope, design,
push and deploy.

---

## §1 · Work moves in stages, each on Surbhi's word

1. **Local** — build and test on the local Docker Compose stack. This is where work is
   proven.
2. **dev** — push to `dev` only when Surbhi says so. Passing tests is not permission.
   *(`dev` exists since 18 Nov 2026 here and in the driver-app fork
   `surbhigoyal7381-agent/navigator-app` — DEC-024. Working branches go into `dev`.)*
3. **main** — push or merge to `main` only when she says so, after testing on dev.
   GitHub enforces it: `main` takes changes **only through a pull request** (from `dev`),
   for admins too; she approves by merging it. No force pushes or deletions on `main` or
   `dev`. A merged PR from `dev` does not tag a release (`release.yml` only tags
   `release/v*` and `dev-v*` branches).

Before editing, and again before committing: `git fetch` and check incoming commits.
Surbhi runs several Claude sessions at once. Before pushing, check that no CI run is still
going on the target branch (`gh run list --branch <b> --limit 4`) — a new push cancels it.

## §2 · Commands that need explicit approval before they run

Ask first, every time, naming the stage it affects:

- `git push` (any branch), `git merge` into `dev`/`main`, any force operation
- Creating, deleting or renaming branches, tags or releases; `gh release`, `gh workflow run/enable/disable`
- `docker compose down -v`, deleting `docker/database/mysql`, or anything else that destroys local data
- `php artisan migrate:fresh`, `migrate:rollback`, `db:wipe`, or a seeder against data someone cares about
- Publishing anything: Docker images, npm/Composer packages, extensions to a registry
- Adding a new third-party dependency, Composer package, npm package or Fleetbase extension
- Merging an upstream Fleetbase release (the `vector-upstream-sync` agent prepares it; she approves it)
- Anything touching a server, cloud account or the secrets of one

Reading, local builds, local tests and local `php artisan migrate` on the dev stack do
not need approval.

## §3 · 🚫 The production wall

There is **no production environment yet**. When one exists, agents never run commands
against it, never read its database, and never copy files to it. They write the commands
for Surbhi to run. Until then, treat any cloud workflow in `.github/workflows/`
(`cd.yml`, `eks-cd.yml`, `gcp-cd.yml`, `publish-docker-images.yml`) as **upstream's, not
ours** — it targets Fleetbase's accounts and must not be triggered.

## §4 · The licence rule — AGPL-3.0

Fleetbase is AGPL-3.0 (dual-licensed; a paid Fleetbase Commercial License removes the
obligations). Until Surbhi decides on the commercial licence:

- **Any code inside Fleetbase, or an extension loaded into it, is AGPL and must be
  published** to the people who use the service. Assume it becomes public.
- **Code that talks to Fleetbase only from outside** (over its REST API and webhooks) —
  the ERPNext connector, for example — is not covered and can stay private.
- Never copy Fleetbase code into a separate "own" codebase to escape the licence.
- Keep Fleetbase's licence files and notices. Every proposal says which side of this
  line its code sits on.

## §5 · How we change Fleetbase — the ladder

Climb from the bottom; say which rung and why every cheaper rung failed.

1. **Already there** — Fleetbase settings, order configs, custom fields, workflows, IAM policies.
2. **Outside integration** — REST API, webhooks, socket events, a separate service.
3. **Our own extension** — a new Fleetbase extension (PHP package + Ember engine).
4. **The thin shells** — `api/`, `console/`, `socket/` in this repo.
5. **Changing an upstream module** (Fleet-Ops, Ledger, core-api…) — last resort. Every
   change here is merge debt on every upstream release. Needs Surbhi's explicit yes.

Details: `.claude/context/fleetbase-conventions.md`.

## §6 · The change process

Mandatory, in order: impact analysis → strategy → **wait for approval** → implement →
tests → independent review → present findings → **wait for deploy approval**. Full rules
in `.claude/context/change-process.md`. A new requirement (it changes *what* the product
does) goes to `vector-product-manager` before any file is opened. Size the work by risk
tier: `.claude/context/usage-discipline.md`.

**Decision log — `docs/decisions/decision-log.md` (Surbhi, 18 Nov 2026).** Whenever Surbhi
decides something — scope, design, an option, a trade-off, a tool, a process rule, a push —
append a `DEC-NNN` entry (newest first, template at the top of the file) **in the same
change as the work**: the decision, who decided and who recommended it, the context, the
rationale, the alternatives rejected and why, follow-ups, and links. Technical decisions
taken without her (a reviewer's fix, an engineer's design choice inside an approved scope)
are logged too, marked as such. Never rewrite an old entry's decision; a reversal is a new
entry that names the one it replaces. When reporting a decision back to Surbhi, say its
DEC number in brackets after the plain words.

## §7 · The agent team

| Agent | Owns |
|---|---|
| `vector-product-manager` | What to build and why; Kano priorities; slice briefs |
| `vector-ux-designer` | Opportunities scan, designs with a clickable prototype, UX learnings |
| `vector-business-analyst` | Functional spec, user stories, acceptance criteria, traceability |
| `vector-security-privacy-engineer` | Security and privacy requirements, threat models, security review |
| `vector-devops-engineer` | Run cost, performance, Compose/CI, release and rollback plans (advises only) |
| `vector-fullstack-engineer` | Impact analysis and implementation |
| `vector-test-automation-engineer` | Tests that prove the slice works |
| `vector-technofunctional-reviewer` | Final quality gate: Ship / Ship with fixes / Block |
| `vector-upstream-sync` | Tracking Fleetbase releases, the divergence ledger, upgrade reports |

Skills: `/slice-start`, `/slice-build`, `/product-priorities`. Slice artifacts live in
`docs/slices/<NNN-name>/` (see `.claude/context/handoff-contract.md`).

## §8 · Running it locally — on Surbhi's Mac

### The machine (checked 18 Nov 2026)

- **macOS 26.3, Intel (x86_64)**. Images run natively as amd64; no Rosetta or `platform:` overrides needed.
- **Installed:** Docker Desktop 29.9 (16 CPUs, ~7.7 GB memory), git (Apple), gh, Python 3.9,
  Google Chrome, and **nvm** with two Node versions: the system Node **26** (the default) and
  **Node 22.23.5** with **pnpm 11.0.9** (installed 18 Nov 2026 with Surbhi's OK).
- **Android (driver app, `/Users/mac/AlvoraVector/navigator-app`):** JDK 17.0.21 (Temurin,
  `~/Library/Java/JavaVirtualMachines`), Android SDK at `~/Library/Android/sdk` (platform 36,
  build-tools 36.0.0, NDK 27.1, emulator AVD `Navigator_Pixel7`). `JAVA_HOME`, `ANDROID_HOME`
  and `PATH` are set in `~/.zshrc` (18 Nov 2026) — run builds in a login zsh (`zsh -ic '…'`).
  Debug build: `cd android && ./gradlew assembleDebug` on Node 22.
- **Not installed:** PHP, Composer, k6, Homebrew. So **PHP and k6 run inside Docker**,
  never on the host. Installing anything else on the Mac is a §2 decision — ask first.
- **Use Node 22 for the console and extensions** (it matches CI and `console/Dockerfile`):
  start the command with `. ~/.nvm/nvm.sh && nvm use 22`. pnpm exists only under Node 22.
  Socket tests run on either.
- **macOS ships BSD tools, not GNU:** `sed -i ''` (not `sed -i`), no `timeout`, `date -v`
  instead of `date -d`, `stat -f` instead of `stat -c`, `grep -E` (no `-P`). Write scripts
  that work on both, because CI runs Linux.
- **The disk is case-insensitive (APFS); CI is not.** Never rename a file by changing only
  its case — use `git mv` through a temporary name — and match import paths' case exactly.
- **Bind mounts on macOS are slow.** Local timings say nothing about production or CI;
  compare query counts and payload bytes, not seconds.

### Start the stack

```sh
open -a Docker                              # Docker Desktop must be running first
until docker info >/dev/null 2>&1; do sleep 2; done
docker compose up -d                        # cache, database, socket, queue, scheduler, application, httpd, console
docker compose exec application php artisan migrate
# API http://localhost:8000 · Console http://localhost:4200 · Socket ws://localhost:38000
docker compose stop                         # when finished — stop what you started
```

First install: `scripts/docker-install.sh`. Copy `docker-compose.override.yml.example` to
`docker-compose.override.yml` for `--watch` and local settings. Give Docker Desktop at
least 6 GB of memory `[PROPOSAL]` — MySQL, Octane and an Ember build run together.
Extension development against local packages: `node scripts/package-linker.mjs` (see
`scripts/README.md`; it runs on the host's Node).

### Tests — run what you touched, plus its neighbours

| Part | Command on this Mac | CI gate |
|---|---|---|
| API shell | `docker run --rm -v "$PWD/api:/fleetbase/api" -w /fleetbase/api fleetbase/fleetbase-api:latest sh -c 'cp -n .env.example .env; composer install --no-interaction && composer test'` — **verified 18 Nov 2026: 44 tests pass, ~5 s once installed** | `api.yml`, coverage 100% |
| Console | `. ~/.nvm/nvm.sh && nvm use 22 && cd console && pnpm install --frozen-lockfile && pnpm lint && pnpm test:ember` — **verified 18 Nov 2026: lint clean, 1,446 tests pass in Chrome** | `console.yml`, coverage 100% |
| Socket | `cd socket && npm test` (host Node is fine) | `socket.yml` |
| Extension | its own phpunit in the same PHP container, its `ember test` like the console | the extension's repo |
| API performance | `docker run --rm -i -v "$PWD/tests/k6:/k6" -e BASE_URL=http://host.docker.internal:8000 grafana/k6 run /k6/api-release.js` `[UNVERIFIED — needs keys, see tests/k6/README.md]` | `performance.yml` on release PRs |
| Clean install | `install-smoke.yml` in CI; locally a fresh stack: `docker compose -p fresh up -d` then migrate and seed | migrate, seed, permissions, registry init |

**Every console build or test rewrites `console/app/router.js`** (it is generated from
`console/router.map.js` by `console/lib/fleetbase-extensions-generator`, and upstream's
committed copy is stale). If you did not change `router.map.js`, restore it before
committing: `git checkout -- console/app/router.js`. Never commit it by accident.

**VS Code's PHP checker** uses `~/.local/bin/php-docker`, a script that runs PHP 8.2 from
the `fleetbase/fleetbase-api:latest` image (set in `.vscode/settings.json`, git-excluded,
checks on save). If VS Code says it cannot validate, Docker Desktop is not running.

The API test command uses the app image only as a PHP 8.2 toolbox (it has every extension
CI installs, and Composer); `api/vendor` and `api/.env` it creates are git-ignored. The
first run downloads images and packages — slow once, then cached. When a command marked
`[UNVERIFIED]` works or fails, fix this table in the same change.

## §9 · Writing for Surbhi

Plain, short chat replies: the answer first, about eight lines, an example rather than
jargon, no ticket or slice ID without saying what it holds. Documents can be fuller.
Never describe code or screens from memory — read them first, and say when something
could not be checked (much of Fleetbase lives in packages that are not in this checkout).
