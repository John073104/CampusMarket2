export interface Order {
  orderId?: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  pickupLocation?: string;
  notes?: string;
  paymentMethod?: 'cod' | 'gcash' | 'bank_transfer' | 'meet_and_pay';
  paymentProofImage?: string;
  paymentStatus?: 'pending' | 'verified' | 'rejected';
  paymentVerifiedAt?: any;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 
  | 'placed' 
  | 'confirmed' 
  | 'ready_for_pickup' 
  | 'completed' 
  | 'cancelled';