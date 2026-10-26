# AGENTS.md

This is a TypeScript monorepo starter template: create a repository from it, then customize. `CLAUDE.md` imports this file, so these instructions are the single source for every agent.

## Project Overview

A modern TypeScript monorepo using pnpm workspaces, Turborepo for build orchestration, Biome for linting/formatting, Vitest for testing, and Changesets for versioning. By default, all packages are private to prevent accidental publishing when users clone the template.

**Tech Stack:**

- Package manager: pnpm 10.26.2 (pinned via `packageManager` and Volta)
- Language: TypeScript 6.0.3, with Node (`tsconfig.json`) and browser (`tsconfig.browser.json`) presets
- Build system: Turborepo
- Linter/Formatter: Biome
- Testing: Vitest 5 (run from root), Playwright + axe for browser packages
- Size budgets: size-limit, per browser package
- CI/CD: GitHub Actions (separate CI and Release workflows)
- Versioning: Changesets
- Node.js: >= 24 (LTS; Volta pins 24.12.0, and CI reads the same version from package.json)

## Repository Structure

```
packages/
├── core/          # Core package with tests
├── utils/         # Utilities (depends on core)
├── feature-a/     # Feature package (depends on core and utils)
├── browser-example/ # Browser library: ES module + script-tag build, e2e tests, size budget
└── cli-example/     # Command-line package: bin entry, Node target, test that runs the built command
```

Each package has its own `package.json`, `tsconfig.json`, and `src/` directory. All packages are currently marked as `"private": true`.

## Setup Commands

```bash
# Install dependencies (required first step)
pnpm install

# Build all packages (required before typecheck)
pnpm build

# Lint all packages
pnpm lint

# Type check all packages (must run AFTER build)
pnpm typecheck

# Run all tests (runs from root using centralized vitest config)
pnpm test

# Watch mode for tests
pnpm test:watch

# Browser tests (Playwright; run after build; first time: pnpm exec playwright install chromium)
pnpm test:browser

# Size budgets for browser builds (run after build)
pnpm size

# Pack each package as it would publish and check layout and types (publint, attw)
pnpm check:packages

# Clean all build outputs
pnpm clean
```

## Development Workflow

### Working on a specific package

```bash
# Build a specific package
pnpm -F "@monorepo/core" build

# Watch mode for development
pnpm -F "@monorepo/core" dev

# Run tests for a specific package (note: tests run from root)
cd packages/core && pnpm test:watch
```

### Important: Build Order

Packages with dependencies must be built in order. Turborepo handles this automatically, but be aware:

- `@monorepo/core` has no dependencies (builds first)
- `@monorepo/utils` depends on `@monorepo/core`
- `@monorepo/feature-a` depends on both `@monorepo/core` and `@monorepo/utils`

**Critical:** Always run `pnpm build` before `pnpm typecheck` because TypeScript needs the built `.d.ts` files from dependencies.

## Testing Instructions

Tests use Vitest with a centralized configuration at the root (`vitest.config.ts`).

- Test files: `**/*.test.ts` or `**/*.spec.ts` in `packages/*/src/`
- Run from root: `pnpm test` (NOT `turbo test`)
- The test script in root package.json runs `vitest run`, not `turbo test`
- Unit tests live next to source (`packages/*/src/*.test.ts`); `packages/cli-example/test/bin.test.ts` runs the *built* command, so `pnpm build` must run before `pnpm test`

**When adding tests:**

1. Place test files next to source files: `src/myModule.test.ts`
2. Import from the source file: `import { MyClass } from './myModule'`
3. Run `pnpm test` from root to verify

## Before Calling Work Done

Run the same sequence CI runs, in this order, and report any failure with its output:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm build
pnpm typecheck
pnpm test
pnpm size
pnpm check:packages
pnpm test:browser
```

A partial run is not done. If you changed a workflow, also lint it with [actionlint](https://github.com/rhysd/actionlint).

## Code Style

- TypeScript strict mode enabled
- Biome handles linting and formatting (config in `biome.json`)
- Run `pnpm lint` to check, `pnpm format` to auto-fix
- Conventional Commits enforced via Commitlint
- Git hooks (Husky): **pre-commit** runs Biome with fixes on staged `.ts`/`.js` files and re-stages them, so a commit can rewrite your files; then `pnpm typecheck` (needs a prior `pnpm build`). **commit-msg** runs commitlint.

**Commit message format:**

```
type(scope): description

