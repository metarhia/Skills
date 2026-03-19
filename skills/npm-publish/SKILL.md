---
name: npm-publish
description: Prepare an npm package for publishing. Handles version bump, CHANGELOG update, typings check, test run, README refresh, package.json audit, and npm pack verification. Use when the user asks to prepare a release, bump version, publish a package, or do release prep.
---

# npm Publish Preparation

Systematic workflow for preparing an npm package for a new release. Every step must pass before proceeding to the next.

## Step 0: Gather Release Intent

Ask the user (use AskQuestion if available):

1. **Version bump type**: patch / minor / major / explicit version / prerelease tag
2. **Prerelease label** (if any): e.g. `alpha`, `beta`, `rc`, `prerelease`
3. **Confirm changelog entries**: ask if the `[Unreleased]` section in CHANGELOG is complete, or if the user wants to draft entries from recent commits

If the user already specified intent (e.g. "prepare 4.1.0 release"), skip the question and proceed.

## Step 1: Pre-flight Checks

Run:

```bash
npm i             # install deps
npm test          # must exit 0 (lint + types + tests)
```

Then in parallel: `npm outdated` and `npm audit` (report to user).

If `npm test` fails, stop and fix issues before continuing.

## Step 2: Version Bump

### Read current version from `package.json`

Compute the new version based on user intent and semver rules:

- **patch**: `1.2.3` → `1.2.4`
- **minor**: `1.2.3` → `1.3.0`
- **major**: `1.2.3` → `2.0.0`
- **prerelease**: `1.2.3` → `1.2.4-<label>.0`, or `1.2.4-beta.0` → `1.2.4-beta.1`
- **Removing prerelease tag**: `4.0.3-prerelease` → `4.0.3` (just strip the suffix)

Update `"version"` in `package.json` using StrReplace (not `npm version` — we manage changelog manually).

## Step 3: Update CHANGELOG.md

The changelog uses:

- **Sections**: `## [Unreleased]` at top; `## [Version] - YYYY-MM-DD` for releases (date in ISO 8601)
- **Order**: newest first; every version gets an entry
- **Types of changes**: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. Group same-type changes under each
- **Entries**: bullet lists; past tense; capitalise first letter; human-readable, curated (no raw git diffs)
- **Links**: footnote-style link block at bottom: `[unreleased]: ...`, `[version]: ...` (GitHub compare URLs)
- **Principles**: changelog is for humans; omit empty sections; call out breaking changes and deprecations clearly

### 3a: Detect changelog structure

Read the full `CHANGELOG.md`. Identify:

- The `[Unreleased]` section
- The previous version heading (to derive the comparison base)
- The links block at the bottom of the file
- The GitHub repo URL from the existing links

### 3b: Create the new version entry

**Always** draft entries from `git log` since the last tag (fallback to `HEAD~20` if no tags):

```bash
git log $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~20")..HEAD --oneline
```

Convert commits into changelog bullets: group by type (Added, Changed, Fixed, Removed, Deprecated, Security), past tense, capitalise. Merge with any existing `[Unreleased]` content if the user added manual entries.

Create the new version section with today's date (ISO 8601):

```markdown
## [Unreleased][unreleased]

## [NEW_VERSION][] - YYYY-MM-DD

- Entry description
- Another entry
```

### 3c: Update comparison links

At the bottom of `CHANGELOG.md`, update the `[unreleased]` link and add the new version link:

```markdown
[unreleased]: https://github.com/OWNER/REPO/compare/vNEW_VERSION...HEAD
[NEW_VERSION]: https://github.com/OWNER/REPO/compare/vPREVIOUS_VERSION...vNEW_VERSION
```

Keep all existing links intact below.

## Step 4: TypeScript Declarations

If `.d.ts` files exist:

1. Run `npx tsc` (or the project's `types` script) — must pass with no errors
2. Verify the `.d.ts` public API surface matches the actual exports:
   - Read the main JS entry point's `module.exports` or `export` statements
   - Read the `.d.ts` file
   - Confirm every exported class, function, type, and method is declared
   - Confirm no private/internal fields leak into the declarations
3. If the release includes API changes, update the `.d.ts` accordingly

## Step 5: README & License Review

**Update year** in `LICENSE` and `README.md` (copyright line) to the current year if changed.

Scan `README.md` for staleness:

1. **Usage examples**: do they match the current API? Especially constructor options, method signatures
2. **Badges**: do version badge URLs point to the correct package name?
3. **Configuration tables**: do option names, types, and defaults match the source code?
4. **API reference**: if the README has an API section, verify it against actual exports

Only edit if something is factually wrong or outdated. Don't rewrite style or add unsolicited content.

## Step 6: Package Audit

### 6a: Verify `package.json` fields

Check these fields are correct:

- `"main"` / `"module"` / `"exports"` — points to existing files
- `"types"` — points to the `.d.ts` file
- `"files"` — includes all necessary files, excludes test/config files; cross-check with `.npmignore` if present
- `"engines"` — matches the CI matrix (`.github/workflows/`)
- `"keywords"` — no typos, relevant terms
- `"license"`, `"repository"`, `"homepage"` — valid

### 6b: Dry-run pack

```bash
npm pack --dry-run
```

Review the file list:

- Source files are included
- Type definitions are included
- Test files, configs, CI files are excluded
- No unexpected large files

Report the packed size to the user.

## Step 7: Final Verification

Run the full test suite one more time after all edits:

```bash
npm test
```

Must exit 0. If it fails, fix and re-run.

## Step 8: Summary & Next Steps

Present a summary to the user:

```
Release preparation complete:
  Package:  <name>
  Version:  <old> → <new>
  Tests:    ✓ passing
  Types:    ✓ valid
  Packed:   <N> files, <size>
```

Then list remaining manual steps:

1. `git add -A && git commit -m "Release vX.Y.Z"` (or ask the user if they want you to commit)
2. `git tag vX.Y.Z`
3. `git push && git push --tags`
4. `npm publish` (or `npm publish --tag <label>` for prereleases)

Do NOT run `npm publish` or `git push` automatically — always let the user do it or explicitly confirm.

## Step 9: Reinstall Dependencies

After all steps run to refresh package-lock.json:

```bash
npm i
```
