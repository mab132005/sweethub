"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDocs 
} from "firebase/firestore";
import { 
  ClipboardList, 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  PackageCheck
} from "lucide-react";

interface OrderItem {
  id: string;
  nameAr: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalPrice: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  createdAt: unknown;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  useEffect(() => {
    if (!user) return;

    const ordersQ = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(ordersQ, async (snapshot) => {
      try {
        setLoading(true);

        const storeQ = query(
          collection(db, "stores"),
          where("ownerId", "==", user.uid)
        );
        const storeSnapshot = await getDocs(storeQ);
        
        let myStoreId = "";
        if (!storeSnapshot.empty) {
          myStoreId = storeSnapshot.docs[0].id;
        }

        const items: Order[] = [];
        
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const isMyOrder = 
            data.storeId === myStoreId || 
            data.storeId === user.uid || 
            data.storeId === "gtDuOYGWeGauuBLx4WCl1bzWoOh1";

          if (isMyOrder) {
            items.push({
              id: docSnap.id,
              ...data
            } as Order);
          }
        });

        setOrders(items);
        setLoading(false);
      } catch (err) {
        console.error("Error processing orders:", err);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const formatTime = (createdAt: unknown) => {
    if (!createdAt) return "";
    // تفادي الـ explicit any باستخدام نوع مرن للـ Timestamp
    const ts = createdAt as { toDate?: () => Date; seconds?: number };
    const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(createdAt as string | number);
    return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
  };

  // تصفية الطلبات بناءً على التبويب المختار
  const activeOrders = orders.filter(o => o.status === "pending" || o.status === "processing");
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "cancelled");
  const currentOrders = activeTab === "active" ? activeOrders : completedOrders;

  return (
    <div className="space-y-6" style={{ direction: "rtl" }}>
      
      {/* 💳 الهيدر العلوي */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">لوحة إدارة الطلبات الواردة</h1>
            <p className="text-xs font-bold text-slate-500 mt-0.5">تابع أوردرات زبائنك لايف وحوّل حالتها فوراً لتنظيم المطبخ والتوصيل</p>
          </div>
        </div>
      </div>

      {/* 🗂️ أزرار التبديل بين الأقسام (Tabs) */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-md gap-2">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
            activeTab === "active"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>طلبات نشطة ومفتوحة ({activeOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all ${
            activeTab === "completed"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>الطلبات المنتهية ({completedOrders.length})</span>
        </button>
      </div>

      {/* 📦 عرض الطلبات */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map((i) => <div key={i} className="bg-slate-100 h-64 rounded-3xl" />)}
        </div>
      ) : currentOrders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col items-center justify-center p-6">
          <PackageCheck className="w-16 h-16 text-slate-300 mb-3" />
          <h3 className="text-lg font-black text-slate-800">لا توجد طلبات في هذا القسم حالياً!</h3>
          <p className="text-xs font-bold text-slate-400 mt-1 max-w-sm">بمجرد قيام أي زبون بطلب حلويات، سيظهر هنا فوراً وبشكل تلقائي.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentOrders.map((order) => (
            <div 
              key={order.id} 
              className={`bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                order.status === "completed" ? "border-emerald-100" : "border-slate-200/80"
              }`}
            >
              {/* رأس الكارت */}
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 bg-slate-200/70 px-2.5 py-1 rounded-lg">
                    ID: #{order.id.slice(-5).toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-bold mr-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatTime(order.createdAt)}</span>
                  </div>
                </div>

                {/* شارة الحالة العلوية */}
                <span className={`text-xs font-black px-3 py-1 rounded-full ${
                  order.status === "pending" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                  order.status === "processing" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                  order.status === "completed" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                  "bg-rose-50 text-rose-600 border border-rose-100"
                }`}>
                  {order.status === "pending" && "📥 طلب جديد"}
                  {order.status === "processing" && "🧑‍🍳 جاري التجهيز"}
                  {order.status === "completed" && "✅ تم التسليم"}
                  {order.status === "cancelled" && "❌ ملغي"}
                </span>
              </div>

              {/* محتوى الكارت (بيانات العميل) */}
              <div className="p-5 space-y-3 border-b border-slate-100/80">
                <div className="flex items-center gap-3 text-slate-700">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-400 w-14">الزبون:</span>
                  <span className="text-sm font-black text-slate-900">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-400 w-14">الهاتف:</span>
                  <a href={`tel:${order.customerPhone}`} className="text-sm font-black text-amber-600 hover:underline">
                    {order.customerPhone}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-400 w-14">العنوان:</span>
                  <span className="text-sm font-black text-slate-800">{order.customerAddress}</span>
                </div>
              </div>

              {/* 🍰 قائمة المنتجات */}
              <div className="p-5 bg-slate-50/50 space-y-2.5 border-b border-slate-100">
                <div className="text-xs font-black text-slate-400 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>الأصناف المطلوبة:</span>
                </div>
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white border border-slate-100 px-3 py-2 rounded-xl">
                    <div className="text-sm font-black text-slate-800">
                      <span className="text-amber-500 font-extrabold text-base ml-1.5">{item.quantity}x</span>
                      <span>{item.nameAr}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{item.price * item.quantity} ج.م</span>
                  </div>
                ))}
              </div>

              {/* أسفل الكارت والتحكم بالحالة */}
              <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400">الحساب الإجمالي:</span>
                  <span className="text-xl font-black text-slate-900">{order.totalPrice} <span className="text-xs text-amber-500">ج.م</span></span>
                </div>

                <div className="w-full sm:w-auto">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as Order["status"])}
                    className={`w-full sm:w-auto text-xs font-black px-4 py-2.5 rounded-xl border outline-none cursor-pointer transition-all ${
                      order.status === "pending" ? "bg-blue-50/50 border-blue-200 text-blue-700" :
                      order.status === "processing" ? "bg-amber-50/50 border-amber-200 text-amber-700" :
                      order.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      "bg-rose-50 border-rose-200 text-rose-700"
                    }`}
                  >
                    <option value="pending">📥 طلب جديد</option>
                    <option value="processing">🧑‍🍳 جاري التجهيز</option>
                    <option value="completed">✅ تم التسليم</option>
                    <option value="cancelled">❌ إحباط / ملغي</option>
                  </select>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}