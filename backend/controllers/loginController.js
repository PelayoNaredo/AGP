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
    const { rows } = await pool.query(
      "SELECT u.*, c.company_name, c.subscription_plan FROM users u JOIN companies c ON u.company_id = c.id WHERE u.email = $1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" }); //envio en JSON
    }
    const user = rows[0];

    const isMatch = await bcrypt.compare(contrasena, user.contrasena); // comprobacion en bcrypt

    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" }); //envio en JSON
    }

    // crear el payload del JWT con información multi-tenant
    const payload = {
      id_usuario: user.id_usuario,
      email: user.email,
      nombre: user.nombre,
      company_id: user.company_id, // ← NUEVO: company_id para multi-tenancy
      role: user.rol,
    };

    // firmar el JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "72h",
    });

    // enviar el token al cliente con información de empresa
    res.json({
      token,
      user: {
        id: user.id_usuario,
        email: user.email,
        rol: user.rol,
        company_id: user.company_id, // ← NUEVO: company_id para frontend
        company_name: user.company_name,
        subscription_plan: user.subscription_plan,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al iniciar sesión");
  }
};

export default loginUser;
