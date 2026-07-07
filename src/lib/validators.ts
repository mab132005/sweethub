import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح / Invalid Email"),
  password: z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف / Password min 6 chars"),
});

export const registerSchema = z.object({
  storeName: z.string().min(3, "اسم المتجر يجب أن يكون 3 أحرف على الأقل"),
  slug: z.string()
    .min(3, "الرابط يجب أن يكون 3 أحرف على الأقل")
    .regex(/^[a-z0-9-_]+$/, "الرابط يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وعلامات - أو _ فقط بدون مسافات"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;