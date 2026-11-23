import path from 'node:path';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const viteBin = path.resolve(process.cwd(), 'node_modules/vite/bin/vite.js');
const env = {
  ...process.env,
  NODE_ENV: 'development',
  KODERA_LOCAL_SANDBOX: 'true',
  VITE_LOCAL_SANDBOX: 'true',
};

const child = spawn(process.execPath, [viteBin, ...args], {
  stdio: 'inherit',
  env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
