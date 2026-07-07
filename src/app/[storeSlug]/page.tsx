"use client";

import React, { useEffect, useState, useMemo, use } from "react";
import { db } from "@/firebase/config";
import { collection, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { Store } from "@/types";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Plus, Minus, Trash2, Phone, MapPin, MessageSquare, Loader2, Search, X, Check } from "lucide-react";

interface StorefrontProps {
  params: Promise<{ storeSlug: string }>;
}

interface MultiSizeProduct {
  id: string;
  storeId: string;
  nameAr: string;
  availability: boolean;
  bestSeller: boolean;
  imageUrl: string;
  smallUnitName: string;
  smallUnitPrice: number;
  largeUnitName: string;
  largeUnitPrice: number;
  conversionFactor: number; 
}

export default function StorefrontPage({ params }: StorefrontProps) {
  const resolvedParams = use(params);
  const { storeSlug } = resolvedParams;

  const { cartItems, addToCart, updateQuantity, removeFromCart, getCartSubtotal, sendOrderWhatsApp } = useCart();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<MultiSizeProduct[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<MultiSizeProduct | null>(null);
  const [modalSizeSelection, setModalSizeSelection] = useState<"small" | "large">("small");

  const [gridSizeSelections, setGridSizeSelections] = useState<Record<string, "small" | "large">>({});

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const storeQ = query(collection(db, "stores"), where("slug", "==", storeSlug.toLowerCase()));
        const storeSnapshot = await getDocs(storeQ);

        if (storeSnapshot.empty) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const storeDoc = storeSnapshot.docs[0];
        setStore({ id: storeDoc.id, ...storeDoc.data() } as Store);

        await updateDoc(doc(db, "stores", storeDoc.id), { views: increment(1) });

        const prodQ = query(collection(db, "products"), where("storeId", "==", storeDoc.id), where("availability", "==", true));
        const prodSnapshot = await getDocs(prodQ);
        const prodItems: MultiSizeProduct[] = [];

        prodSnapshot.forEach((document) => {
          const data = document.data();
          prodItems.push({
            id: document.id,
            storeId: data.storeId || "",
            nameAr: data.nameAr || "",
            availability: data.availability ?? true,
            bestSeller: data.bestSeller ?? false,
            imageUrl: data.imageUrl || "",
            smallUnitName: data.smallUnitName || "كيلو",
            smallUnitPrice: data.smallUnitPrice || 0,
            largeUnitName: data.largeUnitName || "كرتونة",
            largeUnitPrice: data.largeUnitPrice || 0,
            conversionFactor: data.conversionFactor || 1,
          });
        });

        setProducts(prodItems);
      } catch (error) {
        console.error(error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [storeSlug]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter((p) => p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, products]);

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;
  if (notFound || !store) return <div className="min-h-screen flex flex-col items-center justify-center text-slate-800"><h1 className="text-3xl font-black">المتجر غير موجود! ❌</h1></div>;

  const accentColor = store.settings?.themeColor || "#f59e0b";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24" style={{ direction: "rtl" }}>
      
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <h1 className="text-3xl font-black text-slate-900">{store.storeName}</h1>
          <button onClick={() => setIsCartOpen(true)} className="relative p-3 rounded-2xl bg-white shadow-md border border-slate-100">
            <ShoppingCart className="w-6 h-6 text-slate-800" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -end-2 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-5" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن حلوياتك المفضلة هنا..." className="w-full pr-12 pl-4 py-3.5 bg-slate-50 rounded-xl font-bold" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => {
            const currentSize = gridSizeSelections[prod.id] || "small";
            const currentPrice = currentSize === "small" ? prod.smallUnitPrice : prod.largeUnitPrice;

            // حساب سعر الحبة/الكيلو الفردي داخل الكرتونة تلقائياً للعرض والتوضيح
            const calculatedSinglePrice = currentSize === "large" && prod.conversionFactor > 0 
              ? (prod.largeUnitPrice / prod.conversionFactor).toFixed(1) 
              : null;

            return (
              <div key={prod.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition flex flex-col overflow-hidden border border-slate-200">
                <div onClick={() => { setSelectedProduct(prod); setModalSizeSelection(currentSize); }} className="cursor-pointer">
                  <div className="relative aspect-[4/3] w-full bg-slate-100">
                    <img src={prod.imageUrl || "https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=600&q=80"} alt={prod.nameAr} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-black text-slate-900 line-clamp-1">{prod.nameAr}</h3>
                  </div>
                </div>

                <div className="px-5 pb-3 grid grid-cols-2 gap-2.5">
                  <button onClick={() => setGridSizeSelections(p => ({...p, [prod.id]: "small"}))} className={`py-2.5 text-sm font-black rounded-xl border ${currentSize === "small" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}>
                    {prod.smallUnitName}
                  </button>
                  <button onClick={() => setGridSizeSelections(p => ({...p, [prod.id]: "large"}))} className={`py-2.5 text-sm font-black rounded-xl border ${currentSize === "large" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}>
                    {prod.largeUnitName}
                  </button>
                </div>

                <div className="p-5 pt-2 mt-auto border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-950">{currentPrice} ج.م</span>
                    {/* حساب تلقائي وعرض ذكي لتقسيم وحساب الكمية الصغيره */}
                    <span className="text-xs text-slate-600 font-bold mt-1">
                      {currentSize === "small" 
                        ? `لـ ${prod.smallUnitName}` 
                        : `العِدْل: ${prod.conversionFactor} ${prod.smallUnitName} (واقف بـ ${calculatedSinglePrice} ج.م لـ ${prod.smallUnitName})`
                      }
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart({ 
                      id: `${prod.id}-${currentSize}`, 
                      nameAr: `${prod.nameAr} (${currentSize === "small" ? prod.smallUnitName : `${prod.largeUnitName} [سعة ${prod.conversionFactor} ${prod.smallUnitName}]`})`, 
                      pricePerKG: currentPrice, 
                      category: "حلويات" 
                    })}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* الـ Modal المحدث بالتفاصيل الحسابية التلقائية */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 left-4 z-20 bg-slate-900/60 text-white p-2 rounded-full">✕</button>
            
            <div className="w-full md:w-1/2 bg-slate-950">
              <img src={selectedProduct.imageUrl || "https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=600&q=80"} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white">
              <h2 className="text-3xl font-black text-slate-900">{selectedProduct.nameAr}</h2>
              
              <div className="space-y-3 mt-6">
                <label className="block text-base font-black text-slate-800">اختر الحجم المطلـوب:</label>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setModalSizeSelection("small")} className={`p-4 rounded-2xl border-2 text-center ${modalSizeSelection === "small" ? "border-amber-500 bg-amber-50/40" : "border-slate-200"}`}>
                    <span className="font-black text-lg block">{selectedProduct.smallUnitName}</span>
                    <span className="text-sm font-bold text-slate-900">{selectedProduct.smallUnitPrice} ج.م</span>
                  </button>
                  <button onClick={() => setModalSizeSelection("large")} className={`p-4 rounded-2xl border-2 text-center ${modalSizeSelection === "large" ? "border-amber-500 bg-amber-50/40" : "border-slate-200"}`}>
                    <span className="font-black text-lg block">{selectedProduct.largeUnitName}</span>
                    <span className="text-sm font-bold text-slate-900">{selectedProduct.largeUnitPrice} ج.م</span>
                    <span className="text-[11px] text-amber-800 font-black block mt-1">
                      (تساوي {selectedProduct.conversionFactor} {selectedProduct.smallUnitName} - الـ {selectedProduct.smallUnitName} بـ {(selectedProduct.largeUnitPrice / selectedProduct.conversionFactor).toFixed(1)} ج.م)
                    </span>
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between mt-auto">
                <span className="text-3xl font-black text-slate-950">{modalSizeSelection === "small" ? selectedProduct.smallUnitPrice : selectedProduct.largeUnitPrice} ج.م</span>
                <button
                  onClick={() => {
                    const pPrice = modalSizeSelection === "small" ? selectedProduct.smallUnitPrice : selectedProduct.largeUnitPrice;
                    const pUnit = modalSizeSelection === "small" ? selectedProduct.smallUnitName : `${selectedProduct.largeUnitName} [${selectedProduct.conversionFactor} ${selectedProduct.smallUnitName}]`;
                    addToCart({ id: `${selectedProduct.id}-${modalSizeSelection}`, nameAr: `${selectedProduct.nameAr} (${pUnit})`, pricePerKG: pPrice, category: "حلويات" });
                    setSelectedProduct(null);
                  }}
                  className="py-4 px-8 text-white font-black rounded-2xl text-base" style={{ backgroundColor: accentColor }}
                >
                  أضف للسلة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* سلة المشتريات المحدثة لحساب ضرب كمية العبوات التلقائي */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between rounded-l-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-950">سلة طلباتك</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-900 hover:bg-slate-100 font-black text-sm border-2 border-slate-300 px-3 py-1.5 rounded-xl">إغلاق ✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 font-bold space-y-4">
                  <span className="text-6xl">🛒</span><p>السلة فارغة الحين!</p>
                </div>
              ) : (
                cartItems.map((item) => {
                  // استخراج معامل التحويل التلقائي من النص إذا كان الحجم كبيراً لحساب الصافي
                  const isLarge = item.id.endsWith("-large");
                  const match = item.nameAr.match(/سعة (\d+)/) || item.nameAr.match(/\[(\d+)/);
                  const factor = match ? parseInt(match[1]) : 1;
                  const totalSmallUnits = isLarge ? factor * item.quantity : null;

                  return (
                    <div key={item.id} className="bg-white p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm border border-slate-200">
                      <div className="space-y-1">
                        <h4 className="font-black text-slate-950 text-sm leading-tight">{item.nameAr}</h4>
                        <p className="text-sm font-black text-amber-600">{item.pricePerKG * item.quantity} ج.م</p>
                        {/* عرض حساب الكمية الصغيره التلقائي الإجمالي في السلة */}
                        {totalSmallUnits && (
                          <div className="text-[11px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded shadow-sm inline-block">
                            إجمالي الكمية الصافية: {totalSmallUnits} وحدة صغيرة
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 bg-slate-100 border-2 border-slate-300 rounded-xl p-1 shrink-0">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-slate-900 bg-white rounded-lg shadow-sm font-bold"><Minus className="w-4 h-4" /></button>
                        <span className="text-sm font-black text-slate-950 px-1">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="p-1 text-slate-900 bg-white rounded-lg shadow-sm font-bold"><Plus className="w-4 h-4" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-white space-y-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between font-black text-slate-950 text-lg">
                <span>الإجمالي النهائي:</span>
                <span className="text-2xl" style={{ color: accentColor }}>{getCartSubtotal()} ج.م</span>
              </div>
              <button onClick={() => sendOrderWhatsApp(store.whatsapp, store.storeName)} disabled={cartItems.length === 0 || !store.whatsapp} className="w-full flex items-center justify-center gap-2 py-4 px-4 text-white font-black rounded-2xl text-lg shadow-md" style={{ backgroundColor: store.whatsapp ? "#25D366" : undefined }}>
                <MessageSquare className="w-6 h-6 stroke-[2.5]" /><span>إتمام الطلب عبر واتساب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}