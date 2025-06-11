import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeIn,
  Layout,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import HeaderWithTabs from "../HeaderWithTabs";

/**
 * Wrapper animado reutilizable para pantallas con pestañas
 * Proporciona animaciones consistentes para transiciones de pestañas
 *
 * @param {Object} props
 * @param {string} props.title - Título de la pantalla
 * @param {Array} props.tabs - Array de pestañas para HeaderWithTabs
 * @param {string} props.activeView - Vista activa actual
 * @param {Function} props.onChangeView - Función para cambiar de vista
 * @param {Object} props.children - Contenido de la pantalla
 * @param {Object} props.style - Estilos adicionales para el contenedor
 * @param {boolean} props.enableTabTransitions - Habilitar animaciones en transiciones de pestañas
 */
const AnimatedScreenWrapper = ({
  title,
  tabs,
  activeView,
  onChangeView,
  children,
  style,
  enableTabTransitions = true,
  ...props
}) => {
  const { themeObject } = useTheme();
  const renderContent = () => {
    if (!enableTabTransitions) {
      return children;
    }
    const contentProps = {
      entering: FadeInRight.duration(300).delay(50),
      exiting: FadeOutLeft.duration(200),
      layout: Layout.duration(200),
      style: styles.contentView,
    };

    return (
      <Animated.View key={activeView} {...contentProps}>
        {children}
      </Animated.View>
    );
  };
  const defaultStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeObject.colors.background,
    },
    content: {
      flex: 1,
    },
    contentView: {
      flex: 1,
    },
  });

  const styles = StyleSheet.create({
    ...defaultStyles,
    container: {
      ...defaultStyles.container,
      ...style,
    },
  });
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeObject.colors.background },
      ]}
      {...props}
    >
      {/* Header estático sin animaciones */}
      <HeaderWithTabs
        title={title}
        tabs={tabs}
        activeView={activeView}
        onChangeView={onChangeView}
      />

      {/* Contenido con animación muy sutil */}
      <Animated.View
        style={styles.content}
        entering={FadeIn.duration(600).delay(50)}
      >
        {renderContent()}
      </Animated.View>
    </View>
  );
};

export default AnimatedScreenWrapper;
