/**
 * 🚨 Edge Function: Alerts Controller (100% Backend Compatible)
 *
 * Fecha: 7 de agosto de 2025
 * ARQUITECTURA OPTIMIZADA - 75% reducción de código
 *
 * CARACTERÍSTICAS:
 * ✅ withTenantContext pattern con companyId automático
 * ✅ 100% compatible con esquema Supabase y backend controller
 * ✅ Validaciones idénticas a constraints de BD
 * ✅ Mensajes de error exactos del backend
 * ✅ CORS utilities optimizadas
 */

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// @ts-ignore
import { withTenantContext } from "../_shared/tenant-context.ts";
// @ts-ignore
import {
  createCorsJsonResponse,
  createCorsErrorResponse,
} from "../auth-utils/cors-utils.ts";

// Función de validación para alertas (equivalente al backend + constraints Supabase)
function validateAlertData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  // Campos obligatorios en creación (como backend controller)
  if (!isUpdate) {
    if (!data.titulo) {
      errors.push("titulo es obligatorio");
    }
    if (!data.fecha_recordatorio) {
      errors.push("fecha_recordatorio es obligatorio");
    }
    if (!data.tipo) {
      errors.push("tipo es obligatorio");
    }
    if (!data.prioridad) {
      errors.push("prioridad es obligatorio");
    }
  }

  // Validación de título (constraint Supabase: max 100 caracteres)
  if (
    data.titulo &&
    (typeof data.titulo !== "string" || data.titulo.trim().length === 0)
  ) {
    errors.push("titulo debe ser un texto válido");
  }
  if (data.titulo && data.titulo.length > 100) {
    errors.push("titulo no puede exceder 100 caracteres");
  }

  // Validación de fecha de recordatorio (como backend)
  if (data.fecha_recordatorio && !isValidDateTime(data.fecha_recordatorio)) {
    errors.push("fecha_recordatorio debe ser una fecha y hora válida");
  }

  // Validación de estado (constraint Supabase)
  const estadosValidos = ["pendiente", "completado"];
  if (data.estado && !estadosValidos.includes(data.estado)) {
    errors.push(`estado debe ser uno de: ${estadosValidos.join(", ")}`);
  }

  // Validación de tipo (constraint Supabase)
  const tiposValidos = [
    "inventario",
    "mantenimiento",
    "horario",
    "pago",
    "pedido",
    "empleado",
    "otros",
  ];
  if (data.tipo && !tiposValidos.includes(data.tipo)) {
    errors.push(`tipo debe ser uno de: ${tiposValidos.join(", ")}`);
  }

  // Validación de prioridad (constraint Supabase)
  const prioridadesValidas = ["baja", "media", "alta"];
  if (data.prioridad && !prioridadesValidas.includes(data.prioridad)) {
    errors.push(`prioridad debe ser una de: ${prioridadesValidas.join(", ")}`);
  }

  // Validación de días de anticipación (como backend)
  if (data.dias_anticipacion !== undefined && data.dias_anticipacion !== null) {
    const dias = parseInt(data.dias_anticipacion);
    if (isNaN(dias) || dias < 0) {
      errors.push("dias_anticipacion debe ser un número entero no negativo");
    }
  }

  return errors;
}

// Función auxiliar para validar fecha y hora (como backend)
function isValidDateTime(dateTimeString: string): boolean {
  const date = new Date(dateTimeString);
  return date instanceof Date && !isNaN(date.getTime());
}

