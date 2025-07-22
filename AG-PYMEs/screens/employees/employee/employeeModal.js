import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  ScrollView,
} from "react-native";
import CustomPicker from "../../../components/customPicker";
import ModalTemplate from "../../../components/modalTemplate";
import { useTheme } from "../../../context/ThemeContext";
import FileUploader from "../../../components/fileUploader";

const getStyles = (themeObject) =>
  StyleSheet.create({
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: themeObject.colors.text,
      marginBottom: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      color: themeObject.colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: themeObject.colors.surface,
      borderWidth: 1,
      borderColor: themeObject.colors.border,
      borderRadius: 8,
      padding: 12,
      color: themeObject.colors.text,
    },
    switchContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
    },
  });

const EmployeeModal = ({ visible, employee, onClose, onSubmit, loading }) => {
  const { themeObject } = useTheme();
  const styles = getStyles(themeObject);
  const [formData, setFormData] = useState({
    nombre: "",
    dni: "",
    nss: "",
    email: "",
    telefono: "",
    telefono_emergencia: "",
    direccion: "",
    codigo_postal: "",
    ciudad: "",
    pais: "España",
    fecha_contratacion: new Date().toISOString().split("T")[0],
    fecha_nacimiento: "",
    cargo: "",
    departamento: "",
    horas_contratadas: "40",
    tipo_contrato: "",
    salario: "",
    activo: true,
    notas: "",
  });
  const [documentos, setDocumentos] = useState([]);
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        nombre: employee.nombre,
        dni: employee.dni,
        nss: employee.nss || "",
        email: employee.email,
        telefono: employee.telefono || "",
        telefono_emergencia: employee.telefono_emergencia || "",
        direccion: employee.direccion || "",
        codigo_postal: employee.codigo_postal || "",
        ciudad: employee.ciudad || "",
        pais: employee.pais || "España",
        fecha_contratacion: employee.fecha_contratacion.split("T")[0],
        fecha_nacimiento: employee.fecha_nacimiento
          ? employee.fecha_nacimiento.split("T")[0]
          : "",
        cargo: employee.cargo,
        departamento: employee.departamento || "",
        horas_contratadas: employee.horas_contratadas?.toString() || "40",
        tipo_contrato: employee.tipo_contrato || "",
        salario: employee.salario.toString(),
        activo: employee.activo,
        notas: employee.notas || "",
      });
      setDocumentos(employee.documento_adjunto || []);
    } else {
      setFormData({
        nombre: "",
        dni: "",
        nss: "",
        email: "",
        telefono: "",
        telefono_emergencia: "",
        direccion: "",
        codigo_postal: "",
        ciudad: "",
        pais: "España",
        fecha_contratacion: new Date().toISOString().split("T")[0],
        fecha_nacimiento: "",
        cargo: "",
        departamento: "",
        horas_contratadas: "40",
        tipo_contrato: "",
        salario: "",
        activo: true,
        notas: "",
      });
      setDocumentos([]);
    }
  }, [employee]);

  useEffect(() => {
    const isValid =
      formData.nombre.trim() &&
      formData.dni.trim().length === 9 &&
      formData.nss.trim().length === 12 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      formData.fecha_contratacion.match(/^\d{4}-\d{2}-\d{2}$/) &&
      formData.fecha_nacimiento.match(/^\d{4}-\d{2}-\d{2}$/) &&
      formData.cargo.trim() &&
      !isNaN(parseFloat(formData.salario)) &&
      formData.tipo_contrato &&
      (employee ? true : formData.dni.trim().length === 9);

    setFormValid(isValid);
  }, [formData]);

  const invalidStyle = {
    borderColor: themeObject.colors.error,
    backgroundColor: themeObject.colors.error + "20",
  };

  const getFieldValidation = (field) => {
    const validations = {
      dni: formData.dni.length === 9,
      nss: formData.nss.length === 12,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
      fecha_contratacion:
        !!formData.fecha_contratacion.match(/^\d{4}-\d{2}-\d{2}$/),
      fecha_nacimiento:
        !!formData.fecha_nacimiento.match(/^\d{4}-\d{2}-\d{2}$/),
      salario: !isNaN(parseFloat(formData.salario)),
    };

    return validations[field] ? {} : invalidStyle;
  };
  const handleFileSelect = (files) => {
    setDocumentos((prevDocs) => {
      // Calcular cuántos archivos podemos añadir sin superar el límite (5)
      const maxToAdd = 5 - prevDocs.length;
      if (maxToAdd <= 0) {
        return prevDocs;
      }

      // Limitar la cantidad de archivos nuevos que podemos añadir
      const filesToAdd = files.slice(0, maxToAdd);

      // Combinar los documentos existentes con los nuevos
      const combinedDocs = [...prevDocs, ...filesToAdd];

      return combinedDocs;
    });
  };
  const handleDeleteFile = (index) => {
    setDocumentos((prev) => {
      const newDocs = prev.filter((_, i) => i !== index);

      return newDocs;
    });
  };
  const handleSubmit = () => {
    if (!formValid) return;

    const payload = {
      ...formData,
      salario: parseFloat(formData.salario),
      telefono: formData.telefono || null,
      activo: employee ? formData.activo : true,
      // Conservar el objeto completo cuando se trata de un archivo nuevo
      documento_adjunto: documentos
        .map((doc) => {
          if (typeof doc === "string") return doc;
          return doc; // Mantener el objeto completo para procesarlo en el servicio
        })
        .filter(Boolean),
    };

    onSubmit(payload);
  };

  return (
    <ModalTemplate
      isVisible={visible}
      title={employee ? "Editar Empleado" : "Nuevo Empleado"}
      cancelLabel="Cancelar"
      cancelAction={onClose}
      confirmLabel={employee ? "Guardar" : "Crear"}
      confirmAction={handleSubmit}
      confirmDisabled={!formValid || loading}
    >
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre completo *</Text>
            <TextInput
              style={[styles.input, !formData.nombre.trim() && invalidStyle]}
              value={formData.nombre}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, nombre: text }))
              }
              placeholder="Ej: María García"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>DNI *</Text>
            <TextInput
              style={[styles.input, getFieldValidation("dni")]}
              value={formData.dni}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  dni: text.toUpperCase().replace(/[^0-9A-Z]/g, ""),
                }))
              }
              placeholder="Ej: 12345678A"
              maxLength={9}
              editable={!loading && !employee}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Número Seguridad Social *</Text>
            <TextInput
              style={[styles.input, getFieldValidation("nss")]}
              value={formData.nss}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  nss: text.replace(/[^0-9]/g, ""),
                }))
              }
              placeholder="Ej: 281234567840"
              maxLength={12}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fecha de Nacimiento *</Text>
            <TextInput
              style={[styles.input, getFieldValidation("fecha_nacimiento")]}
              value={formData.fecha_nacimiento}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, fecha_nacimiento: text }))
              }
              placeholder="AAAA-MM-DD"
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, getFieldValidation("email")]}
              value={formData.email}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, email: text }))
              }
              placeholder="ejemplo@empresa.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={formData.telefono}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, telefono: text }))
              }
              placeholder="+34 600 000 000"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Teléfono de Emergencia</Text>
            <TextInput
              style={styles.input}
              value={formData.telefono_emergencia}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, telefono_emergencia: text }))
              }
              placeholder="+34 600 000 000"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={styles.input}
              value={formData.direccion}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, direccion: text }))
              }
              placeholder="Calle, número, piso..."
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Código Postal</Text>
              <TextInput
                style={styles.input}
                value={formData.codigo_postal}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, codigo_postal: text }))
                }
                placeholder="28001"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 2 }]}>
              <Text style={styles.label}>Ciudad</Text>
              <TextInput
                style={styles.input}
                value={formData.ciudad}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, ciudad: text }))
                }
                placeholder="Madrid"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>País</Text>
            <TextInput
              style={styles.input}
              value={formData.pais}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, pais: text }))
              }
              placeholder="España"
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Laboral</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fecha Contratación *</Text>
            <TextInput
              style={[styles.input, getFieldValidation("fecha_contratacion")]}
              value={formData.fecha_contratacion}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, fecha_contratacion: text }))
              }
              placeholder="AAAA-MM-DD"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cargo *</Text>
            <TextInput
              style={styles.input}
              value={formData.cargo}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, cargo: text }))
              }
              placeholder="Ej: Desarrollador Senior"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Departamento</Text>
            <TextInput
              style={styles.input}
              value={formData.departamento}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, departamento: text }))
              }
              placeholder="Ej: Desarrollo"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Horas Contratadas</Text>
              <TextInput
                style={styles.input}
                value={formData.horas_contratadas}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, horas_contratadas: text }))
                }
                placeholder="40"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 2 }]}>
              <Text style={styles.label}>Tipo de Contrato *</Text>
              <CustomPicker
                selectedValue={formData.tipo_contrato}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, tipo_contrato: value }))
                }
                placeholder="Seleccione tipo"
                items={[
                  { label: "Indefinido", value: "indefinido" },
                  { label: "Temporal", value: "temporal" },
                  { label: "Prácticas", value: "practicas" },
                  { label: "Formación", value: "formacion" },
                ]}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Salario Anual *</Text>
            <TextInput
              style={styles.input}
              value={formData.salario}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, salario: text }))
              }
              placeholder="Ej: 45000.00"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Notas Adicionales</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              value={formData.notas}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, notas: text }))
              }
              placeholder="Información adicional relevante..."
              multiline
              numberOfLines={4}
            />
          </View>

          {employee && (
            <View style={styles.switchContainer}>
              <Text style={styles.label}>Estado Activo</Text>
              <Switch
                value={formData.activo}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, activo: value }))
                }
                trackColor={{
                  false: themeObject.colors.error,
                  true: themeObject.colors.success,
                }}
                thumbColor={
                  formData.activo
                    ? themeObject.colors.onSuccess
                    : themeObject.colors.onError
                }
              />
            </View>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          <FileUploader
            onFileSelect={handleFileSelect}
            files={documentos}
            onDeleteFile={handleDeleteFile}
            maxFiles={5}
            allowedTypes={[
              "*/*",
              "application/pdf",
              "image/*",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ]}
          />
        </View>
      </ScrollView>
    </ModalTemplate>
  );
};

export default EmployeeModal;
