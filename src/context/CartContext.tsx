"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string;
  nameAr: string;
  pricePerKG: number;
  quantity: number;
  category: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartSubtotal: () => number;
  sendOrderWhatsApp: (whatsappNumber: string, storeName: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const savedCart = window.localStorage.getItem("sweethub_cart");
    if (savedCart) {
      try {
        return JSON.parse(savedCart) as CartItem[];
      } catch (e) {
        console.error(e);
      }
    }

    return [];
  });

  // حفظ السلة تلقائياً كل ما تتغير
  useEffect(() => {
    localStorage.setItem("sweethub_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("sweethub_cart");
  };

  const getCartSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.pricePerKG * item.quantity, 0);
  };

  // الدالة النظيفة بعد إزالة إجمالي الوزن الصافي والوحدات الفرعية
  const sendOrderWhatsApp = (whatsappNumber: string, storeName: string) => {
    if (cartItems.length === 0) return;

    // 1. هيدر الرسالة
    let message = `*طلب جديد من متجر: ${storeName}*\n`;
    message += `--------------------------------\n\n`;
    message += `أهلاً بك، أود طلب الأصناف التالية:\n\n`;

    // 2. سرد الأصناف بالكمية والسعر والإجمالي فقط
    cartItems.forEach((item, index) => {
      message += `*${index + 1}. ${item.nameAr}*\n`;
      message += `   • الكمية: ${item.quantity}\n`;
      message += `   • السعر الفردي: ${item.pricePerKG} ج.م\n`;
      message += `   • الإجمالي الفرعي: ${item.pricePerKG * item.quantity} ج.م\n`;
      message += `\n`;
    });

    // 3. فوتر الرسالة المالي
    const subtotal = getCartSubtotal();
    message += `--------------------------------\n`;
    message += `*الإجمالي النهائي للطلب: ${subtotal}.00 ج.م*\n`;
    message += `--------------------------------\n\n`;
    message += `يرجى تأكيد الطلب وتجهيزه وتوضيح وقت الاستلام المتاح. شكراً لكم!`;

    // 4. التشفير والفتح المباشر في الواتساب
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = whatsappNumber.replace(/[+\s-]/g, "");
    const whatsappURL = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    window.open(whatsappURL, "_blank");
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartSubtotal,
        sendOrderWhatsApp,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}