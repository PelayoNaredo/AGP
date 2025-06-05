import React from "react";
import { View, Pressable, Text, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, hexToRgb } from "../../utils/helpers";

export const AlertCard = ({ data, theme, navigation }) => {
  const renderItem = ({ item, index }) => (
    <View
      style={[
        styles.alertItem,
        {
          backgroundColor: theme.background,
          borderLeftColor:
            item.prioridad === "alta" ? theme.error : theme.warning,
        },
      ]}
    >
      <Ionicons
        name={item.prioridad === "alta" ? "alert-circle" : "timer"}
        size={20}
        color={theme.text}
      />
      <View style={styles.alertTextContainer}>
        <Text
          style={[styles.alertTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.titulo}
        </Text>
        <Text
          style={[styles.alertDate, { color: theme.placeholder }]}
          numberOfLines={1}
        >
          {formatDate(item.fecha_recordatorio)}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: `rgba(${hexToRgb(theme.warning)}, 0.09)`, flex: 1 },
      ]}
      accessibilityLabel="Alertas y notificaciones"
    >
      <View style={styles.cardHeader}>
        <Ionicons name="notifications" size={24} color={theme.text} />
        <Text style={[styles.cardTitle, { color: theme.text }]}>Alertas</Text>
        <View style={[styles.alertCounter, { backgroundColor: theme.warning }]}>
          <Text style={[styles.counterText, { color: theme.text }]}>
            {data.pendientes}
          </Text>
        </View>
      </View>

      {data.pendientes > 0 ? (
        <FlatList
          data={data.proximas.slice(0, 3)}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.alertsList}
        />
      ) : (
        <View style={styles.noAlerts}>
          <Ionicons name="checkmark-circle" size={40} color={theme.success} />
          <Text style={[styles.noAlertsText, { color: theme.text }]}>
            ¡Todo bajo control!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    padding: 16,
    
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
    lineHeight: 24,
    flex: 1,
  },
  alertCounter: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  alertsList: {
    gap: 8,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  alertDate: {
    fontSize: 12,
  },
  noAlerts: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  noAlertsText: {
    fontSize: 14,
    textAlign: "center",
  },
  counterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
});
