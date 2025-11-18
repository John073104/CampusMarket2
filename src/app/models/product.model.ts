export interface Product {
  productId?: string;
  sellerId: string;
  sellerName: string;
  sellerCourseName?: string; // Student's course name
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  unitType?: 'piece' | 'kg' | 'liter' | 'box' | 'pack' | 'dozen';
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