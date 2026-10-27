# TypeScript Monorepo Starter

[![Node.js](https://img.shields.io/badge/node-%3E%3D26-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-12.15.0-orange.svg)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern TypeScript monorepo starter template with best practices for scalable projects.

## Features

- 📦 [PNPM](https://pnpm.io/) 12 for package management, and to pin the Node.js version
- 🏎️ [Turborepo](https://turbo.build/repo) for high-performance build system
- 🛠️ The TypeScript compiler (`tsc`) builds every package; [Rollup](https://rollupjs.org/) builds the script-tag file
- 🔍 [Biome](https://biomejs.dev/) for fast linting and formatting
- ⚙️ [TypeScript](https://www.typescriptlang.org/) 7, with Node and browser presets
- 🟢 Published packages support Node.js 24 and later, tested on Linux, macOS and Windows
- 🧪 [Vitest](https://vitest.dev/) for unit testing
- 🌐 [Playwright](https://playwright.dev/) browser tests with [axe](https://github.com/dequelabs/axe-core-npm) accessibility checks
- 📏 [size-limit](https://github.com/ai/size-limit) budgets that fail CI when a browser build grows
- 📝 [Commitlint](https://commitlint.js.org/) with Conventional Commits
- 🔄 [Changesets](https://github.com/changesets/changesets) for versioning and changelogs
- 🚀 GitHub Actions for CI/CD with npm publishing
- 🪝 [Husky](https://typicode.github.io/husky/) for Git hooks

## Project Structure

```
ts-monorepo/
├── .changeset/          # Changesets configuration
├── .github/             # Workflows, issue forms, PR template
├── .husky/              # Git hooks
├── packages/            # All packages
│   ├── core/            # Core package
│   ├── utils/           # Utilities package
│   ├── feature-a/       # Feature package
│   ├── browser-example/ # Browser library example (script tag + ES module)
│   └── cli-example/     # Command-line package example (bin, Node target)
├── .editorconfig        # Editor defaults matching Biome's formatter
├── AGENTS.md            # Instructions for coding agents (CLAUDE.md imports it)
├── biome.json           # Biome configuration
├── commitlint.config.js # Commitlint configuration
├── package.json         # Root package.json
├── pnpm-workspace.yaml  # PNPM workspace config (3-day minimum release age)
├── renovate.json        # Dependency update PRs (once releases are 3 days old)
├── SECURITY.md          # How to report a vulnerability privately
├── playwright.config.ts # Browser tests (packages/*/e2e/*.e2e.ts)
├── tsconfig.json        # Base TypeScript config (Node)
├── tsconfig.browser.json # Browser TypeScript config (DOM, ES2020)
├── turbo.json           # Turborepo config
└── vitest.config.ts     # Vitest config
```

## How It Fits Together

### Packages and build order

```
  ┌──────────┐
  │   core   │ ─────────────────────┐
  └────┬─────┘                      │
       ▼                            ▼
  ┌──────────┐               ┌─────────────┐
  │  utils   │ ────────────▶ │  feature-a  │
  └──────────┘               └─────────────┘

  browser-example     cli-example        no internal dependencies
```

An arrow points from a package to a package that depends on it. `pnpm build` builds `core`, then `utils`, then `feature-a` (Turborepo's `dependsOn: ["^build"]`); the standalone packages build alongside. Typecheck reads each dependency's built `dist/`, so build before typechecking. Unit tests import sources directly, through the aliases in `vitest.config.ts`.

### What a build produces

```
every package
  src/*.ts ──── tsc -p tsconfig.json ────▶ dist/*.js     ES modules, one per source file
                                           dist/*.d.ts   types, with declaration maps

browser-example, one more step
  dist/index.js ──── Rollup + terser ────▶ dist/index.global.js  (minified, window.BrowserExample)

cli-example, one more step
  dist/cli.js ─────── mark executable ───▶ command (keeps #!/usr/bin/env node)
```

### Where versions come from

```
package.json
  devEngines.runtime   node 26.12.1 ──┬──▶ pnpm: downloads it and runs every script on it
                                      ├──▶ setup-node (CI): installs the same version
                                      ├──▶ npm and npx: refuse to run on any other version
                                      └──▶ @types/node 26.x in the root package.json (Renovate rule)
  packages/*/package.json
    engines.node       >=24 ──────────┬──▶ CI: unit tests on Node 24 and 26, Linux, macOS, Windows
                                      ├──▶ tsconfig.json: @tsconfig/node24 (no newer JS APIs)
                                      └──▶ @types/node 24.x in packages (Renovate rule)
  packageManager       pnpm@12.15.0 ──┬──▶ pnpm: switches itself to this version
                                      └──▶ pnpm/action-setup (CI)

pnpm-workspace.yaml
  minimumReleaseAge    4320 (3 days) ◀──── must equal ────▶ renovate.json "3 days"
```

Each version is set in one place, and the tools on the right read it from there. Some stay in step by other means: Renovate holds `@types/node` to the matching Node major (26 for the root's tooling, 24 for the packages), and the two age settings are kept equal by hand. The repository is developed on Node 26; the packages it publishes run on Node 24 and later.

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/) 12. It downloads the pinned Node.js version itself.
- Any Node.js with npm, to install pnpm. After that, commands run through pnpm use the pinned Node.js 26 (`devEngines.runtime` in `package.json`).

### Installation

1. Clone this repository
   ```bash
   git clone https://github.com/yourusername/ts-monorepo.git
   cd ts-monorepo
   ```

2. Install pnpm 12, once per machine
   ```bash
   npm install -g pnpm@12.15.0
   ```
   pnpm 12 ships a native binary that its install script puts in place. pnpm 10 can't switch itself to 12, so upgrade it this way.

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
pnpm -F "@monorepo/core" test:watch
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
pnpm -F "@monorepo/core" build

# Watch mode for development
pnpm -F "@monorepo/core" dev
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

#### Setting Up npm Publishing

Packages publish with **npm trusted publishing**: GitHub Actions proves its identity to npm for each release, so no npm token is stored anywhere, and each version gets a **provenance** statement linking it to the commit and workflow that built it (for public packages from public repositories).

By default, all packages are `"private": true`, so the release workflow does nothing. To publish a package:

1. In its `package.json`, set `"private": false` and add `"publishConfig": { "access": "public" }`. Use a name that's free on npm, or a scope you own.
2. On npmjs.com, open the package's **Settings → Trusted publishing** and add a GitHub Actions publisher: your user or organization, this repository, workflow file `ci.yml`, environment `npm`. (Publishing runs in `release.yml`, which `ci.yml` calls, and npm checks the calling workflow.) A new trusted publisher must complete its first publish within 2 days. If npm won't let you configure a package that doesn't exist yet, publish the first version by hand (`npm publish --access public`, with two-factor authentication), then add the publisher.
3. In the same settings, under **Publishing access**, choose **Require two-factor authentication and disallow tokens**. Trusted publishing keeps working; a leaked token can't publish.
4. In GitHub, under **Settings → Actions → General**, enable **Allow GitHub Actions to create and approve pull requests**, so the workflow can open the version PR. Optionally, add required reviewers to the `npm` environment (**Settings → Environments**) to approve each publish.

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
3. **pack** (version PR merged) builds, runs the package checks, and packs tarballs, with read-only access.
4. **publish** publishes those tarballs. It is the only job that can get npm credentials, and it never builds.

## Working with this Monorepo

### Adding a New Package

Copy the example closest to what you're building (`core` for a plain library, `browser-example` for web pages, `cli-example` for a command), then rename it. Keep `"type": "module"`, the `exports` map, `"files": ["dist"]` and the `check:package` script: `pnpm check:packages` fails without them. Run `pnpm install` to link it. If other packages import it from source, add a `vitest.config.ts` alias and a root `tsconfig.json` path.

### Package Interdependencies

Packages can depend on each other using the workspace protocol:

```json
"dependencies": {
  "@monorepo/core": "workspace:*"
}
```

### Browser Libraries

`packages/browser-example` shows the setup for a library that runs in web pages. Copy it as a starting point.

- **Two builds**: `tsc` writes the ES module and its types for bundlers. [Rollup](https://rollupjs.org/) (`rollup.config.js`) then bundles that output into a minified script-tag file (`dist/index.global.js`) that exposes a global. Rollup reads JavaScript, so it needs no TypeScript plugin, only terser to minify.
- **Nothing runs at import.** Work starts when the page calls the API, so importing the package is always safe.
- **Isolation and safety:** the example renders in a shadow root, so host page CSS can't restyle it, and treats text as text, never HTML.
- **Browser tests** in `e2e/*.e2e.ts` load the built script tag into a real page, including an [axe](https://github.com/dequelabs/axe-core-npm) accessibility check.
- **Size budget** in the package's `size-limit` field. CI fails if the script-tag build grows past it.

```bash
# One-time: install the browser Playwright uses
pnpm exec playwright install chromium

# Build, then run browser tests and the size budget
pnpm build
pnpm test:browser
pnpm size
```

### Command-Line Packages

`packages/cli-example` shows the setup for a package people run as a command (`npx your-tool`). Copy it as a starting point.

- **A `bin` entry** in `package.json` points at `dist/cli.js`. The source starts with `#!/usr/bin/env node`; `tsc` keeps that line, and the build script marks the file executable (with Node's `fs.chmodSync`, so it also builds on Windows).
- **Runs on Node 24 and later**: `engines.node` is `>=24`, the root `tsconfig.json` extends `@tsconfig/node24` so code can't use newer JavaScript APIs, and the package's `@types/node` is 24.x so it can't use newer Node APIs. CI runs the tests on Node 24 and 26.
- **Logic separate from the process.** `src/index.ts` exports `run(argv, io)`, which returns an exit code instead of exiting, so it is unit-tested directly. `src/cli.ts` is the two-line entry point that calls it.
- **No argument-parsing dependency:** Node's built-in `util.parseArgs`, with unknown options reported as errors (exit 2) instead of crashes.
- **A test of the built command** (`test/bin.test.ts`) runs `dist/cli.js` the way a user would: shebang, executable bit, output, exit codes. It fails with a clear message if you haven't built first.

```bash
pnpm build
node packages/cli-example/dist/cli.js greet --name you
pnpm test
```

### Package Checks

`pnpm check:packages` packs every package the way it would be published and checks the result. CI runs it on every push.

- **[publint](https://publint.dev)** checks the package layout: that `exports`, `types` and `bin` point at files that exist in the tarball, and that nothing unneeded ships.
- **[Are The Types Wrong](https://arethetypeswrong.github.io)** checks that the types resolve for each way someone can import the package (Node ES modules and bundlers; the packages are ESM-only, so CommonJS resolution is not required).

Every package lists `"files": ["dist"]`. Without it, what ships depends on the tool: `npm pack` follows `.gitignore` and leaves out `dist/`, while `pnpm pack` includes it along with build logs and caches.

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
  Renovate PR, Monday, grouped ──▶ CI runs every check ──▶ a person reviews and merges

  urgent security fix, released today
  advisory ──▶ a person approves ──▶ minimumReleaseAgeExclude: pkg@x.y.z ──▶ CI ──▶ merge
                                       └── removed once x.y.z is 3 days old
```

- **pnpm enforces it on every install** (`minimumReleaseAge` in `pnpm-workspace.yaml`, in minutes), including transitive dependencies. `minimumReleaseAgeStrict: true` makes a version that is too new fail the install, with a message naming the setting, instead of falling back to it. pnpm 12 also rejects a misspelled setting, so a typo can't silently turn the rule off.
- **Install scripts are opt-in** (`allowBuilds` in `pnpm-workspace.yaml`). pnpm fails the install when a dependency has a script nobody approved or denied.
- **Renovate proposes the updates** (`renovate.json`): weekly, only once a release is 3 days old, grouped into one PR for GitHub Actions and one for dev tools. It also keeps the GitHub Actions pinned to exact commits and refreshes the lockfile weekly. Keep its `minimumReleaseAge` equal to pnpm's, or it opens PRs that pnpm refuses. It keeps `@types/node` on the matching Node major: 26.x in the root `package.json` (the pinned `devEngines.runtime`) and 24.x in packages (the oldest `engines.node`). Raise each with its Node version.

**An urgent security fix released today.** The rule allows one exact version through, never a whole package:

1. Confirm the fix is real: a published advisory (GitHub advisory or CVE), a matching changelog entry, and the usual maintainer as publisher.
2. Add that exact version to `pnpm-workspace.yaml`, with the advisory linked, then install and run the full checks:
   ```yaml
   minimumReleaseAgeExclude:
     - somepkg@1.2.4 # https://github.com/advisories/GHSA-...
   ```
3. Remove the entry once the version is 3 days old.

With Dependabot alerts on (**Settings → Advanced Security**), Renovate opens security-fix PRs right away, outside its weekly schedule, labelled `security`. A person still adds the exception in that PR.

To turn Renovate on, install the [Renovate GitHub App](https://github.com/apps/renovate) for the repository. Its first PR is an onboarding check you merge to start.

## Versioning

Template releases are tagged at the repository level (`v1.0.0`, `v1.1.0`). A template is copied once and never upgraded in place, so versions mark milestones, not compatibility:

- **MAJOR**: a new generation of the template (package manager, build system or layout changes)
- **MINOR**: meaningful changes, including major tool upgrades and workflow changes
- **PATCH**: fixes and documentation

Package versions start at `0.1.0`; customize them after creating your project. Each release's notes list **Changes for existing projects**, including anything breaking.

See [AGENTS.md](AGENTS.md) for detailed versioning strategy.

## License

[MIT](LICENSE)