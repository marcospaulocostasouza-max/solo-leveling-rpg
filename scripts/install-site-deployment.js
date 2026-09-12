'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const site = path.join(root, 'apps', 'site');

if (!process.argv.includes('--check')) {
    for (const cwd of [root, site]) {
        console.log(`[INSTALL SITE] npm ci: ${path.relative(root, cwd) || 'repository root'}`);
        const result = process.platform === 'win32'
            ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm ci'], { cwd, stdio: 'inherit', windowsHide: true })
            : spawnSync('npm', ['ci'], { cwd, stdio: 'inherit' });
        if (result.error) throw result.error;
        if (result.status !== 0) process.exit(result.status || 1);
    }
}

// Check resolution from the importing modules, rather than only from apps/site.
for (const [file, dependency] of [
    ['packages/database/postgres.js', 'pg'],
    ['apps/bot/src/core/database.js', 'sqlite3'],
    ['cardinal/knowledge/store.js', 'sqlite3'],
    ['cardinal/memory/store.js', 'sqlite3'],
    ['cardinal/world/index.js', 'sqlite3'],
    ['apps/site/package.json', 'next']
]) {
    createRequire(path.join(root, file)).resolve(dependency);
    console.log(`[INSTALL SITE] OK: ${dependency} from ${file}`);
}
