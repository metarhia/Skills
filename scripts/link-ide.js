#!/usr/bin/env node
'use strict';

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const PROJECT_DIR = process.cwd();
const SKILLS_DIR = path.join(PROJECT_DIR, 'node_modules/metaskills/skills');

const IDE_TARGETS = {
  cursor: '.cursor',
  claude: '.claude',
  windsurf: '.windsurf',
  vscode: '.github',
  gemini: '.gemini',
  antigravity: '.agents',
};

const detectTargetDirs = () => {
  const found = [];
  for (const base of Object.values(IDE_TARGETS)) {
    const basePath = path.join(PROJECT_DIR, base);
    if (!fs.existsSync(basePath)) continue;
    if (base === '.github' || base === '.agents') {
      const skillsPath = path.join(basePath, 'skills');
      if (!fs.existsSync(skillsPath)) continue;
    }
    found.push(base + '/skills');
  }
  return found;
};

const ensureSkillLinks = (targetDir, dirs = {}) => {
  const { root = PROJECT_DIR, source = SKILLS_DIR } = dirs;
  const parentPath = path.join(root, targetDir);

  if (!fs.existsSync(parentPath)) {
    fs.mkdirSync(parentPath, { recursive: true });
  } else {
    const stat = fs.lstatSync(parentPath);
    if (stat.isSymbolicLink()) {
      return {
        created: false,
        message: `${targetDir} is a symlink; remove it to use skill links`,
      };
    }
  }

  const linkPath = path.join(parentPath, 'metaskills');
  try {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink()) {
      const resolved = path.resolve(parentPath, fs.readlinkSync(linkPath));
      if (resolved === path.resolve(source)) {
        return { created: false, message: 'Already linked ' + targetDir };
      }
    }
    return {
      created: false,
      message: `${targetDir}/metaskills exists and is not a symlink; skip`,
    };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const relativeTarget = path.relative(parentPath, source);
  fs.symlinkSync(relativeTarget, linkPath, 'dir');
  return {
    created: true,
    message: `Linked ${targetDir}/metaskills -> metaskills/skills`,
  };
};

const addToIgnoreFile = (filePath, entry) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  if (lines.includes(entry)) return;
  const sep = content.endsWith('\n') ? '' : '\n';
  const updated = content + sep + entry + '\n';
  fs.writeFileSync(filePath, updated);
};

const ensureIgnored = () => {
  const entry = '*/skills/metaskills';
  addToIgnoreFile(path.join(PROJECT_DIR, '.gitignore'), entry);
  addToIgnoreFile(path.join(PROJECT_DIR, '.npmignore'), entry);
};

const ensureInstalled = () => {
  const pkgPath = path.join(PROJECT_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) return;
  const localPkg = path.join(PROJECT_DIR, 'node_modules', 'metaskills');
  if (fs.existsSync(localPkg)) return;
  console.log('Installing metaskills as dev dependency...');
  execSync('npm install metaskills --save-dev', {
    cwd: PROJECT_DIR,
    stdio: 'inherit',
  });
};

const main = () => {
  ensureInstalled();
  ensureIgnored();

  if (!fs.existsSync(SKILLS_DIR)) {
    console.error('metaskills: node_modules/metaskills/skills not found.');
    process.exit(1);
  }
  const source = SKILLS_DIR;

  const ide = (process.argv[2] || process.env.LINK_IDE || '').toLowerCase();
  const ideNames = Object.keys(IDE_TARGETS);

  const runLink = (targetDir) => {
    try {
      const result = ensureSkillLinks(targetDir, { source });
      console.log(result.message);
    } catch (error) {
      console.error(`Failed to link ${targetDir}:`, error.message);
      process.exit(1);
    }
  };

  const doRunLink = (selected) => {
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

    for (const targetDir of dirsToLink) runLink(targetDir);
  };

  if (ide) return void doRunLink(ide);

  const detectedDirs = detectTargetDirs();
  if (detectedDirs.length > 0) {
    for (const targetDir of detectedDirs) runLink(targetDir);
    return;
  }

  const menu = ideNames.map((name, i) => `${i + 1}) ${name}`).join(' ');
  const allIdx = ideNames.length + 1;
  console.log('\nSelect IDE or AI Agent: ' + menu + ' ' + allIdx + ') all\n');
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

module.exports = { ensureSkillLinks };