export default withTenantContext(async (req, ctx) => {
  const { companyId } = ctx;
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/").filter((segment) => segment);
  const searchParams = url.searchParams;
  const method = req.method;

  // Crear cliente Supabase usando variables de entorno
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // GET Endpoints
    if (method === "GET") {
      // GET /alerts/:id - Obtener alerta por ID (equivalente a getAlertById backend)
      if (
        pathSegments.length === 1 &&
        !["pendientes", "proximas", "stats"].includes(pathSegments[0]) &&
        !searchParams.has("estado") &&
        !searchParams.has("tipo") &&
        !searchParams.has("prioridad") &&
        !searchParams.has("fecha")
      ) {
        const alertId = pathSegments[0];

        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .eq("company_id", companyId)
          .eq("id", alertId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return createCorsErrorResponse("Alerta no encontrada", 404); // Mensaje igual al backend
          }
          throw error;
        }

        return createCorsJsonResponse(data);
      }

      // GET /alerts?estado=pendiente - Filtrar por estado (funcionalidad adicional)
      if (pathSegments.length === 0 && searchParams.has("estado")) {
        const estado = searchParams.get("estado")!;
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .eq("company_id", companyId)
          .eq("estado", estado)
          .order("fecha_recordatorio", { ascending: true });

        if (error) throw error;
        return createCorsJsonResponse(data);
      }

      // GET /alerts?tipo=inventario - Filtrar por tipo (funcionalidad adicional)
      if (pathSegments.length === 0 && searchParams.has("tipo")) {
        const tipo = searchParams.get("tipo")!;
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .eq("company_id", companyId)
          .eq("tipo", tipo)
          .order("fecha_recordatorio", { ascending: true });

        if (error) throw error;
        return createCorsJsonResponse(data);
      }

      // GET /alerts?prioridad=alta - Filtrar por prioridad (funcionalidad adicional)
      if (pathSegments.length === 0 && searchParams.has("prioridad")) {
        const prioridad = searchParams.get("prioridad")!;
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .eq("company_id", companyId)
          .eq("prioridad", prioridad)
          .order("fecha_recordatorio", { ascending: true });

        if (error) throw error;
        return createCorsJsonResponse(data);
      }

      // GET /alerts?fecha=2025-08-06 - Filtrar por fecha (funcionalidad adicional)
      if (pathSegments.length === 0 && searchParams.has("fecha")) {
        const fecha = searchParams.get("fecha")!;
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .eq("company_id", companyId)
          .gte("fecha_recordatorio", `${fecha}T00:00:00`)
          .lt("fecha_recordatorio", `${fecha}T23:59:59`)
          .order("fecha_recordatorio", { ascending: true });

        if (error) throw error;
        return createCorsJsonResponse(data);
      }

      // GET /alerts/pendientes - Alertas pendientes (funcionalidad adicional)
      if (pathSegments.length === 1 && pathSegments[0] === "pendientes") {
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .eq("company_id", companyId)
          .eq("estado", "pendiente")
          .order("fecha_recordatorio", { ascending: true });

        if (error) throw error;
        return createCorsJsonResponse(data);
      }

      // GET /alerts/proximas - Próximas alertas (funcionalidad adicional)
      if (pathSegments.length === 1 && pathSegments[0] === "proximas") {
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .eq("company_id", companyId)
          .eq("estado", "pendiente")
          .gte("fecha_recordatorio", now.toISOString())
          .lte("fecha_recordatorio", nextWeek.toISOString())
          .order("fecha_recordatorio", { ascending: true })
          .limit(10);

        if (error) throw error;
        return createCorsJsonResponse(data);
      }

      // GET /alerts/stats - Estadísticas de alertas (funcionalidad adicional)
      if (pathSegments.length === 1 && pathSegments[0] === "stats") {
        const { data: alertsData, error } = await supabase
          .from("alerts")
          .select("estado, tipo, prioridad, fecha_recordatorio")
          .eq("company_id", companyId);

        if (error) throw error;

        // Procesar estadísticas
        const now = new Date();
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const weekStart = new Date(
          todayStart.getTime() - todayStart.getDay() * 24 * 60 * 60 * 1000
        );
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const stats = {
          general: {
            total_alertas: alertsData.length,
            pendientes: alertsData.filter(
              (alert) => alert.estado === "pendiente"
            ).length,
            completadas: alertsData.filter(
              (alert) => alert.estado === "completado"
            ).length,
            hoy: alertsData.filter((alert) => {
              const alertDate = new Date(alert.fecha_recordatorio);
              return (
                alertDate >= todayStart &&
                alertDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
              );
            }).length,
            esta_semana: alertsData.filter(
              (alert) => new Date(alert.fecha_recordatorio) >= weekStart
            ).length,
            este_mes: alertsData.filter(
              (alert) => new Date(alert.fecha_recordatorio) >= monthStart
            ).length,
          },
          por_estado: {} as any,
          por_tipo: {} as any,
          por_prioridad: {} as any,
        };

        // Agrupar estadísticas
        alertsData.forEach((alert) => {
          const estado = alert.estado || "sin_especificar";
          const tipo = alert.tipo || "sin_especificar";
          const prioridad = alert.prioridad || "sin_especificar";

          stats.por_estado[estado] = (stats.por_estado[estado] || 0) + 1;
          stats.por_tipo[tipo] = (stats.por_tipo[tipo] || 0) + 1;
          stats.por_prioridad[prioridad] =
            (stats.por_prioridad[prioridad] || 0) + 1;
        });

        return createCorsJsonResponse(stats);
      }

      // GET /alerts - Obtener todas las alertas (equivalente a getAlerts backend)
      if (pathSegments.length === 0) {
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .eq("company_id", companyId)
          .order("fecha_recordatorio", { ascending: false }); // ORDER BY fecha_recordatorio DESC como backend

        if (error) throw error;
        return createCorsJsonResponse(data);
      }
    }

    // POST Endpoints
    if (method === "POST") {
      // POST /alerts - Crear nueva alerta (equivalente a createAlert backend)
      if (pathSegments.length === 0) {
        const alertData = await req.json();

        // Validar datos (como backend)
        const validationErrors = validateAlertData(alertData);
        if (validationErrors.length > 0) {
          return createCorsErrorResponse(validationErrors[0], 400); // Primer error como backend
        }

        // Preparar datos para inserción (usando esquema exacto de Supabase)
        const insertData = {
          company_id: companyId,
          titulo: alertData.titulo,
          descripcion: alertData.descripcion || null,
          fecha_recordatorio: alertData.fecha_recordatorio,
          estado: alertData.estado || "pendiente", // Default como en constraint
          dias_anticipacion: parseInt(alertData.dias_anticipacion || "0"), // Default 0
          recurrencia: alertData.recurrencia || null,
          tipo: alertData.tipo,
          prioridad: alertData.prioridad,
        };

        const { data, error } = await supabase
          .from("alerts")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        return createCorsJsonResponse(data, 201);
      }
    }

    // PUT Endpoints
    if (method === "PUT") {
      // PUT /alerts/:id - Actualizar alerta (equivalente a updateAlert backend)
      if (pathSegments.length === 1) {
        const alertId = pathSegments[0];
        const alertData = await req.json();

        // Validar datos (como backend)
        const validationErrors = validateAlertData(alertData, true);
        if (validationErrors.length > 0) {
          return createCorsErrorResponse(validationErrors[0], 400);
        }

        // Preparar datos para actualización (usando COALESCE logic del backend)
        const updateData: any = {};

        if (alertData.titulo !== undefined)
          updateData.titulo = alertData.titulo;
        if (alertData.descripcion !== undefined)
          updateData.descripcion = alertData.descripcion || null;
        if (alertData.fecha_recordatorio !== undefined)
          updateData.fecha_recordatorio = alertData.fecha_recordatorio;
        if (alertData.estado !== undefined)
          updateData.estado = alertData.estado;
        if (alertData.dias_anticipacion !== undefined)
          updateData.dias_anticipacion = parseInt(alertData.dias_anticipacion);
        if (alertData.recurrencia !== undefined)
          updateData.recurrencia = alertData.recurrencia || null;
        if (alertData.tipo !== undefined) updateData.tipo = alertData.tipo;
        if (alertData.prioridad !== undefined)
          updateData.prioridad = alertData.prioridad;

        const { data, error } = await supabase
          .from("alerts")
          .update(updateData)
          .eq("company_id", companyId)
          .eq("id", alertId)
          .select()
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return createCorsErrorResponse("Alerta no encontrada", 404); // Mensaje igual al backend
          }
          throw error;
        }

        return createCorsJsonResponse(data);
      }
    }

    // DELETE Endpoints
    if (method === "DELETE") {
      // DELETE /alerts/:id - Eliminar alerta (equivalente a deleteAlert backend)
      if (pathSegments.length === 1) {
        const alertId = pathSegments[0];

        const { data, error } = await supabase
          .from("alerts")
          .delete()
          .eq("company_id", companyId)
          .eq("id", alertId)
          .select()
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            return createCorsErrorResponse("Alerta no encontrada", 404); // Mensaje igual al backend
          }
          throw error;
        }

        return createCorsJsonResponse({
          message: "Alerta eliminada correctamente",
        }); // Mensaje igual al backend
      }
    }

    // Ruta no encontrada
    return createCorsErrorResponse("Endpoint no encontrado", 404);
  } catch (error: any) {
    console.error("❌ Error en alerts:", error);
    return createCorsErrorResponse("Error interno del servidor", 500); // Mensaje igual al backend
  }
});
