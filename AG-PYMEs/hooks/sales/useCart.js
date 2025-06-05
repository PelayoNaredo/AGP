import { useState, useCallback } from "react";

//Hook personalizado para gestionar el carrito de compras
const useCart = () => {
  const [cartItems, setCartItems] = useState([]);

  //Añade un producto al carrito
  const addProduct = useCallback((product) => {
    // Verificar si el producto ya está en el carrito
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.id_producto === product.id_producto && item.tipo === "producto"
      );

      // Determinar el precio a usar (pvp si está disponible, sino precio_unitario)
      const precioVenta = product.pvp || product.precio_unitario;

      if (existingItemIndex >= 0) {
        // Actualizar cantidad si ya existe
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].cantidad += 1;
        return updatedItems;
      } else {
        // Añadir nuevo item
        return [
          ...prevItems,
          {
            ...product,
            cantidad: 1,
            tipo: "producto",
            precio_unitario: precioVenta, // Usar pvp como precio_unitario para mantener consistencia
          },
        ];
      }
    });
  }, []);

  //Añade un servicio al carrito
  const addService = useCallback((service) => {
    setCartItems((prevItems) => {
      // Crear un identificador único para el servicio
      // Para servicios por nivel o personalizados, necesitamos un ID compuesto
      const serviceUniqueId =
        service.tipo_tarifa === "por_nivel" && service.nivel_seleccionado
          ? `${service.id_servicio}-${service.nivel_seleccionado.id_nivel}`
          : service.precio_personalizado
            ? `${service.id_servicio}-custom-${Date.now()}`
            : service.id_servicio;

      // Verificar si el servicio ya está en el carrito
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          (item.serviceUniqueId === serviceUniqueId ||
            (item.id_servicio === service.id_servicio &&
              !item.serviceUniqueId &&
              !item.nivel_seleccionado &&
              !item.precio_personalizado)) &&
          item.tipo === "servicio"
      );

      // Determinar el nombre a mostrar
      const displayName =
        service.tipo_tarifa === "por_nivel" && service.nivel_seleccionado
          ? `${service.nombre_servicio} - ${service.nivel_seleccionado.nombre_nivel}`
          : service.precio_personalizado && service.descripcion_personalizada
            ? `${service.nombre_servicio} - ${service.descripcion_personalizada}`
            : service.nombre_servicio; // Determinar el precio unitario
      let precioUnitario = service.precio_base;

      // Para servicios por nivel, usar el precio del nivel
      if (service.tipo_tarifa === "por_nivel" && service.nivel_seleccionado) {
        precioUnitario = service.nivel_seleccionado.precio;
      }

      // Para servicios de mano de obra, usar el precio base (que ya fue personalizado)
      if (service.precio_personalizado) {
        // Nos aseguramos de que sea un número
        precioUnitario = parseFloat(service.precio_base);
      }

      if (existingItemIndex >= 0) {
        // Actualizar cantidad si ya existe (solo para servicios estándar)
        // Para servicios personalizados o por nivel siempre creamos uno nuevo
        if (
          !service.precio_personalizado &&
          !(service.tipo_tarifa === "por_nivel" && service.nivel_seleccionado)
        ) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex].cantidad += 1;
          return updatedItems;
        }
      }

      // Añadir nuevo item
      return [
        ...prevItems,
        {
          ...service,
          cantidad: 1,
          tipo: "servicio",
          precio_unitario: precioUnitario,
          serviceUniqueId,
          displayName,
          // Asegurar que estos campos se mantengan para servicios especiales
          nivel_seleccionado: service.nivel_seleccionado,
          precio_personalizado: service.precio_personalizado,
          descripcion_personalizada: service.descripcion_personalizada,
          horas: service.horas,
        },
      ];
    });
  }, []);

  //Cambia la cantidad de un item en el carrito
  const changeItemQuantity = useCallback((id, change, tipo) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.map((item) => {
        // Verificar el tipo y el ID correspondiente
        const matchId =
          tipo === "producto"
            ? item.id_producto === id && item.tipo === "producto"
            : (item.serviceUniqueId === id ||
                (item.id_servicio === id && !item.serviceUniqueId)) &&
              item.tipo === "servicio";

        if (matchId) {
          const newQuantity = item.cantidad + change;
          if (newQuantity <= 0) {
            return null; // Se filtrará después
          }
          return { ...item, cantidad: newQuantity };
        }
        return item;
      });

      return updatedItems.filter(Boolean);
    });
  }, []);

  //Verifica el stock disponible para los productos en el carrito
  const checkInventoryAvailability = useCallback(() => {
    const productsWithLowStock = [];

    for (const item of cartItems) {
      if (item.tipo === "producto" && item.cantidad_actual < item.cantidad) {
        productsWithLowStock.push({
          nombre: item.nombre_producto,
          stockActual: item.cantidad_actual,
          solicitado: item.cantidad,
        });
      }
    }

    return productsWithLowStock;
  }, [cartItems]);

  //Calcula el subtotal del carrito
  const calculateSubtotal = useCallback(() => {
    return cartItems.reduce((sum, item) => {
      // Para servicios de mano de obra, multiplicar precio por horas
      if (
        item.tipo === "servicio" &&
        item.tipo_tarifa === "mano_obra" &&
        item.horas
      ) {
        return (
          sum +
          parseFloat(item.precio_unitario) *
            parseFloat(item.horas) *
            item.cantidad
        );
      }
      return sum + parseFloat(item.precio_unitario) * item.cantidad;
    }, 0);
  }, [cartItems]);

  //Calcula el IVA basado en el subtotal y el porcentaje especificado
  const calculateTax = useCallback(
    (porcentaje = 21) => {
      return (calculateSubtotal() * porcentaje) / 100;
    },
    [calculateSubtotal]
  );

  //Calcula el total (subtotal + IVA)
  const calculateTotal = useCallback(
    (porcentaje = 21) => {
      return calculateSubtotal() + calculateTax(porcentaje);
    },
    [calculateSubtotal, calculateTax]
  );

  //Vacía el carrito
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  //Obtiene el nombre del item (producto o servicio)
  const getItemName = useCallback((item) => {
    if (item.tipo === "producto") {
      return item.nombre_producto;
    } else if (item.tipo === "servicio") {
      // Si el servicio tiene un displayName (servicio por nivel o personalizado), usarlo
      return item.displayName || item.nombre_servicio;
    }
    return "";
  }, []);

  //Obtiene el ID del item (producto o servicio)
  const getItemId = useCallback((item) => {
    if (item.tipo === "producto") {
      return item.id_producto;
    } else if (item.tipo === "servicio") {
      // Si el servicio tiene un identificador único (servicio por nivel o personalizado), usarlo
      return item.serviceUniqueId || item.id_servicio;
    }
    return "";
  }, []);

  return {
    cartItems,
    setCartItems,
    addProduct,
    addService,
    changeItemQuantity,
    checkInventoryAvailability,
    calculateSubtotal,
    calculateTax,
    calculateTotal,
    clearCart,
    getItemName,
    getItemId,
    isEmpty: cartItems.length === 0,
  };
};

export default useCart;
