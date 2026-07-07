"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/firebase/config";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

// 1. تعريف أنواع البيانات في الـ Context مع ضمان وجود logout بالسمول
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. دالة تسجيل الخروج باستخدام Firebase Auth الأصلي بالسمول
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. كاستم هوك للاستخدام السهل في باقي الملفات
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}