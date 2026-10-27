# AGENTS.md

This is a TypeScript monorepo starter template: create a repository from it, then customize. `CLAUDE.md` imports this file, so these instructions are the single source for every agent.

## Project Overview

A modern TypeScript monorepo using pnpm workspaces, Turborepo for build orchestration, Biome for linting/formatting, Vitest for testing, and Changesets for versioning. Nothing publishes until a repository opts in with a repository variable: `NPM_PUBLISH` for npm, `PKG_PR_NEW` for PR previews. A copy of the template publishes nothing by accident.

**Tech Stack:**

- Package manager: pnpm 12.15.0 (pinned via `packageManager`)
- Language: TypeScript 7.0.2, with a Node 24 preset (`tsconfig.json`)
- Build: `tsc` for every package
<!-- example:web -->
- Browser package: overrides the Node preset for the DOM; Rollup bundles its script-tag file
<!-- /example:web -->
- Build system: Turborepo
- Linter/Formatter: Biome
- Testing: Vitest 5 (run from root)
<!-- example:web -->
- Browser tests: Playwright + axe; size budgets: size-limit; both owned by the browser package
<!-- /example:web -->
- CI/CD: GitHub Actions (separate CI and Release workflows)
- Versioning: Changesets
- Node.js for development: >= 26 (LTS; `devEngines.runtime` pins 26.12.1: pnpm downloads it locally, and CI reads the same version from package.json)
- Node.js for published packages: >= 24 (`engines.node`); CI runs the unit tests on Node 24 and 26, on Linux, macOS and Windows

## Repository Structure

`packages/` holds the example packages:

<!-- example:lib -->
- `packages/shared`: core service and logger, with tests
- `packages/lib`: a library package that depends on shared
<!-- /example:lib -->
<!-- example:web -->
- `packages/web`: a browser library with an ES module and script-tag build, e2e tests and a size budget
<!-- /example:web -->
<!-- example:cli -->
- `packages/cli`: a command-line package with a bin entry, a Node target and a test that runs the built command
<!-- /example:cli -->

Each package has its own `package.json`, `tsconfig.json`, and `src/` directory. Packages aren't marked private, so previews include them. Mark a package `"private": true` only if it must never be published or previewed.

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
```

<!-- example:web -->
```bash
# Browser tests (Playwright; runs through turbo, which builds first; first time: pnpm --filter @monorepo/web exec playwright install chromium)
pnpm test:browser

# Size budgets for browser builds (runs through turbo, which builds first)
pnpm size
```
<!-- /example:web -->

```bash
# Pack each package as it would publish and check layout and types (publint, attw)
pnpm check:packages

# Unused files, exports and dependencies, and undeclared dependencies (knip; no build needed)
pnpm check:unused

# Clean all build outputs
pnpm clean
```

## Development Workflow

### Working on a specific package

```bash
# Build a specific package
pnpm -F "<package-name>" build

# Watch mode for development
pnpm -F "<package-name>" dev

