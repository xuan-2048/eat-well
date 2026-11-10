import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
}
function run(args) {
  const child = spawn(process.execPath, args, {cwd: root, stdio: 'inherit'});
  children.push(child);
  child.on('error', error => {console.error(error.message); stop(1);});
  child.on('exit', code => {if (!stopping) stop(code ?? 1);});
  return child;
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => stop());
run(['--env-file-if-exists=.env', 'server/index.ts']);
run(['--env-file-if-exists=.env', 'node_modules/vite/bin/vite.js']);
