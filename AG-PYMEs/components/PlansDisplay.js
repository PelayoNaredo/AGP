// =====================================================
// FASE 4 - TAREA 4.10: Componente de Planes de Suscripción
// Fecha: 8 de agosto de 2025
// Descripción: Componente para mostrar y comparar planes
// =====================================================

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import {
  Card,
  Button,
  Chip,
  IconButton,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useCompany } from "../context/CompanyContext";
import { useTheme } from "../context/ThemeContext";
import { Services } from "../api";

const PlanFeatureList = ({ features, planCode, compact = false }) => {
  const { themeObject } = useTheme();

  if (!features) return null;

  const mainFeatures = Services.Plans.getMainFeatures({ features });
  const displayFeatures = compact ? mainFeatures.slice(0, 3) : mainFeatures;

  return (
    <View style={styles.featuresContainer}>
      {displayFeatures.map((feature, index) => (
        <View key={feature.key} style={styles.featureItem}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={Services.Plans.getPlanColor(planCode)}
          />
          <Text
            style={[styles.featureText, { color: themeObject.colors.text }]}
          >
            {feature.name}
          </Text>
        </View>
      ))}
      {compact && mainFeatures.length > 3 && (
        <Text
          style={[styles.moreFeatures, { color: themeObject.colors.primary }]}
        >
          +{mainFeatures.length - 3} más
        </Text>
      )}
    </View>
  );
};

