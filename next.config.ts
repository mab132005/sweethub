import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // ميزة مريحة: الكاش مقفول في الـ dev عشان تشوف تعديلاتك فوراً
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {}, // 🚀 السطر السحري ده هيقفل الإيرور ده تماماً في الـ dev وفي الـ build للأبد!
};

export default withPWA(nextConfig);