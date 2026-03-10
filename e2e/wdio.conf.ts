import path from 'path';
import { spawn, ChildProcess, execSync } from 'child_process';
import net from 'net';
import fs from 'fs';

let driverProcess: ChildProcess | null = null;

function resolveTauriDriverCommand(): string {
  const userProfile = process.env.USERPROFILE;
  const candidates = [
    process.env.TAURI_DRIVER_PATH,
    userProfile ? path.join(userProfile, '.cargo', 'bin', 'tauri-driver.exe') : undefined,
    userProfile ? path.join(userProfile, '.cargo', 'bin', 'tauri-driver') : undefined,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to PATH lookup.
  try {
    execSync('where tauri-driver', { stdio: 'ignore' });
    return 'tauri-driver';
  } catch {
    throw new Error(
      'tauri-driver not found. Install it with `cargo install tauri-driver` or set TAURI_DRIVER_PATH to tauri-driver.exe.',
    );
  }
}

async function waitForPortReady(port: number, host = '127.0.0.1', timeoutMs = 10000): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const isOpen = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();

      socket.setTimeout(500);
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.once('error', () => resolve(false));

      socket.connect(port, host);
    });

    if (isOpen) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`tauri-driver did not open ${host}:${port} within ${timeoutMs}ms`);
}

function cleanupStaleDriver(port: number): void {
  // Kill stale tauri-driver processes from previous runs.
  try {
    execSync('taskkill /IM tauri-driver.exe /F /T', { stdio: 'ignore' });
    console.log('[wdio] Cleaned stale tauri-driver.exe process(es).');
  } catch {
    // No stale process is a valid state.
  }

  // Fallback: free the specific listening port in case another process holds it.
  try {
    const command = `powershell -NoProfile -Command "$p=(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).OwningProcess; if ($p) { Stop-Process -Id $p -Force }"`;
    execSync(command, { stdio: 'ignore' });
  } catch {
    // Best-effort cleanup only.
  }
}

export const config = {
  runner: 'local',
  specs: ['./test/specs/**/*.ts'],
  exclude: [],
  maxInstances: 1,
  
  capabilities: [{
    'maxInstances': 1,
    'browserName': 'tauri',
    'tauri:options': {
      application: path.resolve(__dirname, '../src-tauri/target/release/tauri-app.exe'),
    }
  }],

  logLevel: 'info',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  hostname: '127.0.0.1',
  port: 4444,
  path: '/',

  framework: 'mocha',
  reporters: ['spec'],
  
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },

  async onPrepare() {
    const tauriDriverCommand = resolveTauriDriverCommand();
    cleanupStaleDriver(4444);
    console.log(`Starting tauri-driver: ${tauriDriverCommand}`);
    driverProcess = spawn(tauriDriverCommand, [], {
      stdio: 'inherit',
      shell: false
    });
    await waitForPortReady(4444);
  },

  async onComplete() {
    if (driverProcess) {
      console.log('Stopping tauri-driver...');
      driverProcess.kill();
    }
  }
};