# Run tests for a specific package (note: tests run from root)
cd packages/<name> && pnpm test:watch
```

### Important: Build Order

<!-- example:lib -->
Packages with dependencies must be built in order. Turborepo handles this automatically, but be aware:

- `@monorepo/shared` has no dependencies (builds first)
- `@monorepo/lib` depends on `@monorepo/shared`
<!-- /example:lib -->

**Critical:** Always run `pnpm build` before `pnpm typecheck` because TypeScript needs the built `.d.ts` files from dependencies.

## Testing Instructions

Tests use Vitest with a centralized configuration at the root (`vitest.config.ts`).

- Test files: `**/*.test.ts` or `**/*.spec.ts` in `packages/*/src/`
- Run from root: `pnpm test` (NOT `turbo test`)
- The test script in root package.json runs `vitest run`, not `turbo test`
- Unit tests live next to source (`packages/*/src/*.test.ts`)
<!-- example:cli -->
- `packages/cli/test/bin.test.ts` runs the *built* command, so `pnpm build` must run before `pnpm test`
<!-- /example:cli -->

**When adding tests:**

1. Place test files next to source files: `src/myModule.test.ts`
2. Import from the source file: `import { MyClass } from './myModule'`
3. Run `pnpm test` from root to verify

## Before Calling Work Done

Run the same sequence CI runs, in this order, and report any failure with its output:

```bash
pnpm install --frozen-lockfile
pnpm audit --audit-level high
pnpm lint
pnpm check:unused
pnpm build
pnpm typecheck
pnpm test
pnpm check:packages
```

<!-- example:web -->
With the web example, also run:

```bash
pnpm size
pnpm test:browser
```
<!-- /example:web -->

<!-- example:template-only -->
In the template repository, CI also runs `node scripts/check-examples.mjs` after lint.
<!-- /example:template-only -->

A partial run is not done. If you changed a workflow, also lint it with [actionlint](https://github.com/rhysd/actionlint)
and audit it with [zizmor](https://docs.zizmor.sh/) (`zizmor .github/workflows`); CI fails on any zizmor finding.

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
feat(api): add new authentication method
fix(core): resolve import path issue
chore: update dependencies
```

## CI/CD Workflows

### CI Workflow (`.github/workflows/ci.yml`)

- Triggers: Push to main OR Pull Request to main
- Node version: read from `package.json` (`devEngines.runtime` pins 26.12.1)
- Steps: Install → Audit → Lint → Unused code → Build → Typecheck → Test → Package checks
<!-- example:web -->
- Web steps: Size budget and Browser tests
<!-- /example:web -->
<!-- example:template-only -->
- Template-only step: `node scripts/check-examples.mjs` after Lint keeps every example's lines between markers
<!-- /example:template-only -->
- `compat` job: build, then the unit tests on Node 24 and 26 × Linux, macOS, Windows. It calls Vitest with `node` directly,
  because pnpm would run it on the pinned Node 26
- Least-privilege `permissions`; every action pinned to a commit SHA with the version in a comment
- `workflows` job: zizmor (version pinned in `ZIZMOR_VERSION`, raised by hand) audits every workflow and fails on
  any finding. Suppress one only with an inline `# zizmor: ignore[rule]` and a comment saying why it doesn't apply
- A new push to a PR cancels that PR's older run; runs on `main` always finish, because they release
- `preview` job: publishes every package as an installable preview (pkg.pr.new) for pushes to main and same-repo PRs,
  and comments the install commands on the PR. Runs only when the repository variable `PKG_PR_NEW` is `true`, never
  for fork PRs, and uses no token: the pkg.pr.new GitHub App authenticates the run
- **Important:** Build runs BEFORE typecheck (required for type definitions)

### Release Workflow (`.github/workflows/release.yml`)

- Triggers: called by CI's `release` job (`workflow_call`) on pushes to main, after every other CI job passes; or a
  manual run on main. Never `workflow_run`: it also fires for fork PRs from a branch named main, running their code
  with write access
- Four jobs: select-mode → version (opens the version PR) or pack → publish
- Publishes with npm trusted publishing (OIDC): no npm token exists; only the `publish` job has `id-token: write`
- **Never publishes by default:** `pack` and `publish` run only when the repository variable `NPM_PUBLISH` is `true`
- To enable publishing: see README "Setting Up npm Publishing" (trusted publisher on npmjs.com, `npm` environment)

## Adding a New Package

Copy the example closest to what you're building, then rename it:

<!-- example:lib -->
- `packages/shared/`: a plain library (ES module and types)
<!-- /example:lib -->
<!-- example:web -->
- `packages/web/`: a library that runs in web pages (script-tag build, browser tests, size budget)
<!-- /example:web -->
<!-- example:cli -->
- `packages/cli/`: a command people run (`bin`, Node target, test of the built command)
<!-- /example:cli -->

Every package keeps these, or `pnpm check:packages` fails or it publishes broken:

- a `build` script that runs `pnpm run clean` (which deletes `dist`) and then `tsc -p tsconfig.json`. Scripts use `node -e`
  instead of `rm` or `chmod`, so they also run on Windows
- `"engines": { "node": ">=24" }` for packages that run on Node, and `@types/node` 24.x if the package needs it
- `"type": "module"` and an `exports` map whose `types` and `import` point into `dist/`
- `"files": ["dist"]`: without it, `npm pack` follows `.gitignore` and ships no `dist/`
- the `check:package` script (`publint --strict && attw --pack . --profile esm-only`)

Then run `pnpm install` to link it, and add a `vitest.config.ts` alias and root `tsconfig.json` path if other packages import it from source.

## Package Dependencies

Use workspace protocol for internal dependencies:

```json
"dependencies": {
  "@monorepo/<package>": "workspace:*"
}
```

Turborepo automatically builds dependencies in the correct order.

## Dependencies and the Lockfile

- Pin exact versions (no `^` or `~`), and pick releases at least 3 days old; pnpm enforces the age.
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
6. Merge version PR to publish (only if the repository variable `NPM_PUBLISH` is `true`)

## Publishing to npm

**The template never publishes until `NPM_PUBLISH` is set.**

To publish:

1. Give each package a name that's free on npm, or use a scope you own. Mark any package that must never publish
   `"private": true`. Add `"repository": {"type": "git", "url": "git+https://github.com/<owner>/<repo>.git", "directory": "packages/<name>"}`
   to each package you publish, because npm provenance checks it against the publishing repository
2. Set the repository variable `NPM_PUBLISH` to `true` (Settings → Secrets and variables → Actions → Variables)
3. Add a trusted publisher for the package on npmjs.com (repository, workflow `ci.yml`, environment `npm`): npm checks
   the calling workflow, and `ci.yml` calls `release.yml`
4. Release workflow will publish on next version bump; never add an `NPM_TOKEN` secret

## Common Patterns

### Running commands in all packages

```bash
pnpm -r <command>  # Run in all packages
turbo <command>    # Run via Turborepo with caching
```

### Filtering specific packages

```bash
pnpm -F "<package-name>" build
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

**`ENOEXEC` or "Failed to switch pnpm to v12":**

- A Volta-managed pnpm 10 can't switch itself to pnpm 12 (pnpm 12 is a native binary placed by an install script). Run `volta install pnpm@12.15.0`, or install pnpm with npm: `npm install -g pnpm@12.15.0`.

**`ERR_PNPM_UNSUPPORTED_ENGINE`:**

- The root `engines.pnpm` (`>=12`) refuses a pnpm older than 12 that doesn't switch itself, such as pnpm 9. Install pnpm 12 with `npm install -g pnpm@12.15.0`.
- If the message names Node.js instead, the system Node is older than 26 (`engines.node`) and pnpm ran on it. Use Node 26 or newer, or a pnpm that switches itself to 12.

**`EBADDEVENGINES` from `npm` or `npx`:**

- npm refuses to run in this repository unless Node.js matches `devEngines.runtime` exactly. Run tools through pnpm
  (`pnpm exec`, `pnpm dlx`), which uses the pinned Node.js.

**A package builds but `dist/` is empty or stale:**

- The build script deletes `dist` and runs `tsc` without `composite`. Don't re-add `composite` or `incremental`: with them, `tsc` can skip writing output after `dist` is deleted.

**`ERR_PNPM_IGNORED_BUILDS`:**

- A new dependency has an install script. Decide in `allowBuilds` (`pnpm-workspace.yaml`): `false` unless the package truly needs its script, and a person approves `true`.

**Build failures:**

- Check dependency order (dependencies build first)
- Clear cache: `pnpm clean` then `pnpm build`
- Remove node_modules: `pnpm clean && pnpm install`

**`ERR_PNPM_NO_MATURE_MATCHING_VERSION`:**

- A version you asked for, or one a dependency needs, was published less than 3 days ago.
- Choose an older version, or wait until it ages. Never add a `minimumReleaseAgeExclude` entry on your own:
  exceptions are for urgent security fixes, approved by a person (README "Dependency Updates").
- If the young version is already in the lockfile, re-resolve (see "Dependencies and the Lockfile").

**CI failures on typecheck:**

- Ensure build step runs before typecheck in workflow
- Local: `pnpm build && pnpm typecheck`

## Security Considerations

- Never commit `.env` files or secrets
- No npm token is stored: publishing uses npm trusted publishing (OIDC), with provenance
- Publishing is off until the repository variable `NPM_PUBLISH` is `true`. Previews (`PKG_PR_NEW`) never run for fork PRs
- CI fails on high or critical advisories (`pnpm audit --audit-level high`); run `pnpm audit` to see every severity.
  GitHub's Dependabot alerts can't read pnpm 12's two-document lockfile, so they miss these dependencies
- Nothing newer than 3 days installs: `minimumReleaseAge` in `pnpm-workspace.yaml` (minutes).
- Agents never add `minimumReleaseAgeExclude` entries. A person may approve one exact version for an urgent security
  fix, with the advisory linked, removed once it is 3 days old (README "Dependency Updates").
- Dependabot (`.github/dependabot.yml`) proposes updates once they're 3 days old and keeps GitHub Actions pinned to commit
  SHAs. Its `cooldown` must equal pnpm's `minimumReleaseAge`, and so must `days` in `.github/zizmor.yml`. It doesn't update `devEngines.runtime`, `ZIZMOR_VERSION` or
  `@types/node` majors: those are raised by hand.
- `@types/node` matches the Node major the code runs on (Dependabot skips its majors): 26.x in the root `package.json`, for the
  tooling on the pinned runtime; 24.x in packages, for the oldest `engines.node`. Types for a newer Node let code typecheck
  against APIs its users' Node doesn't have; raise them together.

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
- Packages aren't published by default (`NPM_PUBLISH` is unset)
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
   - Turn on private vulnerability reporting (Settings → Advanced Security), and set the reply time in `SECURITY.md`
5. Decide which packages should be public vs private
6. To publish, set up npm trusted publishing (README "Setting Up npm Publishing"); never add an npm token secret
7. Start versioning your packages from `0.1.0` according to your development needs

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
