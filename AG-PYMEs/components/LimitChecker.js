import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card, ProgressBar } from "react-native-paper";
import { useCompany } from "../context/CompanyContext";

const LimitChecker = ({ resource, title }) => {
  const { usage, company, getRemainingLimit } = useCompany();

  const configs = {
    users: { current: usage.users, limit: company.max_users },
    clients: { current: usage.clients, limit: company.max_clients },
    products: { current: usage.products, limit: company.max_products },
    storage: {
      current: usage.storageMB,
      limit: company.max_storage_mb,
      formatter: (value) => `${(value / 1024).toFixed(2)} GB`,
    },
  };

  const config = configs[resource];
  if (!config) return null;

  const progress = config.current / config.limit;
  const isNearLimit = progress > 0.8;
  const isAtLimit = progress >= 1;
  const formatValue = config.formatter || ((value) => value.toString());

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text
            style={[
              styles.usage,
              isNearLimit && styles.warning,
              isAtLimit && styles.error,
            ]}
          >
            {formatValue(config.current)} / {formatValue(config.limit)}
          </Text>
        </View>
        <ProgressBar
          progress={progress}
          color={isAtLimit ? "#f44336" : isNearLimit ? "#ff9800" : "#4caf50"}
          style={styles.progressBar}
        />
        {isNearLimit && (
          <Text style={[styles.warningText, isAtLimit && styles.errorText]}>
            {isAtLimit
              ? `Has alcanzado el límite de ${title.toLowerCase()}`
              : `Quedan ${getRemainingLimit(resource)} disponibles`}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    borderRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  usage: {
    fontSize: 14,
    color: "#666",
  },
  warning: {
    color: "#ff9800",
    fontWeight: "600",
  },
  error: {
    color: "#f44336",
    fontWeight: "700",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 12,
    color: "#ff9800",
    marginTop: 8,
    fontStyle: "italic",
  },
  errorText: {
    color: "#f44336",
    fontWeight: "600",
  },
});

export default LimitChecker;
