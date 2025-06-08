/**
 * Herramientas de profiling para React Native
 * Incluye métricas de rendering, memoria y CPU
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

// Hook personalizado para medir performance de componentes
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const [metrics, setMetrics] = useState({
    renders: 0,
    avgRenderTime: 0,
    lastRender: null,
  });

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const renderTime = now - lastRenderTime.current;

    setMetrics((prev) => ({
      renders: renderCount.current,
      avgRenderTime:
        prev.avgRenderTime === 0
          ? renderTime
          : (prev.avgRenderTime + renderTime) / 2,
      lastRender: now,
    }));

    lastRenderTime.current = now;

    // Log para debugging (solo en desarrollo)
    if (__DEV__) {
      console.log(
        `[Performance] ${componentName}: Render #${renderCount.current}, Time: ${renderTime}ms`
      );
    }
  });

  return metrics;
};

// Componente de métricas de performance en tiempo real
export const PerformanceMonitor = ({ visible = false }) => {
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [frameRate, setFrameRate] = useState(60);
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    let interval;

    if (isVisible && __DEV__) {
      interval = setInterval(() => {
        // Simular métricas (en una app real usarías APIs nativas)
        setMemoryUsage(Math.random() * 100);
        setFrameRate(55 + Math.random() * 10);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  if (!__DEV__ || !isVisible) return null;

  return (
    <View style={styles.monitor}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsVisible(!isVisible)}
      >
        <Text style={styles.toggleText}>📊</Text>
      </TouchableOpacity>

      {isVisible && (
        <View style={styles.metricsContainer}>
          <Text style={styles.metricText}>
            Memory: {memoryUsage.toFixed(1)}%
          </Text>
          <Text style={styles.metricText}>FPS: {frameRate.toFixed(0)}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsVisible(false)}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Hook para detectar renders lentos
export const useSlowRenderDetector = (componentName, threshold = 16) => {
  const startTime = useRef(Date.now());

  useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime.current;

    if (renderTime > threshold && __DEV__) {
      console.warn(
        `[Slow Render] ${componentName}: ${renderTime}ms (threshold: ${threshold}ms)`
      );
    }

    startTime.current = Date.now();
  });
};

// Wrapper para medir performance de componentes
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return React.memo((props) => {
    const metrics = usePerformanceMonitor(componentName);
    useSlowRenderDetector(componentName);

    return <WrappedComponent {...props} />;
  });
};

// Utilidad para medir tiempo de ejecución de funciones
export const measureFunction = (fn, name = "Function") => {
  return (...args) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();

    if (__DEV__) {
      console.log(`[Function Time] ${name}: ${(end - start).toFixed(2)}ms`);
    }

    return result;
  };
};

// Componente para mostrar estadísticas de FlatList
export const FlatListProfiler = ({ data, renderItem, ...props }) => {
  const [listMetrics, setListMetrics] = useState({
    itemsRendered: 0,
    scrollEvents: 0,
    lastScrollTime: null,
  });

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    setListMetrics((prev) => ({
      ...prev,
      itemsRendered: viewableItems.length,
    }));
  });

  const onScroll = (event) => {
    setListMetrics((prev) => ({
      ...prev,
      scrollEvents: prev.scrollEvents + 1,
      lastScrollTime: Date.now(),
    }));

    if (props.onScroll) {
      props.onScroll(event);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  if (__DEV__) {
    console.log(`[FlatList Metrics]`, listMetrics);
  }

  return (
    <FlatList
      {...props}
      data={data}
      renderItem={renderItem}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={viewabilityConfig}
      onScroll={onScroll}
      // Optimizaciones por defecto
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      getItemLayout={props.getItemLayout || undefined}
    />
  );
};

const styles = StyleSheet.create({
  monitor: {
    position: "absolute",
    top: 50,
    right: 10,
    zIndex: 9999,
  },
  toggleButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: {
    fontSize: 20,
  },
  metricsContainer: {
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    minWidth: 120,
  },
  metricText: {
    color: "white",
    fontSize: 12,
    fontFamily: "monospace",
  },
  closeButton: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    backgroundColor: "red",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default {
  usePerformanceMonitor,
  PerformanceMonitor,
  useSlowRenderDetector,
  withPerformanceTracking,
  measureFunction,
  FlatListProfiler,
};
