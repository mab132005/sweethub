"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Settings, 
  LogOut as LogOutIcon, 
  Loader2,
  ClipboardList // 🎉 استيراد أيقونة الطلبات
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  // ✨ إضافة تبويب "الطلبات الواردة" ليتحدث في الكمبيوتر والموبايل معاً
  const navigationItems = [
    { name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
    { name: "المنتجات", href: "/dashboard/products", icon: ShoppingBag },
    { name: "الطلبات الواردة", href: "/dashboard/orders", icon: ClipboardList }, // 🎉 الخيار الجديد
    { name: "الإعدادات", href: "/dashboard/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" style={{ direction: "rtl" }}>
      
      {/* 🖥️ الـ Sidebar المخصص للكمبيوتر فقط (يختفي على الموبايل) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-200 flex-col justify-between p-4 border-l border-slate-800 shrink-0 fixed h-screen right-0 top-0 z-30">
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍯</span>
              <span className="text-xl font-black tracking-wider text-white">
                Sweet<span className="text-amber-500">Hub</span>
              </span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
              v2.0
            </span>
          </div>

          <nav className="space-y-1.5">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-black transition-all duration-200 group ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? "text-slate-950" : "text-slate-400 group-hover:text-amber-500"}`} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4 space-y-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-150"
          >
            <LogOutIcon className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
          
          <div className="text-[10px] font-bold text-slate-500 text-center border-t border-slate-800/60 pt-2">
            تم تطوير بواسطة <span className="text-amber-500 font-black"> Mohamed Abdelbaqy Ahmed</span>
          </div>
        </div>
      </aside>

      {/* 📱 الـ Bottom Navigation المخصص للموبايل فقط (يختفي على الكمبيوتر) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-1 py-2 flex items-center justify-around z-40 shadow-xl">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-150 ${
                isActive ? "text-amber-500 font-black" : "text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-black">{item.name}</span>
            </Link>
          );
        })}
        
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-rose-400"
        >
          <LogOutIcon className="w-5 h-5" />
          <span className="text-[10px] font-black">خروج</span>
        </button>
      </div>

      {/* 📦 محتوى الصفحة المرن والمتجاوب تلقائياً */}
      <div className="flex-1 pr-0 md:pr-64 min-h-screen pb-20 md:pb-0">
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
        
        <div className="md:hidden text-center pb-6 text-[10px] font-bold text-slate-400">
          تم التطوير بواسطة <span className="text-amber-600 font-black"> Mohamed Abdelbaqy Ahmed</span>
        </div>
      </div>

    </div>
  );
}