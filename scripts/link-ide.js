#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const IDE_TARGETS = {
  cursor: ['.cursor/skills', '.agents/skills'],
  claude: ['.claude/skills'],
  windsurf: ['.windsurf/skills'],
  github: ['.github/skills'],
};

const getSkillFolders = (skillsPath) => {
  const entries = fs.readdirSync(skillsPath, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory());
  const names = dirs.map((e) => e.name);
  return names.sort();
};

const ensureSkillLinks = (projectRoot, skillsSource, skillNames, targetDir) => {
  const messages = [];
  let created = false;
  const parentPath = path.join(projectRoot, targetDir);

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
  }

  for (const name of skillNames) {
    const sourcePath = path.join(skillsSource, name);
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
    const skillSuffix = 'metarhia-skills/skills/' + name;
    const linkMsg = `Linked ${targetDir}/${name} -> ${skillSuffix}`;
    messages.push(linkMsg);
    created = true;
  }
  let message = messages.join('\n');
  if (!message) message = 'No new links under ' + targetDir;

  return { created, message };
};

const main = () => {
  const packageRoot = path.resolve(path.dirname(__filename), '..');
  const skillsPath = path.join(packageRoot, 'skills');

  if (!fs.existsSync(skillsPath) || !fs.statSync(skillsPath).isDirectory()) {
    const msg = 'metarhia-skills: no "skills" directory in package.';
    console.error(msg);
    process.exit(1);
  }

  const ide = (process.argv[2] || process.env.LINK_IDE || '').toLowerCase();
  const ideNames = Object.keys(IDE_TARGETS);

  const doRunLink = (selected) => {
    const projectRoot = process.cwd();
    const skillNames = getSkillFolders(skillsPath);
    const dirsToLink =
      selected === 'all'
        ? ideNames.flatMap((name) => IDE_TARGETS[name])
        : IDE_TARGETS[selected];

    if (!dirsToLink) {
      console.error('Unknown ide: ' + selected);
      process.exit(1);
    }

    const uniqueDirs = [...new Set(dirsToLink)];

    for (const targetDir of uniqueDirs) {
      try {
        const result = ensureSkillLinks(
          projectRoot,
          skillsPath,
          skillNames,
          targetDir,
        );
        console.log(result.message);
      } catch (error) {
        console.error(`Failed to link ${targetDir}:`, error.message);
        process.exit(1);
      }
    }
  };

  if (ide) return void doRunLink(ide);

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
