const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 3001;
const DOP_PER_USD = 60;
const VEHICLE_TYPES = ['Sedan', 'Hatchback', 'Jeepeta', 'Camioneta', 'Minivan', 'Coupé', 'Convertible', 'Van'];
const FUEL_TYPES = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'Gas/GLP'];

const fotoPortadaPorVehiculo = {
  9: '2.jpg',
};

app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'cambia-esta-clave-antes-de-produccion';
const TOKEN_DURATION_MS = 8 * 60 * 60 * 1000;
const PASSWORD_RESET_DURATION_MS = 15 * 60 * 1000;
const yearColumn = '`a\u00f1o`';

function crearToken(usuario) {
  const contenido = Buffer.from(
    JSON.stringify({ id: usuario.id, cedula: usuario.cedula, rol: usuario.rol, exp: Date.now() + TOKEN_DURATION_MS })
  ).toString('base64url');
  const firma = crypto.createHmac('sha256', TOKEN_SECRET).update(contenido).digest('base64url');
  return `${contenido}.${firma}`;
}

function leerToken(token) {
  const [contenido, firma] = String(token || '').split('.');
  if (!contenido || !firma) return null;

  const firmaEsperada = crypto.createHmac('sha256', TOKEN_SECRET).update(contenido).digest('base64url');
  const firmaValida = Buffer.byteLength(firma) === Buffer.byteLength(firmaEsperada) &&
    crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(firmaEsperada));

  if (!firmaValida) return null;

  try {
    const datos = JSON.parse(Buffer.from(contenido, 'base64url').toString('utf8'));
    return datos.exp > Date.now() ? datos : null;
  } catch {
    return null;
  }
}

async function requireAdmin(req, res, next) {
  const [tipo, token] = String(req.headers.authorization || '').split(' ');
  const tokenUsuario = tipo === 'Bearer' ? leerToken(token) : null;

  if (!tokenUsuario || !['admin', 'empleado'].includes(tokenUsuario.rol)) {
    return res.status(401).json({ error: 'Acceso requerido' });
  }

  try {
    const [usuarios] = await db.query(
      'SELECT id, nombre, cedula, email, rol, activo, debe_cambiar_contrasena, foto_url, correo_recuperacion FROM usuarios WHERE id = ? LIMIT 1',
      [tokenUsuario.id]
    );
    const usuario = usuarios[0];
    if (!usuario || !usuario.activo || !['admin', 'empleado'].includes(usuario.rol)) {
      return res.status(401).json({ error: 'La cuenta no esta activa' });
    }
    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('Error validando la sesion:', error);
    res.status(500).json({ error: 'No fue posible validar la sesion' });
  }
}

function requireAdminOnly(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso de administrador requerido' });
  }

  next();
}

function verificarContrasena(contrasena, almacenada) {
  const [sal, hashGuardado] = String(almacenada || '').split(':');
  if (!sal || !hashGuardado) return false;
  const hash = crypto.scryptSync(contrasena, sal, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashGuardado, 'hex'));
}

function crearHashContrasena(contrasena) {
  const sal = crypto.randomBytes(16).toString('hex');
  return `${sal}:${crypto.scryptSync(contrasena, sal, 64).toString('hex')}`;
}

function esCorreoValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || '').trim());
}

function esContrasenaSegura(valor) {
  const contrasena = String(valor || '');
  return contrasena.length >= 8 && /[A-Z]/.test(contrasena) && /[a-z]/.test(contrasena) && /\d/.test(contrasena) && /[^A-Za-z0-9]/.test(contrasena);
}

function normalizarCedula(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function esCedulaDominicanaValida(valor) {
  const cedula = normalizarCedula(valor);
  return /^\d{11}$/.test(cedula);
}

function textoOpcional(valor, maximo = 255) {
  const texto = String(valor ?? '').trim();
  return texto ? texto.slice(0, maximo) : null;
}

function crearHashCodigo(codigo) {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(String(codigo)).digest('hex');
}

async function enviarCodigoRecuperacion(destino, codigo) {
  const apiKey = process.env.RESEND_API_KEY;
  const remitente = process.env.PASSWORD_RESET_FROM;
  if (apiKey && remitente) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: remitente,
        to: [destino],
        subject: 'Codigo temporal de acceso a JAK MOVIL',
        text: `Tu codigo temporal de recuperacion es ${codigo}. Expira en 15 minutos. Si no solicitaste este cambio, ignora este mensaje.`,
      }),
    });
    if (!response.ok) throw new Error('El servicio de correo no pudo enviar el codigo');
    return true;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('El servicio de recuperacion por correo no esta configurado');
  }
  console.log(`[RECUPERACION LOCAL] Codigo para ${destino}: ${codigo}`);
  return false;
}

function validarVehiculo(datos) {
  const marca = String(datos.marca || '').trim();
  const modelo = String(datos.modelo || '').trim();
  const anioTexto = String(datos.anio ?? '').trim();
  const precioTexto = String(datos.precio ?? '').trim();
  const kilometrajeTexto = String(datos.kilometraje ?? '').trim();
  const anio = anioTexto ? Number(anioTexto) : null;
  const precio = precioTexto ? Number(precioTexto) : null;

  if (!marca || !modelo || marca.length > 50 || modelo.length > 50) {
    return null;
  }
  if (anio !== null && (!Number.isInteger(anio) || anio < 1900 || anio > 2100)) {
    return null;
  }
  if (precio !== null && (!Number.isFinite(precio) || precio <= 0)) {
    return null;
  }
  if (kilometrajeTexto && !/^\d+$/.test(kilometrajeTexto)) {
    return null;
  }
  if (!['USD', 'DOP'].includes(datos.moneda || 'USD') || !['Nuevo', 'Usado'].includes(datos.condicion || 'Usado')) {
    return null;
  }
  const transmision = textoOpcional(datos.transmision, 30);
  if (transmision && !['Automática', 'Mecánica'].includes(transmision)) return null;
  const tipo = textoOpcional(datos.tipo, 30);
  const combustible = textoOpcional(datos.combustible, 30);
  const colorExterior = textoOpcional(datos.color_exterior, 50);
  if (tipo && !VEHICLE_TYPES.includes(tipo)) return null;
  if (combustible && !FUEL_TYPES.includes(combustible)) return null;
  if (colorExterior && !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ -]+$/.test(colorExterior)) return null;

  return {
    marca, modelo, anio, precio, moneda: datos.moneda || 'USD',
    tipo, transmision, combustible, condicion: datos.condicion || 'Usado',
    color_exterior: colorExterior, kilometraje: kilometrajeTexto || null,
    accesorios: textoOpcional(datos.accesorios, 20000), descripcion: textoOpcional(datos.descripcion, 20000),
  };
}

