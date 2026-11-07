/**
 * EcoTrack Master Audit Runner - Browser Launcher & Windows Process Lifecycle Manager
 * Handles isolated temporary user profiles and robust Windows process cleanup.
 */

const cp = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');
const os = require('os');
const fs = require('fs');

const BROWSER_PATHS = {
  chrome: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  edge: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
};

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

class BrowserInstance {
  constructor(browserType = 'chrome', port = 9222) {
    this.browserType = browserType;
    this.port = port;
    this.proc = null;
    this.pid = null;
    this.tempProfile = null;
    this.executable = BROWSER_PATHS[browserType] || BROWSER_PATHS.chrome;
  }

  isAvailable() {
    return fs.existsSync(this.executable);
  }

  async launch() {
    if (!this.isAvailable()) {
      throw new Error(`Browser executable not found: ${this.executable}`);
    }

    // Preflight port availability check: Stop safely if occupied
    const portFree = await isPortAvailable(this.port);
    if (!portFree) {
      throw new Error(`Port ${this.port} is already in use by another process. Stopping safely to avoid connecting to an unknown browser or terminating an unrelated process.`);
    }

    // Create unique isolated temp profile
    this.tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), `ecotrack_${this.browserType}_profile_`));

    const args = [
      '--headless=new',
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.tempProfile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-background-networking',
      '--disable-extensions',
      '--window-size=1440,900',
      'about:blank'
    ];

    this.proc = cp.spawn(this.executable, args, { stdio: 'ignore' });
    this.pid = this.proc.pid;

    // Poll until ready
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        await new Promise((res, rej) => {
          const req = http.get(`http://127.0.0.1:${this.port}/json/version`, res);
          req.on('error', rej);
        });
        ready = true;
        break;
      } catch (_) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (!ready) {
      await this.terminate();
      throw new Error(`Failed to bind debugging port ${this.port} for ${this.browserType}`);
    }

    return this.port;
  }

  async terminate() {
    // 1. Terminate process
    if (this.proc) {
      try {
        await new Promise((resolve) => {
          let timer = setTimeout(() => {
            try {
              // Force kill process tree on Windows
              if (this.pid) {
                cp.spawnSync('taskkill', ['/pid', this.pid.toString(), '/T', '/F'], { stdio: 'ignore' });
              }
            } catch (_) {}
            resolve();
          }, 3000);

          this.proc.on('close', () => {
            clearTimeout(timer);
            resolve();
          });

          this.proc.kill('SIGINT');
        });
      } catch (_) {}
      this.proc = null;
      this.pid = null;
    }

    // 2. Exponential backoff profile directory cleanup
    if (this.tempProfile && fs.existsSync(this.tempProfile)) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          fs.rmSync(this.tempProfile, { recursive: true, force: true });
          break;
        } catch (err) {
          if (attempt === 3) {
            console.warn(`[Cleanup Note] Temporary profile cleanup deferred by Windows file lock: ${this.tempProfile}`);
          } else {
            await new Promise(r => setTimeout(r, 300 * attempt));
          }
        }
      }
      this.tempProfile = null;
    }
  }
}

// Global active browser registry for emergency termination
const activeInstances = new Set();

function createBrowser(type = 'chrome', port = 9222) {
  const instance = new BrowserInstance(type, port);
  activeInstances.add(instance);
  return instance;
}

async function closeBrowser(instance) {
  if (instance) {
    activeInstances.delete(instance);
    await instance.terminate();
  }
}

// Register global termination hooks for unexpected process exit
let emergencyCleanupRegistered = false;
function registerEmergencyCleanup() {
  if (emergencyCleanupRegistered) return;
  emergencyCleanupRegistered = true;

  const cleanupSync = () => {
    for (const inst of activeInstances) {
      try {
        if (inst.pid) {
          cp.spawnSync('taskkill', ['/pid', inst.pid.toString(), '/T', '/F'], { stdio: 'ignore' });
        }
        if (inst.tempProfile && fs.existsSync(inst.tempProfile)) {
          fs.rmSync(inst.tempProfile, { recursive: true, force: true });
        }
      } catch (_) {}
    }
  };

  process.on('SIGINT', () => { cleanupSync(); process.exit(130); });
  process.on('SIGTERM', () => { cleanupSync(); process.exit(143); });
  process.on('unhandledRejection', (reason) => {
    console.error('CRITICAL UNHANDLED REJECTION:', reason);
    cleanupSync();
    process.exit(1);
  });
  process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
    cleanupSync();
    process.exit(1);
  });
}

registerEmergencyCleanup();

module.exports = {
  createBrowser,
  closeBrowser,
  isPortAvailable,
  BROWSER_PATHS
};
