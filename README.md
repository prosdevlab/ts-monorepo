# TypeScript Monorepo Starter

[![Node.js](https://img.shields.io/badge/node-%3E%3D26-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-12.15.0-orange.svg)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern TypeScript monorepo starter template with best practices for scalable projects.

## Features

- 📦 [PNPM](https://pnpm.io/) 12 for package management, and to pin the Node.js version
- 🏎️ [Turborepo](https://turbo.build/repo) for high-performance build system
- 🛠️ The TypeScript compiler (`tsc`) builds every package
<!-- example:web -->
- 📜 [Rollup](https://rollupjs.org/) builds the script-tag file
<!-- /example:web -->
- 🔍 [Biome](https://biomejs.dev/) for fast linting and formatting
- 🧹 [knip](https://knip.dev/) finds unused files, exports and dependencies
- ⚙️ [TypeScript](https://www.typescriptlang.org/) 7, with a Node preset
<!-- example:web -->
- 🖥️ A browser TypeScript preset (DOM)
<!-- /example:web -->
- 🟢 Published packages support Node.js 24 and later, tested on Linux, macOS and Windows
- 🧪 [Vitest](https://vitest.dev/) for unit testing
<!-- example:web -->
- 🌐 [Playwright](https://playwright.dev/) browser tests with [axe](https://github.com/dequelabs/axe-core-npm) accessibility checks
- 📏 [size-limit](https://github.com/ai/size-limit) budgets that fail CI when a browser build grows
<!-- /example:web -->
- 📝 [Commitlint](https://commitlint.js.org/) with Conventional Commits
- 🔄 [Changesets](https://github.com/changesets/changesets) for versioning and changelogs
- 🚀 GitHub Actions for CI/CD with npm publishing
- 🔗 Installable preview packages for every PR ([pkg.pr.new](https://pkg.pr.new))
- 🛡️ [zizmor](https://docs.zizmor.sh/) audits the workflows themselves on every PR
- 🤖 Dependabot dependency updates, 3 days after release, and `pnpm audit` in CI
- 🪝 [Husky](https://typicode.github.io/husky/) for Git hooks

## Project Structure

```
ts-monorepo-starter/
├── .changeset/          # Changesets configuration
├── .github/             # Workflows, Dependabot and zizmor config, issue forms, PR template
├── .husky/              # Git hooks
├── packages/            # All packages (the examples are listed below)
├── .editorconfig        # Editor defaults matching Biome's formatter
├── AGENTS.md            # Instructions for coding agents (CLAUDE.md imports it)
├── biome.json           # Biome configuration
├── commitlint.config.js # Commitlint configuration
├── package.json         # Root package.json
├── pnpm-workspace.yaml  # PNPM workspace config (3-day minimum release age)
├── SECURITY.md          # How to report a vulnerability privately
├── tsconfig.json        # Base TypeScript config (Node)
├── turbo.json           # Turborepo config
└── vitest.config.ts     # Vitest config
```

The example packages:

<!-- example:lib -->
- `packages/shared`: core service and logger
- `packages/lib`: a library package that depends on `shared`
<!-- /example:lib -->
<!-- example:web -->
- `packages/web`: a browser library (script tag and ES module)
<!-- /example:web -->
<!-- example:cli -->
- `packages/cli`: a command-line package (`bin`, Node target)
<!-- /example:cli -->

## How It Fits Together

### Packages and build order

<!-- example:lib -->
```
  ┌──────────┐         ┌──────────┐
  │  shared  │ ──────▶ │   lib    │
  └──────────┘         └──────────┘
```

An arrow points from a package to a package that depends on it. `pnpm build` builds `shared`, then `lib` (Turborepo's `dependsOn: ["^build"]`). Unit tests import sources directly, through the aliases in `vitest.config.ts`.

<!-- /example:lib -->
<!-- example:web -->
`web` has no internal dependencies.

<!-- /example:web -->
<!-- example:cli -->
`cli` has no internal dependencies.

<!-- /example:cli -->
Typecheck reads each dependency's built `dist/`, so build before typechecking.

### What a build produces

```
every package
  src/*.ts ──── tsc -p tsconfig.json ────▶ dist/*.js     ES modules, one per source file
                                           dist/*.d.ts   types, with declaration maps
```

<!-- example:web -->
```
web, one more step
  dist/index.js ──── Rollup + terser ────▶ dist/index.global.js  (minified, window.Web)
```

<!-- /example:web -->
<!-- example:cli -->
```
cli, one more step
  dist/cli.js ─────── mark executable ───▶ command (keeps #!/usr/bin/env node)
```

<!-- /example:cli -->

### Where versions come from

```
package.json
  devEngines.runtime   node 26.12.1 ──┬──▶ pnpm: downloads it and runs every script on it
                                      ├──▶ setup-node (CI): installs the same version
                                      ├──▶ npm and npx: refuse to run on any other version
                                      └──▶ @types/node 26.x in the root package.json (raised by hand)
  packages/*/package.json
    engines.node       >=24 ──────────┬──▶ CI: unit tests on Node 24 and 26, Linux, macOS, Windows
                                      ├──▶ tsconfig.json: @tsconfig/node24 (no newer JS APIs)
                                      └──▶ @types/node 24.x in packages (raised by hand)
  packageManager       pnpm@12.15.0 ──┬──▶ pnpm: switches itself to this version
                                      └──▶ pnpm/action-setup (CI)

pnpm-workspace.yaml
  minimumReleaseAge    4320 (3 days) ◀──── must equal ────▶ dependabot.yml cooldown 3
```

Each version is set in one place, and the tools on the right read it from there. Some stay in step by hand: `@types/node` stays on the matching Node major (26 for the root's tooling, 24 for the packages; Dependabot skips its major updates), and the two age settings are kept equal. The repository is developed on Node 26; the packages it publishes run on Node 24 and later.

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) 12. It downloads the pinned Node.js version itself.
- Any Node.js with npm, to install pnpm. After that, commands run through pnpm use the pinned Node.js 26 (`devEngines.runtime` in `package.json`).

### Installation

1. Clone this repository
   ```bash
   git clone https://github.com/yourusername/ts-monorepo-starter.git
   cd ts-monorepo-starter
   ```

2. Install pnpm 12, once per machine
   ```bash
   npm install -g pnpm@12.15.0
   ```
   If Volta manages your pnpm, run `volta install pnpm@12.15.0` instead. Otherwise, pnpm 10.26 or newer switches itself to pnpm 12 when you run it here, so you can skip this step. Run it on a machine with no pnpm, or with pnpm older than 10.26. A pnpm that doesn't switch itself to 12 refuses to install here (`ERR_PNPM_UNSUPPORTED_ENGINE`).

   Inside the repository, run one-off tools with `pnpm dlx` or `pnpm exec`. `npm` and `npx` refuse to run unless your system Node.js matches the pinned version exactly.

3. Install dependencies (this also downloads the pinned Node.js)
   ```bash
   pnpm install
   ```

4. Build all packages
   ```bash
   pnpm build
   ```

### Development Workflow

#### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm -F "<package-name>" test:watch
```

#### Linting and Formatting

```bash
# Lint all packages
pnpm lint

# Format all packages
pnpm format
```

#### Building

Every package builds with the TypeScript compiler (`tsc -p tsconfig.json`). No bundler is involved for libraries: their consumers bundle. All packages are ES modules.

```bash
# Build all packages
pnpm build

# Build a specific package
pnpm -F "<package-name>" build

# Watch mode for development
pnpm -F "<package-name>" dev
```

**Build Configuration:**
- **Output**: one ES module per source file (`dist/index.js`, ...)
- **Types**: one declaration file per source file (`dist/index.d.ts`), with declaration maps
- **Source maps**: included for debugging
- **Clean builds**: the build script deletes `dist` first, so files from removed sources never ship
- **Not incremental**: the packages don't use `composite`. With it, `tsc` keeps a build-info file and can skip writing anything after `dist` is deleted.

### Making Changes

1. Create a new branch
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes

3. Commit your changes using conventional commits
   ```bash
   git commit -m "feat: add new feature"
   ```

4. Add a changeset to document your changes
   ```bash
   pnpm changeset
   ```

5. Push your branch and create a pull request

### Release Process

Releasing is handled automatically through GitHub Actions when changes are merged to the main branch:

1. The workflow runs tests, type checking, and builds to ensure quality
2. Changesets creates a PR to bump versions and update changelogs
3. When the PR is merged, packages are published to npm

#### Preview Packages

With previews on, every push to `main` and every PR from a branch in this repository publishes each package to [pkg.pr.new](https://pkg.pr.new). A bot comments the install commands on the PR, so anyone can try a change before it's released:

```bash
npm i https://pkg.pr.new/<owner>/<repo>/@monorepo/<package>@<pr-number>
```

Previews aren't npm releases. They aren't versioned and they don't need an npm account. Dependencies between the packages point at the same preview. PRs from forks never run the preview job, so a stranger's code is never built and published.

To turn previews on:

1. Install the [pkg.pr.new GitHub App](https://github.com/apps/pkg-pr-new) on the repository or organization.
2. Set the repository variable `PKG_PR_NEW` to `true`: **Settings → Secrets and variables → Actions → Variables**.

Previews include every package that isn't marked `"private": true`. The repository's code is public on pkg.pr.new, so leave previews off for a private repository.

#### Setting Up npm Publishing

Packages publish with **npm trusted publishing**: GitHub Actions proves its identity to npm for each release, so no npm token is stored anywhere, and each version gets a **provenance** statement linking it to the commit and workflow that built it (for public packages from public repositories).

The release workflow never publishes until the repository variable `NPM_PUBLISH` is `true`, so a copy of the template can't publish by accident. To publish:

1. Give each package a name that's free on npm, or use a scope you own. Mark any package that must never publish `"private": true`. Add `"repository": {"type": "git", "url": "git+https://github.com/<owner>/<repo>.git", "directory": "packages/<name>"}` to each package you publish, because npm provenance checks it against the publishing repository.
2. On npmjs.com, open the package's **Settings → Trusted publishing** and add a GitHub Actions publisher: your user or organization, this repository, workflow file `ci.yml`, environment `npm`. (Publishing runs in `release.yml`, which `ci.yml` calls, and npm checks the calling workflow.) A new trusted publisher must complete its first publish within 2 days. If npm won't let you configure a package that doesn't exist yet, publish the first version by hand (`npm publish --access public`, with two-factor authentication), then add the publisher.
3. In the same settings, under **Publishing access**, choose **Require two-factor authentication and disallow tokens**. Trusted publishing keeps working; a leaked token can't publish.
4. In GitHub, under **Settings → Actions → General**, enable **Allow GitHub Actions to create and approve pull requests**, so the workflow can open the version PR. Then set the repository variable `NPM_PUBLISH` to `true` (**Settings → Secrets and variables → Actions → Variables**). Optionally, add required reviewers to the `npm` environment (**Settings → Environments**) to approve each publish.

How a release runs: CI's `release` job calls `.github/workflows/release.yml` on pushes to `main`, after every other CI job passes, against the same commit. Pull requests never reach it, so code from a fork never runs with write access.

```
  push to main ──▶ CI jobs pass ──▶ select-mode                  contents: read
                                       │
                 ┌─────────────────────┴──────────────────────┐
         changesets present                          version PR merged
                 ▼                                             ▼
              version                                        pack       contents: read
     opens "version packages" PR                build, package checks, tarballs
     contents, pull-requests: write                            ▼
     (no npm access)                                        publish     environment: npm
                                                  publishes the tarballs; never builds
                                                  contents: write, id-token: write
```

1. **select-mode** reads the changesets: version, publish, or nothing.
2. **version** (changesets present) opens or updates the "version packages" PR. It can write to the repository but cannot reach npm.
3. **pack** (version PR merged, and `NPM_PUBLISH` is `true`) builds, runs the package checks, and packs tarballs, with read-only access.
4. **publish** publishes those tarballs. It is the only job that can get npm credentials, and it never builds.

## Working with this Monorepo

### Adding a New Package

Copy the example closest to what you're building, then rename it:

<!-- example:lib -->
- `packages/shared` for a plain library
<!-- /example:lib -->
<!-- example:web -->
- `packages/web` for a library that runs in web pages
<!-- /example:web -->
<!-- example:cli -->
- `packages/cli` for a command people run
<!-- /example:cli -->

Keep `"type": "module"`, the `exports` map, `"files": ["dist"]` and the `check:package` script: `pnpm check:packages` fails without them. Run `pnpm install` to link it. If other packages import it from source, add a `vitest.config.ts` alias and a root `tsconfig.json` path.

### Package Interdependencies

Packages can depend on each other using the workspace protocol:

```json
"dependencies": {
  "@monorepo/<package>": "workspace:*"
}
```

<!-- example:web -->
### Browser Libraries

`packages/web` shows the setup for a library that runs in web pages. Copy it as a starting point.

- **Two builds**: `tsc` writes the ES module and its types for bundlers. [Rollup](https://rollupjs.org/) (`rollup.config.js`) then bundles that output into a minified script-tag file (`dist/index.global.js`) that exposes a global. Rollup reads JavaScript, so it needs no TypeScript plugin, only terser to minify.
- **Nothing runs at import.** Work starts when the page calls the API, so importing the package is always safe.
- **Isolation and safety:** the example renders in a shadow root, so host page CSS can't restyle it, and treats text as text, never HTML.
- **Browser tests** in `e2e/*.e2e.ts`, configured by the package's own `playwright.config.ts`, load the built script tag into a real page, including an [axe](https://github.com/dequelabs/axe-core-npm) accessibility check.
- **Own tooling:** Playwright, axe and size-limit are this package's dev dependencies, and its `tsconfig.json` carries the browser compiler options (DOM, ES2020), so deleting the package removes them.
- **Size budget** in the package's `size-limit` field. CI fails if the script-tag build grows past it.

```bash
# One-time: install the browser Playwright uses
pnpm --filter @monorepo/web exec playwright install chromium

# Browser tests and the size budget (turbo builds first)
pnpm test:browser
pnpm size
```
<!-- /example:web -->

<!-- example:cli -->
### Command-Line Packages

`packages/cli` shows the setup for a package people run as a command (`npx your-tool`). Copy it as a starting point.

- **A `bin` entry** in `package.json` points at `dist/cli.js`. The source starts with `#!/usr/bin/env node`; `tsc` keeps that line, and the build script marks the file executable (with Node's `fs.chmodSync`, so it also builds on Windows).
- **Runs on Node 24 and later**: `engines.node` is `>=24`, the root `tsconfig.json` extends `@tsconfig/node24` so code can't use newer JavaScript APIs, and the package's `@types/node` is 24.x so it can't use newer Node APIs. CI runs the tests on Node 24 and 26.
- **Logic separate from the process.** `src/index.ts` exports `run(argv, io)`, which returns an exit code instead of exiting, so it is unit-tested directly. `src/cli.ts` is the two-line entry point that calls it.
- **No argument-parsing dependency:** Node's built-in `util.parseArgs`, with unknown options reported as errors (exit 2) instead of crashes.
- **A test of the built command** (`test/bin.test.ts`) runs `dist/cli.js` the way a user would: shebang, executable bit, output, exit codes. It fails with a clear message if you haven't built first.

```bash
pnpm build
node packages/cli/dist/cli.js greet --name you
pnpm test
```
<!-- /example:cli -->

### Package Checks

`pnpm check:packages` packs every package the way it would be published and checks the result. CI runs it on every push.

- **[publint](https://publint.dev)** checks the package layout: that `exports`, `types` and `bin` point at files that exist in the tarball, and that nothing unneeded ships.
- **[Are The Types Wrong](https://arethetypeswrong.github.io)** checks that the types resolve for each way someone can import the package (Node ES modules and bundlers; the packages are ESM-only, so CommonJS resolution is not required).

Every package lists `"files": ["dist"]`. Without it, what ships depends on the tool: `npm pack` follows `.gitignore` and leaves out `dist/`, while `pnpm pack` includes it along with build logs and caches.

### Unused Code

`pnpm check:unused` runs [knip](https://knip.dev/), and CI runs it on every push. It fails on files nothing imports, exports nothing uses, dependencies nothing imports, and imports of packages a `package.json` doesn't declare. Exports from a package's entry file count as its public API, so they are never reported.

knip reads most tools' config files itself, so the template needs no `knip.json`. If knip reports something that is used, add a `knip.json` entry for it rather than deleting the code.

### Issues, Pull Requests and Security Reports

- **Issue forms** (`.github/ISSUE_TEMPLATE/`): bug reports ask for the package and version, steps to reproduce, and the environment. Blank issues are turned off.
- **A PR template** (`.github/PULL_REQUEST_TEMPLATE.md`) asks what changes and why, and lists the checks and the changeset.
- **`SECURITY.md`** sends vulnerability reports to GitHub's private reporting. Turn it on in your repository: **Settings → Advanced Security → Private vulnerability reporting**. Then set the reply time in `SECURITY.md` to one you can keep.

### Dependency Updates

Every dependency is pinned to an exact version, and nothing newer than **3 days** is installed. Freshly published releases are where compromised packages tend to land, and most are caught and pulled within hours to days; waiting means you never install them.

```
  new release on npm
          │
          ▼
  younger than 3 days? ── yes ──▶ pnpm refuses it (ERR_PNPM_NO_MATURE_MATCHING_VERSION)
          │ no
          ▼
  Dependabot PR, Monday, grouped ──▶ CI runs every check ──▶ a person reviews and merges

  urgent security fix, released today
  advisory ──▶ a person approves ──▶ minimumReleaseAgeExclude: pkg@x.y.z ──▶ CI ──▶ merge
                                       └── removed once x.y.z is 3 days old
```

- **pnpm enforces it on every install** (`minimumReleaseAge` in `pnpm-workspace.yaml`, in minutes), including transitive dependencies. `minimumReleaseAgeStrict: true` makes a version that is too new fail the install, with a message naming the setting, instead of falling back to it. pnpm 12 also rejects a misspelled setting, so a typo can't silently turn the rule off.
- **Install scripts are opt-in** (`allowBuilds` in `pnpm-workspace.yaml`). pnpm fails the install when a dependency has a script nobody approved or denied.
- **Dependabot proposes the updates** (`.github/dependabot.yml`): weekly, only once a release is 3 days old (`cooldown`), with minor and patch dev-tool updates grouped into one PR and GitHub Actions into another. It keeps the GitHub Actions pinned to exact commits. Keep its `cooldown` equal to pnpm's `minimumReleaseAge`, or it opens PRs that pnpm refuses, and keep `days` in `.github/zizmor.yml` equal to both: zizmor fails CI on a shorter cooldown. It is built into GitHub: no app to install.
- **Some versions are raised by hand**, because Dependabot doesn't read them: the Node version in `devEngines.runtime`, the zizmor version in `ci.yml` (`ZIZMOR_VERSION`), and `@types/node` majors. Keep `@types/node` on the matching Node major: 26.x in the root `package.json` (the pinned `devEngines.runtime`) and 24.x in packages (the oldest `engines.node`). Raise each with its Node version.
- **CI audits every install** (`pnpm audit --audit-level high`) against the npm registry's advisories, and fails on high or critical ones.

**An urgent security fix released today.** The rule allows one exact version through, never a whole package:

1. Confirm the fix is real: a published advisory (GitHub advisory or CVE), a matching changelog entry, and the usual maintainer as publisher.
2. Add that exact version to `pnpm-workspace.yaml`, with the advisory linked, then install and run the full checks:
   ```yaml
   minimumReleaseAgeExclude:
     - somepkg@1.2.4 # https://github.com/advisories/GHSA-...
   ```
3. Remove the entry once the version is 3 days old.

GitHub's Dependabot alerts and security-fix PRs don't cover these dependencies yet: GitHub's dependency graph reads only the first of the two documents in pnpm 12's `pnpm-lock.yaml`, which lists pnpm itself ([dependabot-core#15904](https://github.com/dependabot/dependabot-core/issues/15904)). The `pnpm audit` step in CI is what catches a known vulnerability; run `pnpm audit` to see every advisory, at any severity.

## Versioning

Template releases are tagged at the repository level (`v1.0.0`, `v1.1.0`). A template is copied once and never upgraded in place, so versions mark milestones, not compatibility:

- **MAJOR**: a new generation of the template (package manager, build system or layout changes)
- **MINOR**: meaningful changes, including major tool upgrades and workflow changes
- **PATCH**: fixes and documentation

Package versions start at `0.1.0`; customize them after creating your project. Each release's notes list **Changes for existing projects**, including anything breaking.

See [AGENTS.md](AGENTS.md) for detailed versioning strategy.

## License

[MIT](LICENSE)