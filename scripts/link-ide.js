#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const IDE_TARGETS = {
  cursor: ['.cursor/skills', '.agents/skills'],
  claude: ['.claude/skills'],
  windsurf: ['.windsurf/skills'],
  github: ['.github/skills'],
};

const getPackageRoot = () => path.resolve(path.dirname(__filename), '..');

const getProjectRoot = () => process.cwd();

const getSkillFolders = (skillsPath) =>
  fs
    .readdirSync(skillsPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

const ensureSkillLinks = (projectRoot, skillsSource, skillNames, targetDir) => {
  const messages = [];
  let anyCreated = false;
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
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    const relativeTarget = path.relative(path.dirname(linkPath), sourcePath);
    fs.symlinkSync(relativeTarget, linkPath, 'dir');
    const linkMsg =
      'Linked ' +
      targetDir +
      '/' +
      name +
      ' -> ' +
      'metarhia-skills/skills/' +
      name;
    messages.push(linkMsg);
    anyCreated = true;
  }

  return {
    created: anyCreated,
    message:
      messages.length > 0
        ? messages.join('\n')
        : `No new links under ${targetDir}`,
  };
};

const main = () => {
  const packageRoot = getPackageRoot();
  const skillsPath = path.join(packageRoot, 'skills');

  if (!fs.existsSync(skillsPath) || !fs.statSync(skillsPath).isDirectory()) {
    const msg =
      'metarhia-skills: no "skills" directory in package. ' +
      'Run from project that has metarhia-skills installed.';
    console.error(msg);
    process.exit(1);
  }

  const ide = (process.argv[2] || process.env.LINK_IDE || '').toLowerCase();
  const ideNames = Object.keys(IDE_TARGETS);

  if (!ide) {
    console.error('Usage: npx metarhia-skills <ide>');
    console.error('  ide: ' + ideNames.join(' | ') + ' | all');
    console.error('Example: npx metarhia-skills cursor');
    process.exit(1);
  }

  const projectRoot = getProjectRoot();
  const skillNames = getSkillFolders(skillsPath);
  const dirsToLink =
    ide === 'all'
      ? ideNames.flatMap((name) => IDE_TARGETS[name])
      : IDE_TARGETS[ide];

  if (!dirsToLink) {
    console.error('Unknown ide: ' + ide);
    console.error('  ide: ' + ideNames.join(' | ') + ' | all');
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
    } catch (err) {
      console.error(`Failed to link ${targetDir}:`, err.message);
      process.exit(1);
    }
  }
};

main();
