'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { getSkillFolders, ensureSkillLinks } = require('../scripts/link-ide.js');

const packageRoot = path.resolve(__dirname, '..');

test('package root has scripts/ and package.json', () => {
  assert.ok(fs.existsSync(path.join(packageRoot, 'scripts')));
  assert.ok(fs.existsSync(path.join(packageRoot, 'package.json')));
});

test('getSkillFolders returns sorted array of directory names', () => {
  const skillsPath = path.join(packageRoot, 'skills');
  const names = getSkillFolders(skillsPath);
  assert.ok(Array.isArray(names));
  assert.ok(names.length > 0);
  const sorted = [...names].sort();
  assert.deepStrictEqual(names, sorted);
  assert.ok(names.includes('javascript-code-style'));
});

test('ensureSkillLinks creates symlinks for skill folders', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'metarhia-skills-'));
  try {
    const skillsPath = path.join(tmp, 'skills');
    const skillName = 'sample-skill';
    const skillPath = path.join(skillsPath, skillName);
    fs.mkdirSync(skillPath, { recursive: true });

    const targetDir = '.cursor/skills';
    const result = ensureSkillLinks(tmp, skillsPath, [skillName], targetDir);

    assert.ok(result.created);
    const linkPath = path.join(tmp, targetDir, skillName);
    const stat = fs.lstatSync(linkPath);
    assert.ok(stat.isSymbolicLink());
    const target = fs.readlinkSync(linkPath);
    const resolved = path.resolve(path.dirname(linkPath), target);
    assert.strictEqual(resolved, skillPath);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('ensureSkillLinks skips existing correct symlink', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'metarhia-skills-'));
  try {
    const skillsPath = path.join(tmp, 'skills');
    const skillName = 'sample-skill';
    const skillPath = path.join(skillsPath, skillName);
    fs.mkdirSync(skillPath, { recursive: true });

    const targetDir = '.cursor/skills';
    ensureSkillLinks(tmp, skillsPath, [skillName], targetDir);
    const result = ensureSkillLinks(tmp, skillsPath, [skillName], targetDir);

    assert.ok(!result.created);
    assert.ok(result.message.includes('No new links'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
