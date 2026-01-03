#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, 'client', 'dist');
const dest = path.resolve(__dirname, 'server', 'public');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDir(from, to) {
  fs.cpSync(from, to, { recursive: true, force: true });
}

function main() {
  if (!fs.existsSync(src)) {
    console.error(`Missing frontend build at ${src}. Run "npm --prefix client run build" first.`);
    process.exit(1);
  }

  ensureDir(dest);
  fs.rmSync(dest, { recursive: true, force: true });
  ensureDir(dest);
  copyDir(src, dest);
  console.log(`Synced frontend assets from ${src} -> ${dest}`);
}

main();
