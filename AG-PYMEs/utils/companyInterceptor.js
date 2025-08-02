import React from "react";
import { useCompany } from "../context/CompanyContext";
import useNotifications from "../hooks/useNotifications";

/**
 * Higher-Order Component para validar límites de empresa automáticamente
 * @param {React.Component} Component - Componente a envolver
 * @param {Array} validations - Array de validaciones a aplicar
 * @returns {React.Component} - Componente envuelto con validaciones
 */
export const withCompanyValidation = (Component, validations = []) => {
  return (props) => {
    const { checkLimit } = useCompany();
    const { showError, showWarning } = useNotifications();

    const validateAndExecute = (action, validation) => {
      return async (...args) => {
        if (validation && !checkLimit(validation.resource)) {
          showError("Límite alcanzado", validation.message);
          return false;
        }

        // Ejecutar la acción original si pasa la validación
        if (typeof action === "function") {
          return await action(...args);
        }
        return true;
      };
    };

    const validatedProps = { ...props };

    // Aplicar validaciones a las props especificadas
    validations.forEach(({ propName, resource, message }) => {
      if (props[propName]) {
        validatedProps[propName] = validateAndExecute(props[propName], {
          resource,
          message,
        });
      }
    });

    return <Component {...validatedProps} />;
  };
};

/**
 * Hook para validar límites manualmente
 * @returns {Object} Funciones de validación
 */
export const useCompanyValidation = () => {
  const { checkLimit, getRemainingLimit, usage, company } = useCompany();
  const { showError, showWarning } = useNotifications();

  const validateAction = async (
    resource,
    actionName = "realizar esta acción"
  ) => {
    if (!checkLimit(resource)) {
      const remaining = getRemainingLimit(resource);
      showError(
        "Límite alcanzado",
        `Has alcanzado el límite de ${resource}. Mejora tu plan para ${actionName}.`
      );
      return false;
    }

    // Advertir cuando esté cerca del límite (90%)
    const limits = {
      users: company?.max_users || 0,
      clients: company?.max_clients || 0,
      products: company?.max_products || 0,
      storage: company?.max_storage_mb || 0,
    };

    const currentUsage = usage?.[resource] || 0;
    const limit = limits[resource] || 0;
    const percentUsed = limit > 0 ? (currentUsage / limit) * 100 : 0;

    if (percentUsed >= 90) {
      showWarning(
        "Cerca del límite",
        `Estás usando el ${percentUsed.toFixed(0)}% de tu límite de ${resource}. Considera mejorar tu plan.`
      );
    }

    return true;
  };

  const createValidatedAction = (resource, actionName) => {
    return async (originalAction) => {
      const canProceed = await validateAction(resource, actionName);
      if (canProceed && typeof originalAction === "function") {
        return await originalAction();
      }
      return canProceed;
    };
  };

  return {
    validateAction,
    createValidatedAction,
    checkLimit,
    getRemainingLimit,

    // Validaciones específicas pre-configuradas
    validateClientCreation: () =>
      validateAction("clients", "agregar más clientes"),
    validateUserCreation: () => validateAction("users", "agregar más usuarios"),
    validateProductCreation: () =>
      validateAction("products", "agregar más productos"),
    validateFileUpload: (fileSizeMB = 0) => {
      const currentUsage = usage?.storageMB || 0;
      const limit = company?.max_storage_mb || 0;

      if (currentUsage + fileSizeMB > limit) {
        showError(
          "Almacenamiento insuficiente",
          `Este archivo excedería tu límite de almacenamiento. Libera espacio o mejora tu plan.`
        );
        return false;
      }
      return true;
    },
  };
};

/**
 * Componente de validación rápida para uso inline
 */
export const CompanyLimitGuard = ({
  resource,
  children,
  fallback = null,
  showWarning = true,
}) => {
  const { checkLimit, getRemainingLimit, usage, company } = useCompany();
  const { showWarning: showNotificationWarning } = useNotifications();

  const canRender = checkLimit(resource);

  // Mostrar advertencia si está cerca del límite
  React.useEffect(() => {
    if (canRender && showWarning) {
      const limits = {
        users: company?.max_users || 0,
        clients: company?.max_clients || 0,
        products: company?.max_products || 0,
        storage: company?.max_storage_mb || 0,
      };

      const currentUsage = usage?.[resource] || 0;
      const limit = limits[resource] || 0;
      const percentUsed = limit > 0 ? (currentUsage / limit) * 100 : 0;

      if (percentUsed >= 90) {
        showNotificationWarning(
          "Cerca del límite",
          `Estás usando el ${percentUsed.toFixed(0)}% de tu límite de ${resource}.`
        );
      }
    }
  }, [canRender, resource, showWarning, usage, company]);

  if (!canRender) {
    return fallback;
  }

  return children;
};

export default {
  withCompanyValidation,
  useCompanyValidation,
  CompanyLimitGuard,
};
