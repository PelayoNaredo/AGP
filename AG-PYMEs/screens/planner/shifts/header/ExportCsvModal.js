import React, { useState } from "react";
import { Text, Platform } from "react-native";
import { Dialog, Button } from "react-native-paper";
import { Services } from "../../../../api/index";

// Función para obtener el primer día del mes
const getFirstDayOfMonth = (date) => {
  const firstDay = new Date(date);
  firstDay.setDate(1);
  firstDay.setHours(0, 0, 0, 0);
  return firstDay;
};

// Función para obtener el último día del mes
const getLastDayOfMonth = (date) => {
  const lastDay = new Date(date);
  // Pasamos al siguiente mes y restamos un día
  lastDay.setMonth(lastDay.getMonth() + 1);
  lastDay.setDate(0);
  lastDay.setHours(23, 59, 59, 999);
  return lastDay;
};

// Función para formatear un mes en formato legible
const formatMonthYear = (date) => {
  const options = { month: "long", year: "numeric" };
  return date.toLocaleDateString("es-ES", options);
};

// Función para obtener el nombre del día de la semana
const getDayName = (dayNumber) => {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  return days[dayNumber === 7 ? 0 : dayNumber];
};

// Función para normalizar el formato del día de la semana
const normalizeDayOfWeek = (dayValue) => {
  if (dayValue === undefined || dayValue === null) return null;
  // Convertir a número si viene como string
  return typeof dayValue === "string" ? parseInt(dayValue, 10) : dayValue;
};

/**
 * Componente para el modal de exportación de horarios a CSV
 */
