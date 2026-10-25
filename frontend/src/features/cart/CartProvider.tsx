import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "../../types/order";
import { useAuth } from "../auth/AuthProvider";

interface CartContextValue {
  lines: CartLine[];
  add: (vehicleId: number, stockAvailable: number) => void;
  setQuantity: (vehicleId: number, quantity: number, stockAvailable: number) => void;
  remove: (vehicleId: number) => void;
  clear: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function cartKey(customerId: number): string {
  return `dealership.cart.${customerId}`;
}

function loadCart(customerId: number): CartLine[] {
  const key = cartKey(customerId);
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const stored: unknown = JSON.parse(raw);
    if (
      Array.isArray(stored) &&
      stored.every((line) =>
        typeof line === "object" &&
        line !== null &&
        "vehicleId" in line &&
        Number.isSafeInteger(line.vehicleId) &&
        line.vehicleId > 0 &&
        "quantity" in line &&
        Number.isSafeInteger(line.quantity) &&
        line.quantity > 0,
      )
    ) {
      return stored as CartLine[];
    }
  } catch {
    localStorage.removeItem(key);
    return [];
  }
  localStorage.removeItem(key);
  return [];
}

function saveCart(customerId: number, lines: CartLine[]): void {
  localStorage.setItem(cartKey(customerId), JSON.stringify(lines));
  localStorage.removeItem(`dealership.checkout.${customerId}`);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ownerId, setOwnerId] = useState<number | null>(user?.id ?? null);
  const [storedLines, setStoredLines] = useState<CartLine[]>(() => user ? loadCart(user.id) : []);
  const customerId = user?.role === "customer" ? user.id : null;

  useEffect(() => {
    if (customerId === null) {
      setOwnerId(null);
      setStoredLines([]);
      return;
    }
    setOwnerId(customerId);
    setStoredLines(loadCart(customerId));
  }, [customerId]);

  const lines = ownerId === customerId && customerId !== null ? storedLines : [];

  const update = useCallback((next: CartLine[]) => {
    if (customerId === null) return;
    setStoredLines(next);
    saveCart(customerId, next);
  }, [customerId]);

  const remove = useCallback((vehicleId: number) => {
    update(lines.filter((line) => line.vehicleId !== vehicleId));
  }, [lines, update]);

  const setQuantity = useCallback((vehicleId: number, quantity: number, stockAvailable: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new Error("Cart quantity must be a positive whole number");
    }
    if (quantity > stockAvailable) {
      throw new Error("Cart quantity cannot exceed the available stock");
    }
    update(lines.map((line) => line.vehicleId === vehicleId ? { ...line, quantity } : line));
  }, [lines, update]);

  const add = useCallback((vehicleId: number, stockAvailable: number) => {
    const existing = lines.find((line) => line.vehicleId === vehicleId);
    const nextQuantity = (existing?.quantity ?? 0) + 1;
    if (nextQuantity > stockAvailable) {
      throw new Error("Cart quantity cannot exceed the available stock");
    }
    update(existing
      ? lines.map((line) => line.vehicleId === vehicleId ? { ...line, quantity: nextQuantity } : line)
      : [...lines, { vehicleId, quantity: 1 }]);
  }, [lines, update]);

  const clear = useCallback(() => update([]), [update]);
  const value = useMemo<CartContextValue>(() => ({
    lines,
    add,
    setQuantity,
    remove,
    clear,
    itemCount: lines.reduce((count, line) => count + line.quantity, 0),
  }), [add, clear, lines, remove, setQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
