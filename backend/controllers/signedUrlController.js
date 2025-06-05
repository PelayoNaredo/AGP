import { generateSignedUrl } from "../middleware/signedUrl.js";

// Genera una URL firmada para acceder a un archivo
export const generateSignedUrlController = (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        error: "Nombre de archivo requerido",
        details: "Debe proporcionar un nombre de archivo válido",
      });
    }

    // Obtener la URL base
    const protocol = req.protocol;
    const host = req.get("host");
    const baseUrl = `${protocol}://${host}`;

    // Obtener datos del usuario desde el token (ya verificado por verifyToken)
    const userData = req.user
      ? {
          id: req.user.id,
          email: req.user.email,
        }
      : null;

    // Generar URL firmada (por defecto válida por 7 días)
    const signedUrl = generateSignedUrl(filename, baseUrl, userData);

    return res.status(200).json({
      signedUrl,
      expiresIn: "7 days",
    });
  } catch (error) {
    console.error("[SignedUrlController] Error:", error);
    return res.status(500).json({
      error: "Error generando URL firmada",
      details: error.message,
    });
  }
};
