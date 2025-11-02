import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp 
} from '@angular/fire/firestore';

export interface Notification {
  notificationId?: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'product' | 'seller_application' | 'chat' | 'system';
  relatedId?: string; // Order ID, Product ID, etc.
  read: boolean;
  createdAt: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private firestore: Firestore) {}

  // Create notification
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    relatedId?: string
  ): Promise<void> {
    const notification: Omit<Notification, 'notificationId'> = {
      userId,
      title,
      message,
      type,
      relatedId,
      read: false,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(this.firestore, 'notifications'), notification);
  }

  // Get user notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const q = query(
      collection(this.firestore, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      notificationId: doc.id,
      ...doc.data()
    } as Notification));
  }

  // Get unread notifications count
  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(this.firestore, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(
      doc(this.firestore, 'notifications', notificationId), 
      { read: true }
    );
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(this.firestore, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updatePromises);
  }

  // Notification templates
  async notifyOrderPlaced(sellerId: string, orderId: string, customerName: string): Promise<void> {
    await this.createNotification(
      sellerId,
      'New Order Received',
      `You have a new order from ${customerName}`,
      'order',
      orderId
    );
  }

  async notifyOrderStatusChanged(customerId: string, orderId: string, status: string): Promise<void> {
    await this.createNotification(
      customerId,
      'Order Status Updated',
      `Your order is now ${status}`,
      'order',
      orderId
    );
  }

  async notifyProductApproved(sellerId: string, productId: string, productName: string): Promise<void> {
    await this.createNotification(
      sellerId,
      'Product Approved',
      `Your product "${productName}" has been approved and is now live`,
      'product',
      productId
    );
  }

  async notifyProductRejected(sellerId: string, productId: string, productName: string): Promise<void> {
    await this.createNotification(
      sellerId,
      'Product Rejected',
      `Your product "${productName}" needs revision`,
      'product',
      productId
    );
  }

  async notifySellerApplicationApproved(userId: string): Promise<void> {
    await this.createNotification(
      userId,
      'Seller Application Approved',
      'Congratulations! Your seller application has been approved. You can now start selling.',
      'seller_application'
    );
  }

  async notifySellerApplicationRejected(userId: string): Promise<void> {
    await this.createNotification(
      userId,
      'Seller Application Update',
      'Your seller application has been reviewed. Please check your application status.',
      'seller_application'
    );
  }

  async notifyNewMessage(userId: string, senderName: string, chatId: string): Promise<void> {
    await this.createNotification(
      userId,
      'New Message',
      `You have a new message from ${senderName}`,
      'chat',
      chatId
    );
  }
}
