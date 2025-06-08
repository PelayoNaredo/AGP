import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "../../../context/ThemeContext";

//Componente que muestra los detalles de un ingreso
const IncomesCard = ({ item, onPress }) => {
  const { themeObject } = useTheme();

  // Obtener valores del item o mostrar valores por defecto
  const {
    id_ingreso,
    fecha_ingreso,
    ingresos,
    comentarios,
    concepto,
    categoria,
    metodo_ingreso,
  } = item || {};

  // Formatear fecha
  const formattedDate = fecha_ingreso
    ? new Date(fecha_ingreso).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Fecha no disponible";

  // Estilos dinámicos basados en el tema
  const dynamicStyles = {
    card: {
      backgroundColor: themeObject.colors.surface,
      borderLeftColor: themeObject.colors.primary,
    },
    amount: {
      color: themeObject.colors.success,
    },
    title: {
      color: themeObject.colors.text,
    },
    subtitle: {
      color: themeObject.colors.textSecondary || themeObject.colors.text + "99",
    },
    date: {
      color: themeObject.colors.textSecondary || themeObject.colors.text + "99",
    },
    comentarios: {
      color: themeObject.colors.text,
    },
    label: {
      color: themeObject.colors.textSecondary || themeObject.colors.text + "99",
    },
    value: {
      color: themeObject.colors.text,
    },
    badge: {
      backgroundColor: themeObject.colors.primary + "22",
    },
    badgeText: {
      color: themeObject.colors.primary,
    },
  };

  return (
    <Pressable
      style={[styles.card, dynamicStyles.card, styles.compactCard]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.amount, dynamicStyles.amount]}>
          ${parseFloat(ingresos || 0).toFixed(2)}
        </Text>
        <Text style={[styles.date, dynamicStyles.date]}>{formattedDate}</Text>
      </View>

      {concepto && (
        <Text style={[styles.title, dynamicStyles.title]} numberOfLines={1}>
          {concepto}
        </Text>
      )}

      {comentarios && (
        <Text
          style={[styles.comentarios, dynamicStyles.comentarios]}
          numberOfLines={2}
        >
          {comentarios}
        </Text>
      )}

      <View style={styles.tagContainer}>
        {categoria && (
          <View style={[styles.badge, dynamicStyles.badge]}>
            <Text style={[styles.badgeText, dynamicStyles.badgeText]}>
              {categoria}
            </Text>
          </View>
        )}

        {metodo_ingreso && (
          <View style={[styles.badge, dynamicStyles.badge]}>
            <Text style={[styles.badgeText, dynamicStyles.badgeText]}>
              {metodo_ingreso}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

// Estilos del componente
const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
  },
  compactCard: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: "right",
  },
  date: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  dateContainer: {
    alignItems: "flex-end",
  },
  comentarios: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  cardActions: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    zIndex: 10,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  value: {
    fontSize: 14,
    flex: 1,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default IncomesCard;
