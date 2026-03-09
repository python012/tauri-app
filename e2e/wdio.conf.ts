import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import os from 'os';

let driverProcess: ChildProcess | null = null;

function getApplicationPath(): string {
  const platform = os.platform();
  if (platform === 'darwin') {
    // macOS: Use the direct binary path for testing
    return path.resolve(__dirname, '../src-tauri/target/release/tauri-app');
  } else if (platform === 'win32') {
    return path.resolve(__dirname, '../src-tauri/target/release/tauri-app.exe');
  } else {
    return path.resolve(__dirname, '../src-tauri/target/release/tauri-app');
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
      application: getApplicationPath(),
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
    const platform = os.platform();
    
    // Note: tauri-driver is only supported on Windows
    // See: https://v2.tauri.app/develop/tests/webdriver/
    if (platform === 'win32') {
      console.log('Starting tauri-driver on Windows...');
      driverProcess = spawn('tauri-driver', [], {
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          PATH: `${process.env.HOME || process.env.USERPROFILE}/.cargo/bin:${process.env.PATH}`
        }
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.warn(`\n⚠️  Warning: tauri-driver is not supported on ${platform}`);
      console.warn('E2E tests with WebdriverIO require Windows with WebView2.');
      console.warn('\nFor macOS/Linux, consider alternative testing approaches:');
      console.warn('  - Playwright with WebKit');
      console.warn('  - Vitest for component testing');
      console.warn('  - Manual testing scripts');
      console.warn('\nSee e2e/MACOS_E2E.md for more information.\n');
      console.warn('Skipping E2E tests on this platform.\n');
      
      // Exit gracefully instead of throwing an error
      process.exit(0);
    }
  },

  async onComplete() {
    if (driverProcess) {
      console.log('Stopping tauri-driver...');
      driverProcess.kill();
    }
  },
};