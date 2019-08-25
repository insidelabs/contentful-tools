#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const stdin = process.openStdin();

let data = '';

stdin.on('data', chunk => {
    data += chunk;
});

stdin.on('end', () => {
    data = data.replace(/^>.*$/gm, '').trim();
    const pack = JSON.parse(data)[0];
    const packageJson = require('../packages/store/package.json');
    const lockJson = require('../packages/generator/package-lock.json');

    const storeDep = lockJson.dependencies['@contentful-tools/store'];
    storeDep.version = pack.version;
    storeDep.integrity = pack.integrity;
    storeDep.resolved = `https://registry.npmjs.org/@contentful-tools/store/-/store-${pack.version}.tgz`;
    storeDep.requires = packageJson.dependencies;

    const lockJsonPath = path.resolve(__dirname, '../packages/generator/package-lock.json');
    fs.writeFileSync(lockJsonPath, JSON.stringify(lockJson, null, 2) + '\n');

    process.exit(0);
});
