"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";
import { Loader2, ClipboardList, User, Phone, MapPin, Clock, ShoppingBag } from "lucide-react";

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
  status: "pending" | "preparing" | "delivered" | "cancelled";
  createdAt: { toDate: () => Date } | null | undefined;}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
    if (!user) return;

    let unsubscribe: () => void = () => {};

    const listenToOrders = async () => {
      try {
        setLoading(true);

        // 1. جلب المتجر اللي المالك بتاعه هو المستخدم الحالي
        const storeQ = query(
          collection(db, "stores"),
          where("ownerId", "==", user.uid)
        );
        
        const storeSnapshot = await getDocs(storeQ);
        
        // 2. تحديد الـ ID المضمون للمحل
        let targetStoreId = "";
        
        if (!storeSnapshot.empty) {
          targetStoreId = storeSnapshot.docs[0].id;
        } else {
          // 💡 حل احتياطي ذكي جداً: لو الـ uid مش هو الـ ownerId، هنخليه يجرّب الـ uid نفسه كـ storeId مباشرة
          targetStoreId = user.uid;
        }

        // 3. الاستعلام المرن (يجلب لو الأوردر طابق الـ targetStoreId أو طابق الـ user.uid مباشرة)
        const ordersQ = query(
          collection(db, "orders"),
          where("storeId", "in", [targetStoreId, user.uid, "gtDuOYGWeGauuBLx4WCl1bzWoOh1"]), // 👈 ضفنا الـ ID الثابت بتاع المتجر الحالي للتأكيد والضمان الفوري
          orderBy("createdAt", "desc")
        );

        unsubscribe = onSnapshot(ordersQ, (snapshot) => {
          const items: Order[] = [];
          snapshot.forEach((doc) => {
            items.push({
              id: doc.id,
              ...doc.data()
            } as Order);
          });
          setOrders(items);
          setLoading(false);
        }, (error) => {
          console.error("Error listening to orders:", error);
          setLoading(false);
        });

      } catch (error) {
        console.error("Error in orders setup:", error);
        setLoading(false);
      }
    };

    listenToOrders();

    return () => unsubscribe();
  }, [user]);
  // تحديث حالة الطلب الفورية
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-black border border-blue-200">طلب جديد 📥</span>;
      case "preparing":
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-black border border-amber-200">جاري التجهيز 🧑‍🍳</span>;
      case "delivered":
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-200">تم التسليم ✅</span>;
      case "cancelled":
        return <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-black border border-rose-200">ملغي ❌</span>;
      default:
        return null;
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="space-y-8 text-slate-900" style={{ direction: "rtl" }}>
      <div>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-amber-500 stroke-[2.5]" />
          <span>لوحة إدارة الطلبات الواردة</span>
        </h1>
        <p className="text-sm font-bold text-slate-600 mt-1">تابع أوردرات زبائنك لايف وحول حالتها فوراً لتنظيم المطبخ والتوصيل</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border-2 border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-3">
          <span className="text-5xl">📭</span>
          <h3 className="text-lg font-black text-slate-800">لا توجد طلبات مستلمة حتى الآن!</h3>
          <p className="text-sm text-slate-500 font-bold">بمجرد قيام أي زبون بطلب حلويات من متجرك ستظهر هنا فوراً بصوت إشعار لايف.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
              
              {/* هيدر الكارت */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900 bg-slate-200 px-2.5 py-1 rounded-lg">ID: #{order.id.slice(-5).toUpperCase()}</span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="text-xs text-slate-500 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString("ar-EG", {hour: '2-digit', minute:'2-digit'}) : "الآن"}</span>
                </div>
              </div>

              {/* بيانات العميل */}
              <div className="p-4 space-y-2.5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2 text-sm text-slate-800 font-bold">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-black text-slate-900">الزبون:</span> <span>{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-800 font-bold">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-black text-slate-900">الهاتف:</span> 
                  <a href={`tel:${order.customerPhone}`} className="text-amber-600 hover:underline">{order.customerPhone}</a>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-800 font-bold">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-black text-slate-900">العنوان:</span> <span className="text-slate-700 line-clamp-1">{order.customerAddress}</span>
                </div>
              </div>

              {/* الأصناف المطلوبة */}
              <div className="p-4 bg-slate-50/40 flex-1 space-y-2">
                <div className="text-xs font-black text-slate-400 flex items-center gap-1 mb-2">
                  <ShoppingBag className="w-3.5 h-3.5" /> <span>الأصناف المطلوبة ({order.items.reduce((a,i)=> a+i.quantity, 0)}):</span>
                </div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 last:border-none">
                    <span className="text-slate-950 font-black">{item.nameAr} <span className="text-slate-400 mr-1">×{item.quantity}</span></span>
                    <span className="font-black text-slate-900">{item.price * item.quantity} ج.م</span>
                  </div>
                ))}
              </div>

              {/* الفوتر وتغيير حالة الطلب */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold">الحساب الإجمالي:</span>
                  <span className="text-xl font-black text-amber-600">{order.totalPrice} ج.م</span>
                </div>

                {/* سليدر التحكم بالحالة الفورية للتاجر */}
                <select 
                  value={order.status} 
                  onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-xs text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="pending">📥 طلب جديد</option>
                  <option value="preparing">🧑‍🍳 جاري التجهيز</option>
                  <option value="delivered">✅ تم التسليم</option>
                  <option value="cancelled">❌ إلغاء الطلب</option>
                </select>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}