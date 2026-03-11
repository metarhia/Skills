# Metarhia Skills

Agent skills for the [Metarhia](https://github.com/metarhia) tech stack: reusable instructions for AI assistants and IDEs (Cursor, WS Code, Claude Code, Windsurf, etc.) — code style, patterns, architecture, and domain knowledge.

## Installation

Add to any Metarhia, JavaScript, TypeScript (or Node.js) project:

```bash
npm install metarhia-skills --save-dev
```

## Usage

From your project root, link skills into your IDE so it can use them:

```bash
npx metarhia-skills cursor
```

This creates symlinks under `.cursor/skills` and `.agents/skills` pointing at `node_modules/metarhia-skills/skills`, so the IDE loads the skills without copying files.

**Supported IDEs:**

| IDE      | Command                        | Target dirs                        |
| -------- | ------------------------------ | ---------------------------------- |
| Cursor   | `npx metarhia-skills cursor`   | `.cursor/skills`, `.agents/skills` |
| Claude   | `npx metarhia-skills claude`   | `.claude/skills`                   |
| Windsurf | `npx metarhia-skills windsurf` | `.windsurf/skills`                 |
| GitHub   | `npx metarhia-skills github`   | `.github/skills`                   |
| All      | `npx metarhia-skills all`      | All of the above                   |

Run once after install (or after updating the package). Existing symlinks are left as-is; only missing skill links are added.

## Skills

Skills live under `skills/<name>/SKILL.md`. They cover:

- **Code style**: JavaScript/TypeScript (eslint-config-metarhia), formatting, naming
- **Patterns**: GoF, GRASP, data access, error handling, security, concurrency, async
- **Architecture**: OOP, functional, procedural, SOLID, highload, distributed systems
- **Platform**: Node.js, databases, networking, V8 optimizations, web UI, metarhia stack

See the [skills](skills/) directory for the full list.

## Development

Clone the repo and link skills into this repo for local testing:

```bash
git clone https://github.com/metarhia/Skills.git
cd Skills
npm install
npm run link:cursor   # or link:claude, link:windsurf, link:github, link:all
```

Scripts:

- `npm run lint` — check code style
- `npm run fix` — auto-fix with ESLint and Prettier
- `npm run link:<ide>` — same as `npx metarhia-skills <ide>` when run from repo root

## License & Contributors

Copyright (c) 2026 [Metarhia contributors](https://github.com/metarhia/Skills/graphs/contributors).
Metarhia Skills is [MIT licensed](./LICENSE).\
Metarhia Skills is a part of [Metarhia](https://github.com/metarhia) technology stack.
