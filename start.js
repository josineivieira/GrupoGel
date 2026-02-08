#!/usr/bin/env node

// Script que:
// 1. Faz build do frontend
// 2. Inicia o backend

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n╔══════════════════════════════════════╗');
console.log('║   STARTING APP - BUILD + SERVER      ║');
console.log('╚══════════════════════════════════════╝\n');

try {
  // ============ BUILD FRONTEND ============
  console.log('📦 STEP 1: Checking Frontend...\n');
  
  const frontendDir = path.join(process.cwd(), 'frontend');
  const buildDir = path.join(frontendDir, 'build');
  
  // Skip build if frontend/build already exists (Docker pre-built) and is not empty
  if (fs.existsSync(buildDir) && fs.readdirSync(buildDir).length > 0) {
    console.log('✅ Frontend already built (found pre-built assets)');
  } else if (fs.existsSync(frontendDir)) {
    // Build frontend only if it hasn't been pre-built
    console.log('📂 Frontend dir:', frontendDir);
    
    console.log('   → npm install...');
    try {
      execSync('npm install --prefer-offline --no-audit', { 
        cwd: frontendDir, 
        stdio: 'inherit',
        shell: true
      });
    } catch(e) {
      console.warn('   ⚠️  npm install teve warnings (continuando)');
    }

    console.log('\n   → npm run build...');
    try {
      execSync('npm run build', { 
        cwd: frontendDir, 
        stdio: 'inherit',
        shell: true
      });
    } catch(e) {
      console.error('   ❌ Build failed:', e.message);
      process.exit(1);
    }

    if (fs.existsSync(buildDir)) {
      const files = fs.readdirSync(buildDir).length;
      console.log('\n✅ Frontend build SUCCESS! (' + files + ' files)');
    } else {
      console.error('❌ Build dir not created!');
      process.exit(1);
    }
  } else {
    console.warn('⚠️  Frontend dir not found, skipping build');
  }

  // ============ START SERVER ============
  console.log('\n🚀 STEP 2: Starting Server...\n');
  
  const backendDir = path.join(process.cwd(), 'backend/src');
  const serverFile = path.join(backendDir, 'server.js');
  
  if (!fs.existsSync(serverFile)) {
    console.error('❌ Server file not found:', serverFile);
    process.exit(1);
  }

  console.log('Starting: node ' + serverFile + '\n');
  console.log('╔══════════════════════════════════════╗\n');
  
  // Start server (this won't return)
  execSync('node ' + serverFile, { 
    stdio: 'inherit',
    shell: true
  });
  
} catch (error) {
  console.error('\n❌ STARTUP ERROR:', error.message);
  process.exit(1);
}
