"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/config";
import { loginSchema, LoginInput } from "@/lib/validators";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setServerError(null);

    try {
      // تسجيل الدخول باستخدام الفايربيز
      await signInWithEmailAndPassword(auth, data.email, data.password);
      
      // التوجيه إلى لوحة التحكم مباشرة عند النجاح
      router.push("/dashboard");
    } catch (error: unknown) {
      let friendlyMessage = "فشل تسجيل الدخول. تأكد من البريد الإلكتروني وكلمة المرور.";
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code !== undefined &&
        ((error as { code?: string }).code === "auth/user-not-found" ||
          (error as { code?: string }).code === "auth/invalid-credential")
      ) {
        friendlyMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      }
      setServerError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {t("login")}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("email")}
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="example@mail.com"
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("password")}
              </label>
              <input
                {...register("password")}
                type="password"
                placeholder="******"
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? "جاري الدخول..." : t("login")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}