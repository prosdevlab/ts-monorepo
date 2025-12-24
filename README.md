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
- ⚙️ [TypeScript](https://www.typescriptlang.org/) configured with modern Node LTS settings
- 🧪 [Vitest](https://vitest.dev/) for unit testing
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
│   └── feature-a/       # Feature package
├── biome.json           # Biome configuration
├── commitlint.config.js # Commitlint configuration
├── package.json         # Root package.json
├── pnpm-workspace.yaml  # PNPM workspace config
├── tsconfig.json        # Base TypeScript config
├── tsup.config.ts       # tsup build configuration
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

By default, all packages are marked as `"private": true` to prevent accidental publishing. To publish packages to npm:

1. In the package's `package.json`, change `"private": true` to `"private": false`
2. Add a `publishConfig` section:
   ```json
   "publishConfig": {
     "access": "public"
   }
   ```
3. Generate an npm access token with publish permissions from [npmjs.com](https://www.npmjs.com/settings/~/tokens)
4. Add the token as a repository secret named `NPM_TOKEN` in GitHub (Settings → Secrets and variables → Actions)
5. Ensure your package names are unique in the npm registry or use a scoped package name

**Note:** The release workflow only runs after the CI workflow succeeds on the `main` branch.

## Working with this Monorepo

### Adding a New Package

1. Create a new folder in the `packages` directory
2. Add a `package.json` with appropriate dependencies
3. Add a `tsconfig.json` that extends from the root
4. Update root `tsconfig.json` with path mappings for the new package

### Package Interdependencies

Packages can depend on each other using the workspace protocol:

```json
"dependencies": {
  "@monorepo/core": "workspace:*"
}
```

## Versioning

This template follows [Semantic Versioning](https://semver.org/) at the repository level:

- **Git tags**: `v1.0.0`, `v1.1.0`, `v2.0.0` (for template releases)
- **Package versions**: Remain at `0.1.0` by default (customize after cloning)

**Version bumps:**
- **MAJOR**: Breaking changes to template structure or tooling
- **MINOR**: New features, examples, or improvements
- **PATCH**: Bug fixes, documentation updates

See [AGENTS.md](AGENTS.md) for detailed versioning strategy.

## License

[MIT](LICENSE)