async function prepararUsuarios() {
  await db.query(`CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    cedula VARCHAR(11) NULL,
    email VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'empleado', 'usuario') NOT NULL DEFAULT 'empleado',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    debe_cambiar_contrasena TINYINT(1) NOT NULL DEFAULT 0,
    foto_url VARCHAR(500) NULL,
    correo_recuperacion VARCHAR(160) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY usuarios_email_unique (email),
    UNIQUE KEY usuarios_cedula_unique (cedula)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.query("ALTER TABLE usuarios MODIFY rol ENUM('admin', 'empleado', 'usuario') NOT NULL DEFAULT 'empleado'");
  const [columnasUsuarios] = await db.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'"
  );
  const columnas = new Set(columnasUsuarios.map((columna) => columna.COLUMN_NAME));
  if (!columnas.has('debe_cambiar_contrasena')) {
    await db.query('ALTER TABLE usuarios ADD COLUMN debe_cambiar_contrasena TINYINT(1) NOT NULL DEFAULT 0');
  }
  if (!columnas.has('foto_url')) {
    await db.query('ALTER TABLE usuarios ADD COLUMN foto_url VARCHAR(500) NULL');
  }
  if (!columnas.has('activo')) {
    await db.query('ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1');
  }
  if (!columnas.has('correo_recuperacion')) {
    await db.query('ALTER TABLE usuarios ADD COLUMN correo_recuperacion VARCHAR(160) NULL');
    await db.query('CREATE UNIQUE INDEX usuarios_correo_recuperacion_unique ON usuarios (correo_recuperacion)');
  }
  if (!columnas.has('cedula')) {
    await db.query('ALTER TABLE usuarios ADD COLUMN cedula VARCHAR(11) NULL AFTER nombre');
    await db.query('CREATE UNIQUE INDEX usuarios_cedula_unique ON usuarios (cedula)');
  }

  await db.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, \'admin\', 1) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), rol = \'admin\', activo = 1',
    ['Administrador General', 'admin', crearHashContrasena('1234')]
  );
}

async function prepararSolicitudes() {
  await db.query(`CREATE TABLE IF NOT EXISTS solicitudes_clientes (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    vehiculo VARCHAR(180) NOT NULL,
    mensaje TEXT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

async function prepararVentas() {
  await db.query(`CREATE TABLE IF NOT EXISTS ventas_clientes (
    id INT NOT NULL AUTO_INCREMENT,
    vehiculo_id INT NULL,
    vehiculo VARCHAR(180) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    apellido VARCHAR(120) NOT NULL,
    cedula VARCHAR(50) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    vendido_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

async function prepararRecuperacionContrasenas() {
  await db.query(`CREATE TABLE IF NOT EXISTS recuperacion_contrasenas (
    usuario_id INT NOT NULL,
    codigo_hash CHAR(64) NOT NULL,
    expira_en DATETIME NOT NULL,
    intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id),
    CONSTRAINT fk_recuperacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

async function prepararRelaciones() {
  await db.query('ALTER TABLE ventas_clientes MODIFY vehiculo_id INT NULL');
  await db.query('UPDATE ventas_clientes venta LEFT JOIN vehiculos vehiculo ON vehiculo.id = venta.vehiculo_id SET venta.vehiculo_id = NULL WHERE venta.vehiculo_id IS NOT NULL AND vehiculo.id IS NULL');
  const [relaciones] = await db.query(
    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas_clientes' AND CONSTRAINT_NAME = 'fk_ventas_vehiculo'"
  );
  if (!relaciones.length) {
    await db.query('ALTER TABLE ventas_clientes ADD CONSTRAINT fk_ventas_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE SET NULL ON UPDATE CASCADE');
  }
}

async function prepararInventario() {
  const columnas = await db.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehiculos' AND COLUMN_NAME IN ('estado', 'vendido_en', 'publicado_en', 'historial_venta_visible')"
  );
  const existentes = new Set(columnas[0].map((columna) => columna.COLUMN_NAME));

  if (!existentes.has('estado')) {
    await db.query("ALTER TABLE vehiculos ADD COLUMN estado ENUM('disponible', 'vendido') NOT NULL DEFAULT 'disponible'");
  }
  if (!existentes.has('vendido_en')) {
    await db.query('ALTER TABLE vehiculos ADD COLUMN vendido_en DATETIME NULL');
  }
  if (!existentes.has('publicado_en')) {
    await db.query('ALTER TABLE vehiculos ADD COLUMN publicado_en DATETIME NULL');
    await db.query('UPDATE vehiculos SET publicado_en = NOW() WHERE publicado_en IS NULL');
  }
  if (!existentes.has('historial_venta_visible')) {
    await db.query('ALTER TABLE vehiculos ADD COLUMN historial_venta_visible TINYINT(1) NOT NULL DEFAULT 1');
  }
  await db.query(`ALTER TABLE vehiculos
    MODIFY ${yearColumn} INT NULL,
    MODIFY precio DECIMAL(10,2) NULL,
    MODIFY tipo VARCHAR(30) NULL,
    MODIFY transmision VARCHAR(30) NULL,
    MODIFY combustible VARCHAR(30) NULL`);
  await db.query("UPDATE vehiculos SET transmision = NULL WHERE transmision IS NOT NULL AND transmision NOT IN ('Automática', 'Mecánica')");
  await db.query("UPDATE vehiculos SET combustible = NULL WHERE combustible IS NOT NULL AND combustible NOT IN ('Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'Gas/GLP')");
  await db.query("UPDATE vehiculos SET tipo = 'Jeepeta' WHERE tipo = 'Carro' AND LOWER(CONCAT(COALESCE(marca, ''), ' ', COALESCE(modelo, ''))) LIKE '%countryman%'");
  await db.query(`UPDATE vehiculos SET tipo = 'Sedan'
    WHERE (tipo IS NULL OR TRIM(tipo) = '') AND (
      (marca = 'Mercedes-Benz' AND modelo = 'C300') OR
      (marca = 'Dodge' AND modelo = 'Avenger') OR
      (marca = 'Nissan' AND modelo = 'Altima S')
    )`);
  await db.query("UPDATE vehiculos SET tipo = 'Convertible' WHERE (tipo IS NULL OR TRIM(tipo) = '') AND marca = 'Chevrolet' AND modelo LIKE 'Corvette%'");
  await db.query("UPDATE vehiculos SET tipo = NULL WHERE tipo IS NOT NULL AND tipo NOT IN ('Sedan', 'Hatchback', 'Jeepeta', 'Camioneta', 'Minivan', 'Coupé', 'Convertible', 'Van')");
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const identificador = String(req.body.cedula || req.body.usuario || '').trim().toLowerCase();
    const cedula = normalizarCedula(identificador);
    const contrasena = String(req.body.contrasena || '');
    const [usuarios] = await db.query(
      'SELECT id, nombre, cedula, email, password_hash, rol, activo, debe_cambiar_contrasena, foto_url, correo_recuperacion FROM usuarios WHERE cedula = ? OR (cedula IS NULL AND LOWER(email) = ?) LIMIT 1',
      [cedula, identificador]
    );
    const usuario = usuarios[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Cédula o contraseña incorrectas' });
    }

    const contrasenaCorrecta = verificarContrasena(contrasena, usuario.password_hash);

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Tu acceso esta pendiente de aprobacion por un administrador' });
    }
    if (!['admin', 'empleado'].includes(usuario.rol) || !contrasenaCorrecta) {
      return res.status(401).json({ error: 'Cédula o contraseña incorrectas' });
    }

    const { password_hash, ...perfil } = usuario;
    res.json({ token: crearToken(perfil), usuario: perfil });
  } catch (error) {
    console.error('Error de inicio de sesion:', error);
    res.status(500).json({ error: 'No fue posible iniciar sesion' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const nombre = String(req.body.nombre || '').trim();
    const cedula = normalizarCedula(req.body.cedula);
    const email = String(req.body.correo || req.body.email || '').trim().toLowerCase();
    const contrasena = String(req.body.contrasena || '');

    if (!nombre || !esCedulaDominicanaValida(cedula) || !esCorreoValido(email) || !esContrasenaSegura(contrasena)) {
      return res.status(400).json({ error: 'Ingresa nombre, una cédula de 11 dígitos, un correo válido y una contraseña de al menos 8 caracteres con mayúscula, minúscula, número y símbolo' });
    }

    const [cedulasRegistradas] = await db.query('SELECT id FROM usuarios WHERE cedula = ? LIMIT 1', [cedula]);
    if (cedulasRegistradas.length) {
      return res.status(409).json({ error: 'Ese número de cédula ya está registrado' });
    }

    const [correosRegistrados] = await db.query(
      'SELECT id FROM usuarios WHERE LOWER(email) = ? OR LOWER(correo_recuperacion) = ? LIMIT 1',
      [email, email]
    );
    if (correosRegistrados.length) {
      return res.status(409).json({ error: 'Ese correo ya está registrado' });
    }

    const passwordHash = crearHashContrasena(contrasena);
    const [resultado] = await db.query(
      'INSERT INTO usuarios (nombre, cedula, email, correo_recuperacion, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?, \'empleado\', 0)',
      [nombre, cedula, email, email, passwordHash]
    );
    res.status(201).json({ mensaje: 'Registro recibido. Un administrador debe aprobar el acceso antes de iniciar sesion.', id: resultado.insertId });
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      const duplicateKey = String(error.sqlMessage || error.message || '');
      return res.status(409).json({
        error: duplicateKey.includes('cedula') ? 'Ese número de cédula ya está registrado' : 'Ese correo ya está registrado',
      });
    }
    console.error('Error de registro:', error);
    res.status(500).json({ error: 'No fue posible registrar el usuario' });
  }
});

app.post('/api/auth/recuperacion/solicitar', async (req, res) => {
  try {
    const cedula = String(req.body.identificador || '').trim();
    if (!/^\d{11}$/.test(cedula)) return res.status(400).json({ error: 'Ingresa un número de cédula de 11 dígitos' });

    const [usuarios] = await db.query(
      'SELECT id, cedula, email, correo_recuperacion, activo FROM usuarios WHERE cedula = ? LIMIT 1',
      [cedula]
    );
    const usuario = usuarios[0];
    if (!usuario || !usuario.activo) {
      return res.json({ mensaje: 'Si la cuenta existe y tiene un correo configurado, recibira un codigo temporal.' });
    }
    const destino = esCorreoValido(usuario.correo_recuperacion)
      ? usuario.correo_recuperacion
      : (esCorreoValido(usuario.email) ? usuario.email : null);
    if (!destino) {
      return res.status(400).json({ error: 'Esta cuenta aun no tiene un correo de recuperacion configurado' });
    }

    const codigo = String(crypto.randomInt(100000, 1000000));
    const expiraEn = new Date(Date.now() + PASSWORD_RESET_DURATION_MS);
    await db.query(
      `INSERT INTO recuperacion_contrasenas (usuario_id, codigo_hash, expira_en, intentos)
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE codigo_hash = VALUES(codigo_hash), expira_en = VALUES(expira_en), intentos = 0, creado_en = CURRENT_TIMESTAMP`,
      [usuario.id, crearHashCodigo(codigo), expiraEn]
    );
    const enviado = await enviarCodigoRecuperacion(destino, codigo);
    res.json({
      mensaje: enviado ? 'Enviamos un codigo temporal a tu correo.' : 'Modo local: utiliza el codigo temporal mostrado debajo.',
      ...(enviado ? {} : { codigo_temporal: codigo }),
    });
  } catch (error) {
    console.error('Error solicitando recuperacion:', error);
    res.status(500).json({ error: error.message || 'No fue posible iniciar la recuperacion' });
  }
});

app.post('/api/auth/recuperacion/confirmar', async (req, res) => {
  try {
    const cedula = String(req.body.identificador || '').trim();
    const codigo = String(req.body.codigo || '').trim();
    const contrasena = String(req.body.contrasena || '');
    if (!/^\d{11}$/.test(cedula) || !/^\d{6}$/.test(codigo) || !esContrasenaSegura(contrasena)) {
      return res.status(400).json({ error: 'Ingresa el código de 6 dígitos y una contraseña de al menos 8 caracteres con mayúscula, minúscula, número y símbolo' });
    }

    const [usuarios] = await db.query(
      'SELECT id FROM usuarios WHERE activo = 1 AND cedula = ? LIMIT 1',
      [cedula]
    );
    const usuario = usuarios[0];
    if (!usuario) return res.status(400).json({ error: 'Codigo invalido o vencido' });

    const [solicitudes] = await db.query(
      'SELECT codigo_hash, expira_en, intentos FROM recuperacion_contrasenas WHERE usuario_id = ? LIMIT 1',
      [usuario.id]
    );
    const solicitud = solicitudes[0];
    if (!solicitud || new Date(solicitud.expira_en).getTime() < Date.now() || solicitud.intentos >= 5) {
      return res.status(400).json({ error: 'Codigo invalido o vencido' });
    }
    if (solicitud.codigo_hash !== crearHashCodigo(codigo)) {
      await db.query('UPDATE recuperacion_contrasenas SET intentos = intentos + 1 WHERE usuario_id = ?', [usuario.id]);
      return res.status(400).json({ error: 'Codigo invalido o vencido' });
    }

    await db.query('UPDATE usuarios SET password_hash = ?, debe_cambiar_contrasena = 0 WHERE id = ?', [crearHashContrasena(contrasena), usuario.id]);
    await db.query('DELETE FROM recuperacion_contrasenas WHERE usuario_id = ?', [usuario.id]);
    res.json({ mensaje: 'Contraseña actualizada. Ya puedes iniciar sesion.' });
  } catch (error) {
    console.error('Error confirmando recuperacion:', error);
    res.status(500).json({ error: 'No fue posible actualizar la contraseña' });
  }
});

app.get('/api/auth/me', requireAdmin, async (req, res) => {
  res.json({ usuario: req.usuario });
});

app.put('/api/auth/perfil', requireAdmin, async (req, res) => {
  try {
    const nombre = String(req.body.nombre || '').trim();
    const cedula = normalizarCedula(req.body.cedula);
    const contrasena = String(req.body.contrasena || '');
    const correoRecuperacion = String(req.body.correo_recuperacion || '').trim().toLowerCase();

    if (!nombre) return res.status(400).json({ error: 'Ingresa el nombre' });
    if (!esCedulaDominicanaValida(cedula)) return res.status(400).json({ error: 'Ingresa un número de cédula de 11 dígitos' });
    if (contrasena && !esContrasenaSegura(contrasena)) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo' });
    if (correoRecuperacion && !esCorreoValido(correoRecuperacion)) return res.status(400).json({ error: 'Ingresa un correo de recuperacion valido' });
    if (correoRecuperacion) {
      const [correoEnUso] = await db.query(
        'SELECT id FROM usuarios WHERE id <> ? AND (LOWER(email) = ? OR LOWER(correo_recuperacion) = ?) LIMIT 1',
        [req.usuario.id, correoRecuperacion, correoRecuperacion]
      );
      if (correoEnUso.length) return res.status(409).json({ error: 'Ese correo de recuperacion ya pertenece a otra cuenta' });
    }
    const [cedulaEnUso] = await db.query('SELECT id FROM usuarios WHERE id <> ? AND cedula = ? LIMIT 1', [req.usuario.id, cedula]);
    if (cedulaEnUso.length) return res.status(409).json({ error: 'Esa cédula ya pertenece a otra cuenta' });

    const [actuales] = await db.query('SELECT debe_cambiar_contrasena FROM usuarios WHERE id = ? LIMIT 1', [req.usuario.id]);
    if (actuales[0]?.debe_cambiar_contrasena && !contrasena) {
      return res.status(400).json({ error: 'Debes crear una nueva contraseña para recuperar el acceso' });
    }

    if (contrasena) {
      await db.query('UPDATE usuarios SET nombre = ?, cedula = ?, correo_recuperacion = ?, password_hash = ?, debe_cambiar_contrasena = 0 WHERE id = ?', [nombre, cedula, correoRecuperacion || null, crearHashContrasena(contrasena), req.usuario.id]);
    } else {
      await db.query('UPDATE usuarios SET nombre = ?, cedula = ?, correo_recuperacion = ? WHERE id = ?', [nombre, cedula, correoRecuperacion || null, req.usuario.id]);
    }

    const [usuarios] = await db.query('SELECT id, nombre, cedula, email, rol, activo, debe_cambiar_contrasena, foto_url, correo_recuperacion FROM usuarios WHERE id = ? LIMIT 1', [req.usuario.id]);
    res.json({ mensaje: 'Perfil actualizado.', usuario: usuarios[0] });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'No fue posible actualizar el perfil' });
  }
});

