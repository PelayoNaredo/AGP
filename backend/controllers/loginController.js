import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../db.js";

// controlador para iniciar sesión y generar JWT - uso de returns para evitar continuacion de ejecucion
const loginUser = async (req, res) => {
  const { email, contrasena } = req.body;

  if (!email || !contrasena) {
    return res.status(400).send("El email y la contraseña son requeridos");
  }

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" }); //envio en JSON
    }
    const user = rows[0];

    const isMatch = await bcrypt.compare(contrasena, user.contrasena); // comprobacion en bcrypt

    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" }); //envio en JSON
    }

    // crear el payload del JWT
    const payload = {
      id_usuario: user.id_usuario,
      email: user.email,
      nombre: user.nombre,
    };

    // firmar el JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "72h",
    });

    // enviar el token al cliente
    res.json({
      token,
      user: { id: user.id_usuario, email: user.email, rol: user.rol },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al iniciar sesión");
  }
};

export default loginUser;
