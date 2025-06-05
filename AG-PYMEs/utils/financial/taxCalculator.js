//Servicio para manejar cálculos fiscales y financieros

// Constantes de tipos de IVA (valores por defecto)
// Nota: Estos valores deberían obtenerse de una configuración en la base de datos para poder ser modificados sin cambiar el código fuente
export const IVA_TYPES = {
  GENERAL: { name: "general", percentage: 21 },
  REDUCIDO: { name: "reducido", percentage: 10 },
  SUPER_REDUCIDO: { name: "superreducido", percentage: 4 },
  EXENTO: { name: "exento", percentage: 0 },
};

//Obtiene el porcentaje de IVA según el tipo
export const getIvaPercentage = (tipoIva = "general") => {
  switch (tipoIva) {
    case IVA_TYPES.GENERAL.name:
      return IVA_TYPES.GENERAL.percentage;
    case IVA_TYPES.REDUCIDO.name:
      return IVA_TYPES.REDUCIDO.percentage;
    case IVA_TYPES.SUPER_REDUCIDO.name:
      return IVA_TYPES.SUPER_REDUCIDO.percentage;
    case IVA_TYPES.EXENTO.name:
      return IVA_TYPES.EXENTO.percentage;
    default:
      return IVA_TYPES.GENERAL.percentage;
  }
};

//Calcula el importe de IVA basado en un subtotal y tipo de IVA
export const calculateIVA = (subtotal, tipoIva = "general") => {
  const porcentaje = getIvaPercentage(tipoIva);
  return (subtotal * porcentaje) / 100;
};

//Calcula el importe de retención IRPF
export const calculateIRPF = (subtotal, porcentajeRetencion = 0) => {
  return (subtotal * porcentajeRetencion) / 100;
};

//Formatea un valor monetario
export const formatCurrency = (amount, currency = "€", decimals = 2) => {
  return `${amount.toFixed(decimals)}${currency}`;
};

//Calcula el total con todos los impuestos y deducciones
export const calculateTotal = (
  subtotal,
  { tipoIva = "general", porcentajeRetencion = 0, descuento = 0 } = {}
) => {
  const porcentajeIva = getIvaPercentage(tipoIva);
  const impuestos = calculateIVA(subtotal, tipoIva);
  const retencion = calculateIRPF(subtotal, porcentajeRetencion);

  const total = subtotal - descuento + impuestos - retencion;

  return {
    subtotal,
    porcentajeIva,
    impuestos,
    porcentajeRetencion,
    retencion,
    descuento,
    total,
  };
};

export default {
  IVA_TYPES,
  getIvaPercentage,
  calculateIVA,
  calculateIRPF,
  formatCurrency,
  calculateTotal,
};
