import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp 
} from '@angular/fire/firestore';
import { User, SellerApplication } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firestore: Firestore) {}

  // Submit seller application
  async submitSellerApplication(
    userId: string,
    userName: string,
    userEmail: string,
    reasonForSelling: string,
    businessDescription: string
  ): Promise<void> {
    const application: SellerApplication = {
      userId,
      userName,
      userEmail,
      status: 'pending',
      reasonForSelling,
      businessDescription,
      submittedAt: serverTimestamp()
    };

    await addDoc(collection(this.firestore, 'sellerApplications'), application);
  }

  // Check if user has pending application
  async hasPendingApplication(userId: string): Promise<boolean> {
    const q = query(
      collection(this.firestore, 'sellerApplications'),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  // Get all pending applications (Admin)
  async getPendingApplications(): Promise<SellerApplication[]> {
    const q = query(
      collection(this.firestore, 'sellerApplications'),
      where('status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      applicationId: doc.id,
      ...doc.data()
    } as SellerApplication));
  }

  // Get seller applications by status (Admin)
  async getSellerApplications(status?: string): Promise<SellerApplication[]> {
    let q;
    if (status) {
      q = query(
        collection(this.firestore, 'sellerApplications'),
        where('status', '==', status)
      );
    } else {
      q = query(collection(this.firestore, 'sellerApplications'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      applicationId: doc.id,
      ...doc.data()
    } as SellerApplication));
  }

  // Approve seller application (Admin)
  async approveSellerApplication(
    applicationId: string, 
    userId: string,
    adminId: string
  ): Promise<void> {
    // Update application status
    await updateDoc(doc(this.firestore, 'sellerApplications', applicationId), {
      status: 'approved',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId
    });

    // Update user role to seller
    await updateDoc(doc(this.firestore, 'users', userId), {
      role: 'seller'
    });
  }

  // Reject seller application (Admin)
  async rejectSellerApplication(
    applicationId: string,
    adminId: string
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'sellerApplications', applicationId), {
      status: 'rejected',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId
    });
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(this.firestore, 'users', userId));
    return userDoc.exists() ? userDoc.data() as User : null;
  }

  // Get all users (Admin)
  async getAllUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(this.firestore, 'users'));
    return snapshot.docs.map(doc => doc.data() as User);
  }

  // Update user profile
  async updateUserProfile(
    userId: string, 
    updates: Partial<User>
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', userId), updates);
  }
}