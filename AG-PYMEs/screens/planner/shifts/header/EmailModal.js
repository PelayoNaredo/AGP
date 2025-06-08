import React, { useState } from "react";
import { View, Text } from "react-native";
import { Dialog, Button, Checkbox } from "react-native-paper";
import { Services } from "../../../../api/index";
import { sendEmail } from "../../../inventory/order/EmailOrderSender";
import useNotifications from "../../../../hooks/useNotifications";

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

// Función para formatear la hora en formato 12 horas (AM/PM)
const formatTime = (timeString) => {
  if (!timeString) return "";

  // Si ya es un objeto Date, lo utilizamos directamente
  let time =
    typeof timeString === "object"
      ? timeString
      : new Date(`2000-01-01T${timeString}`);

  // Formato en 12 horas
  return time.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
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

//Componente para el modal de selección de empleados y envío de horarios por correo
const EmailModal = ({ visible, onDismiss, selectedDate, themeObject }) => {
  const [loading, setLoading] = useState(false);
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const { showSuccess, showError } = useNotifications();

  // Función para preparar el modal de selección de empleados
  const openEmployeeSelectionModal = async () => {
    onDismiss();
    setLoading(true);

    try {
      // Calcular fecha inicio mes
      const firstDayOfMonth = getFirstDayOfMonth(selectedDate);
      const monthStart = firstDayOfMonth.toISOString().split("T")[0];

      // Usar el servicio para obtener los datos con horarios predeterminados e información de empleados
      const shiftsWithEmployeeInfo =
        await Services.Data.Shifts.getMonthlyShiftsForExport(monthStart);

      if (!shiftsWithEmployeeInfo || shiftsWithEmployeeInfo.length === 0) {
        showError("Error", "No hay horarios para enviar en este mes");
        setLoading(false);
        return;
      }

      // Cargar todos los empleados con horarios para el modal de selección
      const employeesWithShifts = shiftsWithEmployeeInfo
        .filter((shift) => shift.employee && shift.employee.email)
        .map((shift) => ({
          id: shift.id_empleado,
          name: `${shift.employee.nombre || ""} ${shift.employee.apellidos || ""}`.trim(),
          email: shift.employee.email,
          selected: true,
        }));

      setAllEmployees(employeesWithShifts);
      setSelectedEmployees(employeesWithShifts.map((emp) => emp.id));
      setSelectionModalVisible(true);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
      showError(
        "Error",
        "No se pudieron cargar los empleados para el envío de correos."
      );
    } finally {
      setLoading(false);
    }
  }; // Función para enviar horarios por correo a los empleados seleccionados
  const sendShiftsByEmail = async () => {
    setSelectionModalVisible(false);
    setLoading(true);

    try {
      // Calcular fecha inicio mes
      const firstDayOfMonth = getFirstDayOfMonth(selectedDate);
      const monthStart = firstDayOfMonth.toISOString().split("T")[0]; // Usar el servicio para obtener los datos con horarios predeterminados e información de empleados
      const shiftsWithEmployeeInfo =
        await Services.Data.Shifts.getMonthlyShiftsForExport(monthStart);

      if (!shiftsWithEmployeeInfo || shiftsWithEmployeeInfo.length === 0) {
        showError("Error", "No hay horarios para enviar en este mes");
        setLoading(false);
        return;
      }

      // Verificar que cada turno tenga intervalos
      const shiftsWithoutIntervals = shiftsWithEmployeeInfo.filter(
        (shift) =>
          !shift.intervals ||
          !Array.isArray(shift.intervals) ||
          shift.intervals.length === 0
      );

      if (shiftsWithoutIntervals.length > 0) {
        console.warn(
          "Hay turnos sin intervalos definidos:",
          shiftsWithoutIntervals.length
        );
      }

      // Contador de correos enviados
      let emailsSent = 0;
      let emailsFailed = 0;

      // Filtrar solo los empleados seleccionados
      const filteredShifts = shiftsWithEmployeeInfo.filter(
        (shift) =>
          shift.employee &&
          shift.employee.email &&
          selectedEmployees.includes(shift.id_empleado)
      ); // Para cada empleado con horario seleccionado, enviar un correo
      for (const shift of filteredShifts) {
        if (!shift.employee || !shift.employee.email) {
          emailsFailed++;
          continue;
        }

        // Generar el cuerpo del correo con los horarios
        const emailBody = generateMonthlyShiftEmailBody(
          shift.employee,
          shift,
          firstDayOfMonth
        );

        // Generar el asunto del correo
        const subject = `Horarios de ${formatMonthYear(firstDayOfMonth)}`;

        // Enviar el correo
        const emailSent = await sendEmail(
          shift.employee.email,
          subject,
          emailBody
        );

        if (emailSent) {
          emailsSent++;
        } else {
          emailsFailed++;
        }
      }

      // Mostrar resumen de correos enviados
      if (emailsSent > 0) {
        showSuccess(
          `Se enviaron ${emailsSent} correos correctamente${emailsFailed > 0 ? ` (${emailsFailed} fallidos)` : ""}`
        );
      } else if (emailsFailed > 0) {
        showError("Error", `No se pudieron enviar ${emailsFailed} correos`);
      }
    } catch (error) {
      console.error("Error al enviar los horarios por correo:", error);
      showError("Error", "No se pudieron enviar los horarios por correo.");
    } finally {
      setLoading(false);
    }
  };

  // Función para generar el cuerpo del correo para horarios mensuales
  const generateMonthlyShiftEmailBody = (employee, shift, monthStartDate) => {
    const monthEndDate = getLastDayOfMonth(monthStartDate);

    let emailBody = `Estimado/a ${employee.nombre || ""} ${employee.apellidos || ""}:\n\n`;
    emailBody += `Le enviamos sus horarios para el mes de ${formatMonthYear(monthStartDate)}:\n\n`;

    // Añadir horarios para todos los días del mes
    const totalDaysInMonth = monthEndDate.getDate();

    for (let dayOfMonth = 1; dayOfMonth <= totalDaysInMonth; dayOfMonth++) {
      // Crear una fecha para este día del mes
      const currentDate = new Date(monthStartDate);
      currentDate.setDate(dayOfMonth);

      // Obtener el día de la semana (0-6, donde 0 es domingo)
      const dayOfWeek = currentDate.getDay();
      const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convertir domingo (0) a 7

      // // Utilizar la nueva función transformIntervals para obtener los intervalos del día
      const dayIntervals = transformIntervals(shift, adjustedDayOfWeek);

      emailBody += `${dayOfMonth} - ${getDayName(adjustedDayOfWeek)}: `;

      if (dayIntervals.length === 0) {
        emailBody += "Libre\n";
      } else {
        // Si hay más de un intervalo para este día
        const intervalStrings = dayIntervals.map(
          (interval) =>
            `${formatTime(interval.hora_entrada)} - ${formatTime(interval.hora_salida)}`
        );

        emailBody += intervalStrings.join(", ") + "\n";
      }
    }

    emailBody += `\nEsta información corresponde a su horario laboral del mes de ${formatMonthYear(monthStartDate)}. `;
    emailBody += `Si tiene alguna consulta, por favor contacte con su supervisor.\n\n`;

    // Añadir opción para sincronizar con Google Calendar (enlace)
    emailBody += `Para agregar estos horarios a su calendario, puede utilizar el siguiente enlace:\n`;
    emailBody += generateGoogleCalendarLink(employee, shift, monthStartDate);

    emailBody += `\n\nSaludos cordiales,\nDepartamento de Recursos Humanos`;

    return emailBody;
  };
  // Función para generar un enlace de Google Calendar
  const generateGoogleCalendarLink = (employee, shift, startDate) => {
    const events = [];

    // Obtener el último día del mes
    const endDate = getLastDayOfMonth(startDate);
    const totalDaysInMonth = endDate.getDate();

    // Para cada día del mes, crear un evento en el calendario
    for (let dayOfMonth = 1; dayOfMonth <= totalDaysInMonth; dayOfMonth++) {
      // Crear una fecha para este día del mes
      const currentDate = new Date(startDate);
      currentDate.setDate(dayOfMonth);

      // Obtener el día de la semana (0-6, donde 0 es domingo)
      const dayOfWeek = currentDate.getDay();
      const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convertir domingo (0) a 7
      // Utilizar la nueva función transformIntervals para obtener los intervalos del día
      const dayIntervals = transformIntervals(shift, adjustedDayOfWeek);

      if (dayIntervals.length > 0) {
        // Fecha para este día del mes (ya tenemos la fecha correcta en currentDate)
        const eventDate = new Date(currentDate);

        // Para cada intervalo, crear un evento
        for (const interval of dayIntervals) {
          if (!interval.hora_entrada || !interval.hora_salida) continue;

          // Formatear fecha y hora para Google Calendar
          const startDateTime = new Date(eventDate);
          const [startHours, startMinutes] = interval.hora_entrada.split(":");
          startDateTime.setHours(
            parseInt(startHours),
            parseInt(startMinutes),
            0,
            0
          );

          const endDateTime = new Date(eventDate);
          const [endHours, endMinutes] = interval.hora_salida.split(":");
          endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

          const event = {
            title: `Horario laboral - ${employee.nombre || ""} ${employee.apellidos || ""}`,
            startDate: startDateTime.toISOString(),
            endDate: endDateTime.toISOString(),
            description: `Turno de trabajo programado`,
          };

          events.push(event);
        }
      }
    }

    // Generar URL para Google Calendar con todos los eventos
    if (events.length > 0) {
      // Para simplificar, crearemos un enlace que permita añadir el primer evento
      const firstEvent = events[0];
      const baseUrl =
        "https://calendar.google.com/calendar/render?action=TEMPLATE";

      // Formatear las fechas para Google Calendar (formato YYYYMMDDTHHmmssZ)
      const startFormatted = firstEvent.startDate
        .replace(/[-:.]/g, "")
        .replace(/\.\d+Z$/, "Z");

      const endFormatted = firstEvent.endDate
        .replace(/[-:.]/g, "")
        .replace(/\.\d+Z$/, "Z");

      const url = `${baseUrl}&text=${encodeURIComponent(
        firstEvent.title
      )}&dates=${startFormatted}/${endFormatted}&details=${encodeURIComponent(
        firstEvent.description
      )}`;

      return url + " (nota: este enlace añade solo el primer turno)";
    }

    return "No hay horarios disponibles para añadir al calendario.";
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

  return (
    <>
      <Dialog
        visible={visible && !selectionModalVisible}
        onDismiss={onDismiss}
        style={{ backgroundColor: themeObject.colors.background }}
      >
        <Dialog.Title style={{ color: themeObject.colors.text }}>
          Enviar horarios por correo
        </Dialog.Title>
        <Dialog.Content>
          <Text style={{ color: themeObject.colors.text }}>
            ¿Desea enviar los horarios de este mes por correo a los empleados?
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor={themeObject.colors.text}>
            Cancelar
          </Button>
          <Button
            onPress={openEmployeeSelectionModal}
            textColor={themeObject.colors.primary}
            loading={loading}
            disabled={loading}
          >
            {loading ? "Preparando..." : "Continuar"}
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog
        visible={selectionModalVisible}
        onDismiss={() => setSelectionModalVisible(false)}
        style={{ backgroundColor: themeObject.colors.background }}
      >
        <Dialog.Title style={{ color: themeObject.colors.text }}>
          Seleccionar empleados
        </Dialog.Title>
        <Dialog.Content>
          <Text style={{ color: themeObject.colors.text, marginBottom: 10 }}>
            Seleccione los empleados a los que desea enviar el horario:
          </Text>
          {allEmployees.map((employee) => (
            <View
              key={employee.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 5,
              }}
            >
              <Checkbox
                status={
                  selectedEmployees.includes(employee.id)
                    ? "checked"
                    : "unchecked"
                }
                onPress={() => {
                  setSelectedEmployees((current) =>
                    current.includes(employee.id)
                      ? current.filter((id) => id !== employee.id)
                      : [...current, employee.id]
                  );
                }}
                color={themeObject.colors.primary}
              />
              <Text style={{ color: themeObject.colors.text, marginLeft: 10 }}>
                {employee.name} ({employee.email})
              </Text>
            </View>
          ))}
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={() => setSelectionModalVisible(false)}
            textColor={themeObject.colors.text}
          >
            Cancelar
          </Button>
          <Button
            onPress={sendShiftsByEmail}
            textColor={themeObject.colors.primary}
            loading={loading}
            disabled={loading || selectedEmployees.length === 0}
          >
            {loading ? "Enviando..." : "Enviar"}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
};

export default EmailModal;
