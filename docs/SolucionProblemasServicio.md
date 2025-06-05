# Solución a problemas en servicios por niveles y mano de obra

## Problemas resueltos

### 1. Los niveles de servicio no se muestran en el modal al hacer clic

**Descripción del problema:**
Al hacer clic en un servicio con tipo de tarifa "por_nivel", se abría el modal pero no se mostraban los niveles disponibles.

**Causa:**
El servicio se estaba estableciendo en el estado sin cargar previamente sus niveles desde el servidor.

**Solución implementada:**
Se modificó el método `handleSelectService` en `ServiceSelector.js` para:

1. Hacer una llamada a la API usando `getServiceById` para obtener el servicio completo con sus niveles.
2. Establecer en el estado el servicio completo antes de mostrar el modal.
3. Manejar adecuadamente los errores y casos donde no hay niveles definidos.

```javascript
// Antes
if (service.tipo_tarifa === "por_nivel") {
  setSelectedService(service);
  setIsLevelSelectorVisible(true);
}

// Después
if (service.tipo_tarifa === "por_nivel") {
  try {
    const completeService = await getServiceById(service.id_servicio);
    if (completeService && completeService.niveles) {
      setSelectedService(completeService);
      setIsLevelSelectorVisible(true);
    } else {
      // Mostrar el modal igualmente, pero sin niveles
      setSelectedService(service);
      setIsLevelSelectorVisible(true);
    }
  } catch (error) {
    console.error("Error al cargar niveles de servicio:", error);
    setSelectedService(service);
    setIsLevelSelectorVisible(true);
  }
}
```

### 2. El precio de los servicios de mano de obra se muestra como NaN en el carrito

**Descripción del problema:**
Al agregar un servicio de mano de obra con precio personalizado, en el carrito aparecía "NaN €" como precio.

**Causa:**
En el hook `useCart.js`, se estaba asignando incorrectamente el valor de `precio_personalizado` (booleano `true`) como precio unitario en lugar de usar el valor numérico de `precio_base`.

**Solución implementada:**

1. Se corrigió la asignación del precio unitario en `useCart.js` para usar el valor correcto de `precio_base`.
2. Se aseguró de que el valor sea numérico usando `parseFloat`.
3. Se mejoró la visualización en `CartItem.js` para mostrar el cálculo del precio total (precio por hora × número de horas).
4. Se actualizó el cálculo del subtotal para considerar las horas en servicios de mano de obra.

```javascript
// Antes
if (service.precio_personalizado) {
  precioUnitario = service.precio_personalizado;
}

// Después
if (service.precio_personalizado) {
  precioUnitario = parseFloat(service.precio_base);
}
```

## Mejoras adicionales

1. Se mejoró la visualización del precio en el carrito para servicios de mano de obra, mostrando el desglose: precio/hora × número de horas = precio total.

2. Se modificó el cálculo del subtotal para considerar correctamente las horas en servicios de mano de obra.

## Componentes actualizados

1. **ServiceSelector.js** - Carga de niveles de servicio desde la API
2. **useCart.js** - Corrección en la asignación del precio y cálculo del subtotal
3. **CartItem.js** - Mejora en la visualización del precio para servicios de mano de obra
