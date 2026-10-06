# Agent guide

This repository owns the shared development standard consumed by the Action
template. Its public interface is the package exports and peer dependency
contract. Keep configurations as executable ESM JavaScript with JSDoc and a JSON
TypeScript base; consumers install them directly from Git without a build step.

## Start and finish a change

1. Inspect the branch, staged and unstaged changes, package scripts, engines and
   affected configurations. Preserve unrelated work. Use the runtime required by
   package.json; the host default may be newer and incompatible.
2. Load the applicable skills below before editing. Read the affected behavior
   and its tests, then implement the smallest complete change.
3. Run the relevant verification described below. Review the full diff,
   generated files and package contents before an English Conventional Commit.
4. When pushing is authorized, inspect the resulting CI, Version and both CodeQL
   jobs for the pushed commit. Report links, failures and unresolved risks.
   Local success alone does not establish remote CI success.

## Required skills

- **Workflows:** read
  [github-actions-hardening](.agents/skills/github-actions-hardening/SKILL.md)
  before creating, editing or reviewing workflows, permissions or trust
  boundaries.
- **Runtime upgrades:** read
  [github-actions-runtime-upgrade-conventions](.agents/skills/github-actions-runtime-upgrade-conventions/SKILL.md)
  before changing external Action versions or the supported runtime.
- **CodeQL:** read [codeql](.agents/skills/codeql/SKILL.md) before changing
  analysis, investigating alerts or troubleshooting a scan.
- **Agent instructions:** read
  [writing-for-agents](.agents/skills/writing-for-agents/SKILL.md) before
  editing AGENTS.md or skills. Keep generally required steps here and
  specialized procedures behind explicit pointers.

[Skill provenance and updates](.agents/README.md) records the vendored sources.
Read referenced material when its branch applies. Reconcile skill examples with
current official documentation; repository policy requires full commit SHA pins
with release comments for external Actions, including first-party Actions.
User-authorized implementation includes applying reviewed hardening fixes.

## Standards and exceptions

The checked-in configurations and package scripts are authoritative. Preserve
strict checks across source, tests, scripts and configuration code. Fix the code
when a preset exposes a real problem; assess rule changes when upgrading
presets. Use narrow, explained lint exceptions only when the rule permits them
and review confirms the reason. Type assertions and non-null assertions remain
forbidden except for the explicitly allowed const assertions; do not bypass this
policy with suppression comments or disabled rules. Tests follow the same
standard.

Keep lockfiles synchronized with manifests using npm. Preserve the TypeScript
compatibility range and matching Vitest/coverage versions. Node types follow the
supported runtime major; major updates require a deliberate runtime migration.
Evaluate audit findings by advisory, dependency path and reachable behavior.
Record unresolved risks and a concrete recheck condition rather than hiding them
with overrides or treating a clean production audit as a clean development tree.

## Workflow and release invariants

Use unprivileged pull_request checks for contributed code, minimal per-job token
permissions, and checkout without persisted credentials in checking jobs. Keep
write credentials limited to the tag job. Pass untrusted data through env
variables and quote shell expansions instead of interpolating expressions into
scripts. Preserve SHA pins and Dependabot updates when editing workflows.

CodeQL analyzes JavaScript/TypeScript and Actions with security-and-quality.
Review findings individually; retain coverage of tests, scripts and configs.
Exclude generated artifacts and vendored skills, not inconvenient findings.
Copilot Autofix suggestions require review and the same tests as human changes.

Version tags identify pushed main tips by reachable commit count. Keep history
append-only and tags immutable. Versioning does not certify CI success; verify
checks before consuming a tag. Keep package publication and paid automation out
of routine changes unless explicitly requested.

## Verify shared configuration changes

Run npm ci and npm run check on the supported runtime. The tests exercise strict
rejections, allowed syntax, inherited TypeScript settings, formatting, coverage
configuration and JSDoc types from an installed package. When changing a rule,
add a behavioral case if the existing tests do not distinguish the intended
acceptance and rejection. Preserve the installed-consumer test: imports that
work inside this repository can lose types across the package boundary.

Run npm pack --dry-run and confirm every export is included, while agent skills,
tests and local artifacts stay out of the package. The files allowlist is part
of that contract. Keep project paths relative to the consumer, not this package.

Before adopting a changed standard, check the sibling typescript-action consumer
with the new package. After an authorized push, wait for this repository's CI,
CodeQL and Version tag, then update the consumer's Git tag and lockfile and run
its complete checks. A successful package check alone does not prove consumer
compatibility. Restore any temporary local dependency before committing.
