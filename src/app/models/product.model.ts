export interface Product {
  productId?: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
  approved: boolean;
  stock: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
}

export type ProductCategory = 
  | 'Food' 
  | 'Accessories' 
  | 'Books' 
  | 'Snacks' 
  | 'Electronics' 
  | 'Clothing' 
  | 'Other';