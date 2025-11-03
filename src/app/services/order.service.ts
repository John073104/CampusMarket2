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
  orderBy,
  serverTimestamp,
  Timestamp
} from '@angular/fire/firestore';
import { Order, OrderItem, OrderStatus } from '../models/order.model';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { ApiIntegrationService } from './api-integration.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(
    private firestore: Firestore,
    private notificationService: NotificationService,
    private apiIntegrationService: ApiIntegrationService
  ) {}

  // Create new order
  async createOrder(
    customerId: string,
    customerName: string,
    sellerId: string,
    sellerName: string,
    items: OrderItem[],
    totalPrice: number,
    pickupLocation?: string,
    notes?: string
  ): Promise<string> {
    const newOrder: Omit<Order, 'orderId'> = {
      customerId,
      customerName,
      sellerId,
      sellerName,
      items,
      totalPrice,
      status: 'placed',
      pickupLocation,
      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(
      collection(this.firestore, 'orders'), 
      newOrder
    );
    
    // Notify seller about new order
    await this.notificationService.notifyOrderPlaced(sellerId, docRef.id, customerName);
    
    // Track order analytics
    await this.apiIntegrationService.trackOrderPlaced(docRef.id, totalPrice, customerId);
    
    return docRef.id;
  }

  // Get orders by customer
  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const q = query(
      collection(this.firestore, 'orders'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      orderId: doc.id,
      ...doc.data()
    } as Order));
  }

  // Get orders by seller
  async getOrdersBySeller(sellerId: string): Promise<Order[]> {
    const q = query(
      collection(this.firestore, 'orders'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      orderId: doc.id,
      ...doc.data()
    } as Order));
  }

  // Get all orders (Admin)
  async getAllOrders(): Promise<Order[]> {
    const q = query(
      collection(this.firestore, 'orders'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      orderId: doc.id,
      ...doc.data()
    } as Order));
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order | null> {
    const orderDoc = await getDoc(doc(this.firestore, 'orders', orderId));
    return orderDoc.exists() ? {
      orderId: orderDoc.id,
      ...orderDoc.data()
    } as Order : null;
  }

  // Update order status
  async updateOrderStatus(
    orderId: string, 
    status: OrderStatus
  ): Promise<void> {
    // Get order details first
    const order = await this.getOrderById(orderId);
    
    await updateDoc(doc(this.firestore, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp()
    });

    // Notify customer about status change
    if (order) {
      await this.notificationService.notifyOrderStatusChanged(
        order.customerId,
        orderId,
        status
      );

      // Send SMS for important status changes
      if (status === 'ready_for_pickup' && order.pickupLocation) {
        // TODO: Get customer phone number from user service
        // await this.apiIntegrationService.sendOrderReadySMS(customerPhone, orderId, order.pickupLocation);
      }
    }
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'cancelled');
  }

  // Get order statistics for seller
  async getSellerStats(sellerId: string): Promise<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  }> {
    const orders = await this.getOrdersBySeller(sellerId);
    
    return {
      totalOrders: orders.length,
      totalRevenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalPrice, 0),
      pendingOrders: orders.filter(o => 
        ['placed', 'confirmed', 'ready_for_pickup'].includes(o.status)
      ).length,
      completedOrders: orders.filter(o => o.status === 'completed').length
    };
  }

  // Get platform statistics (Admin)
  async getPlatformStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    ordersToday: number;
    revenueToday: number;
  }> {
    const orders = await this.getAllOrders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersToday = orders.filter(o => {
      const orderDate = (o.createdAt as Timestamp).toDate();
      return orderDate >= today;
    });

    return {
      totalOrders: orders.length,
      totalRevenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalPrice, 0),
      ordersToday: ordersToday.length,
      revenueToday: ordersToday
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalPrice, 0)
    };
  }
}
