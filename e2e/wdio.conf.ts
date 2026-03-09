import path from 'path';
import { spawn, ChildProcess } from 'child_process';

let driverProcess: ChildProcess | null = null;

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
    console.log('Starting tauri-driver...');
    driverProcess = spawn('tauri-driver', [], {
      stdio: 'inherit',
      shell: true
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
  },

  async onComplete() {
    if (driverProcess) {
      console.log('Stopping tauri-driver...');
      driverProcess.kill();
    }
  }
};