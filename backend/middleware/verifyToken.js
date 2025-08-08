import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  try {
    // Registrar información de la ruta para depuración
    const urlToken = req.query.token;

    // Verificar si el token viene en los headers
    let authHeader = req.headers.authorization;

    // Si no hay token en ninguna parte
    if (!authHeader && !urlToken) {
      console.error("[ERROR] No hay token en el header ni en la URL");
      return res.status(401).json({
        error: "Token requerido",
        details: "No se proporcionó el token de autenticación",
      });
    } // Si el token viene en la URL pero no en los headers, lo añadimos a los headers
    if (!authHeader && urlToken) {
      req.headers.authorization = `Bearer ${urlToken}`;
      // Actualizar la referencia para siguientes pasos
      authHeader = req.headers.authorization;
    }

    // Si después de todo no hay token válido, retornar error
    if (!authHeader) {
      console.error("[ERROR] No hay token en el header ni en la URL");
      return res.status(401).json({
        error: "Token requerido",
        details: "No se proporcionó el token de autenticación",
      });
    }

    const [bearer, token] = authHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      console.error("[ERROR] Formato del token inválido");
      return res.status(401).json({
        error: "Formato del token inválido",
        details: "El token debe estar en el formato: Bearer <token>",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("[ERROR CRÍTICO] JWT_SECRET no está definido");
      return res.status(500).json({
        error: "Error de configuración del servidor",
        details: "Contacte al administrador del sistema",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log(
      "[VERIFY-TOKEN] Decoded token:",
      JSON.stringify(decoded, null, 2)
    );

    if (!decoded.id_usuario || !decoded.email) {
      console.error(
        "[ERROR] Token decodificado no contiene la información necesaria"
      );
      console.error("[ERROR] Decoded object:", decoded);
      return res.status(401).json({
        error: "Token inválido",
        details: "El token no contiene la información requerida",
      });
    }

    // Añadir información del usuario al request
    req.user = {
      id: decoded.id_usuario,
      email: decoded.email,
      company_id: decoded.company_id, // ← NUEVO: company_id para multi-tenancy
      role: decoded.role || decoded.rol, // Compatibilidad con ambos nombres
      nombre: decoded.nombre,
      // Añadir otros campos necesarios del token
      iat: decoded.iat,
      exp: decoded.exp,
    };

    console.log(
      "[VERIFY-TOKEN] User object created:",
      JSON.stringify(req.user, null, 2)
    );

    // Verificar si el token está próximo a expirar (menos de 1 hora)
    const horaParaExpirar = decoded.exp - Math.floor(Date.now() / 1000);
    if (horaParaExpirar < 3600) {
      console.warn(
        `[AVISO] Token próximo a expirar para ${decoded.email}. Tiempo restante: ${horaParaExpirar}s`
      );
    }

    next();
  } catch (err) {
    console.error("[ERROR] Error al verificar el token:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expirado",
        details: "La sesión ha expirado, por favor inicie sesión nuevamente",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Token inválido",
        details: "El token proporcionado no es válido",
      });
    }

    console.error("[ERROR INESPERADO]", err);
    return res.status(500).json({
      error: "Error interno del servidor",
      details:
        process.env.NODE_ENV === "development" ? err.message : "Error interno",
    });
  }
};

export default verifyToken;