app.get('/api/admin/perfiles', requireAdmin, requireAdminOnly, async (req, res) => {
  try {
    const [perfiles] = await db.query('SELECT id, nombre, cedula, email, rol, activo, foto_url, correo_recuperacion, created_at FROM usuarios ORDER BY created_at DESC, id DESC');
    res.json({ perfiles });
  } catch (error) {
    console.error('Error cargando perfiles:', error);
    res.status(500).json({ error: 'No fue posible cargar los perfiles' });
  }
});

app.patch('/api/admin/perfiles/:id/estado', requireAdmin, requireAdminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const activo = req.body.activo === true || req.body.activo === 1 ? 1 : 0;
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador invalido' });
    if (id === req.usuario.id && !activo) return res.status(400).json({ error: 'No puedes desactivar tu propio acceso' });
    const [resultado] = await db.query('UPDATE usuarios SET activo = ? WHERE id = ?', [activo, id]);
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json({ mensaje: activo ? 'Acceso de vendedor aprobado.' : 'Acceso de vendedor desactivado.' });
  } catch (error) {
    console.error('Error cambiando estado del perfil:', error);
    res.status(500).json({ error: 'No fue posible cambiar el estado del acceso' });
  }
});

app.post('/api/auth/perfil/foto', requireAdmin, async (req, res) => {
  try {
    const coincidencia = String(req.body.dataUrl || '').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!coincidencia) {
      return res.status(400).json({ error: 'Selecciona una imagen JPG, PNG o WebP valida' });
    }

    const contenido = Buffer.from(coincidencia[2], 'base64');
    if (!contenido.length || contenido.length > 3 * 1024 * 1024) {
      return res.status(400).json({ error: 'La imagen debe pesar como maximo 3 MB' });
    }

    const extension = coincidencia[1] === 'jpeg' ? 'jpg' : coincidencia[1];
    const carpeta = path.join(__dirname, 'uploads', 'perfiles');
    fs.mkdirSync(carpeta, { recursive: true });
    const archivo = `perfil-${req.usuario.id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`;
    fs.writeFileSync(path.join(carpeta, archivo), contenido);

    const fotoUrl = `${req.protocol}://${req.get('host')}/uploads/perfiles/${archivo}`;
    await db.query('UPDATE usuarios SET foto_url = ? WHERE id = ?', [fotoUrl, req.usuario.id]);
    const [usuarios] = await db.query('SELECT id, nombre, cedula, email, rol, activo, debe_cambiar_contrasena, foto_url, correo_recuperacion FROM usuarios WHERE id = ? LIMIT 1', [req.usuario.id]);
    res.status(201).json({ mensaje: 'Foto de perfil actualizada.', usuario: usuarios[0] });
  } catch (error) {
    console.error('Error subiendo foto de perfil:', error);
    res.status(500).json({ error: 'No fue posible subir la foto de perfil' });
  }
});

