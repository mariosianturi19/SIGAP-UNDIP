#!/usr/bin/env node

/**
 * Remote Deployment Server
 *
 * Script ini dijalankan di laptop yang punya akses SSH ke VM
 * Menerima trigger deployment via HTTP endpoint
 *
 * Usage:
 *   node deploy-server.js
 *
 * Environment Variables:
 *   DEPLOY_SECRET - Secret key untuk autentikasi (wajib)
 *   DEPLOY_PORT - Port server (default: 9000)
 */

const http = require('http');
const { exec } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Configuration
const PORT = process.env.DEPLOY_PORT || 9000;
const SECRET = process.env.DEPLOY_SECRET;

if (!SECRET) {
  console.error('❌ ERROR: DEPLOY_SECRET environment variable is required!');
  console.error('   Example: DEPLOY_SECRET=your-secret-key node deploy-server.js');
  process.exit(1);
}

// Temporary directory for received files
const TEMP_DIR = path.join(__dirname, '../.deploy-temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Verify request signature
 */
function verifySignature(body, signature) {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(body);
  const calculatedSignature = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

/**
 * Execute deployment
 */
function executeDeploy(tarballPath, callback) {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Starting Deployment Process...                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const deployScript = path.join(__dirname, '../deploy.sh');

  // Check if deploy.sh exists
  if (!fs.existsSync(deployScript)) {
    return callback(new Error('deploy.sh not found!'));
  }

  // Make deploy.sh executable
  fs.chmodSync(deployScript, '755');

  // Extract tarball to temp directory
  const extractDir = path.join(TEMP_DIR, `extract-${Date.now()}`);
  fs.mkdirSync(extractDir, { recursive: true });

  exec(`tar -xzf "${tarballPath}" -C "${extractDir}"`, (error) => {
    if (error) {
      return callback(error);
    }

    // Copy extracted files to current directory (backup first)
    const backupDir = path.join(TEMP_DIR, `backup-${Date.now()}`);
    const projectRoot = path.join(__dirname, '..');

    console.log('📦 Creating backup of current files...');

    exec(`mkdir -p "${backupDir}" && cp -r "${projectRoot}"/* "${backupDir}/" 2>/dev/null || true`, (backupError) => {
      if (backupError) {
        console.warn('⚠️  Warning: Could not create backup');
      } else {
        console.log('✅ Backup created at:', backupDir);
      }

      console.log('📥 Copying new files...');

      // Copy new files (exclude node_modules, .next, .git)
      exec(`rsync -av --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='.env*' "${extractDir}/" "${projectRoot}/"`, (copyError) => {
        if (copyError) {
          console.error('❌ Error copying files:', copyError.message);
          // Restore backup
          console.log('🔄 Restoring from backup...');
          exec(`cp -r "${backupDir}"/* "${projectRoot}/"`, () => {
            callback(copyError);
          });
          return;
        }

        console.log('✅ Files copied successfully');
        console.log('');
        console.log('🚀 Executing deployment script...');
        console.log('');

        // Execute deploy.sh with auto-confirm
        const deployProcess = exec(
          `cd "${projectRoot}" && echo "2\ny" | bash "${deployScript}"`,
          { maxBuffer: 10 * 1024 * 1024 }, // 10MB buffer
          (deployError, stdout, stderr) => {
            // Cleanup
            fs.rmSync(extractDir, { recursive: true, force: true });
            fs.rmSync(tarballPath, { force: true });

            if (deployError) {
              console.error('❌ Deployment failed:', deployError.message);
              if (stderr) console.error('STDERR:', stderr);
              callback(deployError);
            } else {
              console.log('');
              console.log('╔════════════════════════════════════════════════════════════╗');
              console.log('║  Deployment Completed Successfully!                       ║');
              console.log('╚════════════════════════════════════════════════════════════╝');
              console.log('');
              callback(null, stdout);
            }
          }
        );

        // Stream output
        deployProcess.stdout.on('data', (data) => {
          process.stdout.write(data);
        });

        deployProcess.stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    });
  });
}

/**
 * Handle deployment request
 */
function handleDeploy(req, res) {
  console.log(`[${new Date().toISOString()}] Deployment request received from ${req.socket.remoteAddress}`);

  // Verify signature
  const signature = req.headers['x-deploy-signature'];
  if (!signature) {
    console.error('❌ No signature provided');
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Signature required' }));
    return;
  }

  let body = [];
  req.on('data', chunk => body.push(chunk));
  req.on('end', () => {
    body = Buffer.concat(body);

    // Verify signature
    if (!verifySignature(body, signature)) {
      console.error('❌ Invalid signature');
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Invalid signature' }));
      return;
    }

    console.log('✅ Signature verified');

    // Save tarball
    const tarballPath = path.join(TEMP_DIR, `deploy-${Date.now()}.tar.gz`);
    fs.writeFileSync(tarballPath, body);

    console.log(`📦 Tarball saved: ${(body.length / 1024 / 1024).toFixed(2)} MB`);

    // Send immediate response
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Deployment started',
      timestamp: new Date().toISOString()
    }));

    // Execute deployment asynchronously
    executeDeploy(tarballPath, (error, output) => {
      if (error) {
        console.error('Deployment failed:', error.message);
      } else {
        console.log('Deployment output:', output);
      }
    });
  });
}

/**
 * Handle health check
 */
function handleHealth(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));
}

/**
 * Create HTTP server
 */
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Deploy-Signature');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Route handling
  if (req.url === '/deploy' && req.method === 'POST') {
    handleDeploy(req, res);
  } else if (req.url === '/health' && req.method === 'GET') {
    handleHealth(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Remote Deployment Server                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  🚀 Server running on port ${PORT}`);
  console.log(`  🔒 Secret configured: ${SECRET.substring(0, 8)}...`);
  console.log('');
  console.log('  Endpoints:');
  console.log(`    POST http://localhost:${PORT}/deploy - Trigger deployment`);
  console.log(`    GET  http://localhost:${PORT}/health - Health check`);
  console.log('');
  console.log('  Waiting for deployment requests...');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('');
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('');
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
