import { Product } from '../models/product.model';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'signature-initial-canvas-tote',
    name: 'Signature Initial Canvas Tote',
    category: 'Tote Bags',
    price: 45,
    image:
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=900&q=80',
    badge: 'new',
    cta: 'customize',
  },
  {
    id: 'waffle-travel-pouch',
    name: 'Waffle Texture Travel Pouch',
    category: 'Accessories',
    price: 28,
    image:
      'https://images.unsplash.com/photo-1614179689702-355944cd0918?auto=format&fit=crop&w=900&q=80',
    palette: ['#F6EDE4', '#DCE8D5', '#DCE4F2'],
    cta: 'add_to_cart',
  },
  {
    id: 'organic-cotton-swaddle',
    name: 'Organic Cotton Muslin Swaddle',
    category: 'Baby Collection',
    price: 32,
    image:
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80',
    badge: 'personalized',
    cta: 'customize',
  },
  {
    id: 'vegan-leather-nappy-backpack',
    name: 'Vegan Leather Nappy Backpack',
    category: 'Accessories',
    price: 120,
    image:
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',
    cta: 'add_to_cart',
  },
  {
    id: 'embroidered-fleece-blanket',
    name: 'Embroidered Fleece Blanket',
    category: 'Personalized',
    price: 58,
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    cta: 'customize',
  },
  {
    id: 'premium-bamboo-bath-set',
    name: 'Premium Bamboo Bath Set',
    category: 'Baby Collection',
    price: 35,
    originalPrice: 45,
    image:
      'https://images.unsplash.com/photo-1544717305-996b815c338c?auto=format&fit=crop&w=900&q=80',
    badge: 'sale',
    cta: 'add_to_cart',
  },
];
