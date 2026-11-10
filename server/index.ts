import {createApi} from './app.ts';

const port = Number(process.env.API_PORT ?? 8020);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid API_PORT');
const origins = process.env.WEB_ORIGINS?.split(',').map(value => value.trim()).filter(Boolean);
const server = createApi(origins ? {origins} : {}).listen(port, '127.0.0.1', () => {
  console.log(`Eat Well API: http://127.0.0.1:${port}`);
});
server.on('error', error => {console.error(error.message); process.exitCode = 1;});
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => {server.close();});
