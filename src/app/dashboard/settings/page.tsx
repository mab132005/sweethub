"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Loader2, Save, CheckCircle, Store, Phone, MapPin, Globe } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");

  const [themeColor, setThemeColor] = useState("#3b82f6");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const docRef = doc(db, "stores", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStoreName(data.storeName || "");
          setWhatsapp(data.whatsapp || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setFacebook(data.facebook || "");
          setInstagram(data.instagram || "");
          setTiktok(data.tiktok || "");
          if (data.settings) {
            setThemeColor(data.settings.themeColor || "#3b82f6");
            setMetaTitle(data.settings.metaTitle || "");
            setMetaDescription(data.settings.metaDescription || "");
          }
        }
      } catch (error) {
        console.error("Error fetching store settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setBtnLoading(true);
    setSuccess(false);
    try {
      const docRef = doc(db, "stores", user.uid);
      await updateDoc(docRef, {
        storeName,
        whatsapp: whatsapp.trim(),
        phone: phone.trim(),
        address,
        facebook,
        instagram,
        tiktok,
        settings: {
          themeColor,
          metaTitle,
          metaDescription,
          keywords: "حلويات, متجر رقمي, كاتالوج, سويت هوب",
        }
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ direction: "rtl" }}>
      <div>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
          <Store className="w-8 h-8 text-amber-500" />
          <span>إعدادات المتجر</span>
        </h1>
        <p className="text-base text-slate-600 mt-1 font-medium">تحكم في بيانات هويتك وتواصلك الاجتماعي ورقم الـ WhatsApp الرئيسي للطلبات</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border-2 border-emerald-200 rounded-xl flex items-center gap-3 text-base font-bold shadow-sm animate-bounce">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
          <span>تم حفظ كافة التعديلات بنجاح وأصبحت حية الآن!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* البيانات العامة */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-amber-500 rounded-full"></span>
              البيانات العامة للمتجر
            </h3>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المتجر</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 font-bold text-base shadow-inner placeholder-slate-400 bg-slate-50/50"
                placeholder="اكتب اسم متجرك بوضوح"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <span>رقم الواتساب (استقبال الطلبات)</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: 201012345678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 font-bold text-base font-mono bg-slate-50/50 shadow-inner"
                  style={{ direction: "ltr" }}
                />
                <p className="text-xs text-slate-500 font-medium mt-1">اكتب رقمك بدون علامة + وبدون أصفار في البداية.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">رقم الهاتف للاتصال</label>
                <input
                  type="text"
                  placeholder="010XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 font-bold text-base font-mono bg-slate-50/50 shadow-inner"
                  style={{ direction: "ltr" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">عنوان ومقر المتجر</label>
              <input
                type="text"
                placeholder="مثال: القاهرة، مدينة نصر"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 font-bold text-base shadow-inner bg-slate-50/50"
              />
            </div>
          </div>

          {/* السوشيال ميديا */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-amber-500 rounded-full"></span>
              مواقع التواصل الاجتماعي
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">فيسبوك</label>
                <input
                  type="text"
                  placeholder="https://facebook.com/..."
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-900 bg-slate-50/30"
                  style={{ direction: "ltr" }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">انستجرام</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/..."
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-900 bg-slate-50/30"
                  style={{ direction: "ltr" }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">تيك توك</label>
                <input
                  type="text"
                  placeholder="https://tiktok.com/..."
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-slate-900 bg-slate-50/30"
                  style={{ direction: "ltr" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* جانب الألوان والـ SEO */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-amber-500 rounded-full"></span>
              الهوية البصرية للمتجر
            </h3>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اللون الرئيسي للكتالوج</label>
              <div className="flex gap-4 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-14 h-11 p-0.5 border border-slate-300 rounded-lg cursor-pointer bg-white"
                />
                <span className="text-base font-black font-mono text-slate-800 uppercase">{themeColor}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-amber-500 rounded-full"></span>
              محركات البحث وعنوان المتجر لجوجل (SEO)
            </h3>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">العنوان التسويقي لجوجل</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold text-sm bg-slate-50/30"
                placeholder="عنوان يظهر في محركات البحث"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">وصف المتجر القصير لجوجل</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-bold text-sm bg-slate-50/30"
                placeholder="وصف تسويقي لمتجرك يظهر في روابط المشاركة"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={btnLoading}
            className="w-full flex items-center justify-center py-3.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-base transition disabled:bg-slate-300 gap-2 shadow-lg shadow-amber-500/10 active:scale-95 duration-100"
          >
            {btnLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>حفظ وتثبيت الإعدادات</span>
          </button>
        </div>
      </form>
    </div>
  );
}