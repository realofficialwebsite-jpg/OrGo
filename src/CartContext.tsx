import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, ServiceItem } from './types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (service: ServiceItem) => void;
  removeFromCart: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  getItemQuantity: (serviceId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const getItemQuantity = (serviceId: string) => {
    return cart.find(item => item.id === serviceId)?.quantity || 0;
  };

  const addToCart = (service: ServiceItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === service.id);
      if (existing) {
        return prev.map(item => 
          item.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...service, quantity: 1 }];
    });
  };

  const removeFromCart = (serviceId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === serviceId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.id === serviceId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.id !== serviceId);
    });
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    setCart(prev => {
      if (quantity <= 0) return prev.filter(item => item.id !== serviceId);
      return prev.map(item => 
        item.id === serviceId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, getItemQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
