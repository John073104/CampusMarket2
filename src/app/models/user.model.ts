export interface User {
  userId: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  name: string;
  phone?: string;
  profileImage?: string;
  dateJoined: any; // Firestore Timestamp
  isActive: boolean;
}

export interface SellerApplication {
  applicationId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  reasonForSelling: string;
  businessDescription?: string;
  submittedAt: any; // Firestore Timestamp
  reviewedAt?: any;
  reviewedBy?: string;
}