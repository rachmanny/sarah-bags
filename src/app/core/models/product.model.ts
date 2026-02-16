export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  gallery?: string[];
  badge?: 'new' | 'sale' | 'personalized';
  palette?: string[];
  sizes?: ProductSizeOption[];
  strapColors?: ProductColorOption[];
  maxInitials?: number;
  cta: 'customize' | 'add_to_cart';
}

export interface ProductSizeOption {
  label: string;
  subtitle?: string;
  priceDelta?: number;
}

export interface ProductColorOption {
  name: string;
  hex: string;
}
