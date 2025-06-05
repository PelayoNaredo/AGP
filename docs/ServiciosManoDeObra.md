# Guía para Implementar Servicios de Mano de Obra

## Problema

Al intentar crear un servicio de tipo "mano_obra", se produce un error 500 (Error interno del servidor) porque la base de datos no reconoce este valor en la restricción CHECK de la columna `tipo_tarifa` en la tabla `services`.

## Solución

### 1. Actualizar el esquema de la base de datos

Ya hemos creado y ejecutado un script para actualizar la restricción en la tabla `services` para incluir el valor 'mano_obra'. El script ha realizado lo siguiente:

```sql
-- Eliminar la restricción existente
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_tipo_tarifa_check;

-- Añadir la nueva restricción con 'mano_obra' incluido
ALTER TABLE services ADD CONSTRAINT services_tipo_tarifa_check
CHECK (tipo_tarifa IN ('fijo', 'por_hora', 'variable', 'por_nivel', 'mano_obra'));
```

### 2. Verificar la implementación del frontend

Hemos verificado que los componentes frontend (`ServiceSelector.js`, `LaborPriceEditor.js` y `useCart.js`) ya están implementados correctamente para manejar este tipo de servicio.

### 3. Probar la creación de servicios de mano de obra

Una vez actualizada la base de datos, deberías poder crear servicios de tipo "mano_obra" sin problemas. Cuando los clientes agreguen estos servicios al carrito, podrán personalizar el precio, las horas y la descripción.

## Verificación

Después de aplicar la solución, verifica lo siguiente:

1. Puedes crear servicios de tipo "mano_obra" sin errores
2. Los servicios de mano de obra se muestran correctamente en la lista de servicios
3. Al añadir un servicio de mano de obra al carrito, se muestra el modal para editar el precio
4. El servicio personalizado aparece correctamente en el carrito con su descripción y precio personalizado

## Problemas adicionales

Si sigues experimentando errores al trabajar con servicios de mano de obra, verifica los logs del servidor para obtener más detalles sobre el error específico.