const PlanCard = ({
  plan,
  currentPlan = null,
  onSelect,
  isSelected = false,
  showComparison = false,
  compact = false,
}) => {
  const { themeObject } = useTheme();
  const { usageStats } = useCompany();

  const isCurrentPlan = currentPlan?.plan_code === plan.plan_code;
  const isRecommended = Services.Plans.isRecommendedPlan(plan, usageStats);
  const yearlySavings = Services.Plans.calculateYearlySavings(plan);

  const planColor = Services.Plans.getPlanColor(plan.plan_code);

  return (
    <Card
      style={[
        styles.planCard,
        { backgroundColor: themeObject.colors.surface },
        isSelected && { borderColor: planColor, borderWidth: 2 },
        isCurrentPlan && {
          borderColor: themeObject.colors.primary,
          borderWidth: 2,
        },
      ]}
      onPress={() => onSelect?.(plan)}
    >
      <Card.Content>
        {/* Header del plan */}
        <View style={styles.planHeader}>
          <View style={styles.planTitleContainer}>
            <Ionicons
              name={Services.Plans.getPlanIcon(plan.plan_code)}
              size={24}
              color={planColor}
            />
            <Text style={[styles.planName, { color: themeObject.colors.text }]}>
              {plan.plan_name}
            </Text>
          </View>

          <View style={styles.planBadges}>
            {isCurrentPlan && (
              <Chip
                mode="outlined"
                textStyle={{ fontSize: 10, color: themeObject.colors.primary }}
                style={[
                  styles.badge,
                  { borderColor: themeObject.colors.primary },
                ]}
              >
                Actual
              </Chip>
            )}
            {isRecommended && (
              <Chip
                mode="outlined"
                textStyle={{ fontSize: 10, color: "#4CAF50" }}
                style={[styles.badge, { borderColor: "#4CAF50" }]}
              >
                Recomendado
              </Chip>
            )}
          </View>
        </View>

        {/* Descripción */}
        {plan.plan_description && !compact && (
          <Text
            style={[styles.planDescription, { color: themeObject.colors.text }]}
          >
            {plan.plan_description}
          </Text>
        )}

        {/* Precio */}
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: planColor }]}>
            {Services.Plans.formatPrice(plan.monthly_price)}
          </Text>
          <Text
            style={[styles.priceInterval, { color: themeObject.colors.text }]}
          >
            /mes
          </Text>
        </View>

        {/* Ahorro anual */}
        {yearlySavings > 0 && !compact && (
          <Text style={[styles.yearlySavings, { color: "#4CAF50" }]}>
            Ahorra {Services.Plans.formatPrice(yearlySavings)} al año
          </Text>
        )}

        <Divider style={{ marginVertical: 12 }} />

        {/* Límites principales */}
        <View style={styles.limitsContainer}>
          <View style={styles.limitItem}>
            <Ionicons
              name="people-outline"
              size={16}
              color={themeObject.colors.text}
            />
            <Text
              style={[styles.limitText, { color: themeObject.colors.text }]}
            >
              {Services.Plans.formatLimit(plan.max_users, "max_users")} usuarios
            </Text>
          </View>
          <View style={styles.limitItem}>
            <Ionicons
              name="person-outline"
              size={16}
              color={themeObject.colors.text}
            />
            <Text
              style={[styles.limitText, { color: themeObject.colors.text }]}
            >
              {Services.Plans.formatLimit(plan.max_clients, "max_clients")}{" "}
              clientes
            </Text>
          </View>
          <View style={styles.limitItem}>
            <Ionicons
              name="cube-outline"
              size={16}
              color={themeObject.colors.text}
            />
            <Text
              style={[styles.limitText, { color: themeObject.colors.text }]}
            >
              {Services.Plans.formatLimit(plan.max_products, "max_products")}{" "}
              productos
            </Text>
          </View>
          {!compact && (
            <View style={styles.limitItem}>
              <Ionicons
                name="cloud-outline"
                size={16}
                color={themeObject.colors.text}
              />
              <Text
                style={[styles.limitText, { color: themeObject.colors.text }]}
              >
                {Services.Plans.formatLimit(
                  plan.max_storage_mb,
                  "max_storage_mb"
                )}{" "}
                almacenamiento
              </Text>
            </View>
          )}
        </View>

        {/* Funcionalidades */}
        {!compact && (
          <>
            <Divider style={{ marginVertical: 12 }} />
            <PlanFeatureList
              features={plan.features}
              planCode={plan.plan_code}
              compact={compact}
            />
          </>
        )}

        {/* Comparación */}
        {showComparison && currentPlan && !isCurrentPlan && (
          <>
            <Divider style={{ marginVertical: 12 }} />
            <PlanComparisonSummary
              currentPlan={currentPlan}
              targetPlan={plan}
            />
          </>
        )}

        {/* Botón de acción */}
        <View style={styles.actionContainer}>
          {isCurrentPlan ? (
            <Button mode="outlined" disabled style={styles.actionButton}>
              Plan Actual
            </Button>
          ) : (
            <Button
              mode="contained"
              style={[styles.actionButton, { backgroundColor: planColor }]}
              onPress={() => onSelect?.(plan)}
            >
              {currentPlan ? "Cambiar Plan" : "Seleccionar"}
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const PlanComparisonSummary = ({ currentPlan, targetPlan }) => {
  const { themeObject } = useTheme();
  const comparison = Services.Plans.comparePlans(currentPlan, targetPlan);

  return (
    <View style={styles.comparisonContainer}>
      <Text
        style={[styles.comparisonTitle, { color: themeObject.colors.text }]}
      >
        Cambios respecto a tu plan actual:
      </Text>
      {comparison.changes.slice(0, 3).map((change, index) => (
        <View key={change.feature} style={styles.comparisonItem}>
          <Ionicons
            name={change.type === "upgrade" ? "arrow-up" : "arrow-down"}
            size={14}
            color={change.type === "upgrade" ? "#4CAF50" : "#FF9800"}
          />
          <Text
            style={[styles.comparisonText, { color: themeObject.colors.text }]}
          >
            {change.displayName}: {Services.Plans.formatLimit(change.current)} →{" "}
            {Services.Plans.formatLimit(change.target)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const PlansDisplay = ({
  onPlanSelect,
  showComparison = true,
  compact = false,
  title = "Planes Disponibles",
}) => {
  const { company } = useCompany();
  const { themeObject } = useTheme();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await Services.Plans.getAvailablePlans();
      setPlans(response.data || []);
    } catch (error) {
      console.error("Error loading plans:", error);
      Alert.alert("Error", "No se pudieron cargar los planes disponibles");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    onPlanSelect?.(plan);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeObject.colors.primary} />
        <Text style={[styles.loadingText, { color: themeObject.colors.text }]}>
          Cargando planes...
        </Text>
      </View>
    );
  }

  if (compact) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {plans.map((plan) => (
          <View key={plan.id} style={styles.compactPlanContainer}>
            <PlanCard
              plan={plan}
              currentPlan={company}
              onSelect={handlePlanSelect}
              isSelected={selectedPlan?.id === plan.id}
              showComparison={false}
              compact={true}
            />
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeObject.colors.text }]}>
        {title}
      </Text>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            currentPlan={company}
            onSelect={handlePlanSelect}
            isSelected={selectedPlan?.id === item.id}
            showComparison={showComparison}
            compact={compact}
          />
        )}
        contentContainerStyle={styles.plansList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  plansList: {
    paddingBottom: 20,
  },
  compactPlanContainer: {
    width: 280,
    marginRight: 16,
  },
  planCard: {
    marginBottom: 16,
    elevation: 3,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  planTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  planBadges: {
    flexDirection: "row",
    gap: 4,
  },
  badge: {
    height: 24,
  },
  planDescription: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
  },
  priceInterval: {
    fontSize: 16,
    marginLeft: 4,
  },
  yearlySavings: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },
  limitsContainer: {
    gap: 6,
  },
  limitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  limitText: {
    fontSize: 14,
  },
  featuresContainer: {
    gap: 4,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    fontSize: 13,
  },
  moreFeatures: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  comparisonContainer: {
    gap: 4,
  },
  comparisonTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  comparisonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  comparisonText: {
    fontSize: 11,
  },
  actionContainer: {
    marginTop: 16,
  },
  actionButton: {
    borderRadius: 8,
  },
});

export { PlansDisplay, PlanCard, PlanFeatureList };
export default PlansDisplay;
