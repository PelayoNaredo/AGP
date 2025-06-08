import { registerTranslation } from "react-native-paper-dates";

// Registrar las traducciones en español para react-native-paper-dates
export const configureDatePicker = () => {
  registerTranslation("es", {
    save: "Guardar",
    selectSingle: "Seleccionar fecha",
    selectMultiple: "Seleccionar fechas",
    selectRange: "Seleccionar periodo",
    notAccordingToDateFormat: (inputFormat) =>
      `Formato de fecha debe ser ${inputFormat}`,
    mustBeHigherThan: (date) => `Debe ser posterior a ${date}`,
    mustBeLowerThan: (date) => `Debe ser anterior a ${date}`,
    mustBeBetween: (startDate, endDate) =>
      `Debe estar entre ${startDate} - ${endDate}`,
    dateIsDisabled: "Días no permitidos",
    previous: "Anterior",
    next: "Siguiente",
    typeInDate: "Escribir fecha",
    pickDateFromCalendar: "Seleccionar fecha del calendario",
    close: "Cerrar",
    // Días de la semana (comenzando desde el lunes)
    startWeekday: 1,
    // Meses
    months: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
    // Días de la semana (comenzando desde el lunes)
    weekdays: [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ],
    // Abreviatura de los días de la semana (comenzando desde el lunes)
    weekdaysShort: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  });
};
