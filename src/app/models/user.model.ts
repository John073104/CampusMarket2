export interface User {
  userId: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  name: string;
  phone?: string;
  profileImage?: string;
  dateJoined: any; // Firestore Timestamp
  isActive: boolean;
  // Student information
  studentName?: string;
  courseName?: string;
  studentId?: string;
  yearLevel?: string;
  // Seller payment details
  gcashNumber?: string;
  gcashName?: string;
  bankAccount?: string;
  bankName?: string;
  bankAccountName?: string;
  // Location information
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
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
  // Student information for seller application
  studentName: string;
  courseName: string;
  studentId?: string;
  yearLevel?: string;
}