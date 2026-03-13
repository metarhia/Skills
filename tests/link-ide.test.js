'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { ensureSkillLinks } = require('../scripts/link-ide.js');

const packageRoot = path.resolve(__dirname, '..');

test('package root has scripts/ and package.json', () => {
  assert.ok(fs.existsSync(path.join(packageRoot, 'scripts')));
  assert.ok(fs.existsSync(path.join(packageRoot, 'package.json')));
});

test('ensureSkillLinks creates metaskills symlink', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'metaskills-'));
  try {
    const skillsPath = path.join(tmp, 'skills');
    fs.mkdirSync(skillsPath, { recursive: true });

    const targetDir = '.cursor/skills';
    const overrides = { root: tmp, source: skillsPath };
    const result = ensureSkillLinks(targetDir, overrides);

    assert.ok(result.created);
    const linkPath = path.join(tmp, targetDir, 'metaskills');
    const stat = fs.lstatSync(linkPath);
    assert.ok(stat.isSymbolicLink());
    const resolved = path.resolve(
      path.dirname(linkPath),
      fs.readlinkSync(linkPath),
    );
    assert.strictEqual(resolved, skillsPath);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('ensureSkillLinks skips existing correct symlink', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'metaskills-'));
  try {
    const skillsPath = path.join(tmp, 'skills');
    fs.mkdirSync(skillsPath, { recursive: true });

    const targetDir = '.cursor/skills';
    const overrides = { root: tmp, source: skillsPath };
    ensureSkillLinks(targetDir, overrides);
    const result = ensureSkillLinks(targetDir, overrides);

    assert.ok(!result.created);
    assert.ok(result.message.includes('Already linked'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
