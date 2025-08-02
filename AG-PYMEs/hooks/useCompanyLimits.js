import { useCompany } from "../context/CompanyContext";
import useNotifications from "./useNotifications";

const useCompanyLimits = () => {
  const { checkLimit, getRemainingLimit, usage, company, limitsStatus } =
    useCompany();
  const { showWarning, showError } = useNotifications();

  const validateAction = async (
    resource,
    actionName = "realizar esta acción",
    amount = 1
  ) => {
    // Verificar si hay datos cargados
    if (!company || !usage) {
      showWarning("Cargando", "Esperando datos de la empresa...");
      return false;
    }

    // Usar checkLimit async
    const canProceed = await checkLimit(resource, amount);

    if (!canProceed) {
      showError(
        "Límite alcanzado",
        `Has alcanzado el límite de ${resource}. Mejora tu plan para ${actionName}.`
      );
      return false;
    }

    // Advertir cuando esté cerca del límite (90%)
    if (
      limitsStatus &&
      limitsStatus[resource] &&
      limitsStatus[resource].percentage >= 90
    ) {
      showWarning(
        "Cerca del límite",
        `Estás usando el ${limitsStatus[resource].percentage}% de tu límite de ${resource}.`
      );
    }

    return true;
  };

  const getUsagePercentage = (resource) => {
    if (!limitsStatus || !limitsStatus[resource]) return 0;
    return limitsStatus[resource].percentage || 0;
  };

  const isNearLimit = (resource, threshold = 80) => {
    return getUsagePercentage(resource) >= threshold;
  };

  const isAtLimit = (resource) => {
    return getUsagePercentage(resource) >= 100;
  };

  return {
    validateAction,
    checkLimit, // Ahora es async
    getRemainingLimit,
    getUsagePercentage,
    isNearLimit,
    isAtLimit,
    usage,
    company,
    limitsStatus,
    limits: company
      ? {
          users: company.max_users,
          clients: company.max_clients,
          products: company.max_products,
          storage: company.max_storage_mb,
        }
      : null,
    // Validaciones específicas async
    canAddUser: async (amount = 1) =>
      await validateAction("users", "agregar más usuarios", amount),
    canAddClient: async (amount = 1) =>
      await validateAction("clients", "agregar más clientes", amount),
    canAddProduct: async (amount = 1) =>
      await validateAction("products", "agregar más productos", amount),
    canUploadFile: async (fileSizeMB) => {
      if (!usage || !company) return false;

      const wouldExceed = usage.storageMB + fileSizeMB > company.max_storage_mb;
      if (wouldExceed) {
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

export default useCompanyLimits;
export { useCompanyLimits };
