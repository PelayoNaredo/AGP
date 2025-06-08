import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { NotificationProvider } from "../../../context/NotificationContext";
import useNotifications from "../../../hooks/useNotifications";
import CustomButton from "../../../components/customButton";
import CustomPicker from "../../../components/customPicker";
import SearchHeaderBar from "../../../components/searchHeaderBar";
import EmployeeCard from "./employeeCard";
import EmployeeModal from "./employeeModal";
import { Services } from "../../../api/index";
import { Ionicons } from "@expo/vector-icons";

// Componente principal que maneja la lógica y la presentación de los empleados
// Este componente incluye la barra de búsqueda, los filtros y la lista de empleados
const EmployeesBody = ({ onEmployeeUpdate }) => {
  const { themeObject } = useTheme();
  const { showSuccess, showError, showInfo, showConfirmDialog } =
    useNotifications();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Estados para los filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos"); // 'todos', 'activos', 'inactivos'
  const [contractFilter, setContractFilter] = useState("todos");
  const [departmentFilter, setDepartmentFilter] = useState("todos");

  // Lista única de departamentos y tipos de contrato
  const [departments, setDepartments] = useState([]);
  const [contractTypes, setContractTypes] = useState([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await Services.Data.Employees.getAll();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando empleados:", err);
      setError(err.message);
      showError("Error", `No se pudieron cargar los empleados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      // Extraer listas únicas de departamentos y tipos de contrato
      const uniqueDepartments = [
        ...new Set(employees.map((emp) => emp.departamento).filter(Boolean)),
      ];
      const uniqueContracts = [
        ...new Set(employees.map((emp) => emp.tipo_contrato).filter(Boolean)),
      ];

      setDepartments(uniqueDepartments);
      setContractTypes(uniqueContracts);

      // Aplicar filtros
      let filtered = [...employees];

      // Filtro de búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (emp) =>
            emp.nombre.toLowerCase().includes(query) ||
            emp.dni.toLowerCase().includes(query)
        );
      }

      // Filtro de estado
      if (statusFilter !== "todos") {
        filtered = filtered.filter((emp) =>
          statusFilter === "activos" ? emp.activo : !emp.activo
        );
      }

      // Filtro de tipo de contrato
      if (contractFilter !== "todos") {
        filtered = filtered.filter(
          (emp) => emp.tipo_contrato === contractFilter
        );
      }

      // Filtro de departamento
      if (departmentFilter !== "todos") {
        filtered = filtered.filter(
          (emp) => emp.departamento === departmentFilter
        );
      }

      setFilteredEmployees(filtered);
    }
  }, [employees, searchQuery, statusFilter, contractFilter, departmentFilter]);
  const handleCreate = async (formData) => {
    try {
      setLoading(true);
      const newEmployee = await Services.Data.Employees.create(formData);

      setEmployees((prev) => [...prev, newEmployee]);

      if (onEmployeeUpdate) {
        onEmployeeUpdate();
      }
      handleModalClose();
      showSuccess("Empleado creado correctamente");
    } catch (error) {
      console.error("Error creando empleado:", error);
      showError("Error", "No se pudo crear el empleado");
    } finally {
      setLoading(false);
    }
  };
  const handleUpdate = async (formData) => {
    try {
      setLoading(true);
      const updatedEmployee = await Services.Data.Employees.update(
        selectedEmployee.id_empleado,
        formData
      );

      // Actualizar estado local
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id_empleado === updatedEmployee.id_empleado
            ? updatedEmployee
            : emp
        )
      );

      // Notificar al padre
      if (onEmployeeUpdate) {
        onEmployeeUpdate();
      }
      handleModalClose();
      showSuccess("Empleado actualizado correctamente");
    } catch (error) {
      console.error("Error actualizando empleado:", error);
      showError("Error", "No se pudo actualizar el empleado");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = (id) => {
    // Confirmar antes de eliminar
    showConfirmDialog(
      "Eliminar empleado",
      "¿Está seguro de que desea eliminar este empleado? Esta acción no se puede deshacer.",
      async () => {
        try {
          setLoading(true);
          await Services.Data.Employees.delete(id);

          // Actualizar estado local
          setEmployees((prev) => prev.filter((emp) => emp.id_empleado !== id));

          // Notificar al padre
          if (onEmployeeUpdate) {
            onEmployeeUpdate();
          }

          showSuccess("Empleado eliminado correctamente");
        } catch (error) {
          console.error("Error eliminando empleado:", error);
          showError("Error", "No se pudo eliminar el empleado");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleModalSubmit = async (formData) => {
    if (selectedEmployee) {
      await handleUpdate(formData);
    } else {
      await handleCreate(formData);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedEmployee(null);
  };

  // Función para manejar el cierre del modal de filtros
  const handleFilterModalClose = () => {
    setIsFilterModalVisible(false);
  };

  // Componente para el modal de filtros en dispositivos móviles
  const FilterModal = () => {
    return (
      <Modal
        transparent
        visible={isFilterModalVisible}
        animationType="slide"
        onRequestClose={handleFilterModalClose}
      >
        <Pressable
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleFilterModalClose}
        >
          <View
            style={[
              styles.filterModalContainer,
              { backgroundColor: themeObject.colors.background },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.filterModalHeader}>
              <Text
                style={[
                  styles.filterModalTitle,
                  { color: themeObject.colors.text },
                ]}
              >
                Filtros
              </Text>
              <Pressable onPress={handleFilterModalClose}>
                <Ionicons
                  name="close"
                  size={24}
                  color={themeObject.colors.text}
                />
              </Pressable>
            </View>

            <View style={styles.filterModalContent}>
              <Text
                style={[styles.filterLabel, { color: themeObject.colors.text }]}
              >
                Estado
              </Text>
              <CustomPicker
                selectedValue={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
                items={[
                  { label: "Todos", value: "todos" },
                  { label: "Activos", value: "activos" },
                  { label: "Inactivos", value: "inactivos" },
                ]}
                placeholder="Estado"
              />

              <Text
                style={[styles.filterLabel, { color: themeObject.colors.text }]}
              >
                Tipo de Contrato
              </Text>
              <CustomPicker
                selectedValue={contractFilter}
                onValueChange={(value) => setContractFilter(value)}
                items={[
                  { label: "Todos", value: "todos" },
                  ...contractTypes.map((type) => ({
                    label: type,
                    value: type,
                  })),
                ]}
                placeholder="Tipo de Contrato"
              />

              <Text
                style={[styles.filterLabel, { color: themeObject.colors.text }]}
              >
                Departamento
              </Text>
              <CustomPicker
                selectedValue={departmentFilter}
                onValueChange={(value) => setDepartmentFilter(value)}
                items={[
                  { label: "Todos", value: "todos" },
                  ...departments.map((dept) => ({
                    label: dept,
                    value: dept,
                  })),
                ]}
                placeholder="Departamento"
              />

              <CustomButton
                onPress={handleFilterModalClose}
                variant="primary"
                size="md"
                style={styles.applyFiltersButton}
              >
                Aplicar Filtros
              </CustomButton>
            </View>
          </View>
        </Pressable>
      </Modal>
    );
  };
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeObject.colors.background,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: themeObject.colors.text,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    errorText: {
      color: themeObject.colors.error,
      textAlign: "center",
      marginTop: 20,
    },
    pickersContainer: {
      padding: 16,
      flexDirection: Platform.select({
        web: "row",
        ios: "column",
        android: "column",
      }),
      gap: Platform.select({
        web: 16,
        ios: 20,
        android: 12,
      }),
      flexWrap: "wrap",
      marginTop: 8,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 20,
      fontSize: 16,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    filterModalContainer: {
      width: "80%",
      borderRadius: 8,
      padding: 16,
    },
    filterModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    filterModalTitle: {
      fontSize: 18,
      fontWeight: "bold",
    },
    filterModalContent: {
      gap: 16,
    },
    filterLabel: {
      fontSize: 16,
      marginBottom: 8,
    },
    applyFiltersButton: {
      marginTop: 16,
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: themeObject.colors.surface, // Transparencia
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    filterButtonText: {
      color: themeObject.colors.primary,
      fontWeight: "500",
    },
  });
  return (
    <View style={styles.container}>
      <SearchHeaderBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onButtonPress={() => setIsModalVisible(true)}
        buttonText="Nuevo Empleado"
        buttonIconName="add-outline"
        buttonVariant="info"
        searchPlaceholder="Buscar (DNI, Nombre, etc.)..."
      />
      {Platform.OS === "web" ? (
        <View style={styles.pickersContainer}>
          <CustomPicker
            selectedValue={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
            items={[
              { label: "Todos", value: "todos" },
              { label: "Activos", value: "activos" },
              { label: "Inactivos", value: "inactivos" },
            ]}
            placeholder="Estado"
          />

          <CustomPicker
            selectedValue={contractFilter}
            onValueChange={(value) => setContractFilter(value)}
            items={[
              { label: "Todos", value: "todos" },
              ...contractTypes.map((type) => ({
                label: type,
                value: type,
              })),
            ]}
            placeholder="Tipo de Contrato"
          />

          <CustomPicker
            selectedValue={departmentFilter}
            onValueChange={(value) => setDepartmentFilter(value)}
            items={[
              { label: "Todos", value: "todos" },
              ...departments.map((dept) => ({
                label: dept,
                value: dept,
              })),
            ]}
            placeholder="Departamento"
          />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Pressable
            style={styles.filterButton}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={themeObject.colors.primary}
            />
            <Text style={styles.filterButtonText}>
              Filtros
              {statusFilter !== "todos" ||
              contractFilter !== "todos" ||
              departmentFilter !== "todos"
                ? " (Aplicados)"
                : ""}
            </Text>
          </Pressable>
        </View>
      )}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && !employees.length ? (
          <ActivityIndicator size="large" color={themeObject.colors.primary} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : filteredEmployees.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              { color: themeObject.colors.secondaryText },
            ]}
          >
            {employees.length === 0
              ? "No hay empleados registrados"
              : "No se encontraron empleados con los filtros seleccionados"}
          </Text>
        ) : (
          <NotificationProvider>
            {filteredEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id_empleado}
                employee={employee}
                onEdit={() => {
                  setSelectedEmployee(employee);
                  setIsModalVisible(true);
                }}
                onDelete={() => handleDelete(employee.id_empleado)}
              />
            ))}
          </NotificationProvider>
        )}
      </ScrollView>
      <EmployeeModal
        visible={isModalVisible}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        employee={selectedEmployee}
        loading={loading}
      />
      <FilterModal />
    </View>
  );
};

export default EmployeesBody;
