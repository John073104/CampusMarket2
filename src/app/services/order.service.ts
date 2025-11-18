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
    deliveryInfo?: {
      name: string;
      phone: string;
      address: string;
      paymentMethod: string;
    },
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
      pickupLocation: deliveryInfo?.address || pickupLocation,
      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Creating order document...', newOrder);
    const docRef = await addDoc(
      collection(this.firestore, 'orders'), 
      newOrder
    );
    console.log('Order document created:', docRef.id);
    
    // Run notifications and analytics in background (non-blocking)
    Promise.all([
      this.notificationService.notifyOrderPlaced(sellerId, docRef.id, customerName)
        .catch(err => console.error('Notification error:', err)),
      this.apiIntegrationService.trackOrderPlaced(docRef.id, totalPrice, customerId)
        .catch(err => console.error('Analytics error:', err))
    ]);
    
    console.log('Order created successfully:', docRef.id);
    return docRef.id;
  }

  // Get orders by customer
  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(this.firestore, 'orders'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      console.log('Customer orders found:', snapshot.size);
      return snapshot.docs.map(doc => ({
        orderId: doc.id,
        ...doc.data()
      } as Order));
    } catch (error: any) {
      console.warn('Composite index not available for customer orders, using fallback...', error);
      // Fallback: Query without orderBy
      const fallbackQuery = query(
        collection(this.firestore, 'orders'),
        where('customerId', '==', customerId)
      );
      
      const snapshot = await getDocs(fallbackQuery);
      const orders = snapshot.docs.map(doc => ({
        orderId: doc.id,
        ...doc.data()
      } as Order));
      
      // Sort manually by createdAt
      orders.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      
      console.log('Customer orders (fallback):', orders.length);
      return orders;
    }
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

      // Decrease stock when order is completed
      if (status === 'completed') {
        await this.decreaseProductStock(order.items);
      }

      // Send SMS for important status changes
      if (status === 'ready_for_pickup' && order.pickupLocation) {
        // TODO: Get customer phone number from user service
        // await this.apiIntegrationService.sendOrderReadySMS(customerPhone, orderId, order.pickupLocation);
      }
    }
  }

  // Decrease product stock after successful delivery
  private async decreaseProductStock(items: OrderItem[]): Promise<void> {
    try {
      const updatePromises = items.map(async (item) => {
        const productRef = doc(this.firestore, 'products', item.productId);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          const currentStock = productDoc.data()['stock'] || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          
          await updateDoc(productRef, {
            stock: newStock,
            updatedAt: serverTimestamp()
          });
          
          console.log(`Stock updated for ${item.productName}: ${currentStock} -> ${newStock}`);
        }
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error decreasing product stock:', error);
      // Don't throw error to prevent order status update from failing
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
