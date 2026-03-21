# Metarhia Skills

[![ci status](https://github.com/metarhia/metaskills/workflows/Testing%20CI/badge.svg)](https://github.com/metarhia/metaskills/actions?query=workflow%3A%22Testing+CI%22+branch%3Amain)
[![snyk](https://snyk.io/test/github/metarhia/Skills/badge.svg)](https://snyk.io/test/github/metarhia/Skills)
[![npm version](https://badge.fury.io/js/metaskills.svg)](https://badge.fury.io/js/metaskills)
[![npm downloads/month](https://img.shields.io/npm/dm/metaskills.svg)](https://www.npmjs.com/package/metaskills)
[![npm downloads](https://img.shields.io/npm/dt/metaskills.svg)](https://www.npmjs.com/package/metaskills)

Agent skills for the [Metarhia](https://github.com/metarhia) tech stack: reusable instructions for AI assistants and IDEs (Cursor, VS Code, Claude Code, Windsurf, etc.) — code style, patterns, architecture, and domain knowledge.

## Usage

From your project root, link skills into your IDE so it can use them:

```bash
npx metaskills
```

This autodetects installed IDEs and creates symlinks under their skills
directories pointing at `node_modules/metaskills/skills`, so the IDE loads
the skills without copying files.

**Supported IDEs:**

| IDE        | Command                   | Target dir         |
| ---------- | ------------------------- | ------------------ |
| Autodetect | `npx metaskills`          | Autodetect or menu |
| Cursor     | `npx metaskills cursor`   | `.cursor/skills`   |
| Claude     | `npx metaskills claude`   | `.claude/skills`   |
| Windsurf   | `npx metaskills windsurf` | `.windsurf/skills` |
| VS Code    | `npx metaskills vscode`   | `.github/skills`   |
| All        | `npx metaskills all`      | All of the above   |

Run once after install or after updating the package. Stale symlinks are
removed and missing ones are added automatically.

## Skills

Skills live under `skills/<name>/SKILL.md`. They cover:

- **Code style**: JavaScript/TypeScript (eslint-config-metarhia), formatting, naming
- **Patterns**: GoF, GRASP, data access, error handling, security, concurrency, async
- **Architecture**: OOP, functional, procedural, SOLID, highload, distributed systems
- **Platform**: Node.js, databases, networking, V8 optimizations, web UI, metarhia stack

See the [skills](skills/) directory for the full list.

## Development

Clone the repo and link skills for local testing:

```bash
git clone https://github.com/metarhia/metaskills.git
cd Skills
npm install
npx metaskills   # autodetect, or npx metaskills cursor, etc.
```

Scripts:

- `npm run lint` — check code style
- `npm run fix` — auto-fix with ESLint and Prettier
- `npm t` — run tests

## License & Contributors

Copyright (c) 2026 [Metarhia contributors](https://github.com/metarhia/metaskills/graphs/contributors).
Metaskills is [MIT licensed](./LICENSE).
Metaskills is a part of [Metarhia](https://github.com/metarhia) technology stack.
