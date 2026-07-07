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
  Loader2 
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  // تم حذف تبويب "الدرجات" نهائياً
  const navigationItems = [
    { name: "الرئيسية", href: "/dashboard", icon: LayoutDashboard },
    { name: "المنتجات", href: "/dashboard/products", icon: ShoppingBag },
    { name: "إعدادات المتجر", href: "/dashboard/settings", icon: Settings },
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
    <div className="min-h-screen bg-slate-50 flex" style={{ direction: "rtl" }}>
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between p-4 border-l border-slate-800 shrink-0 fixed h-screen right-0 top-0 z-30">
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

        <div className="border-t border-slate-800 pt-4">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-150"
          >
            <LogOutIcon className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 pr-64 min-h-screen">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}