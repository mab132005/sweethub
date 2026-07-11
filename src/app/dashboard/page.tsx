"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { 
  Eye, 
  ShoppingBag, 
  ClipboardList, 
  DollarSign, 
  Store,
  BarChart3
} from "lucide-react";
// استيراد مكونات الرسم البياني
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface OrderItem {
  id: string;
  nameAr: string;
  price: number;
  quantity: number;
}

interface DashboardStats {
  views: number;
  productsCount: number;
  categoriesCount: number;
  favoritesCount: number;
  activeOrdersCount: number;
  totalSales: number;
}

interface SalesChartData {
  date: string;
  "المبيعات": number;
}

interface TopItemData {
  name: string;
  value: number;
}

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

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
  const [salesData, setSalesData] = useState<SalesChartData[]>([]);
  const [topItems, setTopItems] = useState<TopItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

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

        const productsQ = query(collection(db, "products"), where("storeId", "==", currentStoreId));
        const productsSnap = await getDocs(productsQ);
        
        const categoriesSet = new Set();
        productsSnap.docs.forEach(docSnap => {
          if (docSnap.data().category) categoriesSet.add(docSnap.data().category);
        });

        // الاستماع لايف للطلبات لبناء الرسوم البيانية
        const ordersQ = query(collection(db, "orders"), where("storeId", "==", currentStoreId));
        
        const unsubscribeOrders = onSnapshot(ordersQ, (ordersSnapshot) => {
          let activeCount = 0;
          let salesTotal = 0;
          
          // تجميع المبيعات حسب التاريخ والأصناف
          const salesByDate: { [key: string]: number } = {};
          const itemsMap: { [key: string]: number } = {};

          ordersSnapshot.forEach((orderDoc) => {
            const orderData = orderDoc.data();
            
            if (orderData.status === "pending" || orderData.status === "processing") {
              activeCount++;
            }
            
            if (orderData.status === "completed") {
              const price = Number(orderData.totalPrice || 0);
              salesTotal += price;

              // 1. تجميع مبيعات الأيام
              let dateStr = "غير محدد";
              if (orderData.createdAt) {
                const dateObj = orderData.createdAt.toDate ? orderData.createdAt.toDate() : new Date(orderData.createdAt);
                dateStr = dateObj.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
              }
              salesByDate[dateStr] = (salesByDate[dateStr] || 0) + price;

              // 2. تجميع الأصناف الأكثر مبيعاً
              if (Array.isArray(orderData.items)) {
                orderData.items.forEach((item: OrderItem) => {
                  itemsMap[item.nameAr] = (itemsMap[item.nameAr] || 0) + Number(item.quantity || 1);
                });
              }
            }
          });

          // تحويل مبيعات الأيام لتنسيق الـ Chart
          const formattedSalesData = Object.keys(salesByDate).map(date => ({
            date,
            "المبيعات": salesByDate[date]
          })).reverse().slice(-7); // آخر 7 أيام مبيعات

          // تحويل الأصناف لتنسيق الـ Chart
          const formattedTopItems = Object.keys(itemsMap).map(name => ({
            name,
            value: itemsMap[name]
          })).sort((a, b) => b.value - a.value).slice(0, 5); // أعلى 5 أصناف

          setSalesData(formattedSalesData.length > 0 ? formattedSalesData : [{ date: "اليوم", "المبيعات": 0 }]);
          setTopItems(formattedTopItems);
          
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10" style={{ direction: "rtl" }}>
      
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

      {/* 📊 شبكة الكروت الرئيسية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* كارت إجمالي المبيعات */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between group">
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

        {/* كارت الطلبات النشطة */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between group">
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
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-black text-slate-400 block">إجمالي الزيارات</span>
            <span className="text-2xl font-black text-slate-900 block">{stats.views}</span>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Eye className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 📈 قسم الرسوم البيانية المتطورة */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. تشارت منحنى المبيعات الخطي */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black text-slate-800">منحنى المبيعات (آخر الأيام النشطة)</h3>
          </div>
          <div className="h-72 w-full text-xs font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} />
                <Tooltip contentStyle={{ direction: "rtl", borderRadius: "1rem", border: "1px solid #f1f5f9" }} />
                <Area type="monotone" dataKey="المبيعات" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. تشارت دائري للأصناف الأكثر طلباً */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <ShoppingBag className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-black text-slate-800">الأصناف الأكثر طلباً</h3>
          </div>
          <div className="h-64 w-full flex-1 text-xs font-bold relative">
            {topItems.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">لا توجد مبيعات مكتملة لحساب الأصناف</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topItems}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {topItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* 📊 الكروت الفرعية المتبقية */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
          <span className="text-xs font-black text-slate-500">إجمالي الأصناف بالمحل</span>
          <span className="text-lg font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-xl">{stats.productsCount}</span>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
          <span className="text-xs font-black text-slate-500">عدد الأقسام النشطة</span>
          <span className="text-lg font-black text-cyan-600 bg-cyan-50 px-3 py-1 rounded-xl">{stats.categoriesCount}</span>
        </div>
        <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
          <span className="text-xs font-black text-slate-500">تفضيلات وإعجابات العملاء</span>
          <span className="text-lg font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl">{stats.favoritesCount}</span>
        </div>
      </div>

    </div>
  );
}