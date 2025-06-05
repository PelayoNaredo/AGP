import pool from '../db.js'; // importamos la conexion a la bd
import bcrypt from 'bcrypt';

// controlador para crear un usuario
const createUser = async (req, res) => {
  const { email, nombre, contrasena } = req.body;

  // validar que todos los campos sean proporcionados (validacion correcta en frontend)
  if (!email || !nombre || !contrasena) {
    return res.status(400).send('Todos los campos (email, nombre, contraseña) son requeridos');
  }

  try {
    // verificar si el email ya esta registrado
    const emailCheckQuery = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(emailCheckQuery, [email]);

    if (rows.length > 0) {
      return res.status(400).send('El correo electrónico ya está registrado');
    }

    // hashificar la contrasena en 10 rondas
    const hashedPassword = await bcrypt.hash(contrasena, 10); 

    const rol = 'admin'; 

    // insertar usuario en la base de datos
    const insertQuery = `
      INSERT INTO users (email, nombre, contrasena, rol, fecha_registro)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id_usuario
    `;
    const { rows: newUserRows } = await pool.query(insertQuery, [email, nombre, hashedPassword, rol]);

    // devolver el id del usuario recien creado
    res.status(201).json({ id_usuario: newUserRows[0].id_usuario, message: 'Usuario creado con éxito' });
  } catch (err) {
    console.error('Error en createUser:', err.message, err.stack);
    res.status(500).json({ message: 'Error al crear el usuario', error: err.message });
  }
};

export default createUser;