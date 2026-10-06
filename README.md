# GitHub Actions dev tools

Shared strict ESLint, Prettier, TypeScript and Vitest configurations for Node.js
24 GitHub Actions. Configurations are plain ESM JavaScript and JSON. Install the
repository directly from GitHub; no compilation, registry account or publication
workflow is required.

## Requirements

Use Node.js `>=24.12.0 <25` and npm. Consumers provide compatible ESLint,
Prettier, TypeScript and Vitest versions as peer dependencies, plus
`@types/node` 24.x and `@vitest/coverage-v8` matching their installed Vitest
version. TypeScript stays on 6.0.x while typescript-eslint requires a version
below 6.1.

The package owns the ESLint preset dependencies. Consumers do not need separate
`@eslint/js`, `typescript-eslint` or `eslint-config-prettier` declarations.

## Connect an Action

Install a reviewed commit using HTTPS:

```sh
npm install --save-dev '@mstrict-actions/dev-tools@git+https://github.com/mstrict-actions/dev-tools.git#<commit-sha>'
```

Commit both `package.json` and `package-lock.json`. Replace the commit SHA and
refresh the lockfile to adopt a new standard. Fixed commits keep existing
Actions stable while the shared configuration changes. Local development can use
`npm install --save-dev ../dev-tools`; restore the Git dependency before commit.

Create `eslint.config.mjs`:

```js
import { createActionConfig } from '@mstrict-actions/dev-tools/eslint'

export default createActionConfig({ rootDirectory: import.meta.dirname })
```

The factory needs the consumer root, not the package directory. It checks
TypeScript and JavaScript with type information; the project must include those
files in its TypeScript configuration.

Create `tsconfig.json`:

```json
{
  "extends": "@mstrict-actions/dev-tools/tsconfig.json",
  "include": ["src/**/*.ts", "tests/**/*.ts", "scripts/**/*.ts", "*.mjs"]
}
```

Add `"prettier": "@mstrict-actions/dev-tools/prettier"` to `package.json`. Keep
a local `.prettierignore` for generated and project-specific files.

Create `vitest.config.mjs`:

```js
export { default } from '@mstrict-actions/dev-tools/vitest'
```

The shared test configuration uses `tests/**/*.test.ts`, measures `src/**/*.ts`
except `src/index.ts`, and requires 100% statements, branches, functions and
lines. Coverage reports use the consumer's `coverage/` directory. Run tools from
the Action root. Project-specific configurations may import and extend the
exported configurations; paths must refer to that project.

Use ordinary commands: `eslint --max-warnings 0 .`, `prettier --check .`,
`tsc --noEmit`, `vitest run` and `vitest run --coverage`. ESLint no longer needs
a flag for native TS config loading. Builds, launchers, Action tests, workflow
files and Action metadata remain in the consumer repository.

## Standard

The TypeScript configuration includes strict indexed access, exact optional
properties, bracket access for dictionaries, complete return paths, override
checks, and errors for fallthrough, unreachable code and unused labels.

ESLint uses strict and stylistic typed presets. Conditions must be boolean;
promises require awaiting, returning or a rejection handler. Explicit `any`,
unsafe operations, ordinary type assertions and non-null assertions are errors.
`as const` and `satisfies` remain allowed. Async functions must perform async
work. Switches must cover a union or enum, or provide a default. Use type
imports, camelCase values, PascalCase types, `const` and braces.

Every TypeScript function, including callbacks, requires an explicit return
type. JavaScript configurations use JSDoc and TypeScript `checkJs` instead of TS
syntax; all other applicable typed rules remain enabled. The base config reads
one level of installed JavaScript dependencies (`maxNodeModuleJsDepth: 1`) so
consumers retain the exported JSDoc types without generated declaration files.
TypeScript checks global names in both languages. Formatting uses two spaces,
single quotes, no semicolons, multiline trailing commas, an 80-column target, LF
and wrapped Markdown.

Local lint exceptions require an explanation and review. Never disable the
assertion bans. Unused disable comments are errors. Strict presets can change
outside major releases; review changes with dependency updates.

## Develop and validate

```sh
npm ci
npm run check
npm pack --dry-run
```

CI runs formatting, typed linting, JavaScript type checking and consumer-project
tests on Node 24. Tests verify strict rule enforcement, external project roots,
TypeScript inheritance, formatting, coverage settings and packaged exports.
There is no build or publish job. Dependabot checks npm and GitHub Actions
weekly, with Vitest and its coverage provider grouped together.

## Version tags

Every push to `main` runs the Version workflow and tags the pushed tip commit as
`0.N`, without a `v` prefix. `N` is the number of commits reachable from that
commit (`git rev-list --count`), including merged history. The workflow fetches
full history so the count does not depend on a shallow checkout. A push with
several commits tags its tip; existing history is not tagged retroactively.

Rerunning the workflow succeeds when the tag already points to the same commit.
A conflicting tag fails the workflow and is never moved. Keep `main` history
append-only so version numbers remain meaningful. Versioning runs independently
of CI; check CI before adopting a tag. Package versions and GitHub Releases are
not changed. Tags created with `GITHUB_TOKEN` do not trigger another workflow
run.

Consumers can select a reviewed version tag instead of a commit SHA:

```sh
npm install --save-dev '@mstrict-actions/dev-tools@git+https://github.com/mstrict-actions/dev-tools.git#0.3'
```

Commit the updated manifest and lockfile together. Existing consumers pinned to
a commit remain on that commit until explicitly updated.

## License

MIT. See [LICENSE](LICENSE).

## Agent-assisted development and security

Start agent work with [AGENTS.md](AGENTS.md). Required skills are vendored in
`.agents/skills/`; [provenance](.agents/README.md) records their source
revisions and update procedure. The instructions distinguish this repository's
checks from consumer and remote CI validation.

External workflow Actions use full commit SHAs with release comments; Dependabot
updates these pins weekly. Node type major updates require a runtime migration.
CodeQL scans JavaScript/TypeScript and GitHub Actions workflows with the
`security-and-quality` suite on pull requests, main pushes, a weekly schedule
and manual dispatch. Tests, scripts and configurations remain in scope;
generated artifacts and vendored skills are excluded. Autofix suggestions need
review and validation. Repository security settings must also be enabled when
creating a new repository from this template.
