// =====================================================
// FASE 3 - TAREA 3.4: Pantalla de Selección de Empresa
// Fecha: 8 de agosto de 2025
// Descripción: Pantalla para cambiar entre empresas disponibles
// =====================================================

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import {
  Card,
  Button,
  IconButton,
  Chip,
  ActivityIndicator,
  Searchbar,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import { useCompany } from "../../context/CompanyContext";
import { useTheme } from "../../context/ThemeContext";
import { Services } from "../../api";
import { SingleLimitDisplay } from "../../components/CompanyLimitsDisplay";

const CompanySelectionScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const {
    company: currentCompany,
    setCompany,
    loading: companyLoading,
  } = useCompany();
  const { themeObject } = useTheme();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [switchingTo, setSwitchingTo] = useState(null);

  useEffect(() => {
    loadUserCompanies();
  }, []);

  const loadUserCompanies = async () => {
    try {
      setLoading(true);

      // Simular carga de empresas del usuario
      // En un caso real, esto vendría de una API
      const userCompanies = [
        {
          id: currentCompany?.id || "1",
          name: currentCompany?.name || "Mi Empresa",
          plan: currentCompany?.plan || "basic",
          role: "owner",
          users_count: 5,
          is_current: true,
        },
        // Agregar más empresas simuladas si el usuario pertenece a varias
        ...(await loadInvitedCompanies()),
      ];

      setCompanies(userCompanies);
    } catch (error) {
      console.error("Error loading companies:", error);
      Alert.alert("Error", "No se pudieron cargar las empresas");
    } finally {
      setLoading(false);
    }
  };

  const loadInvitedCompanies = async () => {
    // Simular empresas a las que el usuario fue invitado
    // En un caso real, esto vendría de una API
    return [
      // {
      //   id: '2',
      //   name: 'Empresa Demo 2',
      //   plan: 'pro',
      //   role: 'employee',
      //   users_count: 12,
      //   is_current: false,
      // }
    ];
  };

  const handleCompanySwitch = async (selectedCompany) => {
    if (selectedCompany.is_current) return;

    try {
      setSwitchingTo(selectedCompany.id);

      Alert.alert(
        "Cambiar Empresa",
        `¿Deseas cambiar a "${selectedCompany.name}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cambiar",
            onPress: async () => {
              await performCompanySwitch(selectedCompany);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error switching company:", error);
      Alert.alert("Error", "No se pudo cambiar de empresa");
    } finally {
      setSwitchingTo(null);
    }
  };

  const performCompanySwitch = async (selectedCompany) => {
    try {
      // Guardar la empresa seleccionada
      await AsyncStorage.setItem("selected_company_id", selectedCompany.id);

      // Actualizar el contexto de empresa
      await setCompany(selectedCompany);

      // Navegar de vuelta
      navigation.goBack();

      Alert.alert("Éxito", `Cambiado a "${selectedCompany.name}"`);
    } catch (error) {
      console.error("Error performing company switch:", error);
      Alert.alert("Error", "No se pudo completar el cambio");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserCompanies();
    setRefreshing(false);
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCompanyCard = ({ item: company }) => {
    const isCurrent = company.is_current;
    const isSwitching = switchingTo === company.id;

    return (
      <Card
        style={[
          styles.companyCard,
          { backgroundColor: themeObject.colors.surface },
          isCurrent && {
            borderColor: themeObject.colors.primary,
            borderWidth: 2,
          },
        ]}
        onPress={() => !isCurrent && handleCompanySwitch(company)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.companyInfo}>
              <Text
                style={[
                  styles.companyName,
                  { color: themeObject.colors.text },
                  isCurrent && { fontWeight: "bold" },
                ]}
              >
                {company.name}
              </Text>
              <View style={styles.badges}>
                <Chip
                  mode="outlined"
                  textStyle={{
                    fontSize: 10,
                    lineHeight: 12,
                    textAlign: "center",
                    includeFontPadding: false,
                  }}
                  style={styles.planChip}
                >
                  {company.plan.toUpperCase()}
                </Chip>
                <Chip
                  mode="outlined"
                  textStyle={{
                    fontSize: 10,
                    lineHeight: 12,
                    textAlign: "center",
                    includeFontPadding: false,
                  }}
                  style={styles.roleChip}
                >
                  {company.role === "owner" ? "Propietario" : "Empleado"}
                </Chip>
                {isCurrent && (
                  <Chip
                    icon="check-circle"
                    mode="outlined"
                    textStyle={{
                      fontSize: 10,
                      lineHeight: 12,
                      textAlign: "center",
                      includeFontPadding: false,
                      color: themeObject.colors.primary,
                    }}
                    style={[
                      styles.currentChip,
                      { borderColor: themeObject.colors.primary },
                    ]}
                  >
                    Actual
                  </Chip>
                )}
              </View>
            </View>

            <View style={styles.cardActions}>
              {isSwitching ? (
                <ActivityIndicator
                  size="small"
                  color={themeObject.colors.primary}
                />
              ) : !isCurrent ? (
                <IconButton
                  icon="swap-horizontal"
                  size={20}
                  onPress={() => handleCompanySwitch(company)}
                />
              ) : (
                <IconButton
                  icon="check-circle"
                  size={20}
                  iconColor={themeObject.colors.primary}
                />
              )}
            </View>
          </View>

          <View style={styles.companyStats}>
            <Text
              style={[styles.statsText, { color: themeObject.colors.text }]}
            >
              {company.users_count} usuarios
            </Text>
          </View>

          {/* Mostrar límites si es la empresa actual */}
          {isCurrent && (
            <View style={styles.limitsPreview}>
              <SingleLimitDisplay resourceType="users" />
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeObject.colors.primary} />
        <Text style={[styles.loadingText, { color: themeObject.colors.text }]}>
          Cargando empresas...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
    >
      <View style={styles.content}>
        <Searchbar
          placeholder="Buscar empresa..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <FlatList
          data={filteredCompanies}
          keyExtractor={(item) => item.id}
          renderItem={renderCompanyCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text
                style={[styles.emptyText, { color: themeObject.colors.text }]}
              >
                No se encontraron empresas
              </Text>
              <Button
                mode="contained"
                onPress={handleRefresh}
                style={styles.retryButton}
              >
                Reintentar
              </Button>
            </View>
          }
        />
      </View>

      {/* Botón para crear nueva empresa */}
      <View style={styles.bottomActions}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("CreateCompany")}
          style={styles.createButton}
        >
          Crear Nueva Empresa
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchbar: {
    marginBottom: 16,
    elevation: 2,
  },
  listContainer: {
    paddingBottom: 16,
  },
  companyCard: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    marginBottom: 8,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  planChip: {
    height: 24,
  },
  roleChip: {
    height: 24,
  },
  currentChip: {
    height: 24,
  },
  cardActions: {
    alignItems: "center",
  },
  companyStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  statsText: {
    fontSize: 12,
  },
  limitsPreview: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
  },
  bottomActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  createButton: {
    marginTop: 8,
  },
});

export default CompanySelectionScreen;
