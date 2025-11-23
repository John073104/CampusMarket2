import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { OrderService } from '../../../../services/order.service';
import { AuthService } from '../../../../services/auth.service';
import { Order, OrderStatus } from '../../../../models/order.model';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class OrdersPage implements OnInit {
  orders: Order[] = [];
  loading: boolean = false;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadOrders();
  }

  ionViewWillEnter() {
    this.loadOrders();
  }

  async loadOrders() {
    this.loading = true;
    try {
      const user = this.authService.getCurrentUser();
      if (user && user.userId) {
        console.log('Loading orders for seller:', user.userId);
        try {
          this.orders = await this.orderService.getOrdersBySeller(user.userId);
          console.log('Loaded orders:', this.orders.length);
        } catch (error: any) {
          console.warn('Error loading orders, retrying...', error);
          // Retry once after a short delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.orders = await this.orderService.getOrdersBySeller(user.userId);
          console.log('Loaded orders (retry):', this.orders.length);
        }
      } else {
        console.error('No user found');
        this.orders = [];
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      this.orders = [];
    } finally {
      this.loading = false;
    }
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    try {
      await this.orderService.updateOrderStatus(orderId, status);
      this.loadOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  viewOrderDetail(orderId: string) {
    this.router.navigate(['/seller/order-detail', orderId]);
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'placed': 'primary',
      'confirmed': 'secondary',
      'preparing': 'warning',
      'ready': 'success',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'medium';
  }

  formatDate(timestamp: any): string {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return 'N/A';
  }

  getOrderItemsDisplay(order: Order): string {
    if (order.items.length === 1) {
      const item = order.items[0];
      const productName = item.productName;
      // Check if product name looks valid (not empty, not just seller name)
      if (productName && productName.trim().length > 0) {
        return `${productName} × ${item.quantity}`;
      }
      return `Product × ${item.quantity}`;
    }
    return `${order.items.length} items`;
  }
}