# Examples:
feat(core): add new authentication method
fix(utils): resolve import path issue
chore: update dependencies
```

## CI/CD Workflows

### CI Workflow (`.github/workflows/ci.yml`)

- Triggers: Push to main OR Pull Request to main
- Node version: read from `package.json` (Volta pins 24.12.0)
- Steps: Install → Lint → Build → Typecheck → Test → Size budget → Package checks → Browser tests
- Least-privilege `permissions`; every action pinned to a commit SHA with the version in a comment
- **Important:** Build runs BEFORE typecheck (required for type definitions)

### Release Workflow (`.github/workflows/release.yml`)

- Triggers: After CI succeeds on main branch (workflow_run)
- Four jobs: select-mode → version (opens the version PR) or pack → publish
- Publishes with npm trusted publishing (OIDC): no npm token exists; only the `publish` job has `id-token: write`
- **By default, does nothing** because all packages are private
- To enable publishing: see README "Setting Up npm Publishing" (trusted publisher on npmjs.com, `npm` environment)

## Adding a New Package

Copy the example closest to what you're building, then rename it:

- `packages/core/`: a plain library (ES module and types)
- `packages/browser-example/`: a library that runs in web pages (script-tag build, browser tests, size budget)
- `packages/cli-example/`: a command people run (`bin`, Node target, test of the built command)

Every package keeps these, or `pnpm check:packages` fails or it publishes broken:

- `"type": "module"` and an `exports` map whose `types` and `import` point into `dist/`
- `"files": ["dist"]`: without it, `npm pack` follows `.gitignore` and ships no `dist/`
- `"private": true` until you intend to publish
- the `check:package` script (`publint --strict && attw --pack . --profile esm-only`)

Then run `pnpm install` to link it, and add a `vitest.config.ts` alias and root `tsconfig.json` path if other packages import it from source.

## Package Dependencies

Use workspace protocol for internal dependencies:

```json
"dependencies": {
  "@monorepo/core": "workspace:*"
}
```

Turborepo automatically builds dependencies in the correct order.

## Dependencies and the Lockfile

- Pin exact versions (no `^` or `~`), and pick releases at least 14 days old; pnpm enforces the age.
- Read the `pnpm-lock.yaml` diff before committing. Adding or pinning one dependency should not change unrelated
  versions; if it does, restore the lockfile and make the narrower change.
- To deliberately re-resolve everything, delete `node_modules` (root and packages) as well as the lockfile.
  Otherwise pnpm rebuilds from its hidden copy in `node_modules/.pnpm` and nothing is re-resolved.

## Versioning and Changesets

1. Make changes to packages
2. Run `pnpm changeset` to document changes
3. Select packages that changed and semantic version bump
4. Commit the changeset file
5. On merge to main, Changesets creates a version PR
6. Merge version PR to publish (only if packages are not private)

## Publishing to npm

**Template ships with all packages private by default.**

To publish a package:

1. In `packages/your-package/package.json`:
   - Change `"private": true` to `"private": false`
   - Add `"publishConfig": { "access": "public" }`
2. Ensure unique package name or use scoped name
3. Add a trusted publisher for the package on npmjs.com (repository, `release.yml`, environment `npm`)
4. Release workflow will publish on next version bump; never add an `NPM_TOKEN` secret

## Common Patterns

### Running commands in all packages

```bash
pnpm -r <command>  # Run in all packages
turbo <command>    # Run via Turborepo with caching
```

### Filtering specific packages

```bash
pnpm -F "@monorepo/core" build
pnpm --filter "@monorepo/*" test
```

### Checking package locations

```bash
pnpm list --depth 0  # See all workspace packages
```

## Troubleshooting

**TypeScript errors about missing types:**

- Run `pnpm build` first to generate `.d.ts` files
- Check that dependencies are listed in package.json
- Verify workspace links: `pnpm install`

**Tests not found:**

- Tests must match `packages/**/*.{test,spec}.ts` pattern
- Run from root: `pnpm test` (NOT from package directory with turbo)

**Build failures:**

- Check dependency order (core → utils → feature-a)
- Clear cache: `pnpm clean` then `pnpm build`
- Remove node_modules: `pnpm clean && pnpm install`

**`ERR_PNPM_NO_MATURE_MATCHING_VERSION`:**

- A version you asked for, or one a dependency needs, was published less than 14 days ago.
- Choose an older version, or wait until it ages. Don't add it to `minimumReleaseAgeExclude`.
- If the young version is already in the lockfile, re-resolve (see "Dependencies and the Lockfile").

**CI failures on typecheck:**

- Ensure build step runs before typecheck in workflow
- Local: `pnpm build && pnpm typecheck`

## Security Considerations

- Never commit `.env` files or secrets
- No npm token is stored: publishing uses npm trusted publishing (OIDC), with provenance
- All packages default to private to prevent accidental publishing
- Review dependencies regularly: `pnpm audit`
- Nothing newer than 14 days installs: `minimumReleaseAge` in `pnpm-workspace.yaml`. Don't bypass it with
  `minimumReleaseAgeExclude` to get a just-released version; wait for it to age.
- Renovate (`renovate.json`) proposes updates once they're 14 days old and keeps GitHub Actions pinned to commit SHAs

## Versioning Strategy

Versions apply to the **template repository** as a whole, not to its packages.

### Repository Versioning

A template is copied once; each project then lives on its own and nothing upgrades in place. So template versions mark milestones, not compatibility. Git tags use the format `vMAJOR.MINOR.PATCH` (e.g., `v1.0.0`, `v1.1.0`):

- **MAJOR**: a new generation of the template, with a different shape
  - Example: changing the package manager, the build system, or the repository layout
- **MINOR**: a release of meaningful changes, including major tool upgrades and workflow changes
  - Example: new example packages, new CI checks, TypeScript or Node major upgrades, a redesigned release workflow
- **PATCH**: fixes and documentation
  - Example: correcting CI configuration, updating the README

Every release's notes include **Changes for existing projects**: what a project created from the previous version would change to match. Read that section before porting changes into a project; it is where breaking changes are called out.

### Package Versioning

Individual packages remain at `0.1.0` by default:
- Packages are private by default (`"private": true`)
- Users customize package names and versions after cloning
- Version according to [Semantic Versioning](https://semver.org/) once users start developing

### Pre-release Versions

Use pre-release tags for experimental features:
- `v2.0.0-alpha.1` - Early testing, unstable
- `v2.0.0-beta.1` - Feature complete, testing phase
- `v2.0.0-rc.1` - Release candidate, final testing

## Template Customization

When using this template:

1. Update package names in all `package.json` files (change `@monorepo/*` scope)
2. Update repository URL in root `package.json`
3. Update LICENSE file with your information
4. Customize README.md for your project
5. Decide which packages should be public vs private
6. To publish, set up npm trusted publishing (README "Setting Up npm Publishing"); never add an npm token secret
7. Start versioning your packages from `0.1.0` according to your development needs

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
