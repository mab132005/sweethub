"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { 
  Eye, 
  ShoppingBag, 
  FolderHeart, 
  Heart, 
  ClipboardList, 
  DollarSign, 
  Store 
} from "lucide-react";

interface DashboardStats {
  views: number;
  productsCount: number;
  categoriesCount: number;
  favoritesCount: number;
  activeOrdersCount: number;
  totalSales: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [storeName, setStoreName] = useState("متجرك الرقمي");
  const [stats, setStats] = useState<DashboardStats>({
    views: 0,
    productsCount: 0,
    categoriesCount: 0,
    favoritesCount: 0,
    activeOrdersCount: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. جلب بيانات المتجر لمعرفة الاسم الـ ID الفعلي
    const storeQ = query(collection(db, "stores"), where("ownerId", "==", user.uid));
    
    const unsubscribeStore = onSnapshot(storeQ, async (storeSnapshot) => {
      try {
        if (storeSnapshot.empty) {
          setLoading(false);
          return;
        }

        const storeDoc = storeSnapshot.docs[0];
        const storeData = storeDoc.data();
        const currentStoreId = storeDoc.id;

        setStoreName(storeData.storeName || "متجرك الرقمي");

        // جلب أعداد المنتجات والأقسام المرتبطة بهذا المتجر
        const productsQ = query(collection(db, "products"), where("storeId", "==", currentStoreId));
        const productsSnap = await getDocs(productsQ);
        
        // جلب الأقسام (تعتمد على التصميم لديك، هنا نفترض تصفية الأقسام المضافة للمتجر أو حسابها من المنتجات)
        const categoriesSet = new Set();
        productsSnap.docs.forEach(docSnap => {
          if (docSnap.data().category) categoriesSet.add(docSnap.data().category);
        });

        // 2. الاستماع لايف للطلبات لحساب المبيعات والطلبات النشطة
        const ordersQ = query(collection(db, "orders"), where("storeId", "==", currentStoreId));
        
        const unsubscribeOrders = onSnapshot(ordersQ, (ordersSnapshot) => {
          let activeCount = 0;
          let salesTotal = 0;

          ordersSnapshot.forEach((orderDoc) => {
            const orderData = orderDoc.data();
            if (orderData.status === "pending" || orderData.status === "processing") {
              activeCount++;
            }
            if (orderData.status === "completed") {
              salesTotal += Number(orderData.totalPrice || 0);
            }
          });

          setStats({
            views: Number(storeData.views || 0),
            productsCount: productsSnap.size,
            categoriesCount: categoriesSet.size || Number(storeData.settings?.categoriesCount || 0),
            favoritesCount: Number(storeData.favoritesCount || 0),
            activeOrdersCount: activeCount,
            totalSales: salesTotal
          });
          
          setLoading(false);
        });

        return () => unsubscribeOrders();

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setLoading(false);
      }
    });

    return () => unsubscribeStore();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" style={{ direction: "rtl" }}>
        <div className="h-10 bg-slate-100 rounded-xl w-2/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ direction: "rtl" }}>
      
      {/* 👋 ترويسة الترحيب */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-right flex-col sm:flex-row">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Store className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black">مرحباً بك في لوحة تحكم {storeName}</h1>
            <p className="text-xs font-bold opacity-80 mt-1">إليك نظرة عامة شاملة ومباشرة على أداء متجرك اليوم</p>
          </div>
        </div>
      </div>

      {/* 📊 شبكة الكروت المطورة والمنظمة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* كارت إجمالي المبيعات (جديد) */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between overflow-hidden relative group">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 block">المبيعات المكتملة</span>
            <span className="text-2xl font-black text-slate-900 block">
              {stats.totalSales} <span className="text-xs text-amber-500 font-bold">ج.م</span>
            </span>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* كارت الطلبات النشطة (جديد) */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between overflow-hidden relative group">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 block">الطلبات النشطة حالياً</span>
            <span className="text-2xl font-black text-slate-900 block">
              {stats.activeOrdersCount} <span className="text-xs text-slate-400 font-bold">أوردر</span>
            </span>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* كارت إجمالي المشاهدات */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between overflow-hidden relative group">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 block">إجمالي الزيارات</span>
            <span className="text-2xl font-black text-slate-900 block">{stats.views}</span>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* كارت المنتجات */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between overflow-hidden relative group">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 block">عدد المنتجات بالمحل</span>
            <span className="text-2xl font-black text-slate-900 block">{stats.productsCount}</span>
          </div>
          <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* كارت الأقسام */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between overflow-hidden relative group">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 block">إجمالي الأقسام</span>
            <span className="text-2xl font-black text-slate-900 block">{stats.categoriesCount}</span>
          </div>
          <div className="p-4 bg-cyan-50 text-cyan-600 rounded-2xl group-hover:scale-110 transition-transform">
            <FolderHeart className="w-6 h-6" />
          </div>
        </div>

        {/* كارت الإضافات المفضلة */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center justify-between overflow-hidden relative group">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 block">تفضيلات العملاء</span>
            <span className="text-2xl font-black text-slate-900 block">{stats.favoritesCount}</span>
          </div>
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Heart className="w-6 h-6" />
          </div>
        </div>

      </div>

    </div>
  );
}