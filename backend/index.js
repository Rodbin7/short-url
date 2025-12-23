
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Link = require('./models/Link');

// Conexión a la base de datos
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB conectado exitosamente.');
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error.message);
    process.exit(1); // Salir del proceso con error
  }
};

connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('<h1>API del Acortador de Enlaces funcionando!</h1>');
});

// Ruta de redirección
app.get('/r/:code', async (req, res) => {
  try {
    const link = await Link.findOne({ 
        $or: [{ shortCode: req.params.code }, { customAlias: req.params.code }] 
    });

    if (link) {
      link.clicks++;
      await link.save();
      return res.redirect(link.originalUrl);
    } else {
      return res.status(404).json({ error: 'Enlace no encontrado' });
    }
  } catch (error) {
    console.error('Error en la redirección:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Rutas de autenticación
app.use('/api/auth', require('./routes/auth'));

const auth = require('./middleware/auth');

// Ruta para acortar un enlace (protegida)
app.post('/api/shorten', auth, async (req, res) => {
  const { originalUrl, customAlias } = req.body;
  const owner = req.user.id;

  if (!originalUrl) {
    return res.status(400).json({ error: 'La URL original es requerida' });
  }

  try {
    // Si se provee un alias, verificar que no exista ya
    if (customAlias) {
      const existing = await Link.findOne({ customAlias });
      if (existing) {
        return res.status(400).json({ error: 'Este alias ya está en uso.' });
      }
    }

    const { nanoid } = await import('nanoid');
    const shortCode = nanoid(8);

    const link = new Link({
      originalUrl,
      shortCode,
      owner,
      customAlias: customAlias || null, // Guardar el alias si existe
    });

    await link.save();

    res.status(201).json(link);
  } catch (error) {
    console.error('Error al acortar el enlace:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para obtener todos los enlaces de un usuario
app.get('/api/links', auth, async (req, res) => {
  
  try {
    const links = await Link.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(links);
  } catch (error) {
    console.error('Error al obtener los enlaces:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para eliminar un enlace
app.delete('/api/links/:id', auth, async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);

    if (!link) {
      return res.status(404).json({ error: 'Enlace no encontrado' });
    }

    // Asegurarse de que el usuario es el propietario del enlace
    if (link.owner.toString() !== req.user.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    await link.deleteOne();

    res.json({ msg: 'Enlace eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el enlace:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
