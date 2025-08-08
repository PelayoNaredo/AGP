import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Card,
  List,
  Divider,
  Chip,
  Text,
  IconButton,
  Button,
  TextInput,
  Dialog,
  Portal,
} from "react-native-paper";
import { useTheme } from "../../context/ThemeContext";
import { useCompany } from "../../context/CompanyContext";
import { Services } from "../../api";
import useNotifications from "../../hooks/useNotifications";

// Tarjeta para gestionar invitaciones de empresa
const CompanyInvitationsCard = ({ navigation }) => {
  const { themeObject } = useTheme();
  const { generateInvitation, users, loadCompanyUsers } = useCompany();
  const { showSuccess, showErrorNotification, showConfirmDialog } =
    useNotifications();

  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    loadInvitations();
    loadCompanyUsers();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      // Aquí podrías llamar a un endpoint específico para obtener invitaciones pendientes
      // Por ahora simulamos algunas invitaciones
      setInvitations([
        {
          id: 1,
          email: "ejemplo@empresa.com",
          status: "pending",
          created_at: new Date().toISOString(),
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error loading invitations:", error);
      showErrorNotification("Error al cargar invitaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) {
      showErrorNotification("Por favor ingresa un email válido");
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      showErrorNotification("Por favor ingresa un email válido");
      return;
    }

    try {
      setSendingInvite(true);
      const invitation = await generateInvitation(inviteEmail);

      if (invitation) {
        showSuccess("Invitación enviada correctamente");
        setInviteEmail("");
        setShowInviteDialog(false);
        loadInvitations();
        loadCompanyUsers();
      } else {
        showErrorNotification("No se pudo enviar la invitación");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      showErrorNotification("Error al enviar la invitación");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvitation = (invitationId) => {
    showConfirmDialog(
      "Cancelar Invitación",
      "¿Estás seguro de que quieres cancelar esta invitación?",
      () => {
        // Aquí implementarías la lógica para cancelar la invitación
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
        showSuccess("Invitación cancelada");
      },
      () => {},
      "Cancelar Invitación",
      "Mantener"
    );
  };

  const handleResendInvitation = async (invitationId, email) => {
    try {
      const invitation = await generateInvitation(email);
      if (invitation) {
        showSuccess("Invitación reenviada correctamente");
        loadInvitations();
      } else {
        showErrorNotification("No se pudo reenviar la invitación");
      }
    } catch (error) {
      console.error("Error resending invitation:", error);
      showErrorNotification("Error al reenviar la invitación");
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { label: "Pendiente", color: "#FF9800", icon: "clock-outline" },
      accepted: { label: "Aceptada", color: "#4CAF50", icon: "check-circle" },
      rejected: { label: "Rechazada", color: "#F44336", icon: "close-circle" },
      expired: { label: "Expirada", color: "#9E9E9E", icon: "timer-off" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Chip
        icon={config.icon}
        style={{ backgroundColor: config.color + "20" }}
        textStyle={{ color: config.color, fontSize: 11 }}
        compact
      >
        {config.label}
      </Chip>
    );
  };

  return (
    <>
      <Card
        style={[styles.card, { backgroundColor: themeObject.colors.surface }]}
      >
        <Card.Title
          title="Invitaciones de Empresa"
          subtitle={`${invitations.length} invitaciones • ${users.length} miembros`}
          titleStyle={{ fontWeight: "bold", fontSize: 16 }}
          subtitleStyle={{ fontSize: 12, opacity: 0.7 }}
          left={(props) => (
            <IconButton
              {...props}
              icon="account-multiple-plus"
              size={20}
              iconColor={themeObject.colors.primary}
            />
          )}
          right={(props) => (
            <IconButton
              {...props}
              icon="plus"
              size={18}
              iconColor={themeObject.colors.primary}
              onPress={() => setShowInviteDialog(true)}
            />
          )}
        />

        <Card.Content>
          {/* Miembros actuales */}
          <Text
            style={[styles.sectionTitle, { color: themeObject.colors.text }]}
          >
            Miembros Actuales ({users.length})
          </Text>

          {users.length > 0 ? (
            <ScrollView style={styles.membersList} nestedScrollEnabled>
              {users.map((user, index) => (
                <List.Item
                  key={user.id || index}
                  title={user.name || user.email}
                  description={user.email}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={user.role === "admin" ? "crown" : "account"}
                    />
                  )}
                  right={() => (
                    <View style={styles.memberRole}>
                      <Chip
                        compact
                        style={{
                          backgroundColor:
                            user.role === "admin" ? "#FFE0B2" : "#E8F5E8",
                        }}
                        textStyle={{ fontSize: 10 }}
                      >
                        {user.role === "admin" ? "Admin" : "Usuario"}
                      </Chip>
                    </View>
                  )}
                  style={styles.listItem}
                />
              ))}
            </ScrollView>
          ) : (
            <Text
              style={[styles.emptyText, { color: themeObject.colors.text }]}
            >
              No hay miembros en la empresa
            </Text>
          )}

          <Divider style={styles.divider} />

          {/* Invitaciones pendientes */}
          <Text
            style={[styles.sectionTitle, { color: themeObject.colors.text }]}
          >
            Invitaciones Pendientes ({invitations.length})
          </Text>

          {invitations.length > 0 ? (
            invitations.map((invitation) => (
              <List.Item
                key={invitation.id}
                title={invitation.email}
                description={`Enviada: ${formatDate(invitation.created_at)} • Expira: ${formatDate(invitation.expires_at)}`}
                left={(props) => <List.Icon {...props} icon="email-outline" />}
                right={() => (
                  <View style={styles.invitationActions}>
                    {getStatusChip(invitation.status)}
                    <IconButton
                      icon="refresh"
                      size={16}
                      onPress={() =>
                        handleResendInvitation(invitation.id, invitation.email)
                      }
                      iconColor={themeObject.colors.primary}
                    />
                    <IconButton
                      icon="close"
                      size={16}
                      onPress={() => handleCancelInvitation(invitation.id)}
                      iconColor={themeObject.colors.error}
                    />
                  </View>
                )}
                style={styles.listItem}
              />
            ))
          ) : (
            <Text
              style={[styles.emptyText, { color: themeObject.colors.text }]}
            >
              No hay invitaciones pendientes
            </Text>
          )}

          {/* Botón para invitar */}
          <Button
            mode="contained"
            icon="plus"
            onPress={() => setShowInviteDialog(true)}
            style={styles.inviteButton}
            contentStyle={styles.inviteButtonContent}
          >
            Invitar Nuevo Miembro
          </Button>
        </Card.Content>
      </Card>

      {/* Dialog para invitar */}
      <Portal>
        <Dialog
          visible={showInviteDialog}
          onDismiss={() => setShowInviteDialog(false)}
        >
          <Dialog.Title>Invitar Nuevo Miembro</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogDescription}>
              Ingresa el email de la persona que quieres invitar a tu empresa.
            </Text>
            <TextInput
              label="Email del invitado"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="ejemplo@empresa.com"
              left={<TextInput.Icon icon="email" />}
              style={styles.inviteInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInviteDialog(false)}>Cancelar</Button>
            <Button
              mode="contained"
              onPress={handleSendInvitation}
              loading={sendingInvite}
              disabled={sendingInvite || !inviteEmail.trim()}
            >
              Enviar Invitación
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 4,
  },
  membersList: {
    maxHeight: 160,
    marginBottom: 4,
  },
  listItem: {
    backgroundColor: "rgba(0, 0, 0, 0.025)",
    borderRadius: 6,
    marginVertical: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  memberRole: {
    justifyContent: "center",
  },
  divider: {
    marginVertical: 12,
    opacity: 0.3,
  },
  invitationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  emptyText: {
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.6,
    paddingVertical: 12,
    fontSize: 13,
  },
  inviteButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  inviteButtonContent: {
    paddingVertical: 6,
  },
  dialogDescription: {
    marginBottom: 16,
    opacity: 0.8,
    fontSize: 14,
  },
  inviteInput: {
    marginBottom: 8,
  },
});

export default CompanyInvitationsCard;
