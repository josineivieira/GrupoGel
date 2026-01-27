#!/usr/bin/env node

const server = require('./src/server');

console.log('Server wrapper loaded, process staying alive...');

// Keep process alive
setInterval(() => {}, 1000);
