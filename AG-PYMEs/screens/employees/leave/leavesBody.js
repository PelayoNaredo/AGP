import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import LeaveCard from "./leaveCard";
import SearchHeaderBar from "../../../components/searchHeaderBar";
import LeaveModal from "./leaveModal";
import { Services } from "../../../api/index";

// Componente LeavesBody para gestionar las bajas de empleados
// Este componente muestra una lista de bajas y permite crear, editar y eliminar bajas
const LeavesBody = ({ onLeaveUpdate }) => {
  const { themeObject } = useTheme();
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [leaveToEdit, setLeaveToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeObject.colors.background,
    },
    emptyText: {
      textAlign: "center",
      color: themeObject.colors.secondaryText,
      marginTop: 20,
    },
    content: {
      padding: 16,
    },
  });
  // Cargar datos iniciales
  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, leavesData] = await Promise.all([
        Services.Data.Employees.getAll(),
        Services.Data.Leaves.getAll(),
      ]);

      setEmployees(employeesData);
      setLeaves(leavesData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);

  // Efecto para filtrar las bajas según la búsqueda
  useEffect(() => {
    if (leaves.length > 0) {
      if (searchQuery.trim() === "") {
        setFilteredLeaves(leaves);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = leaves.filter((leave) => {
          const employee = employees.find(
            (e) => e.id_empleado === leave.id_empleado
          );
          return employee && employee.nombre.toLowerCase().includes(query);
        });
        setFilteredLeaves(filtered);
      }
    } else {
      setFilteredLeaves([]);
    }
  }, [leaves, searchQuery, employees]);
  // Registrar nueva baja
  const handleCreateLeave = async (leaveData) => {
    try {
      setLoading(true);
      let updatedLeave;

      if (leaveToEdit) {
        // Editar baja existente
        updatedLeave = await Services.Data.Leaves.update(
          leaveToEdit.id_baja,
          leaveData
        );

        // Actualizar el estado local de las bajas
        setLeaves((prev) =>
          prev.map((l) =>
            l.id_baja === updatedLeave.id_baja ? updatedLeave : l
          )
        );

        // Actualizar empleado
        const employeeUpdateData = {
          activo: !leaveData.inactivo,
        };
        await Services.Data.Employees.update(
          leaveData.id_empleado,
          employeeUpdateData
        );
      } else {
        // Crear nueva baja
        const newLeave = await Services.Data.Leaves.create(leaveData);
        setLeaves((prev) => [...prev, newLeave]);

        // Actualizar estado activo del empleado
        const employeeUpdateData = {
          activo: !leaveData.inactivo,
        };
        await Services.Data.Employees.update(
          leaveData.id_empleado,
          employeeUpdateData
        );
      }

      // Actualizar la vista
      await loadData();

      // Notificar al componente padre
      if (onLeaveUpdate) {
        onLeaveUpdate();
      }
    } catch (error) {
      console.error("Error registrando/actualizando baja:", error);
      throw error;
    } finally {
      setLoading(false);
      setShowModal(false);
      setLeaveToEdit(null);
    }
  };
  // Reactivar empleado y actualizar baja
  const handleReactivate = async (employeeId) => {
    try {
      setLoading(true);

      // Buscar la última baja activa del empleado
      const lastLeave = leaves
        .filter((l) => l.id_empleado === employeeId)
        .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio))[0];

      if (lastLeave && !lastLeave.fecha_fin) {
        // Actualizar la baja con la fecha de fin
        const updatedLeave = await Services.Data.Leaves.update(
          lastLeave.id_baja,
          {
            ...lastLeave,
            fecha_fin: new Date().toISOString().split("T")[0],
          }
        );

        // Actualizar estado local
        setLeaves((prev) =>
          prev.map((l) =>
            l.id_baja === updatedLeave.id_baja ? updatedLeave : l
          )
        );
      }

      // Actualizar el empleado a activo
      await Services.Data.Employees.update(employeeId, { activo: true });

      // Recargar todos los datos
      await loadData();

      // Notificar al componente padre
      if (onLeaveUpdate) {
        onLeaveUpdate();
      }
    } catch (error) {
      console.error("Error reactivando empleado:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  // Eliminar baja
  const handleDeleteLeave = async (leave) => {
    try {
      setLoading(true);
      await Services.Data.Leaves.delete(leave.id_baja);

      // Si la baja no tiene fecha de fin, reactivar al empleado
      if (!leave.fecha_fin) {
        await Services.Data.Employees.update(leave.id_empleado, {
          activo: true,
        });
      }

      // Actualizar estado local
      setLeaves((prev) => prev.filter((l) => l.id_baja !== leave.id_baja));

      // Recargar datos
      await loadData();

      // Notificar al componente padre
      if (onLeaveUpdate) {
        onLeaveUpdate();
      }
    } catch (error) {
      console.error("Error eliminando baja:", error);
      Alert.alert("Error", "No se pudo eliminar la baja");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={themeObject.colors.accent} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <SearchHeaderBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onButtonPress={() => setShowModal(true)}
        buttonText="Nueva Baja"
        buttonVariant="info"
        buttonIconName="add-outline"
        searchPlaceholder="Buscar por nombre de empleado..."
      />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {filteredLeaves.length === 0 ? (
          <Text style={styles.emptyText}>
            {leaves.length === 0
              ? "No hay bajas registradas"
              : "No se encontraron bajas con el nombre proporcionado"}
          </Text>
        ) : (
          filteredLeaves.map((leave) => {
            const employee = employees.find(
              (e) => e.id_empleado === leave.id_empleado
            );
            return (
              <LeaveCard
                key={leave.id_baja}
                leave={leave}
                employee={employee}
                onReactivate={() => handleReactivate(leave.id_empleado)}
                onEdit={() => {
                  setLeaveToEdit(leave);
                  setShowModal(true);
                }}
                onDelete={() => handleDeleteLeave(leave)}
              />
            );
          })
        )}
      </ScrollView>
      <LeaveModal
        visible={showModal}
        employees={employees.filter(
          (e) => e.activo || leaveToEdit?.id_empleado === e.id_empleado
        )}
        onClose={() => {
          setShowModal(false);
          setLeaveToEdit(null);
        }}
        onSubmit={handleCreateLeave}
        loading={loading}
        leaveToEdit={leaveToEdit}
      />
    </View>
  );
};

export default LeavesBody;
