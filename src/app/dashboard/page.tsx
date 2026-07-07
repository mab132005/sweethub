"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Store } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { Eye, ShoppingBag, FolderOpen, Heart } from "lucide-react";

export default function DashboardOverview() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const [store, setStore] = useState<Store | null>(null);
  const [stats, setStats] = useState({ productsCount: 0, categoriesCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // 1. جلب بيانات المتجر نفسه
        const storeDoc = await getDoc(doc(db, "stores", user.uid));
        if (storeDoc.exists()) {
          setStore(storeDoc.data() as Store);
        }

        // 2. حساب عدد المنتجات التابعة للمتجر
        const productsQ = query(collection(db, "products"), where("storeId", "==", user.uid));
        const productsSnapshot = await getDocs(productsQ);

        // 3. حساب عدد الأقسام التابعة للمتجر
        const categoriesQ = query(collection(db, "categories"), where("storeId", "==", user.uid));
        const categoriesSnapshot = await getDocs(categoriesQ);

        setStats({
          productsCount: productsSnapshot.size,
          categoriesCount: categoriesSnapshot.size,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ترحيب بصاحب المتجر */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          {locale === "ar" ? `مرحباً بك في لوحة تحكم ${store?.storeName}` : `Welcome to ${store?.storeName} Dashboard`}
        </h1>
        <p className="text-gray-500 mt-2">
          {locale === "ar" ? "إليك نظرة عامة على أداء متجرك اليوم" : "Here is an overview of your store performance today"}
        </p>
      </div>

      {/* بطاقات الإحصائيات الرائعة (Stats Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{locale === "ar" ? "إجمالي المشاهدات" : "Total Views"}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{store?.views || 0}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{locale === "ar" ? "المنتجات" : "Products"}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.productsCount}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{locale === "ar" ? "الأقسام" : "Categories"}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.categoriesCount}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <FolderOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{locale === "ar" ? "إضافات المفضلة" : "Favorites"}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">0</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-red-600">
            <Heart className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}