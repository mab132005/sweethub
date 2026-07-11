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
  // 🎉 التعديل: إضافة البارامتر السادس storeId هنا في الـ Interface
  sendOrderWhatsApp: (whatsappNumber: string, storeName: string, customerName: string, customerPhone: string, customerAddress: string, storeId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
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

  // 🚀 رفع الطلب للداتابيز ثم فتح الواتساب مجمعين
  const sendOrderWhatsApp = async (
    whatsappNumber: string, 
    storeName: string, 
    customerName: string, 
    customerPhone: string, 
    customerAddress: string,
    storeId: string
  ) => {
    if (cartItems.length === 0) return;

    try {
      // 1. صياغة أوبجكت الأوردر المتكامل
      const orderData = {
        storeId: storeId,
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
        items: cartItems.map(item => ({
          id: item.id,
          nameAr: item.nameAr,
          price: item.pricePerKG,
          quantity: item.quantity
        })),
        totalPrice: getCartSubtotal(),
        status: "pending", // الحالات المتاحة: pending, preparing, delivered, cancelled
        createdAt: new Date()
      };

      // 2. الحفظ المباشر بـ Firestore
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("@/firebase/config");
      await addDoc(collection(db, "orders"), orderData);

    } catch (error) {
      console.error("Error saving order to Firestore:", error);
    }

    // 3. فتح الواتساب للعميل
    let message = `*طلب جديد من متجر: ${storeName}*\n`;
    message += `--------------------------------\n`;
    message += `👤 *بيانات الزبون والتوصيل:*\n`;
    message += `   • الاسم: ${customerName}\n`;
    message += `   • الهاتف: ${customerPhone}\n`;
    message += `   • العنوان: ${customerAddress}\n`;
    message += `--------------------------------\n\n`;
    message += `أهلاً بك، أود طلب الأصناف التالية:\n\n`;

    cartItems.forEach((item, index) => {
      message += `*${index + 1}. ${item.nameAr}*\n`;
      message += `   • الكمية: ${item.quantity}\n`;
      message += `   • السعر الإجمالي: ${item.pricePerKG * item.quantity} ج.م\n`;
      message += `\n`;
    });

    const subtotal = getCartSubtotal();
    message += `--------------------------------\n`;
    message += `*الإجمالي النهائي للطلب: ${subtotal}.00 ج.م*\n`;
    message += `--------------------------------\n\n`;
    message += `يرجى تأكيد وتجهيز الطلب للتوصيل الفوري. شكراً لكم!`;

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = whatsappNumber.replace(/[+\s-]/g, "");
    const whatsappURL = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    window.open(whatsappURL, "_blank");
    clearCart(); // مسح السلة بعد الخروج للواتساب
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