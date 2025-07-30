import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useUnifiedCache } from "../../cache/hooks/useUnifiedCache";

const CacheMonitor = ({ visible = false }) => {
  const cache = useUnifiedCache();
  const [stats, setStats] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const updateStats = () => {
      try {
        const currentStats = cache.getStats();
        setStats({
          available: cache.isAvailable,
          initialized: cache.isInitialized,
          healthy: cache.isHealthy,
          loadingOps: currentStats?.loadingOperations || 0,
          errorCount: currentStats?.errorCount || 0,
          lastUpdate: new Date(cache.lastUpdate).toLocaleTimeString(),
          hitRatio: currentStats?.hitRatio || "N/A",
          cacheSize: currentStats?.cacheSize || "N/A",
        });
      } catch (error) {
        console.warn("[CacheMonitor] Error getting stats:", error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [visible, cache]);

  if (!visible) return null;

  const getStatusColor = () => {
    if (!stats.available) return "#F44336"; // Red
    if (stats.errorCount > 0) return "#FF9800"; // Orange
    if (stats.loadingOps > 0) return "#2196F3"; // Blue
    return "#4CAF50"; // Green
  };

  return (
    <View style={[styles.container, { borderLeftColor: getStatusColor() }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.title}>Cache Monitor</Text>
        <View
          style={[styles.indicator, { backgroundColor: getStatusColor() }]}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.details}>
          <Text style={styles.stat}>
            Status: {stats.available ? "  Available" : "  Unavailable"}
          </Text>
          <Text style={styles.stat}>
            Initialized: {stats.initialized ? " " : " "}
          </Text>
          <Text style={styles.stat}>Healthy: {stats.healthy ? " " : " "}</Text>
          <Text style={styles.stat}>Loading: {stats.loadingOps} ops</Text>
          <Text style={styles.stat}>Errors: {stats.errorCount}</Text>
          <Text style={styles.stat}>Hit Ratio: {stats.hitRatio}</Text>
          <Text style={styles.stat}>Last Update: {stats.lastUpdate}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    minWidth: 120,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  details: {
    padding: 8,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  stat: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
});

export default CacheMonitor;