app.delete('/api/auth/perfil/foto', requireAdmin, async (req, res) => {
  try {
    const [usuarios] = await db.query('SELECT foto_url FROM usuarios WHERE id = ? LIMIT 1', [req.usuario.id]);
    const fotoUrl = usuarios[0]?.foto_url;

    if (fotoUrl) {
      try {
        const nombreArchivo = path.basename(new URL(fotoUrl).pathname);
        const rutaArchivo = path.join(__dirname, 'uploads', 'perfiles', nombreArchivo);
        if (fs.existsSync(rutaArchivo)) fs.unlinkSync(rutaArchivo);
      } catch (errorArchivo) {
        console.error('No fue posible borrar el archivo de foto de perfil:', errorArchivo);
      }
    }

    await db.query('UPDATE usuarios SET foto_url = NULL WHERE id = ?', [req.usuario.id]);
    const [actualizados] = await db.query('SELECT id, nombre, cedula, email, rol, activo, debe_cambiar_contrasena, foto_url, correo_recuperacion FROM usuarios WHERE id = ? LIMIT 1', [req.usuario.id]);
    res.json({ mensaje: 'Foto de perfil eliminada.', usuario: actualizados[0] });
  } catch (error) {
    console.error('Error eliminando foto de perfil:', error);
    res.status(500).json({ error: 'No fue posible eliminar la foto de perfil' });
  }
});

