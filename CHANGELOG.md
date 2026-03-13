# Changelog

## [Unreleased][unreleased]

## [1.0.1][] - 2026-03-14

- Auto-install as dev dependency when running via `npx`
- Add `*/skills/metaskills` to `.gitignore` and `.npmignore` automatically

## [1.0.0][] - 2026-03-13

- Support for Cursor, Claude, Windsurf, and VS Code
- npm package with `npx metaskills` CLI to link skills into IDEs
- Interactive menu when run without IDE argument
- 2 skills: javascript-code-style, npm-publish
- Tests for link-ide script
- Autodetect IDE dirs and link skills without a menu prompt
- Prune stale symlinks on re-run after package update

[unreleased]: https://github.com/metarhia/metaskills/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/metarhia/metaskills/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/metarhia/metaskills/releases/tag/v1.0.0
