const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @ruta    POST api/auth/register
// @desc    Registrar un nuevo usuario y devolver token
// @acceso  Público
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'El usuario ya existe' });
    }

    user = new User({
      email,
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
});

// @ruta    POST api/auth/login
// @desc    Iniciar sesión y obtener token
// @acceso  Público
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Lógica para usuario de prueba: encontrarlo o crearlo si no existe
    if (email === 'test@test.com') {
      let user = await User.findOne({ email });

      // Si el usuario de prueba no existe, lo creamos
      if (!user) {
        user = new User({
          email: 'test@test.com',
          password: 'password123', // La contraseña se hashea antes de guardar
        });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash('password123', salt);
        await user.save();
      }
      
      // Una vez que el usuario existe, procedemos a comparar la contraseña
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Credenciales inválidas para el usuario de prueba' });
      }

      // Si las credenciales son correctas, generamos el token
      const payload = { user: { id: user.id } };
      return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 3600 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    }

    // Lógica para usuarios normales
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
});

const authMiddleware = require('../middleware/auth');

// @ruta    GET api/auth/user
// @desc    Obtener datos del usuario autenticado
// @acceso  Privado
router.get('/user', authMiddleware, async (req, res) => {
  try {
    // El middleware ya ha validado el token y añadido req.user
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  }
});

module.exports = router;
