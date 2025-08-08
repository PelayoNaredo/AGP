import { useState, useEffect } from "react";
import { Services } from "../../../api/index";
import { useUnifiedCache } from "../../../cache/hooks/useUnifiedCache";
import { normalizeAPIResponse } from "../../../utils/helpers";

// Maneja la lógica de la pantalla de gestión de turnos
const ShiftManagerContainer = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState(() => getMonday(new Date()));
  const [selectedView, setSelectedView] = useState("semana");
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook del cache unificado (compatible con API anterior)
  const {
    getEmployees,
    getShiftsByDate,
    invalidateShifts,
    isLoading: isCacheLoading,
  } = useUnifiedCache();

  // Obtener el lunes de la semana de una fecha
  function getMonday(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // Formatear fecha a YYYY-MM-DD
  function formatPostgresDate(date) {
    return date.toISOString().split("T")[0];
  }

  // Transformar datos de la API
  const transformShifts = (apiShifts) => {
    if (!apiShifts || apiShifts.length === 0) return {};

    return apiShifts.reduce((acc, shift) => {
      // Si el empleado no existe en el acumulador, lo inicializamos
      if (!acc[shift.id_empleado]) {
        acc[shift.id_empleado] = {
          1: { intervalos: [] },
          2: { intervalos: [] },
          3: { intervalos: [] },
          4: { intervalos: [] },
          5: { intervalos: [] },
          6: { intervalos: [] },
          7: { intervalos: [] },
        };
      }

      // Para mantener compatibilidad con el formato anterior
      for (let dia = 1; dia <= 7; dia++) {
        const intervalosDia =
          shift.intervals?.filter((i) => i.dia_semana === dia) || [];
        acc[shift.id_empleado][dia] = {
          intervalos: intervalosDia.map((i) => ({
            hora_inicio: i.hora_entrada,
            hora_fin: i.hora_salida,
          })),
          // Mantenemos entrada/salida para compatibilidad, usando el primer intervalo
          entrada: intervalosDia[0]?.hora_entrada || "",
          salida: intervalosDia[0]?.hora_salida || "",
        };
      }

      return acc;
    }, {});
  };

  // Inicializar estructura vacía para empleados sin horarios
  const initializeEmptyShifts = (employees, existingShifts) => {
    return employees.reduce(
      (acc, empleado) => {
        if (!existingShifts[empleado.id_empleado]) {
          acc[empleado.id_empleado] = {
            1: { intervalos: [], entrada: "", salida: "" },
            2: { intervalos: [], entrada: "", salida: "" },
            3: { intervalos: [], entrada: "", salida: "" },
            4: { intervalos: [], entrada: "", salida: "" },
            5: { intervalos: [], entrada: "", salida: "" },
            6: { intervalos: [], entrada: "", salida: "" },
            7: { intervalos: [], entrada: "", salida: "" },
          };
        }
        return acc;
      },
      { ...existingShifts }
    );
  };

  // Cargar datos iniciales con cache optimizado
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const dateStr = formatPostgresDate(
          selectedView === "semana" ? selectedDate : getMonday(selectedDate)
        );

        // Usar cache inteligente para cargar datos
        const [employeesData, shiftsData] = await Promise.all([
          getEmployees(), // Cache de 30 min
          getShiftsByDate(dateStr), // Cache de 10 min
        ]);

        // Normalizar los datos de empleados
        const normalizedEmployees = normalizeAPIResponse(employeesData);
        const normalizedShifts = normalizeAPIResponse(shiftsData);

        const transformedShifts = transformShifts(normalizedShifts);
        const initializedShifts = initializeEmptyShifts(
          normalizedEmployees,
          transformedShifts
        );

        setEmployees(normalizedEmployees);
        setShifts(initializedShifts);
      } catch (err) {
        console.error("Error loading shifts data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate, selectedView, getEmployees, getShiftsByDate]); // Dependencias optimizadas

  // Guardar cambios en un turno
  const handleSaveShift = async (employeeId, dayNumber, shiftData) => {
    try {
      const fecha_inicio_semana = formatPostgresDate(
        selectedView === "semana" ? selectedDate : getMonday(selectedDate)
      );

      const result = await Services.Data.Shifts.save(
        employeeId,
        fecha_inicio_semana,
        dayNumber,
        shiftData.intervalos
      );

      // Actualizar el estado local con los nuevos intervalos
      setShifts((prev) => ({
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [dayNumber]: {
            intervalos: shiftData.intervalos,
            entrada: shiftData.intervalos[0]?.hora_inicio || "",
            salida: shiftData.intervalos[0]?.hora_fin || "",
          },
        },
      }));

      // Invalidar cache de shifts para refrescar datos
      await invalidateShifts();
    } catch (err) {
      console.error("Error saving shift:", err);
      setError(err.message);
    }
  };

  // Eliminar un turno
  const handleDeleteShift = async (shift) => {
    if (!shift) return;

    try {
      const fecha_inicio_semana = formatPostgresDate(
        selectedView === "semana" ? selectedDate : getMonday(selectedDate)
      );

      // Llamada a la API para eliminar los intervalos
      const result = await Services.Data.Shifts.save(
        shift.id_empleado,
        fecha_inicio_semana,
        shift.dia_semana,
        [] // Pasar un array vacío de intervalos para "eliminar" el turno
      );

      // Actualizar el estado local eliminando los intervalos del turno
      setShifts((prev) => ({
        ...prev,
        [shift.id_empleado]: {
          ...prev[shift.id_empleado],
          [shift.dia_semana]: {
            intervalos: [],
            entrada: "",
            salida: "",
          },
        },
      }));

      // Invalidar cache de shifts para refrescar datos
      await invalidateShifts();
    } catch (err) {
      console.error("Error deleting shift:", err);
      setError(err.message);
    }
  };

  const handleDateChange = (date) => {
    if (selectedView === "semana") {
      setSelectedDate(getMonday(date));
    } else {
      setSelectedDate(date);
    }
  };

  const handleViewChange = (view) => {
    setSelectedView(view);
    if (view === "semana") {
      setSelectedDate(getMonday(selectedDate));
    }
  };
  return children({
    selectedDate,
    employees,
    shifts,
    loading,
    error,
    selectedView,
    handleDateChange,
    handleViewChange,
    handleSaveShift,
    handleDeleteShift,
  });
};

export default ShiftManagerContainer;
