"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Language = "ar" | "en";

interface LanguageContextType {
  locale: Language;
  dir: "rtl" | "ltr";
  setLocale: (locale: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    appName: "SweetHub",
    welcome: "مرحباً بك في منصة SweetHub",
    login: "تسجيل الدخول",
    register: "إنشاء متجر",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    storeName: "اسم المتجر",
    storeSlug: "رابط المتجر المميز",
    submit: "تأكيد",
  },
  en: {
    appName: "SweetHub",
    welcome: "Welcome to SweetHub Platform",
    login: "Login",
    register: "Register Store",
    email: "Email Address",
    password: "Password",
    storeName: "Store Name",
    storeSlug: "Unique Store URL (Slug)",
    submit: "Submit",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // initialize locale from localStorage to avoid setting state synchronously in an effect
  const getInitialLocale = (): Language => {
    try {
      const saved = localStorage.getItem("sweethub_lang") as Language | null;
      if (saved === "ar" || saved === "en") return saved;
    } catch {
      // ignore
    }
    return "ar";
  };

  const [locale, setLocaleState] = useState<Language>(getInitialLocale);
  const dir: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";

  const setLocale = useCallback((newLocale: Language) => {
    setLocaleState(newLocale);
    localStorage.setItem("sweethub_lang", newLocale);
  }, []);

  // keep document attributes and dir state in sync with locale
  useEffect(() => {
    const newDir = locale === "ar" ? "rtl" : "ltr";
    // update document attributes to match locale/dir
    document.documentElement.dir = newDir;
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (key: string) => {
    return translations[locale]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, dir, setLocale, t }}>
      <div dir={dir}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}