#!/usr/bin/env node

// Script que roda Frontend (build) e Backend em paralelo
// Funciona em produção (Railway) também

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║   STARTING FRONTEND + BACKEND (PRODUCTION MODE)  ║');
console.log('╚══════════════════════════════════════════════════╝\n');

// ============ BUILD FRONTEND ============
console.log('📦 STEP 1: Building Frontend...\n');

const frontendDir = path.join(process.cwd(), 'frontend');

if (!fs.existsSync(frontendDir)) {
  console.error('❌ Frontend dir not found!');
  process.exit(1);
}

try {
  // Build frontend
  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true
  });

  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Frontend build failed');
      process.exit(1);
    }

    console.log('\n✅ Frontend build complete!\n');
    
    // ============ START SERVERS ============
    console.log('🚀 STEP 2: Starting Servers...\n');
    console.log('   • Frontend: http://localhost:3000');
    console.log('   • Backend:  http://localhost:5000/api\n');
    
    // Start frontend (serve the build)
    console.log('   Starting frontend dev server...');
    const frontendServer = spawn('npx', ['serve', '-s', 'build', '-l', '3000'], {
      cwd: frontendDir,
      stdio: 'inherit',
      shell: true
    });

    // Start backend
    console.log('   Starting backend server...');
    const backendServer = spawn('npm', ['run', 'dev'], {
      cwd: path.join(process.cwd(), 'backend'),
      stdio: 'inherit',
      shell: true
    });

    // Handle exits
    process.on('SIGINT', () => {
      console.log('\n\n⏹️  Stopping servers...');
      frontendServer.kill();
      backendServer.kill();
      process.exit(0);
    });
  });
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
