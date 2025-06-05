export const validateSettingsUpdate = (req, res, next) => {
  const errors = [];
  const {
    nombre_local,
    direccion,
    telefono,
    url_backend,
    horario_apertura,
    horario_cierre,
    tema,
  } = req.body;

  // Validar nombre del local
  if (nombre_local && typeof nombre_local !== "string") {
    errors.push("El nombre del local debe ser un texto");
  }

  // Validar dirección
  if (direccion && typeof direccion !== "string") {
    errors.push("La dirección debe ser un texto");
  }

  // Validar teléfono
  if (telefono) {
    const phoneRegex = /^\+?[0-9]{6,15}$/;
    if (!phoneRegex.test(telefono)) {
      errors.push("El formato del teléfono no es válido");
    }
  }

  // Validar URL del backend
  if (url_backend) {
    try {
      new URL(url_backend);
    } catch (error) {
      errors.push("La URL del backend no es válida");
    }
  }

  // Validar horarios
  if (horario_apertura || horario_cierre) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (horario_apertura && !timeRegex.test(horario_apertura)) {
      errors.push("El formato del horario de apertura no es válido (HH:MM)");
    }

    if (horario_cierre && !timeRegex.test(horario_cierre)) {
      errors.push("El formato del horario de cierre no es válido (HH:MM)");
    }

    // Validar que la hora de cierre sea posterior a la de apertura
    if (horario_apertura && horario_cierre) {
      const apertura = new Date(`1970-01-01T${horario_apertura}`);
      const cierre = new Date(`1970-01-01T${horario_cierre}`);

      if (cierre <= apertura) {
        errors.push("El horario de cierre debe ser posterior al de apertura");
      }
    }
  }

  // Validar tema
  if (tema && !["claro", "oscuro", "system"].includes(tema)) {
    errors.push('El tema debe ser "claro", "oscuro" o "system"');
  }

  // Si hay errores, devolver respuesta con errores
  if (errors.length > 0) {
    return res.status(400).json({
      message: "Error de validación",
      errors,
    });
  }

  // Si todo está bien, continuar
  next();
};