app.delete('/api/admin/perfiles/:id', requireAdmin, requireAdminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador invalido' });
    if (id === req.usuario.id) return res.status(400).json({ error: 'No puedes eliminar tu propio acceso' });

    const [resultado] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json({ mensaje: 'Perfil eliminado. El acceso fue revocado.' });
  } catch (error) {
    console.error('Error eliminando perfil:', error);
    res.status(500).json({ error: 'No fue posible eliminar el perfil' });
  }
});

app.patch('/api/admin/perfiles/:id/contrasena', requireAdmin, requireAdminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const contrasena = String(req.body.contrasena || '');
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador invalido' });
    if (!esContrasenaSegura(contrasena)) return res.status(400).json({ error: 'La contraseña temporal debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo' });

    const [resultado] = await db.query('UPDATE usuarios SET password_hash = ?, debe_cambiar_contrasena = 1 WHERE id = ?', [crearHashContrasena(contrasena), id]);
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json({ mensaje: 'Contraseña restablecida.' });
  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    res.status(500).json({ error: 'No fue posible restablecer la contraseña' });
  }
});

app.post('/api/solicitudes-clientes', async (req, res) => {
  try {
    const nombre = String(req.body.nombre || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const telefono = String(req.body.telefono || '').trim();
    const vehiculo = String(req.body.vehiculo || '').trim();
    const mensaje = String(req.body.mensaje || '').trim() || null;
    if (!nombre || !email || !telefono || !vehiculo || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Completa nombre, correo, telefono y vehiculo' });
    }
    await db.query('INSERT INTO solicitudes_clientes (nombre, email, telefono, vehiculo, mensaje) VALUES (?, ?, ?, ?, ?)', [nombre, email, telefono, vehiculo, mensaje]);
    res.status(201).json({ mensaje: 'Solicitud enviada correctamente.' });
  } catch (error) {
    console.error('Error guardando solicitud:', error);
    res.status(500).json({ error: 'No fue posible enviar la solicitud' });
  }
});

app.get('/api/admin/solicitudes-clientes', requireAdmin, async (req, res) => {
  try {
    const [solicitudes] = await db.query(
      'SELECT id, nombre, email, telefono, vehiculo, mensaje, creado_en FROM solicitudes_clientes ORDER BY creado_en DESC, id DESC'
    );
    const [ventas] = await db.query('SELECT id, vehiculo_id, vehiculo, nombre, apellido, cedula, direccion, vendido_en FROM ventas_clientes ORDER BY vendido_en DESC, id DESC');
    res.json({ solicitudes, ventas });
  } catch (error) {
    console.error('Error cargando solicitudes:', error);
    res.status(500).json({ error: 'No fue posible cargar las solicitudes de clientes' });
  }
});

function validarComprador(datos) {
  const nombre = String(datos.nombre || '').trim();
  const apellido = String(datos.apellido || '').trim();
  const cedula = String(datos.cedula || '').trim();
  const direccion = String(datos.direccion || '').trim();
  return nombre && apellido && /^\d{11}$/.test(cedula) && direccion ? { nombre, apellido, cedula, direccion } : null;
}

app.put('/api/admin/ventas/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const comprador = validarComprador(req.body);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador inválido' });
    if (!comprador) return res.status(400).json({ error: 'Completa los datos del cliente e ingresa una cédula de 11 dígitos' });
    const [resultado] = await db.query('UPDATE ventas_clientes SET nombre = ?, apellido = ?, cedula = ?, direccion = ? WHERE id = ?', [comprador.nombre, comprador.apellido, comprador.cedula, comprador.direccion, id]);
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json({ mensaje: 'Datos del cliente actualizados.' });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ error: 'No fue posible actualizar el cliente' });
  }
});

app.delete('/api/admin/ventas/:id', requireAdmin, requireAdminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador invalido' });
    const [resultado] = await db.query('DELETE FROM ventas_clientes WHERE id = ?', [id]);
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ mensaje: 'Cliente eliminado.' });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ error: 'No fue posible eliminar el cliente' });
  }
});

app.get('/api/admin/ventas/:id/constancia', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador invalido' });
    const [ventas] = await db.query(
      `SELECT venta.*, vehiculo.marca, vehiculo.modelo, vehiculo.${yearColumn} AS anio, vehiculo.precio, vehiculo.moneda, vehiculo.tipo, vehiculo.transmision, vehiculo.combustible, vehiculo.color_exterior, vehiculo.kilometraje
       FROM ventas_clientes venta LEFT JOIN vehiculos vehiculo ON vehiculo.id = venta.vehiculo_id WHERE venta.id = ?`,
      [id]
    );
    const venta = ventas[0];
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

    const fechaGeneracion = new Date();
    const formatoFecha = new Intl.DateTimeFormat('es-DO', { dateStyle: 'long', timeStyle: 'short' }).format(fechaGeneracion);
    const archivo = 'constancia-venta.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${archivo}"`);
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    doc.pipe(res);
    const logo = path.join(__dirname, '..', 'JAK-Movil-App', 'src', 'assets', 'images', 'Logo_Dealer.jpg');
    if (fs.existsSync(logo)) doc.image(logo, 48, 34, { fit: [92, 76] });
    doc.fillColor('#231f20').fontSize(22).font('Helvetica-BoldOblique').text('ROSYBEL AUTO SALES', 154, 46);
    doc.fillColor('#231f20').fontSize(9).font('Helvetica-Bold').text('SERVICES, S.R.L.', 154, 72);
    doc.fillColor('#374151').fontSize(10).font('Helvetica').text('Constancia de venta de vehículo', 154, 88);
    doc.moveTo(48, 112).lineTo(547, 112).strokeColor('#dc2626').stroke();
    doc.fillColor('#111827').fontSize(17).font('Helvetica-Bold').text('CONSTANCIA DE VENTA', 48, 132);
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text(`Fecha y hora de generación: ${formatoFecha}`, 48, 158);
    doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Datos del cliente', 48, 202);
    doc.fillColor('#374151').fontSize(11).font('Helvetica').text(`Nombre: ${venta.nombre} ${venta.apellido}`, 48, 226).text(`Cedula: ${venta.cedula}`, 48, 246).text(`Direccion: ${venta.direccion}`, 48, 266, { width: 470 });
    doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Detalles del vehiculo', 48, 326);
    const detalles = [
      ['Vehiculo', venta.vehiculo], ['Año', venta.anio || 'No especificado'], ['Tipo', venta.tipo || 'No especificado'], ['Transmision', venta.transmision || 'No especificada'], ['Combustible', venta.combustible || 'No especificado'], ['Color exterior', venta.color_exterior || 'No especificado'], ['Kilometraje', venta.kilometraje || 'No especificado'], ['Precio', venta.precio ? `${venta.moneda === 'DOP' ? 'RD$' : 'US$'} ${Number(venta.precio).toLocaleString('en-US')}` : 'Consultar precio'],
    ];
    let y = 352;
    detalles.forEach(([etiqueta, valor]) => { doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(10).text(`${etiqueta}:`, 48, y); doc.fillColor('#111827').font('Helvetica').text(String(valor), 175, y); y += 24; });
    doc.moveTo(48, 566).lineTo(547, 566).strokeColor('#e5e7eb').stroke();
    doc.fillColor('#6b7280').fontSize(9).text('Comprobante interno de la venta registrada en JAK MOVIL. Este documento no constituye una factura fiscal.', 48, 582, { align: 'center', width: 499 });
    doc.end();
  } catch (error) {
    console.error('Error generando el documento informativo:', error);
    if (!res.headersSent) res.status(500).json({ error: 'No fue posible generar el documento informativo' });
  }
});

