"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, writeBatch, DocumentData } from "firebase/firestore";
import { Plus, Trash2, Edit2, Loader2, Link2, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";

// 1. تعريف نوع المنتج داخل التطبيق
interface CompactProduct {
  id: string;
  nameAr: string;
  availability: boolean;
  bestSeller: boolean;
  imageUrl?: string;
  smallUnitName: string;
  smallUnitPrice: number;
  largeUnitName: string;
  largeUnitPrice: number;
  conversionFactor: number;
}

// 2. تعريف واجهة البيانات المتوقعة القادمة من ملف الـ Excel لمنع الـ any
interface ExcelProductRow {
  "اسم الصنف"?: string | number;
  "الاسم"?: string | number;
  "nameAr"?: string | number;
  "سعر الوحدة الصغيرة"?: string | number;
  "السعر"?: string | number;
  "اسم الوحدة الصغيرة"?: string | number;
  "اسم الوحدة الكبيرة"?: string | number;
  "معامل الاحتواء"?: string | number;
  "السعة"?: string | number;
  "رابط الصورة"?: string | number;
  "الصورة"?: string | number;
}

export default function ProductsPage() {
  const { user } = useAuth();
  
  const [products, setProducts] = useState<CompactProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  // حقول الفورم
  const [nameAr, setNameAr] = useState("");
  const [smallUnitPrice, setSmallUnitPrice] = useState("");
  const [smallUnitName, setSmallUnitName] = useState("كيلو");
  const [largeUnitName, setLargeUnitName] = useState("كرتونة");
  const [conversionFactor, setConversionFactor] = useState("5"); 
  
  const [imageUrl, setImageUrl] = useState("");
  const [availability, setAvailability] = useState(true);
  const [bestSeller, setBestSeller] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);

  // الحسبة التلقائية لسعر الوحدة الكبيرة
  const calculatedLargeUnitPrice = useMemo(() => {
    const smallPrice = Number(smallUnitPrice) || 0;
    const factor = Number(conversionFactor) || 1;
    return smallPrice * factor;
  }, [smallUnitPrice, conversionFactor]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const prodQ = query(collection(db, "products"), where("storeId", "==", user.uid));
        const prodSnapshot = await getDocs(prodQ);
        const prodItems: CompactProduct[] = [];
        
        prodSnapshot.forEach((document) => {
          // استبدال الـ any بنوع DocumentData المدعوم من Firebase
          const d: DocumentData = document.data();
          prodItems.push({
            id: document.id,
            nameAr: d.nameAr || "",
            availability: d.availability ?? true,
            bestSeller: d.bestSeller ?? false,
            imageUrl: d.imageUrl || "",
            smallUnitName: d.smallUnitName || "كيلو",
            smallUnitPrice: d.smallUnitPrice || 0,
            largeUnitName: d.largeUnitName || "كرتونة",
            largeUnitPrice: d.largeUnitPrice || 0,
            conversionFactor: d.conversionFactor || 1,
          });
        });
        setProducts(prodItems);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ==================== ميزة استيراد المنتجات من ملف Excel ====================
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setExcelLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        if (!bstr) return;
        
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // هنا حددنا النوع الصريح بدلاً من any[] لمنع خطأ الـ TypeScript
        const data = XLSX.utils.sheet_to_json<ExcelProductRow>(ws);

        const batch = writeBatch(db);
        const addedProductsLocal: CompactProduct[] = [];

        for (const row of data) {
          const pName = row["اسم الصنف"] || row["الاسم"] || row["nameAr"];
          const pSmallPrice = Number(row["سعر الوحدة الصغيرة"]) || Number(row["السعر"]) || 0;
          const pSmallUnit = row["اسم الوحدة الصغيرة"] || "كيلو";
          const pLargeUnit = row["اسم الوحدة الكبيرة"] || "كرتونة";
          const pFactor = Number(row["معامل الاحتواء"]) || Number(row["السعة"]) || 5;
          const pImage = row["رابط الصورة"] || row["الصورة"] || "";

          if (!pName) continue; 

          const pLargePrice = pSmallPrice * pFactor;

          const productData = {
            storeId: user.uid,
            nameAr: String(pName),
            smallUnitPrice: pSmallPrice,
            smallUnitName: String(pSmallUnit),
            largeUnitName: String(pLargeUnit),
            largeUnitPrice: pLargePrice,
            conversionFactor: pFactor,
            imageUrl: String(pImage).trim(),
            availability: true,
            bestSeller: false,
            createdAt: new Date(),
          };

          const docRef = doc(collection(db, "products"));
          batch.set(docRef, productData);
          
          addedProductsLocal.push({ id: docRef.id, ...productData });
        }

        await batch.commit();
        setProducts(prev => [...prev, ...addedProductsLocal]);
        alert(`🎉 تم استيراد ${addedProductsLocal.length} منتج بنجاح لمتجرك!`);
      } catch (err) {
        console.error("Error parsing excel:", err);
        alert("❌ حدث خطأ أثناء قراءة ملف الـ Excel.");
      } finally {
        setExcelLoading(false);
        e.target.value = ""; 
      }
    };

    reader.readAsBinaryString(file);
  };

  // ==================== ميزة تصدير المنتجات الحالية لملف Excel ====================
  const handleExportExcel = () => {
    if (products.length === 0) {
      alert("⚠️ لا توجد منتجات حالية لتصديرها.");
      return;
    }

    const excelData = products.map((prod) => ({
      "اسم الصنف": prod.nameAr,
      "سعر الوحدة الصغيرة": prod.smallUnitPrice,
      "اسم الوحدة الصغيرة": prod.smallUnitName,
      "اسم الوحدة الكبيرة": prod.largeUnitName,
      "معامل الاحتواء (السعة)": prod.conversionFactor,
      "سعر الوحدة الكبيرة (التلقائي)": prod.largeUnitPrice,
      "رابط الصورة": prod.imageUrl || "لا يوجد",
      "الحالة": prod.availability ? "متوفر" : "غير متوفر",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المنتجات والأسعار");

    XLSX.writeFile(workbook, `منتجات_متجر_SweetHub_${new Date().toLocaleDateString("ar-EG")}.xlsx`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nameAr || !smallUnitPrice || !conversionFactor) return;

    setBtnLoading(true);
    try {
      const productData = {
        storeId: user.uid,
        nameAr,
        availability,
        bestSeller,
        imageUrl: imageUrl.trim(),
        smallUnitName,
        smallUnitPrice: Number(smallUnitPrice),
        largeUnitName,
        largeUnitPrice: calculatedLargeUnitPrice,
        conversionFactor: Number(conversionFactor) || 1,
        createdAt: new Date(),
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        setProducts(prev => prev.map(p => p.id === editingId ? { id: editingId, ...productData } : p));
        setEditingId(null);
      } else {
        const docRef = await addDoc(collection(db, "products"), productData);
        setProducts(prev => [...prev, { id: docRef.id, ...productData }]);
      }

      setNameAr(""); setSmallUnitPrice(""); 
      setSmallUnitName("كيلو"); setLargeUnitName("كرتونة"); setConversionFactor("5");
      setImageUrl(""); setAvailability(true); setBestSeller(false);
      
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleEdit = (prod: CompactProduct) => {
    setEditingId(prod.id);
    setNameAr(prod.nameAr);
    setSmallUnitPrice(prod.smallUnitPrice.toString());
    setSmallUnitName(prod.smallUnitName);
    setLargeUnitName(prod.largeUnitName);
    setConversionFactor(prod.conversionFactor.toString());
    setImageUrl(prod.imageUrl || "");
    setAvailability(prod.availability);
    setBestSeller(prod.bestSeller);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-8 text-slate-900" style={{ direction: "rtl" }}>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900">إدارة المنتجات</h1>
          <p className="text-sm font-bold text-slate-600 mt-1">أضف حلوياتك يدوياً أو مجمعاً بملفات الإكسل لسرعة فائقة</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-black rounded-xl border-2 border-slate-300 shadow-sm transition text-sm"
          >
            <Download className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>تصدير Excel لمنتجاتك</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer shadow-sm transition text-sm relative">
            {excelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 stroke-[2.5]" />}
            <span>{excelLoading ? "جاري الرفع مجمعاً..." : "استيراد ملف Excel للمحل"}</span>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleImportExcel} 
              disabled={excelLoading} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* نموذج الإضافة والتعديل */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-300 h-fit">
          <h3 className="text-xl font-black text-slate-900 mb-5 border-b border-slate-200 pb-3">
            {editingId ? "تعديل بيانات المنتج" : "إضافة منتج يدوياً"}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-black text-slate-900 mb-1">1. اسم الصنف</label>
              <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} required className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:border-amber-500 focus:outline-none text-base" placeholder="مثال: سمسمية ارمش" />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-1">2. سعر الوحدة الصغيرة (ج.م)</label>
              <input type="number" value={smallUnitPrice} onChange={(e) => setSmallUnitPrice(e.target.value)} required className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:border-amber-500 focus:outline-none text-base" placeholder="مثال: 50" />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-1">3. اسم الوحدة الصغيرة</label>
              <input type="text" value={smallUnitName} onChange={(e) => setSmallUnitName(e.target.value)} required className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:border-amber-500 focus:outline-none text-base" placeholder="مثال: كيلو أو قطعة" />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-1">4. اسم الوحدة الكبيرة</label>
              <input type="text" value={largeUnitName} onChange={(e) => setLargeUnitName(e.target.value)} required className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:border-amber-500 focus:outline-none text-base" placeholder="مثال: كرتونة أو علبة" />
            </div>

            <div>
              <label className="block text-sm font-black text-amber-950 mb-1">5. معامل الاحتواء (الـ {largeUnitName || "كرتونة"} فيها كام {smallUnitName || "كيلو"}؟)</label>
              <input type="number" value={conversionFactor} onChange={(e) => setConversionFactor(e.target.value)} required min="1" className="w-full px-4 py-2.5 border-2 border-amber-300 bg-amber-50/20 rounded-xl text-slate-900 font-black focus:border-amber-500 focus:outline-none text-base" placeholder="مثال: 5" />
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1 shadow-inner">
              <div className="text-xs font-bold text-slate-400">سعر الـ {largeUnitName || "كرتونة"} التلقائي المحسوب:</div>
              <div className="text-2xl font-black text-amber-400">{calculatedLargeUnitPrice} ج.م</div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-1">رابط صورة المنتج (اختياري)</label>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-4 py-2 border-2 border-slate-300 rounded-xl text-sm font-medium text-slate-900" placeholder="https://example.com/image.jpg" />
            </div>

            <div className="flex items-center gap-6 py-2 border-y border-slate-200">
              <label className="flex items-center gap-2 text-sm font-black text-slate-900 cursor-pointer">
                <input type="checkbox" checked={availability} onChange={(e) => setAvailability(e.target.checked)} className="rounded text-amber-500 w-4 h-4 border-slate-400" />
                <span>متوفر للبيع</span>
              </label>
              <label className="flex items-center gap-2 text-sm font-black text-slate-900 cursor-pointer">
                <input type="checkbox" checked={bestSeller} onChange={(e) => setBestSeller(e.target.checked)} className="rounded text-amber-500 w-4 h-4 border-slate-400" />
                <span>الأكثر مبيعاً ⭐</span>
              </label>
            </div>

            <button type="submit" disabled={btnLoading} className="w-full flex justify-center py-3.5 px-4 bg-amber-500 text-slate-950 font-black rounded-xl text-base transition disabled:bg-slate-300 gap-2 shadow-sm hover:bg-amber-600">
              {btnLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              <span>{editingId ? "تحديث المنتج" : "إضافة منتج"}</span>
            </button>
          </form>
        </div>

        {/* الجدول وعرض البيانات */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead className="bg-slate-100 border-b-2 border-slate-300 text-slate-900 text-sm">
                <tr>
                  <th className="p-4 text-start font-black text-slate-900 text-base">صورة</th>
                  <th className="p-4 text-start font-black text-slate-900 text-base">المنتج</th>
                  <th className="p-4 text-start font-black text-slate-900 text-base">الأسعار والتعبئة المحسوبة</th>
                  <th className="p-4 text-center font-black text-slate-900 text-base">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200 text-slate-950">
                {products.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-bold">المتجر فارغ، ارفع ملف Excel أو أضف يدوياً وانطلق!</td></tr>
                ) : (
                  products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50 transition font-bold">
                      <td className="p-4">
                        <img src={prod.imageUrl || "https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=120&q=80"} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-sm" />
                      </td>
                      <td className="p-4">
                        <div className="font-black text-slate-950 text-base">{prod.nameAr} {prod.bestSeller && "⭐"}</div>
                      </td>
                      <td className="p-4 space-y-1.5 text-sm">
                        <div className="text-slate-950 font-bold"><span className="font-black text-slate-900">{prod.smallUnitName}:</span> {prod.smallUnitPrice} ج.م</div>
                        <div className="text-slate-950 font-bold">
                          <span className="font-black text-slate-900">{prod.largeUnitName}:</span> {prod.largeUnitPrice} ج.م 
                          <span className="text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md mr-2 font-black inline-block shadow-sm">
                            (تحتوي على {prod.conversionFactor} {prod.smallUnitName})
                          </span>
                        </div>
                      </td>
                      <td className="p-4 flex items-center justify-center gap-3 mt-3">
                        <button onClick={() => handleEdit(prod)} className="p-2.5 text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl transition"><Edit2 className="w-4 h-4 stroke-[2.5]" /></button>
                        <button onClick={() => handleDelete(prod.id)} className="p-2.5 text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition"><Trash2 className="w-4 h-4 stroke-[2.5]" /></button>
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