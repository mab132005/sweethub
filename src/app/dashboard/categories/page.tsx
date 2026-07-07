"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useLanguage } from "@/context/LanguageContext";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";

// تعريف بسيط للأقسام بدون الاسم الإنجليزي لتسهيل الكود عندك
interface CompactCategory {
  id: string;
  storeId: string;
  nameAr: string;
  slug: string;
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  
  const [categories, setCategories] = useState<CompactCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  // حقول الفورم (الاسم العربي والرابط الإنجليزي للمتصفح)
  const [nameAr, setNameAr] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // 1. جلب الأقسام من الفايربيز
  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, "categories"), where("storeId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const items: CompactCategory[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as CompactCategory);
      });
      setCategories(items);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      if (!active) return;
      await fetchCategories();
    };

    void loadCategories();

    return () => {
      active = false;
    };
  }, [fetchCategories]);

  // 2. إضافة أو تحديث قسم
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nameAr || !slug) return;

    setBtnLoading(true);
    try {
      const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");
      
      if (editingId) {
        // وضع التعديل
        const docRef = doc(db, "categories", editingId);
        await updateDoc(docRef, {
          nameAr,
          slug: cleanSlug,
        });
        setEditingId(null);
      } else {
        // وضع الإضافة الجديد
        await addDoc(collection(db, "categories"), {
          storeId: user.uid,
          nameAr,
          slug: cleanSlug,
        });
      }

      // تفريغ الحقول وتحديث الجدول
      setNameAr("");
      setSlug("");
      await fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setBtnLoading(false);
    }
  };

  // 3. بدء التعديل
  const handleEdit = (category: CompactCategory) => {
    setEditingId(category.id);
    setNameAr(category.nameAr);
    setSlug(category.slug);
  };

  // 4. حذف قسم
  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
    
    try {
      await deleteDoc(doc(db, "categories", id));
      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ direction: "rtl" }}>
      <div>
        <h1 className="text-2xl font-bold text-gray-800">إدارة الأقسام</h1>
        <p className="text-sm text-gray-500 mt-1">إضافة وتعديل الأقسام الخاصة بمنتجات متجرك</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* الفورم */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-lg font-bold text-gray-700 mb-4">
            {editingId ? "تعديل القسم" : "إضافة قسم جديد"}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">الاسم بالعربية</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="مثال: حلويات شرقية"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">اسم الرابط بالمتصفح (بالإنجليزي)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="مثال: sharqy"
                style={{ direction: "ltr" }}
              />
              <p className="text-xs text-gray-400 mt-1">يظهر في أعلى المتصفح، اكتبه بأحرف إنجليزية صغيرة.</p>
            </div>

            <button
              type="submit"
              disabled={btnLoading}
              className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition disabled:bg-gray-400 gap-2"
            >
              {btnLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{editingId ? "تحديث القسم" : "إضافة قسم"}</span>
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setNameAr(""); setSlug(""); }}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-lg text-sm transition mt-2"
              >
                إلغاء التعديل
              </button>
            )}
          </form>
        </div>

        {/* الجدول */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-sm">
                  <th className="p-4 text-start font-medium">اسم القسم</th>
                  <th className="p-4 text-start font-medium">الرابط الإنجليزي</th>
                  <th className="p-4 text-center font-medium">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-400">
                      لم تقم بإضافة أقسام بعد.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-medium text-gray-800">{cat.nameAr}</td>
                      <td className="p-4 font-mono text-xs text-gray-500">{cat.slug}</td>
                      <td className="p-4 flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}