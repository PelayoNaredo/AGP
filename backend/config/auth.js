import jwt from 'jsonwebtoken';

// middleware para verificar el JWT
export const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; 

  if (!token) {
    return res.status(403).send('Acceso denegado');
  }

  try {
    // verificar el token con la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // agregar los datos del usuario decodificados a la solicitud
    req.user = decoded;

    next(); // permitir que la solicitud continue
  } catch (err) {
    console.error(err);
    res.status(403).send('Token inválido');
  }
};
