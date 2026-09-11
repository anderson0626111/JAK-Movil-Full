const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 3001;

const fotoPortadaPorVehiculo = {
  9: '2.jpg',
};

app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'cambia-esta-clave-antes-de-produccion';
const TOKEN_DURATION_MS = 8 * 60 * 60 * 1000;
const ADMIN_RECOVERY_KEY = process.env.ADMIN_RECOVERY_KEY || 'recuperar1234';
const yearColumn = '`a\u00f1o`';

function crearToken(usuario) {
  const contenido = Buffer.from(
    JSON.stringify({ id: usuario.id, email: usuario.email, rol: usuario.rol, exp: Date.now() + TOKEN_DURATION_MS })
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

function requireAdmin(req, res, next) {
  const [tipo, token] = String(req.headers.authorization || '').split(' ');
  const usuario = tipo === 'Bearer' ? leerToken(token) : null;

  if (!usuario || !['admin', 'empleado'].includes(usuario.rol)) {
    return res.status(401).json({ error: 'Acceso requerido' });
  }

  req.usuario = usuario;
  next();
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

function validarVehiculo(datos) {
  const requerido = ['marca', 'modelo', 'anio', 'precio', 'moneda', 'tipo', 'transmision', 'combustible'];
  const faltante = requerido.find((campo) => datos[campo] === undefined || String(datos[campo]).trim() === '');
  const anio = Number(datos.anio);
  const precio = Number(datos.precio);

  if (faltante || !Number.isInteger(anio) || anio < 1900 || anio > 2100 || !Number.isFinite(precio) || precio <= 0 || !['USD', 'DOP'].includes(datos.moneda)) {
    return null;
  }

  return {
    marca: String(datos.marca).trim(), modelo: String(datos.modelo).trim(), anio, precio,
    moneda: datos.moneda, tipo: String(datos.tipo).trim(), transmision: String(datos.transmision).trim(),
    combustible: String(datos.combustible).trim(), condicion: String(datos.condicion || 'Usado').trim(),
    color_exterior: datos.color_exterior ? String(datos.color_exterior).trim() : null,
    kilometraje: datos.kilometraje ? String(datos.kilometraje).trim() : null,
    accesorios: datos.accesorios ? String(datos.accesorios).trim() : null,
    descripcion: datos.descripcion ? String(datos.descripcion).trim() : null,
  };
}

async function prepararUsuarios() {
  await db.query(`CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'empleado', 'usuario') NOT NULL DEFAULT 'empleado',
    debe_cambiar_contrasena TINYINT(1) NOT NULL DEFAULT 0,
    foto_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY usuarios_email_unique (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.query("ALTER TABLE usuarios MODIFY rol ENUM('admin', 'empleado', 'usuario') NOT NULL DEFAULT 'empleado'");
  const columnasUsuarios = await db.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'debe_cambiar_contrasena'"
  );
  if (!columnasUsuarios[0].length) {
    await db.query('ALTER TABLE usuarios ADD COLUMN debe_cambiar_contrasena TINYINT(1) NOT NULL DEFAULT 0');
  }
  const columnasFotoPerfil = await db.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'foto_url'"
  );
  if (!columnasFotoPerfil[0].length) {
    await db.query('ALTER TABLE usuarios ADD COLUMN foto_url VARCHAR(500) NULL');
  }

  await db.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, \'admin\') ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), rol = \'admin\'',
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
    vehiculo_id INT NOT NULL,
    vehiculo VARCHAR(180) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    apellido VARCHAR(120) NOT NULL,
    cedula VARCHAR(50) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    vendido_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

async function prepararInventario() {
  const columnas = await db.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehiculos' AND COLUMN_NAME IN ('estado', 'vendido_en', 'publicado_en')"
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
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || req.body.usuario || '').trim().toLowerCase();
    const contrasena = String(req.body.contrasena || '');
    const [usuarios] = await db.query(
      'SELECT id, nombre, email, password_hash, rol, debe_cambiar_contrasena, foto_url FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );
    const usuario = usuarios[0];

    if (!usuario) {
      return res.status(404).json({ error: 'Este usuario no existe' });
    }

    const esClaveRecuperacion = usuario.email === 'admin' && usuario.rol === 'admin' && contrasena === ADMIN_RECOVERY_KEY;
    const contrasenaCorrecta = verificarContrasena(contrasena, usuario.password_hash);

    if (!['admin', 'empleado'].includes(usuario.rol) || (!contrasenaCorrecta && !esClaveRecuperacion)) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    if (esClaveRecuperacion) {
      await db.query('UPDATE usuarios SET debe_cambiar_contrasena = 1 WHERE id = ?', [usuario.id]);
      usuario.debe_cambiar_contrasena = 1;
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
    const email = String(req.body.email || req.body.usuario || '').trim().toLowerCase();
    const contrasena = String(req.body.contrasena || '');

    if (!nombre || !email || contrasena.length < 4) {
      return res.status(400).json({ error: 'Completa nombre, usuario y contraseña' });
    }
    if (/\s/.test(email)) {
      return res.status(400).json({ error: 'El usuario no debe contener espacios' });
    }

    const passwordHash = crearHashContrasena(contrasena);
    const [resultado] = await db.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, \'empleado\')',
      [nombre, email, passwordHash]
    );
    const usuario = { id: resultado.insertId, nombre, email, rol: 'empleado' };
    res.status(201).json({ token: crearToken(usuario), usuario });
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ese usuario ya esta registrado' });
    }
    console.error('Error de registro:', error);
    res.status(500).json({ error: 'No fue posible registrar el usuario' });
  }
});

app.get('/api/auth/me', requireAdmin, async (req, res) => {
  const [usuarios] = await db.query('SELECT id, nombre, email, rol, debe_cambiar_contrasena, foto_url FROM usuarios WHERE id = ? LIMIT 1', [req.usuario.id]);
  if (!usuarios[0] || !['admin', 'empleado'].includes(usuarios[0].rol)) return res.status(401).json({ error: 'Sesion no valida' });
  res.json({ usuario: usuarios[0] });
});

app.put('/api/auth/perfil', requireAdmin, async (req, res) => {
  try {
    const nombre = String(req.body.nombre || '').trim();
    const contrasena = String(req.body.contrasena || '');

    if (!nombre) return res.status(400).json({ error: 'Ingresa el nombre' });
    if (contrasena && contrasena.length < 4) return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });

    const [actuales] = await db.query('SELECT debe_cambiar_contrasena FROM usuarios WHERE id = ? LIMIT 1', [req.usuario.id]);
    if (actuales[0]?.debe_cambiar_contrasena && !contrasena) {
      return res.status(400).json({ error: 'Debes crear una nueva contraseña para recuperar el acceso' });
    }

    if (contrasena) {
      await db.query('UPDATE usuarios SET nombre = ?, password_hash = ?, debe_cambiar_contrasena = 0 WHERE id = ?', [nombre, crearHashContrasena(contrasena), req.usuario.id]);
    } else {
      await db.query('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombre, req.usuario.id]);
    }

    const [usuarios] = await db.query('SELECT id, nombre, email, rol, debe_cambiar_contrasena, foto_url FROM usuarios WHERE id = ? LIMIT 1', [req.usuario.id]);
    res.json({ mensaje: 'Perfil actualizado.', usuario: usuarios[0] });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'No fue posible actualizar el perfil' });
  }
});

app.get('/api/admin/perfiles', requireAdmin, requireAdminOnly, async (req, res) => {
  try {
    const [perfiles] = await db.query('SELECT id, nombre, email, rol, foto_url, created_at FROM usuarios ORDER BY created_at DESC, id DESC');
    res.json({ perfiles });
  } catch (error) {
    console.error('Error cargando perfiles:', error);
    res.status(500).json({ error: 'No fue posible cargar los perfiles' });
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
    const [usuarios] = await db.query('SELECT id, nombre, email, rol, debe_cambiar_contrasena, foto_url FROM usuarios WHERE id = ? LIMIT 1', [req.usuario.id]);
    res.status(201).json({ mensaje: 'Foto de perfil actualizada.', usuario: usuarios[0] });
  } catch (error) {
    console.error('Error subiendo foto de perfil:', error);
    res.status(500).json({ error: 'No fue posible subir la foto de perfil' });
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
    if (contrasena.length < 4) return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });

    const [resultado] = await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [crearHashContrasena(contrasena), id]);
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
  return nombre && apellido && cedula && direccion ? { nombre, apellido, cedula, direccion } : null;
}

app.put('/api/admin/ventas/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const comprador = validarComprador(req.body);
    if (!Number.isInteger(id) || id <= 0 || !comprador) return res.status(400).json({ error: 'Completa los datos del cliente' });
    const [resultado] = await db.query('UPDATE ventas_clientes SET nombre = ?, apellido = ?, cedula = ?, direccion = ? WHERE id = ?', [comprador.nombre, comprador.apellido, comprador.cedula, comprador.direccion, id]);
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json({ mensaje: 'Datos del cliente actualizados.' });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ error: 'No fue posible actualizar el cliente' });
  }
});

app.delete('/api/admin/ventas/:id', requireAdmin, async (req, res) => {
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

app.get('/api/admin/ventas/:id/factura', requireAdmin, async (req, res) => {
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

    const fecha = new Date(venta.vendido_en);
    const formatoFecha = new Intl.DateTimeFormat('es-DO', { dateStyle: 'long', timeStyle: 'short' }).format(fecha);
    const archivo = `factura-venta-${venta.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${archivo}"`);
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    doc.pipe(res);
    const logo = path.join(__dirname, '..', 'JAK-Movil-App', 'src', 'assets', 'images', 'Logo_Dealer.jpg');
    if (fs.existsSync(logo)) doc.image(logo, 48, 34, { fit: [92, 76] });
    doc.fillColor('#231f20').fontSize(22).font('Helvetica-BoldOblique').text('ROSYBEL AUTO SALES', 154, 46);
    doc.fillColor('#231f20').fontSize(9).font('Helvetica-Bold').text('SERVICES, S.R.L.', 154, 72);
    doc.fillColor('#374151').fontSize(10).font('Helvetica').text('Factura de venta', 154, 88);
    doc.moveTo(48, 112).lineTo(547, 112).strokeColor('#dc2626').stroke();
    doc.fillColor('#111827').fontSize(17).font('Helvetica-Bold').text(`FACTURA #${venta.id}`, 48, 132);
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica').text(`Fecha y hora de compra: ${formatoFecha}`, 48, 158);
    doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Datos del cliente', 48, 202);
    doc.fillColor('#374151').fontSize(11).font('Helvetica').text(`Nombre: ${venta.nombre} ${venta.apellido}`, 48, 226).text(`Cedula: ${venta.cedula}`, 48, 246).text(`Direccion: ${venta.direccion}`, 48, 266, { width: 470 });
    doc.fillColor('#111827').fontSize(13).font('Helvetica-Bold').text('Detalles del vehiculo', 48, 326);
    const detalles = [
      ['Vehiculo', venta.vehiculo], ['Año', venta.anio || 'No especificado'], ['Tipo', venta.tipo || 'No especificado'], ['Transmision', venta.transmision || 'No especificada'], ['Combustible', venta.combustible || 'No especificado'], ['Color exterior', venta.color_exterior || 'No especificado'], ['Kilometraje', venta.kilometraje || 'No especificado'], ['Precio', venta.precio ? `${venta.moneda === 'DOP' ? 'RD$' : 'US$'} ${Number(venta.precio).toLocaleString('en-US')}` : 'Consultar precio'],
    ];
    let y = 352;
    detalles.forEach(([etiqueta, valor]) => { doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(10).text(`${etiqueta}:`, 48, y); doc.fillColor('#111827').font('Helvetica').text(String(valor), 175, y); y += 24; });
    doc.moveTo(48, 566).lineTo(547, 566).strokeColor('#e5e7eb').stroke();
    doc.fillColor('#6b7280').fontSize(9).text('Gracias por confiar en Rosybel Auto Sales.', 48, 582, { align: 'center', width: 499 });
    doc.end();
  } catch (error) {
    console.error('Error generando factura:', error);
    if (!res.headersSent) res.status(500).json({ error: 'No fue posible generar la factura' });
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

    if (precioMinimo !== null && precioMaximo === null) {
      sql += ' AND precio = ?';
      parametros.push(precioMinimo.precio);
    } else if (precioMinimo !== null) {
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

    sql += orden === 'recientes'
      ? ' ORDER BY publicado_en DESC, id DESC'
      : ' ORDER BY `año` DESC, marca ASC, modelo ASC';

    const [vehiculos] = await db.query(sql, parametros);

    res.json(vehiculos.map((vehiculo) => agregarFotos(req, vehiculo)));
  } catch (error) {
    console.error('Error al buscar vehículos:', error);
    res.status(500).json({
      error: 'No se pudieron consultar los vehículos',
    });
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

    res.json(agregarFotos(req, vehiculos[0]));
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
    const [vehiculos] = await db.query("SELECT id, marca, modelo FROM vehiculos WHERE id = ? AND estado = 'disponible'", [id]);
    if (!vehiculos[0]) return res.status(404).json({ error: 'Vehiculo no disponible para venta' });
    const [resultado] = await db.query(
      "UPDATE vehiculos SET estado = 'vendido', vendido_en = NOW() WHERE id = ? AND estado = 'disponible'",
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
    app.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('No fue posible preparar la tabla de usuarios:', error.message);
    process.exit(1);
  });
