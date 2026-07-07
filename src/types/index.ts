export interface UserProfile {
  uid: string;
  email: string;
  role: "admin" | "owner";
  createdAt: Date;
}

export interface StoreSettings {
  themeColor: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

export interface Store {
  id: string;
  ownerId: string;
  storeName: string;
  slug: string;
  logo: string;
  banner: string;
  whatsapp: string;
  phone: string;
  address: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  settings: StoreSettings;
  views: number;
  createdAt: Date;
}

export interface Product {
  id: string;
  storeId: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  pricePerKG: number;
  sku: string;
  category: string;
  grade: string;
  availability: boolean;
  bestSeller: boolean;
  sortOrder: number;
  images: string[];
  views: number;
  favorites: number;
  cartAdds: number;
  createdAt: Date;
}

export interface Category {
  id: string;
  storeId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
}

export interface Grade {
  id: string;
  storeId: string;
  nameAr: string;
  nameEn: string;
}