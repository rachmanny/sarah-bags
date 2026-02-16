export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: 'new' | 'sale' | 'personalized';
  palette?: string[];
  cta: 'customize' | 'add_to_cart';
}
