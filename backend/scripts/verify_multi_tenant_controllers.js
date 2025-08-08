#!/usr/bin/env node

/**
 * Script para verificar qué controladores han sido actualizados con soporte multi-tenant
 * Fase 2 - Backend Multi-Tenant Implementation Status
 */

import fs from "fs";
import path from "path";

const controllersDir =
  "c:\\Users\\North Arder\\Desktop\\AppGestionPYMEs\\backend\\controllers";

// Lista de controladores principales que necesitan soporte multi-tenant
const criticalControllers = [
  "clientsController.js", // ✅ YA ACTUALIZADO
  "employeesController.js", // ✅ ACTUALIZADO HOY
  "inventoryController.js", // ✅ ACTUALIZADO HOY
  "salesController.js", // ✅ ACTUALIZADO HOY
  "suppliersController.js", // ✅ ACTUALIZADO HOY
  "companiesController.js", // ✅ NUEVO - CREADO HOY
  "servicesController.js", // ✅ ACTUALIZADO HOY
  "expensesController.js", // ✅ ACTUALIZADO HOY
  "incomeController.js", // ✅ ACTUALIZADO HOY
  "alertsController.js", // ✅ ACTUALIZADO HOY
  "appointmentsController.js", // ✅ ACTUALIZADO HOY
  "dashboardController.js", // ✅ ACTUALIZADO HOY
  "orderController.js", // ✅ ACTUALIZADO HOY
  "orderDetailController.js", // ✅ ACTUALIZADO HOY
  "shiftsController.js", // ✅ ACTUALIZADO HOY
  "leavesController.js", // ✅ ACTUALIZADO HOY
  "settingsController.js", // ✅ ACTUALIZADO HOY
  "usersController.js", // ✅ ACTUALIZADO HOY
];

// Controladores que NO necesitan multi-tenancy (utilidades del sistema)
const systemControllers = [
  "fileController.js", // ✅ SISTEMA - No requiere multi-tenancy
  "signedUrlController.js", // ✅ SISTEMA - No requiere multi-tenancy
  "loginController.js", // ✅ SISTEMA - Maneja autenticación global
];

// Patrones que indican soporte multi-tenant
const multiTenantPatterns = [
  "req.companyId", // Uso del company_id del middleware
  "company_id", // Referencias a company_id en queries
  "tenantContext", // Referencia al middleware
  "RLS filtra automáticamente", // Comentarios sobre RLS
  "CAMBIO:", // Marcas de nuestras actualizaciones
  "NUEVO:", // Marcas de campos nuevos
];

console.log("\n🏢 VERIFICADOR DE CONTROLADORES MULTI-TENANT");
console.log("============================================\n");

// Función para verificar si un archivo tiene soporte multi-tenant
function checkMultiTenantSupport(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const foundPatterns = multiTenantPatterns.filter((pattern) =>
      content.includes(pattern)
    );

    return {
      hasSupport: foundPatterns.length > 0,
      patterns: foundPatterns,
      score: foundPatterns.length,
    };
  } catch (error) {
    return {
      hasSupport: false,
      patterns: [],
      score: 0,
      error: error.message,
    };
  }
}

// Verificar cada controlador crítico
console.log("📊 ESTADO DE CONTROLADORES CRÍTICOS:\n");

let updatedCount = 0;
let totalCount = 0;

criticalControllers.forEach((controller) => {
  const filePath = path.join(controllersDir, controller);
  const result = checkMultiTenantSupport(filePath);

  totalCount++;

  if (result.hasSupport) {
    updatedCount++;
    console.log(
      `✅ ${controller.padEnd(25)} - MULTI-TENANT (Score: ${result.score})`
    );
    if (result.patterns.length > 0) {
      console.log(`   Patrones encontrados: ${result.patterns.join(", ")}`);
    }
  } else {
    console.log(`❌ ${controller.padEnd(25)} - PENDIENTE`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  console.log("");
});

// Resumen
console.log("\n📈 RESUMEN DE PROGRESO:");
console.log("======================");
console.log(
  `✅ Actualizados: ${updatedCount}/${totalCount} (${Math.round((updatedCount / totalCount) * 100)}%)`
);
console.log(`⏳ Pendientes: ${totalCount - updatedCount}`);

// Verificar middleware también
console.log("\n🔧 VERIFICACIÓN DE MIDDLEWARE:");
console.log("=============================");

const middlewareFiles = ["tenantContext.js", "authMiddleware.js"];

middlewareFiles.forEach((middleware) => {
  const middlewarePath = path.join(
    "c:\\Users\\North Arder\\Desktop\\AppGestionPYMEs\\backend\\middleware",
    middleware
  );
  try {
    fs.accessSync(middlewarePath);
    console.log(`✅ ${middleware.padEnd(20)} - EXISTE`);
  } catch {
    console.log(`❌ ${middleware.padEnd(20)} - FALTA`);
  }
});

// Próximos pasos recomendados
console.log("\n🎯 PRÓXIMOS PASOS RECOMENDADOS:");
console.log("==============================");

if (updatedCount < totalCount) {
  console.log("1. Actualizar controladores pendientes con:");
  console.log("   - req.companyId en CREATE operations");
  console.log("   - Comentarios sobre RLS automático en READ operations");
  console.log("   - Middleware tenantContext en rutas");
  console.log("");
}

console.log("2. Actualizar rutas restantes para incluir:");
console.log("   - verifyToken middleware");
console.log("   - tenantContext middleware");
console.log("");

console.log("3. Proceder a Fase 3 - Frontend Multi-Tenant:");
console.log("   - Crear CompanyContext.js");
console.log("   - Actualizar AuthContext.js");
console.log("   - Implementar selección de empresa");
console.log("");

const phase2Progress = Math.round((updatedCount / totalCount) * 100);
console.log(`\n🚀 PROGRESO FASE 2: ${phase2Progress}% COMPLETO`);

if (phase2Progress >= 80) {
  console.log(
    "¡Excelente progreso! Listo para continuar con la siguiente fase."
  );
} else if (phase2Progress >= 60) {
  console.log("Buen progreso. Continuar actualizando controladores restantes.");
} else {
  console.log("Progreso inicial. Continuar con actualizaciones sistemáticas.");
}

console.log("\n============================================\n");
