import { useState, useEffect } from 'react';
import { 
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  createEmployee,
  deleteEmployee
} from '../services/employeesService';
import {
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave
} from '../services/leavesService';

const useEmployeeManagement = () => {
  // Estados principales
  const [employees, setEmployees] = useState([]);
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [loading, setLoading] = useState({
    employees: true,
    leaves: false,
    actions: false
  });

  // Estados UI
  const [isEditing, setIsEditing] = useState(false);
  const [showLeaveSection, setShowLeaveSection] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  

  // Formularios
  const [employeeForm, setEmployeeForm] = useState({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    fecha_contratacion: '',
    cargo: '',
    salario: '',
    activo: true
  });

  const [leaveForm, setLeaveForm] = useState({
    id_empleado: null,
    tipo_baja: '',
    fecha_inicio: '',
    fecha_fin: '',
    comentarios: ''
  });

  const [newEmployeeForm, setNewEmployeeForm] = useState({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    fecha_contratacion: '', 
    cargo: '',
    salario: '',
    activo: true
  });

  const initialNewEmployeeForm = {
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    fecha_contratacion: new Date().toISOString().split('T')[0],
    cargo: '',
    salario: '',
    activo: true
  };

  // Cargar empleados iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAllEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Error loading employees:', error);
      } finally {
        setLoading(prev => ({ ...prev, employees: false }));
      }
    };
    loadData();
  }, []);

  // Cargar bajas cuando cambia el empleado seleccionado
  useEffect(() => {
    const loadLeaves = async () => {
      if (!selectedEmployee) return;
      
      try {
        setLoading(prev => ({ ...prev, leaves: true }));
        const leaves = await getLeaves();
        setEmployeeLeaves(leaves.filter(l => l.id_empleado === selectedEmployee.id_empleado));
      } catch (error) {
        console.error('Error loading leaves:', error);
      } finally {
        setLoading(prev => ({ ...prev, leaves: false }));
      }
    };
    
    loadLeaves();
  }, [selectedEmployee]);

  // Handlers
  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      nombre: employee.nombre,
      dni: employee.dni,
      email: employee.email,
      telefono: employee.telefono,
      fecha_contratacion: employee.fecha_contratacion.split('T')[0],
      cargo: employee.cargo,
      salario: employee.salario.toString(),
      activo: employee.activo
    });
    setLeaveForm(prev => ({ ...prev, id_empleado: employee.id_empleado }));
    setIsEditing(true);

    if (selectedEmployee?.id_empleado === employee.id_empleado) {
      setSelectedEmployee(null);
      setIsEditing(false);
      return;
    }
  };

  const handleCreateEmployee = async () => {
    try {
      setLoading({ ...loading, actions: true });
      const created = await createEmployee({
        ...newEmployeeForm,
        salario: parseFloat(newEmployeeForm.salario)
      });
      
      setEmployees([...employees, created]);
      setShowCreateModal(false);
      setNewEmployeeForm({ ...initialNewEmployeeForm }); // Resetear formulario
    } catch (error) {
      console.error('Error creating employee:', error);
    } finally {
      setLoading({ ...loading, actions: false });
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoading(prev => ({ ...prev, actions: true }));
      const updated = await updateEmployee(selectedEmployee.id_empleado, {
        ...employeeForm,
        salario: parseFloat(employeeForm.salario),
        activo: employeeForm.activo
      });
      
      setEmployees(employees.map(e => e.id_empleado === updated.id_empleado ? updated : e));
      setSelectedEmployee(updated);
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  };

  const handleCreateLeave = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoading(prev => ({ ...prev, actions: true }));
      
      // Registrar baja
      const newLeave = await createLeave(leaveForm);
      
      // Actualizar estado empleado
      const updatedEmployee = await updateEmployee(selectedEmployee.id_empleado, {
        ...selectedEmployee,
        activo: false
      });
      
      // Actualizar estado local
      setEmployees(employees.map(e => 
        e.id_empleado === updatedEmployee.id_empleado ? updatedEmployee : e
      ));
      setEmployeeLeaves([...employeeLeaves, newLeave]);
      setSelectedEmployee(updatedEmployee);
      setShowLeaveSection(false);
    } catch (error) {
      console.error('Error creating leave:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  };

  const handleReactivateEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoading(prev => ({ ...prev, actions: true }));
      const updated = await updateEmployee(selectedEmployee.id_empleado, {
        ...selectedEmployee,
        activo: true
      });
      
      setEmployees(employees.map(e => 
        e.id_empleado === updated.id_empleado ? updated : e
      ));
      setSelectedEmployee(updated);
      setShowReactivateModal(false);
    } catch (error) {
      console.error('Error reactivating employee:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoading(prev => ({ ...prev, actions: true }));
      await deleteEmployee(selectedEmployee.id_empleado);
      
      setEmployees(employees.filter(e => e.id_empleado !== selectedEmployee.id_empleado));
      setSelectedEmployee(null);
      setShowDismissModal(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  };

  return {
    // Estados
    employees,
    selectedEmployee,
    employeeLeaves,
    loading,
    isEditing,
    showCreateModal,
    showLeaveSection,
    showDismissModal,
    showReactivateModal,
    employeeForm,
    leaveForm,
    newEmployeeForm,
    
    
    // Setters
    setEmployeeForm,
    setNewEmployeeForm,
    setLeaveForm,
    setIsEditing,
    setShowCreateModal,
    setShowLeaveSection,
    setShowDismissModal,
    setShowReactivateModal,
    
    // Handlers
    handleSelectEmployee,
    handleUpdateEmployee,
    handleCreateEmployee,
    handleCreateLeave,
    handleReactivateEmployee,
    handleDeleteEmployee
  };
};

export default useEmployeeManagement;