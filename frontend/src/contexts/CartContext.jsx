import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { cartService } from "../services/cartService.js";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";

const emptyCart = { id: "", items: [], subtotal: "0.00", total: "0.00" };

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, role, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user || role !== "customer") {
      setCart(emptyCart);
      return emptyCart;
    }
    setLoading(true);
    try {
      const nextCart = await cartService.getCart();
      setCart(nextCart);
      return nextCart;
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    if (!user || role !== "customer") {
      setCart(emptyCart);
      return;
    }
    setLoading(true);
    cartService
      .getCart()
      .then((nextCart) => {
        if (active) setCart(nextCart);
      })
      .catch(() => {
        if (active) setCart(emptyCart);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, user, role]);

  const addItem = useCallback(
    async (payload) => {
      const result = await cartService.addItem(payload);
      setCart(result);
      addToast({ title: "Item added to cart." });
      return result;
    },
    [addToast]
  );

  const updateItem = useCallback(
    async (itemId, payload) => {
      const nextCart = await cartService.updateItem(itemId, payload);
      setCart(nextCart);
      addToast({ title: "Cart updated." });
      return nextCart;
    },
    [addToast]
  );

  const removeItem = useCallback(
    async (itemId) => {
      const nextCart = await cartService.removeItem(itemId);
      setCart(nextCart);
      addToast({ title: "Item removed." });
      return nextCart;
    },
    [addToast]
  );

  const clearCart = useCallback(async () => {
    const nextCart = await cartService.clearCart();
    setCart(nextCart);
    return nextCart;
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const value = useMemo(
    () => ({
      cart,
      itemCount,
      loading,
      refreshCart,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      setCart,
    }),
    [cart, itemCount, loading, refreshCart, addItem, updateItem, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return context;
}
