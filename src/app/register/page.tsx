"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { registerSchema, RegisterInput } from "@/lib/validators";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setServerError(null);

    try {
      const storesRef = collection(db, "stores");
      const q = query(storesRef, where("slug", "==", data.slug.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error("رابط المتجر هذا محجوز مسبقاً، اختر رابطاً آخر.");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: data.email,
        role: "owner",
        createdAt: new Date(),
      });

      await setDoc(doc(db, "stores", user.uid), {
        id: user.uid,
        ownerId: user.uid,
        storeName: data.storeName,
        slug: data.slug.toLowerCase(),
        logo: "",
        banner: "",
        whatsapp: "",
        phone: "",
        address: "",
        settings: {
          themeColor: "#3b82f6",
          metaTitle: data.storeName,
          metaDescription: `مرحباً بكم في متجر ${data.storeName}`,
          keywords: "حلويات, متجر رقمي, كاتالوج",
        },
        views: 0,
        createdAt: new Date(),
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "حدث خطأ ما أثناء التسجيل";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {t("register")}
          </h2>
        </div>
        
        {serverError && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
            {serverError}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("storeName")}</label>
              <input
                {...register("storeName")}
                type="text"
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.storeName && <p className="text-red-500 text-xs mt-1">{errors.storeName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("storeSlug")}</label>
              <div className="flex rounded-lg shadow-sm" style={{ direction: "ltr" }}>
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  sweethub.com/
                </span>
                <input
                  {...register("slug")}
                  type="text"
                  placeholder="my-store"
                  className="appearance-none rounded-l-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")}</label>
              <input
                {...register("email")}
                type="email"
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("password")}</label>
              <input
                {...register("password")}
                type="password"
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? "جاري الإنشاء..." : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}