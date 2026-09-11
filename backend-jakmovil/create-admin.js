const crypto = require('crypto');
const db = require('./db');

const [email, password, nombre = 'Administrador'] = process.argv.slice(2);

if (!email || !password || password.length < 4) {
  console.error('Uso: node create-admin.js usuario-o-correo contrasena [nombre]');
  console.error('La contrasena debe tener al menos 4 caracteres.');
  process.exit(1);
}

async function main() {
  await db.query(`CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT, nombre VARCHAR(100) NOT NULL, email VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL, rol ENUM('admin', 'empleado', 'usuario') NOT NULL DEFAULT 'empleado',
    debe_cambiar_contrasena TINYINT(1) NOT NULL DEFAULT 0,
    foto_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY usuarios_email_unique (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
  await db.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, \'admin\') ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), password_hash = VALUES(password_hash), rol = \'admin\'',
    [nombre, email.trim().toLowerCase(), passwordHash]
  );
  console.log(`Administrador configurado para ${email.trim().toLowerCase()}`);
  process.exit(0);
}

main().catch((error) => {
  console.error('No fue posible crear el administrador:', error.message);
  process.exit(1);
});
