# TypeScript Monorepo Starter

[![Node.js](https://img.shields.io/badge/node-%3E%3D24-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.26.2-orange.svg)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern TypeScript monorepo starter template with best practices for scalable projects.

## Features

- 📦 [PNPM](https://pnpm.io/) for fast, disk-efficient package management
- 🏎️ [Turborepo](https://turbo.build/repo) for high-performance build system
- 📦 [tsup](https://tsup.egoist.dev/) for fast, zero-config bundling with TypeScript support
- 🔍 [Biome](https://biomejs.dev/) for fast linting and formatting
- ⚙️ [TypeScript](https://www.typescriptlang.org/) 6, with Node LTS and browser presets
- 🧪 [Vitest](https://vitest.dev/) for unit testing
- 🌐 [Playwright](https://playwright.dev/) browser tests with [axe](https://github.com/dequelabs/axe-core-npm) accessibility checks
- 📏 [size-limit](https://github.com/ai/size-limit) budgets that fail CI when a browser build grows
- ⚡ [Volta](https://volta.sh/) for Node.js and package manager version management
- 📝 [Commitlint](https://commitlint.js.org/) with Conventional Commits
- 🔄 [Changesets](https://github.com/changesets/changesets) for versioning and changelogs
- 🚀 GitHub Actions for CI/CD with npm publishing
- 🪝 [Husky](https://typicode.github.io/husky/) for Git hooks

## Project Structure

```
ts-monorepo/
├── .changeset/          # Changesets configuration
├── .github/             # GitHub Actions workflows
├── .husky/              # Git hooks
├── packages/            # All packages
│   ├── core/            # Core package
│   ├── utils/           # Utilities package
│   ├── feature-a/       # Feature package
│   ├── browser-example/ # Browser library example (script tag + ES module)
│   └── cli-example/     # Command-line package example (bin, Node target)
├── biome.json           # Biome configuration
├── commitlint.config.js # Commitlint configuration
├── package.json         # Root package.json
├── pnpm-workspace.yaml  # PNPM workspace config
├── playwright.config.ts # Browser tests (packages/*/e2e/*.e2e.ts)
├── tsconfig.json        # Base TypeScript config (Node)
├── tsconfig.browser.json # Browser TypeScript config (DOM, ES2020)
├── turbo.json           # Turborepo config
└── vitest.config.ts     # Vitest config
```

## Getting Started

### Prerequisites

- [Volta](https://volta.sh/) for Node.js and pnpm version management (recommended)
  - Or [Node.js](https://nodejs.org/) (v24 LTS or higher) and [PNPM](https://pnpm.io/) (v10 or higher)

### Installation

1. Clone this repository
   ```bash
   git clone https://github.com/yourusername/ts-monorepo.git
   cd ts-monorepo
   ```

2. Install Node.js and pnpm (if using Volta, this happens automatically)
   ```bash
   # With Volta (recommended)
   volta install node@24.12.0 pnpm@10.26.2

   # Or install manually
   # Install Node.js 24+ from https://nodejs.org
   # Install pnpm: npm install -g pnpm
   ```

3. Install dependencies
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

This template uses [tsup](https://tsup.egoist.dev/) for fast, zero-config bundling with TypeScript support. All packages are built as ESM modules.

```bash
# Build all packages
pnpm build

# Build a specific package
pnpm -F "@monorepo/core" build

# Watch mode for development
pnpm -F "@monorepo/core" dev
```

**Build Configuration:**
- **Output**: ESM modules (`dist/index.js`)
- **Types**: Generated automatically (`dist/index.d.ts`)
- **Source maps**: Included for debugging
- **Tree shaking**: Enabled for optimal bundle size

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
2. On npmjs.com, open the package's **Settings → Trusted publishing** and add a GitHub Actions publisher: your user or organization, this repository, workflow file `release.yml`, environment `npm`. A new trusted publisher must complete its first publish within 2 days. If npm won't let you configure a package that doesn't exist yet, publish the first version by hand (`npm publish --access public`, with two-factor authentication), then add the publisher.
3. In the same settings, under **Publishing access**, choose **Require two-factor authentication and disallow tokens**. Trusted publishing keeps working; a leaked token can't publish.
4. In GitHub, under **Settings → Actions → General**, enable **Allow GitHub Actions to create and approve pull requests**, so the workflow can open the version PR. Optionally, add required reviewers to the `npm` environment (**Settings → Environments**) to approve each publish.

How a release runs (`.github/workflows/release.yml`), after CI passes on `main`, against the exact commit CI tested:

1. **select-mode** reads the changesets: version, publish, or nothing.
2. **version** (changesets present) opens or updates the "version packages" PR. It can write to the repository but cannot reach npm.
3. **pack** (version PR merged) builds, runs the package checks, and packs tarballs, with read-only access.
4. **publish** publishes those tarballs. It is the only job that can get npm credentials, and it never builds.

## Working with this Monorepo

### Adding a New Package

1. Create a new folder in the `packages` directory
2. Add a `package.json` with appropriate dependencies
3. Add a `tsconfig.json` that extends the root `tsconfig.json` (Node) or `tsconfig.browser.json` (browser)
4. Update root `tsconfig.json` with path mappings for the new package

### Package Interdependencies

Packages can depend on each other using the workspace protocol:

```json
"dependencies": {
  "@monorepo/core": "workspace:*"
}
```

### Browser Libraries

`packages/browser-example` shows the setup for a library that runs in web pages. Copy it as a starting point.

- **Two builds** (`tsup.config.ts`): an ES module with types for bundlers, and a minified script-tag build (`dist/index.global.js`) that exposes a global.
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

- **A `bin` entry** in `package.json` points at `dist/cli.js`. The source starts with `#!/usr/bin/env node`; tsup keeps that line and marks the built file executable.
- **Node build target** (`tsup.config.ts`): `platform: 'node'`, `target: 'node24'`, ES module output.
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

### Dependency Updates

Every dependency is pinned to an exact version, and nothing newer than **14 days** is installed. Freshly published releases are where compromised packages tend to land; waiting gives the ecosystem time to catch them.

- **pnpm enforces it on every install** (`minimumReleaseAge` in `pnpm-workspace.yaml`), including transitive dependencies. A version that is too new fails to install, with a message naming the setting.
- **Renovate proposes the updates** (`renovate.json`): weekly, only once a release is 14 days old, grouped into one PR for GitHub Actions and one for dev tools. It also keeps the GitHub Actions pinned to exact commits and refreshes the lockfile weekly.

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