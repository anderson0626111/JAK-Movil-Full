const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const processes = [];
let closing = false;

function start(name, npmScript, cwd, interactive = false) {
  console.log(`[${name}] Iniciando...`);

  const command =
    process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npm';
  const args =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', `npm run ${npmScript}`]
      : ['run', npmScript];

  const child = spawn(command, args, {
    cwd,
    // Solo Expo debe leer el teclado. Si nodemon también hereda stdin,
    // puede capturar respuestas como "y" antes de que Expo las reciba.
    stdio: interactive ? 'inherit' : ['ignore', 'inherit', 'inherit'],
    windowsHide: true,
  });

  processes.push(child);

  child.on('error', (error) => {
    console.error(`[${name}] No se pudo iniciar: ${error.message}`);
    shutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (closing) return;

    if (signal) {
      console.log(`[${name}] Se detuvo (${signal}).`);
    } else if (code !== 0) {
      console.error(`[${name}] Terminó con error (código ${code}).`);
    } else {
      console.log(`[${name}] Terminó.`);
    }

    shutdown(code || 0);
  });
}

function stopProcess(child) {
  if (!child.pid || child.killed) return;

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }

  child.kill('SIGTERM');
}

function shutdown(exitCode = 0) {
  if (closing) return;
  closing = true;

  for (const child of processes) {
    stopProcess(child);
  }

  setTimeout(() => process.exit(exitCode), 300);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

start(
  'BACKEND',
  'dev',
  path.join(projectRoot, 'backend-jakmovil')
);

start(
  'WEB',
  'web:full',
  path.join(projectRoot, 'JAK-Movil-App'),
  true
);