function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function obtenerCarpetaVehiculo(id) {
  const carpetaUploads = path.join(__dirname, 'uploads');

  if (!fs.existsSync(carpetaUploads)) {
    return null;
  }

  const nombreBuscado = normalizarTexto(`Vehiculo ${id}`);

  const carpeta = fs.readdirSync(carpetaUploads, { withFileTypes: true }).find((elemento) => {
    return (
      elemento.isDirectory() &&
      normalizarTexto(elemento.name) === nombreBuscado
    );
  });

  return carpeta ? carpeta.name : null;
}

function obtenerFotosVehiculo(req, id) {
  const nombreCarpeta = obtenerCarpetaVehiculo(id);

  if (!nombreCarpeta) {
    return [];
  }

  const carpeta = path.join(__dirname, 'uploads', nombreCarpeta);
  const extensionesPermitidas = /\.(jpg|jpeg|png|webp)$/i;

  const archivos = fs
    .readdirSync(carpeta)
    .filter((archivo) => extensionesPermitidas.test(archivo))
    .sort((archivoA, archivoB) =>
      archivoA.localeCompare(archivoB, undefined, { numeric: true })
    );

  const fotoPortada = fotoPortadaPorVehiculo[id];

  if (fotoPortada) {
    archivos.sort((archivoA, archivoB) => {
      if (archivoA.toLowerCase() === fotoPortada.toLowerCase()) return -1;
      if (archivoB.toLowerCase() === fotoPortada.toLowerCase()) return 1;
      return 0;
    });
  }

  return archivos
    .map((archivo) => {
      return `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(
        nombreCarpeta
      )}/${encodeURIComponent(archivo)}`;
    });
}

function agregarFotos(req, vehiculo) {
  const fotos = obtenerFotosVehiculo(req, vehiculo.id);

  return {
    ...vehiculo,
    anio: vehiculo.anio ?? vehiculo.año,
    año: vehiculo.año ?? vehiculo.anio,
    imagen: fotos.length > 0 ? fotos[0] : vehiculo.imagen,
    fotos,
  };
}

function prepararVehiculoPublico(req, vehiculo) {
  const publico = { ...agregarFotos(req, vehiculo) };
  delete publico.sector;
  delete publico.vendedor;
  delete publico.descripcion;

  if (String(publico.condicion || '').toLowerCase().startsWith('usado')) {
    const kilometraje = String(publico.kilometraje || '').trim();
    const valor = Number(kilometraje.replace(/,/g, '').match(/[0-9]+(?:\.[0-9]+)?/)?.[0]);
    if (kilometraje && Number.isFinite(valor) && valor <= 2) publico.kilometraje = null;
  }

  return publico;
}

function validarAnio(valor) {
  if (valor === undefined || valor === '') {
    return null;
  }

  const anio = Number(valor);

  if (!Number.isInteger(anio) || anio < 1900 || anio > 2100) {
    return undefined;
  }

  return anio;
}

function validarPrecio(valor) {
  if (valor === undefined || valor === '') {
    return null;
  }

  const texto = String(valor).trim().toUpperCase();
  const moneda = /(?:RD\$|DOP)/.test(texto)
    ? 'DOP'
    : /(?:US\$|USD)/.test(texto)
      ? 'USD'
      : null;
  const precioTexto = texto
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '');
  const precio = Number(precioTexto);

  if (!Number.isFinite(precio) || precio < 0) {
    return undefined;
  }

  return { precio, moneda };
}

// Marcas y modelos para los selectores del filtro.
app.get('/api/vehiculos/filtros', async (req, res) => {
  try {
    const { marca, condicion } = req.query;
    const filtrosCondicion = [];
    const parametrosCondicion = [];

    if (condicion === 'Nuevo') {
      filtrosCondicion.push('condicion = ?');
      parametrosCondicion.push(condicion);
    } else if (condicion === 'Usado') {
      filtrosCondicion.push('condicion LIKE ?');
      parametrosCondicion.push('Usado%');
    }

    const whereCondicion = filtrosCondicion.length ? ` AND ${filtrosCondicion.join(' AND ')}` : '';

    const [marcas] = await db.query(
      `SELECT DISTINCT marca FROM vehiculos WHERE marca IS NOT NULL AND estado = 'disponible'${whereCondicion} ORDER BY marca ASC`,
      parametrosCondicion
    );

    const [anios] = await db.query(
      `SELECT DISTINCT ${yearColumn} AS anio FROM vehiculos WHERE estado = 'disponible'${whereCondicion} ORDER BY ${yearColumn} DESC`,
      parametrosCondicion
    );

    let consultaModelos =
      `SELECT DISTINCT modelo FROM vehiculos WHERE modelo IS NOT NULL AND estado = 'disponible'${whereCondicion}`;

    const parametros = [...parametrosCondicion];

    if (marca) {
      consultaModelos += ' AND marca = ?';
      parametros.push(marca);
    }

    consultaModelos += ' ORDER BY modelo ASC';

    const [modelos] = await db.query(consultaModelos, parametros);

    res.json({
      marcas: marcas.map((item) => item.marca),
      modelos: modelos.map((item) => item.modelo),
      anios: anios.map((item) => item.anio),
    });
  } catch (error) {
    console.error('Error al cargar filtros:', error);
    res.status(500).json({
      error: 'No se pudieron cargar las opciones de búsqueda',
    });
  }
});

