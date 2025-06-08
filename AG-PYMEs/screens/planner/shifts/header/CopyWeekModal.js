import React, { useState } from "react";
import { Text } from "react-native";
import { Dialog, Button } from "react-native-paper";
import { Services } from "../../../../api/index";
import useNotifications from "../../../../hooks/useNotifications";

// Función para obtener el lunes de la semana
const getMonday = (date) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

//Componente para el modal de copiar horarios de la semana anterior
const CopyWeekModal = ({
  visible,
  onDismiss,
  selectedDate,
  themeObject,
  onCopyStart,
  onCopyComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();

  // Función para copiar horarios de la semana anterior
  const handleCopyPreviousWeek = async () => {
    onDismiss();
    setLoading(true);
    onCopyStart();

    try {
      // Calcular fecha inicio semana anterior (asegurándonos que sea un lunes)
      const previousWeekStart = new Date(selectedDate);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      const previousMonday = getMonday(previousWeekStart);

      // Calcular fecha inicio semana actual
      const currentMonday = getMonday(selectedDate);

      // Formatear fechas para la API
      const previousWeekStartFormatted = previousMonday
        .toISOString()
        .split("T")[0];
      const currentWeekStartFormatted = currentMonday
        .toISOString()
        .split("T")[0];

      // Realizar la copia de turnos mediante la API
      const result = await Services.Data.Shifts.copyShiftsFromPreviousWeek(
        previousWeekStartFormatted,
        currentWeekStartFormatted
      );

      if (result && result.success) {
        showSuccess(
          `Se copiaron ${result.data.numShifts || 0} horarios de la semana anterior.`
        );
      } else {
        throw new Error("No se pudo completar la copia de horarios");
      }
    } catch (error) {
      console.error("Error al copiar horarios:", error);
      showError(
        "Error",
        "Hubo un error al intentar copiar los horarios de la semana anterior."
      );
    } finally {
      setLoading(false);
      onCopyComplete();
    }
  };

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{ backgroundColor: themeObject.colors.background }}
    >
      <Dialog.Title style={{ color: themeObject.colors.text }}>
        Copiar horarios
      </Dialog.Title>
      <Dialog.Content>
        <Text style={{ color: themeObject.colors.text }}>
          ¿Copiar los horarios de la semana anterior?
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={themeObject.colors.text}>
          Cancelar
        </Button>
        <Button
          onPress={handleCopyPreviousWeek}
          textColor={themeObject.colors.primary}
          loading={loading}
          disabled={loading}
        >
          Confirmar
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

export default CopyWeekModal;
