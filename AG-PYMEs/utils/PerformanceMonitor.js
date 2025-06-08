/**
 * Monitor de Performance en Tiempo Real
 * Herramienta para detectar cuellos de botella mientras usas la app
 */

import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";

class PerformanceTracker {
  constructor() {
    this.metrics = {
      renderCount: 0,
      lastRenderTime: Date.now(),
      avgRenderTime: 0,
      slowRenders: 0,
      memoryUsage: 0,
    };
    this.renderTimes = [];
    this.maxSamples = 30;
  }

  startRender() {
    this.renderStart = performance.now();
  }

  endRender(componentName = "Unknown") {
    if (!this.renderStart) return;

    const renderTime = performance.now() - this.renderStart;
    this.renderTimes.push(renderTime);

    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift();
    }

    this.metrics.renderCount++;
    this.metrics.avgRenderTime =
      this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;

    // Detectar renders lentos (más de 16ms = 60fps)
    if (renderTime > 16) {
      this.metrics.slowRenders++;
      console.warn(
        `🐌 Render lento detectado en ${componentName}: ${renderTime.toFixed(2)}ms`
      );
    }

    this.renderStart = null;
    return renderTime;
  }

  getMetrics() {
    return {
      ...this.metrics,
      fps:
        this.renderTimes.length > 0
          ? (1000 / this.metrics.avgRenderTime).toFixed(1)
          : 0,
      slowRenderPercentage:
        this.metrics.renderCount > 0
          ? (
              (this.metrics.slowRenders / this.metrics.renderCount) *
              100
            ).toFixed(1)
          : 0,
    };
  }

  reset() {
    this.metrics = {
      renderCount: 0,
      lastRenderTime: Date.now(),
      avgRenderTime: 0,
      slowRenders: 0,
      memoryUsage: 0,
    };
    this.renderTimes = [];
  }
}

// Hook para monitorear performance de componentes
export const usePerformanceMonitor = (componentName) => {
  const tracker = useRef(new PerformanceTracker()).current;
  const renderCount = useRef(0);

  useEffect(() => {
    tracker.startRender();
    return () => {
      tracker.endRender(componentName);
    };
  });

  useEffect(() => {
    renderCount.current++;
    if (renderCount.current > 10) {
      const metrics = tracker.getMetrics();
      if (metrics.slowRenderPercentage > 20) {
        console.warn(
          `⚠️ ${componentName} tiene ${metrics.slowRenderPercentage}% de renders lentos`
        );
      }
    }
  });

  return tracker.getMetrics();
};

// Componente de overlay para mostrar métricas en desarrollo
export const PerformanceOverlay = ({ visible = __DEV__ }) => {
  const [metrics, setMetrics] = useState({});
  const globalTracker = useRef(new PerformanceTracker()).current;

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setMetrics(globalTracker.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, globalTracker]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Text style={styles.title}>Performance Monitor</Text>
      <Text style={styles.metric}>FPS: {metrics.fps || 0}</Text>
      <Text style={styles.metric}>Renders: {metrics.renderCount || 0}</Text>
      <Text style={styles.metric}>
        Avg Time: {(metrics.avgRenderTime || 0).toFixed(1)}ms
      </Text>
      <Text
        style={[
          styles.metric,
          metrics.slowRenderPercentage > 20 && styles.warning,
        ]}
      >
        Slow: {metrics.slowRenderPercentage || 0}%
      </Text>
    </View>
  );
};

// HOC para envolver componentes y monitorear automáticamente
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return React.memo((props) => {
    const metrics = usePerformanceMonitor(
      componentName || WrappedComponent.name
    );

    return <WrappedComponent {...props} />;
  });
};

// Utilidades para medir operaciones específicas
export const measureAsyncOperation = async (operation, operationName) => {
  const start = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - start;

    if (duration > 100) {
      console.warn(
        `🐌 Operación lenta: ${operationName} tomó ${duration.toFixed(2)}ms`
      );
    }

    return result;
  } catch (error) {
    console.error(`❌ Error en ${operationName}:`, error);
    throw error;
  }
};

export const measureSyncOperation = (operation, operationName) => {
  const start = performance.now();
  try {
    const result = operation();
    const duration = performance.now() - start;

    if (duration > 16) {
      console.warn(
        `🐌 Operación síncrona lenta: ${operationName} tomó ${duration.toFixed(2)}ms`
      );
    }

    return result;
  } catch (error) {
    console.error(`❌ Error en ${operationName}:`, error);
    throw error;
  }
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 10,
    borderRadius: 5,
    zIndex: 9999,
  },
  title: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 5,
  },
  metric: {
    color: "white",
    fontSize: 10,
    marginBottom: 2,
  },
  warning: {
    color: "#FF6B6B",
  },
});

export default PerformanceTracker;
