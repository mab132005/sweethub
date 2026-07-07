"use client";

import React from "react";
import Link from "next/link";
import { Store, ArrowLeft, Sparkles, LayoutDashboard } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900" style={{ direction: "rtl" }}>
      
      <div className="max-w-xl w-full bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-8 relative overflow-hidden">
        
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-200 rounded-full blur-3xl opacity-30" />

        <div className="flex flex-col items-center space-y-3 relative z-10">
          <div className="p-4 bg-amber-500 text-slate-950 rounded-2xl shadow-md inline-block">
            <Store className="w-12 h-12 stroke-[2.5]" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            SweetHub
          </h1>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-950 text-xs font-black rounded-full shadow-inner">
            <Sparkles className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
            <span>منصة الكتالوج الرقمي المتطور</span>
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <p className="text-xl font-black text-slate-900">
            أنشئ متجرك الإلكتروني في دقيقة واحدة!
          </p>
          <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-sm mx-auto">
            منصة مخصصة لمحلات الحلويات لإدارة المنتجات، حساب الأسعار مجمعاً، واستقبل طلبات الزبائن مباشرة عبر الواتساب.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 relative z-10">
          <Link 
            href="/register" 
            className="flex items-center justify-center gap-2 py-4 px-6 bg-amber-500 text-slate-950 font-black rounded-2xl text-base shadow-sm hover:bg-amber-600 transition"
          >
            <span>ابدأ الآن مجاناً</span>
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>

          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 py-4 px-6 bg-white hover:bg-slate-50 text-slate-800 font-black rounded-2xl text-base border-2 border-slate-300 shadow-sm transition"
          >
            <LayoutDashboard className="w-5 h-5 text-slate-600 stroke-[2.5]" />
            <span>لوحة تحكم التاجر</span>
          </Link>
        </div>

        {/* 🏆 هنا برضه اسمك محفوظ ومنور كحقوق ملكية فكرية */}
        <div className="text-xs font-bold text-slate-400 pt-4 border-t border-slate-100 relative z-10 space-y-1">
          <div>جميع الحقوق محفوظة © {new Date().getFullYear()} SweetHub</div>
          <div className="text-slate-400 font-medium">
            تم التطوير بكل ❤️ بواسطة <span className="text-amber-600 font-black">محمد عبدالباقي</span>
          </div>
        </div>

      </div>
    </div>
  );
}