const ExportCsvModal = ({ visible, onDismiss, selectedDate, themeObject }) => {
  const [loading, setLoading] = useState(false);

  // Función para exportar horarios a CSV
  const exportShiftsToCsv = async () => {
    onDismiss();
    setLoading(true);
    try {
      // Calcular fecha inicio de mes
      const firstDayOfMonth = getFirstDayOfMonth(selectedDate);
      const monthStart = firstDayOfMonth.toISOString().split("T")[0];

      // Obtener el último día del mes
      const lastDayOfMonth = getLastDayOfMonth(selectedDate);

      // Usar la nueva función específica para exportación de horarios mensuales
      const shiftsWithEmployeeInfo =
        await Services.Data.Shifts.getMonthlyShiftsForExport(monthStart);

      if (!shiftsWithEmployeeInfo || shiftsWithEmployeeInfo.length === 0) {
        alert("No hay horarios para exportar en este mes");
        setLoading(false);
        return;
      } // Verificar que cada turno tenga intervalos
      const shiftsWithoutIntervals = shiftsWithEmployeeInfo.filter(
        (shift) =>
          !shift.intervals ||
          !Array.isArray(shift.intervals) ||
          shift.intervals.length === 0
      );

      if (shiftsWithoutIntervals.length > 0) {
        console.warn(
          "Exportación CSV - Hay turnos sin intervalos definidos:",
          shiftsWithoutIntervals.length
        );
      }

      // Crear cabecera del CSV
      let csvContent = "Empleado,Fecha,Día,Hora entrada,Hora salida\n";

      // Rellenar datos
      for (const shift of shiftsWithEmployeeInfo) {
        if (!shift.employee) continue;

        const employeeName =
          `${shift.employee.nombre || ""} ${shift.employee.apellidos || ""}`.trim();

        // Obtener el número total de días del mes
        const totalDaysInMonth = lastDayOfMonth.getDate();

        // Para cada día del mes, verificar si hay horarios
        for (let dayOfMonth = 1; dayOfMonth <= totalDaysInMonth; dayOfMonth++) {
          // Crear una fecha para este día del mes
          const currentDate = new Date(firstDayOfMonth);
          currentDate.setDate(dayOfMonth);

          // Obtener el día de la semana (0-6, donde 0 es domingo)
          const dayOfWeek = currentDate.getDay();
          const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convertir domingo (0) a 7

          // Formatear la fecha para el CSV
          const formattedDate = `${dayOfMonth}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`; // Buscar horarios para este día de la semana          // Utilizar la nueva función transformIntervals para obtener los intervalos del día exactamente como en ShiftManagerContainer
          const dayIntervals = getIntervalsForDay(shift, adjustedDayOfWeek);

          if (dayIntervals.length === 0) {
            // Si no hay horario ese día, añadir una fila indicándolo
            csvContent += `"${employeeName}","${formattedDate}","${getDayName(adjustedDayOfWeek)}","Libre","Libre"\n`;
          } else {
            // Si hay varios intervalos para ese día, añadir cada uno
            dayIntervals.forEach((interval) => {
              csvContent += `"${employeeName}","${formattedDate}","${getDayName(adjustedDayOfWeek)}","${interval.hora_entrada || ""}","${interval.hora_salida || ""}"\n`;
            });
          }
        }
      }

      // Crear un archivo Blob con el contenido CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      // Generar nombre del archivo con formato mes-año
      const monthYearFormat = formatMonthYear(firstDayOfMonth);
      const fileName = `horarios_${monthYearFormat.replace(" ", "_")}.csv`;

      // Descargar el archivo
      if (Platform.OS === "web") {
        // En web, crear un enlace y simulamos un clic para descargar
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // En móvil, usar FileSystem de expo-file-system
        try {
          // Importar dinámicamente para evitar problemas en web
          const FileSystem = require("expo-file-system");

          const fileUri = FileSystem.cacheDirectory + fileName;
          await FileSystem.writeAsStringAsync(fileUri, csvContent);

          // Compartir el archivo
          const shareResult = await FileSystem.shareAsync(fileUri, {
            mimeType: "text/csv",
            dialogTitle: "Exportar horarios",
            UTI: "public.comma-separated-values-text",
          });

          if (!shareResult.action) {
            alert("Horarios exportados correctamente");
          }
        } catch (fsError) {
          console.error("Error al usar FileSystem:", fsError);
          alert("No se pudo exportar el archivo CSV en este dispositivo");
        }
      }
    } catch (error) {
      console.error("Error al exportar los horarios:", error);
      alert("Hubo un error al exportar los horarios");
    } finally {
      setLoading(false);
    }
  };

  // Función para transformar los intervalos como lo hace ShiftManagerContainer
  const transformIntervals = (shift, dayNumber) => {
    if (!shift || !shift.intervals || !Array.isArray(shift.intervals)) {
      return [];
    }

    // Convertir dayNumber a número para asegurar comparación correcta
    const dayNum = parseInt(dayNumber, 10);

    // Implementar la misma lógica que en ShiftManagerContainer
    const intervalosDia = shift.intervals.filter((interval) => {
      // Asegurar que dia_semana sea un número (puede venir como string)
      const diaSemana = parseInt(interval.dia_semana, 10);
      return diaSemana === dayNum;
    });

    return intervalosDia;
  };

  // Función mejorada para obtener intervalos de un día específico
  const getIntervalsForDay = (shift, dayNumber) => {
    // Validar parámetros de entrada
    if (!shift) {
      console.error("El objeto shift es null o undefined");
      return [];
    }

    // Manejar tanto arrays como objetos para intervalos (compatibilidad con diferentes formatos)
    let intervals = [];

    // Caso 1: el shift tiene una propiedad 'intervals' que es un array
    if (shift.intervals && Array.isArray(shift.intervals)) {
      intervals = shift.intervals;
    }
    // Caso 2: el shift tiene propiedades numeradas [1-7] con horarios, como en ShiftManagerContainer
    else if (shift[dayNumber]) {
      const dayData = shift[dayNumber];
      if (dayData.intervalos && Array.isArray(dayData.intervalos)) {
        // Adaptar el formato de los intervalos
        return dayData.intervalos.map((interval) => ({
          dia_semana: dayNumber,
          hora_entrada: interval.hora_inicio || interval.hora_entrada, // Manejar ambos formatos
          hora_salida: interval.hora_fin || interval.hora_salida, // Manejar ambos formatos
        }));
      }
    }

    // Filtrar intervalos para el día especificado
    const dayNum = parseInt(dayNumber, 10);
    return intervals.filter((interval) => {
      if (!interval || interval.dia_semana === undefined) return false;

      // Convertir dia_semana a número si es un string
      const diaSemana =
        typeof interval.dia_semana === "string"
          ? parseInt(interval.dia_semana, 10)
          : interval.dia_semana;

      // Validar que sea un número válido
      if (isNaN(diaSemana)) return false;

      return diaSemana === dayNum;
    });
  };

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{ backgroundColor: themeObject.colors.background }}
    >
      <Dialog.Title style={{ color: themeObject.colors.text }}>
        Exportar horarios
      </Dialog.Title>
      <Dialog.Content>
        <Text style={{ color: themeObject.colors.text }}>
          ¿Exportar los horarios del mes actual a CSV?
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={themeObject.colors.text}>
          Cancelar
        </Button>
        <Button
          onPress={exportShiftsToCsv}
          textColor={themeObject.colors.primary}
          loading={loading}
          disabled={loading}
        >
          {loading ? "Exportando..." : "Exportar"}
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

export default ExportCsvModal;
