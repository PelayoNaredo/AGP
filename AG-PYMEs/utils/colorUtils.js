/**
 * Aclara u oscurece un color hexadecimal
 * @param {string} color - El color hexadecimal (ej: "#FF0000")
 * @param {number} amount - Cantidad positiva para aclarar, negativa para oscurecer (ej: 20 para aclarar, -20 para oscurecer)
 * @returns {string} - El color modificado en formato hexadecimal
 */
export const LightenDarkenColor = (color, amount) => {
  let usePound = false;

  if (color[0] === "#") {
    color = color.slice(1);
    usePound = true;
  }

  const num = parseInt(color, 16);

  let r = (num >> 16) + amount;
  r = Math.max(Math.min(255, r), 0);

  let g = ((num >> 8) & 0x00ff) + amount;
  g = Math.max(Math.min(255, g), 0);

  let b = (num & 0x0000ff) + amount;
  b = Math.max(Math.min(255, b), 0);

  return (
    (usePound ? "#" : "") +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  );
};

/**
 * Genera un color aleatorio con contraste suficiente para texto blanco o negro
 * @returns {Object} - Objeto con color aleatorio y color de texto recomendado
 */
export const generateAccessibleRandomColor = () => {
  // Generar componentes RGB en un rango que garantice buena visibilidad
  // Evitamos colores demasiado claros o demasiado oscuros
  const r = Math.floor(Math.random() * 200) + 30; // 30-230
  const g = Math.floor(Math.random() * 200) + 30; // 30-230
  const b = Math.floor(Math.random() * 200) + 30; // 30-230

  // Convertir a hexadecimal
  const hexColor =
    "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

  // Calcular luminosidad para determinar si debe usarse texto negro o blanco
  // Fórmula de luminosidad percibida: 0.299*R + 0.587*G + 0.114*B
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Si la luminosidad es mayor a 0.5, usar texto negro, de lo contrario usar blanco
  const textColor = luminance > 0.5 ? "#000000" : "#FFFFFF";

  return {
    backgroundColor: hexColor,
    textColor: textColor,
  };
};
