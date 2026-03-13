#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const PROJECT_DIR = process.cwd();
const PACKAGE_DIR = path.resolve(path.dirname(__filename), '..');
const SKILLS_PATH = path.join(PACKAGE_DIR, 'skills');

const IDE_TARGETS = {
  cursor: '.cursor',
  claude: '.claude',
  windsurf: '.windsurf',
  vscode: '.github',
};

const detectTargetDirs = () => {
  const found = [];
  for (const base of Object.values(IDE_TARGETS)) {
    const basePath = path.join(PROJECT_DIR, base);
    if (fs.existsSync(basePath)) found.push(base + '/skills');
  }
  return found;
};

const getSkillFolders = () => {
  const entries = fs.readdirSync(SKILLS_PATH, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory());
  const names = dirs.map((e) => e.name);
  return names.sort();
};

const ensureSkillLinks = (skillNames, targetDir, dirs = {}) => {
  const { root = PROJECT_DIR, source = SKILLS_PATH } = dirs;
  const messages = [];
  let created = false;
  const parentPath = path.join(root, targetDir);

  if (!fs.existsSync(parentPath)) {
    fs.mkdirSync(parentPath, { recursive: true });
    messages.push(`Created ${targetDir}`);
  } else {
    const stat = fs.lstatSync(parentPath);
    if (stat.isSymbolicLink()) {
      return {
        created: false,
        message: `${targetDir} is a symlink; remove it to use skill links`,
      };
    }
    const entries = fs.readdirSync(parentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isSymbolicLink()) continue;
      const linkPath = path.join(parentPath, entry.name);
      const resolved = path.resolve(parentPath, fs.readlinkSync(linkPath));
      if (resolved.startsWith(source) && !fs.existsSync(resolved)) {
        fs.unlinkSync(linkPath);
        messages.push(`Removed stale link ${targetDir}/${entry.name}`);
      }
    }
  }

  for (const name of skillNames) {
    const sourcePath = path.join(source, name);
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
      continue;
    }

    const linkPath = path.join(parentPath, name);
    try {
      const stat = fs.lstatSync(linkPath);
      if (stat.isSymbolicLink()) {
        const target = fs.readlinkSync(linkPath);
        const resolved = path.resolve(path.dirname(linkPath), target);
        if (resolved === path.resolve(sourcePath)) continue;
      }
      messages.push(`${targetDir}/${name} exists and is not a symlink; skip`);
      continue;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const relativeTarget = path.relative(path.dirname(linkPath), sourcePath);
    fs.symlinkSync(relativeTarget, linkPath, 'dir');
    const skillSuffix = 'metaskills/skills/' + name;
    const linkMsg = `Linked ${targetDir}/${name} -> ${skillSuffix}`;
    messages.push(linkMsg);
    created = true;
  }
  let message = messages.join('\n');
  if (!message) message = 'No new links under ' + targetDir;

  return { created, message };
};

const main = () => {
  if (!fs.existsSync(SKILLS_PATH)) {
    const msg = 'metaskills: no "skills" directory in package.';
    console.error(msg);
    process.exit(1);
  }

  const ide = (process.argv[2] || process.env.LINK_IDE || '').toLowerCase();
  const ideNames = Object.keys(IDE_TARGETS);

  const doRunLink = (selected) => {
    const skillNames = getSkillFolders();
    const toTarget = (base) => base + '/skills';
    const dirsToLink = [];
    if (selected === 'all') {
      dirsToLink.push(...Object.values(IDE_TARGETS).map(toTarget));
    } else if (IDE_TARGETS[selected]) {
      dirsToLink.push(toTarget(IDE_TARGETS[selected]));
    }

    if (dirsToLink.length === 0) {
      console.error('Unknown ide: ' + selected);
      process.exit(1);
    }

    for (const targetDir of dirsToLink) {
      try {
        const result = ensureSkillLinks(skillNames, targetDir);
        console.log(result.message);
      } catch (error) {
        console.error(`Failed to link ${targetDir}:`, error.message);
        process.exit(1);
      }
    }
  };

  if (ide) return void doRunLink(ide);

  const detectedDirs = detectTargetDirs();
  if (detectedDirs.length > 0) {
    const skillNames = getSkillFolders();
    for (const targetDir of detectedDirs) {
      try {
        const result = ensureSkillLinks(skillNames, targetDir);
        console.log(result.message);
      } catch (error) {
        console.error(`Failed to link ${targetDir}:`, error.message);
        process.exit(1);
      }
    }
    return;
  }

  const menu = ideNames.map((name, i) => `${i + 1}) ${name}`).join(' ');
  const allIdx = ideNames.length + 1;
  console.log('\nSelect IDE: ' + menu + ' ' + allIdx + ') all\n');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('> ', (answer) => {
    rl.close();
    const n = parseInt(answer, 10);
    if (n >= 1 && n <= allIdx) {
      const selected = n === allIdx ? 'all' : ideNames[n - 1];
      doRunLink(selected);
    } else {
      console.error('Invalid choice');
      process.exit(1);
    }
  });
};

if (require.main === module) main();

module.exports = {
  getSkillFolders,
  ensureSkillLinks,
};
