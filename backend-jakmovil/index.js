const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

  return fs
    .readdirSync(carpeta)
    .filter((archivo) => extensionesPermitidas.test(archivo))
    .sort()
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

// Marcas y modelos para los selectores del filtro.
app.get('/api/vehiculos/filtros', async (req, res) => {
  try {
    const { marca } = req.query;

    const [marcas] = await db.query(
      'SELECT DISTINCT marca FROM vehiculos WHERE marca IS NOT NULL ORDER BY marca ASC'
    );

    let consultaModelos =
      'SELECT DISTINCT modelo FROM vehiculos WHERE modelo IS NOT NULL';

    const parametros = [];

    if (marca) {
      consultaModelos += ' AND marca = ?';
      parametros.push(marca);
    }

    consultaModelos += ' ORDER BY modelo ASC';

    const [modelos] = await db.query(consultaModelos, parametros);

    res.json({
      marcas: marcas.map((item) => item.marca),
      modelos: modelos.map((item) => item.modelo),
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
    const { marca, modelo, anioDesde, anioHasta, condicion } = req.query;

    const desde = validarAnio(anioDesde);
    const hasta = validarAnio(anioHasta);

    if (
      desde === undefined ||
      hasta === undefined ||
      (desde && hasta && desde > hasta)
    ) {
      return res.status(400).json({
        error: 'El rango de años no es válido',
      });
    }

    let sql = 'SELECT * FROM vehiculos WHERE 1 = 1';
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
      sql += ' AND anio >= ?';
      parametros.push(desde);
    }

    if (hasta) {
      sql += ' AND anio <= ?';
      parametros.push(hasta);
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

    sql += ' ORDER BY anio DESC, marca ASC, modelo ASC';

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
      'SELECT * FROM vehiculos WHERE id = ?',
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

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});