// Búsqueda de vehículos.
app.get('/api/vehiculos', async (req, res) => {
  try {
    const { marca, modelo, anioDesde, anioHasta, condicion, precioDesde, precioHasta, moneda, orden } = req.query;

    const desde = validarAnio(anioDesde);
    const hasta = validarAnio(anioHasta);
    const precioMinimo = validarPrecio(precioDesde);
    const precioMaximo = validarPrecio(precioHasta);
    const monedaSeleccionada = moneda === 'USD' || moneda === 'DOP' ? moneda : null;

    if (
      desde === undefined ||
      hasta === undefined ||
      precioMinimo === undefined ||
      precioMaximo === undefined ||
      (desde && hasta && desde > hasta) ||
      (precioMinimo !== null &&
        precioMaximo !== null &&
        precioMinimo.precio > precioMaximo.precio) ||
      (!monedaSeleccionada &&
        precioMinimo?.moneda &&
        precioMaximo?.moneda &&
        precioMinimo.moneda !== precioMaximo.moneda)
    ) {
      return res.status(400).json({
        error: 'El rango de años o precios no es válido',
      });
    }

    let sql = "SELECT * FROM vehiculos WHERE estado = 'disponible'";
    const parametros = [];

    if (marca) {
      sql += ' AND marca = ?';
      parametros.push(marca);
    }

    if (modelo) {
      sql += ' AND modelo = ?';
      parametros.push(modelo);
    }

    if (desde) {
      sql += ' AND `año` >= ?';
      parametros.push(desde);
    }

    if (hasta) {
      sql += ' AND `año` <= ?';
      parametros.push(hasta);
    }

    const monedaPrecio = monedaSeleccionada || precioMinimo?.moneda || precioMaximo?.moneda;
    if (monedaPrecio) {
      sql += ' AND moneda = ?';
      parametros.push(monedaPrecio);
    }

    if (precioMinimo !== null) {
      sql += ' AND precio >= ?';
      parametros.push(precioMinimo.precio);
    }

    if (precioMaximo !== null) {
      sql += ' AND precio <= ?';
      parametros.push(precioMaximo.precio);
    }

    if (condicion) {
      if (condicion === 'Nuevo') {
        sql += ' AND condicion = ?';
        parametros.push(condicion);
      } else if (condicion === 'Usado') {
        sql += ' AND condicion LIKE ?';
        parametros.push('Usado%');
      }
    }

    const precioComparable = `(CASE WHEN moneda = 'USD' THEN precio * ${DOP_PER_USD} ELSE precio END)`;

    switch (orden) {
      case 'precio_asc':
        sql += ` ORDER BY ${precioComparable} ASC, ${yearColumn} DESC`;
        break;
      case 'precio_desc':
        sql += ` ORDER BY ${precioComparable} DESC, ${yearColumn} DESC`;
        break;
      case 'anio_asc':
        sql += ` ORDER BY ${yearColumn} ASC, marca ASC, modelo ASC`;
        break;
      case 'anio_desc':
        sql += ` ORDER BY ${yearColumn} DESC, marca ASC, modelo ASC`;
        break;
      case 'recientes':
        sql += ' ORDER BY publicado_en DESC, id DESC';
        break;
      default:
        sql += ` ORDER BY ${yearColumn} DESC, marca ASC, modelo ASC`;
    }

    const [vehiculos] = await db.query(sql, parametros);

    res.json(vehiculos.map((vehiculo) => prepararVehiculoPublico(req, vehiculo)));
  } catch (error) {
    console.error('Error al buscar vehículos:', error);
    res.status(500).json({
      error: 'No se pudieron consultar los vehículos',
    });
  }
});

// Hasta ocho vehículos disponibles elegidos al azar en cada carga de la portada.
app.get('/api/vehiculos/carrusel', async (req, res) => {
  try {
    const [vehiculos] = await db.query(
      "SELECT * FROM vehiculos WHERE estado = 'disponible' ORDER BY RAND() LIMIT 8"
    );
    res.set('Cache-Control', 'no-store');
    res.json(vehiculos.map((vehiculo) => prepararVehiculoPublico(req, vehiculo)));
  } catch (error) {
    console.error('Error cargando el carrusel:', error);
    res.status(500).json({ error: 'No fue posible cargar el carrusel' });
  }
});

// Fotos de un vehículo. Debe ir antes de la ruta /:id.
app.get('/api/vehiculos/:id/fotos', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: 'El identificador del vehículo no es válido',
    });
  }

  res.json({
    fotos: obtenerFotosVehiculo(req, id),
  });
});

// Información completa de un vehículo.
app.get('/api/vehiculos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'El identificador del vehículo no es válido',
      });
    }

    const [vehiculos] = await db.query(
      "SELECT * FROM vehiculos WHERE id = ? AND estado = 'disponible'",
      [id]
    );

    if (vehiculos.length === 0) {
      return res.status(404).json({
        error: 'Vehículo no encontrado',
      });
    }

    res.json(prepararVehiculoPublico(req, vehiculos[0]));
  } catch (error) {
    console.error('Error al cargar vehículo:', error);
    res.status(500).json({
      error: 'No se pudo cargar el vehículo',
    });
  }
});

app.get('/api/admin/vehiculos', requireAdmin, async (req, res) => {
  try {
    const [vehiculos] = await db.query(`SELECT vehiculos.*, EXISTS (SELECT 1 FROM ventas_clientes WHERE ventas_clientes.vehiculo_id = vehiculos.id) AS tiene_venta FROM vehiculos ORDER BY vehiculos.id DESC`);
    res.json(vehiculos.map((vehiculo) => agregarFotos(req, vehiculo)));
  } catch (error) {
    console.error('Error cargando inventario de administracion:', error);
    res.status(500).json({ error: 'No fue posible cargar el inventario' });
  }
});

