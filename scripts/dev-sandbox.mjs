import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const env = {
  ...process.env,
  NODE_ENV: 'development',
  KODERA_LOCAL_SANDBOX: 'true',
  VITE_LOCAL_SANDBOX: 'true',
};

const isWin = process.platform === 'win32';
const child = spawn(isWin ? 'npx.cmd' : 'npx', ['vite', ...args], {
  stdio: 'inherit',
  env,
  shell: isWin,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