// Todas las operaciones que alteran el inventario requieren un administrador.
app.post('/api/admin/vehiculos', requireAdmin, async (req, res) => {
  try {
    const vehiculo = validarVehiculo(req.body);
    if (!vehiculo) return res.status(400).json({ error: 'Datos del vehiculo incompletos o invalidos' });

    const [resultado] = await db.query(
      `INSERT INTO vehiculos (marca, modelo, ${yearColumn}, precio, moneda, tipo, transmision, combustible, condicion, color_exterior, kilometraje, accesorios, descripcion, publicado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [vehiculo.marca, vehiculo.modelo, vehiculo.anio, vehiculo.precio, vehiculo.moneda, vehiculo.tipo, vehiculo.transmision, vehiculo.combustible, vehiculo.condicion, vehiculo.color_exterior, vehiculo.kilometraje, vehiculo.accesorios, vehiculo.descripcion]
    );
    const [vehiculos] = await db.query('SELECT * FROM vehiculos WHERE id = ?', [resultado.insertId]);
    res.status(201).json(agregarFotos(req, vehiculos[0]));
  } catch (error) {
    console.error('Error creando vehiculo:', error);
    res.status(500).json({ error: 'No fue posible crear el vehiculo' });
  }
});

app.put('/api/admin/vehiculos/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const vehiculo = validarVehiculo(req.body);
    if (!Number.isInteger(id) || id <= 0 || !vehiculo) return res.status(400).json({ error: 'Datos del vehiculo invalidos' });

    const [resultado] = await db.query(
      `UPDATE vehiculos SET marca = ?, modelo = ?, ${yearColumn} = ?, precio = ?, moneda = ?, tipo = ?, transmision = ?, combustible = ?, condicion = ?, color_exterior = ?, kilometraje = ?, accesorios = ?, descripcion = ? WHERE id = ?`,
      [vehiculo.marca, vehiculo.modelo, vehiculo.anio, vehiculo.precio, vehiculo.moneda, vehiculo.tipo, vehiculo.transmision, vehiculo.combustible, vehiculo.condicion, vehiculo.color_exterior, vehiculo.kilometraje, vehiculo.accesorios, vehiculo.descripcion, id]
    );
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Vehiculo no encontrado' });
    const [vehiculos] = await db.query('SELECT * FROM vehiculos WHERE id = ?', [id]);
    res.json(agregarFotos(req, vehiculos[0]));
  } catch (error) {
    console.error('Error actualizando vehiculo:', error);
    res.status(500).json({ error: 'No fue posible actualizar el vehiculo' });
  }
});

app.post('/api/admin/vehiculos/:id/fotos', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const coincidencia = String(req.body.dataUrl || '').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!Number.isInteger(id) || id <= 0 || !coincidencia) {
      return res.status(400).json({ error: 'Selecciona una imagen JPG, PNG o WebP valida' });
    }

    const contenido = Buffer.from(coincidencia[2], 'base64');
    if (!contenido.length || contenido.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'La imagen debe pesar como maximo 5 MB' });
    }

    const [vehiculos] = await db.query('SELECT id FROM vehiculos WHERE id = ?', [id]);
    if (!vehiculos[0]) return res.status(404).json({ error: 'Vehiculo no encontrado' });

    const extension = coincidencia[1] === 'jpeg' ? 'jpg' : coincidencia[1];
    const carpeta = path.join(__dirname, 'uploads', `Vehiculo ${id}`);
    fs.mkdirSync(carpeta, { recursive: true });
    const archivo = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`;
    fs.writeFileSync(path.join(carpeta, archivo), contenido);

    res.status(201).json({
      foto: `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(`Vehiculo ${id}`)}/${archivo}`,
    });
  } catch (error) {
    console.error('Error subiendo foto:', error);
    res.status(500).json({ error: 'No fue posible subir la foto' });
  }
});

app.patch('/api/admin/vehiculos/:id/vender', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador invalido' });
    const nombre = String(req.body.nombre || '').trim();
    const apellido = String(req.body.apellido || '').trim();
    const cedula = String(req.body.cedula || '').trim();
    const direccion = String(req.body.direccion || '').trim();
    if (!nombre || !apellido || !cedula || !direccion) return res.status(400).json({ error: 'Completa los datos del comprador' });
    if (!/^\d{11}$/.test(cedula)) return res.status(400).json({ error: 'Ingresa un número de cédula de 11 dígitos' });
    const [vehiculos] = await db.query("SELECT id, marca, modelo FROM vehiculos WHERE id = ? AND estado = 'disponible'", [id]);
    if (!vehiculos[0]) return res.status(404).json({ error: 'Vehiculo no disponible para venta' });
    const [resultado] = await db.query(
      "UPDATE vehiculos SET estado = 'vendido', vendido_en = NOW(), historial_venta_visible = 1 WHERE id = ? AND estado = 'disponible'",
      [id]
    );
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Vehiculo no disponible para venta' });
    const vehiculo = `${vehiculos[0].marca} ${vehiculos[0].modelo}`;
    await db.query('INSERT INTO ventas_clientes (vehiculo_id, vehiculo, nombre, apellido, cedula, direccion) VALUES (?, ?, ?, ?, ?, ?)', [id, vehiculo, nombre, apellido, cedula, direccion]);
    res.json({ mensaje: 'Vehiculo marcado como vendido.' });
  } catch (error) {
    console.error('Error marcando vehiculo vendido:', error);
    res.status(500).json({ error: 'No fue posible registrar la venta' });
  }
});

app.patch('/api/admin/vehiculos/:id/cancelar-venta', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador invalido' });
    const [resultado] = await db.query(
      "UPDATE vehiculos SET estado = 'disponible', publicado_en = NOW() WHERE id = ? AND estado IN ('vendido', 'disponible')",
      [id]
    );
    if (!resultado.affectedRows) return res.status(404).json({ error: 'No se encontro una venta para cancelar' });
    res.json({ mensaje: 'Venta cancelada. El vehiculo vuelve a aparecer como recien agregado.' });
  } catch (error) {
    console.error('Error cancelando venta:', error);
    res.status(500).json({ error: 'No fue posible cancelar la venta' });
  }
});

app.delete('/api/admin/vehiculos-vendidos/historial', requireAdmin, requireAdminOnly, async (req, res) => {
  try {
    const [resultado] = await db.query(
      `UPDATE vehiculos vehiculo
       LEFT JOIN ventas_clientes venta ON venta.vehiculo_id = vehiculo.id
       SET vehiculo.historial_venta_visible = 0
       WHERE vehiculo.historial_venta_visible = 1
         AND (vehiculo.estado = 'vendido' OR vehiculo.vendido_en IS NOT NULL OR venta.id IS NOT NULL)`
    );

    res.json({
      mensaje: resultado.affectedRows
        ? `Historial limpiado correctamente. ${resultado.affectedRows} vehículo(s) dejaron de mostrarse en esta sección.`
        : 'El historial de vehículos vendidos ya estaba vacío.',
      ocultados: resultado.affectedRows,
    });
  } catch (error) {
    console.error('Error limpiando historial de vendidos:', error);
    res.status(500).json({ error: 'No fue posible limpiar el historial de vehículos vendidos' });
  }
});

app.delete('/api/admin/vehiculos/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Identificador invalido' });
    const [resultado] = await db.query('DELETE FROM vehiculos WHERE id = ?', [id]);
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Vehiculo no encontrado' });
    res.status(204).end();
  } catch (error) {
    console.error('Error eliminando vehiculo:', error);
    res.status(500).json({ error: 'No fue posible eliminar el vehiculo' });
  }
});

Promise.all([prepararUsuarios(), prepararInventario(), prepararSolicitudes(), prepararVentas()])
  .then(async () => {
    await prepararRecuperacionContrasenas();
    await prepararRelaciones();
    app.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No fue posible preparar la tabla de usuarios:', error.message);
    process.exit(1);
  });
