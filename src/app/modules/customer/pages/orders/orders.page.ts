import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { OrderService } from '../../../../services/order.service';
import { AuthService } from '../../../../services/auth.service';
import { Order } from '../../../../models/order.model';

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
  selectedStatus: string = 'all';

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    this.loading = true;
    try {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.orders = await this.orderService.getOrdersByCustomer(user.userId!);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      this.loading = false;
    }
  }

  getFilteredOrders(): Order[] {
    if (this.selectedStatus === 'all') {
      return this.orders;
    }
    return this.orders.filter(order => order.status === this.selectedStatus);
  }

  viewOrderDetail(orderId: string) {
    this.router.navigate(['/customer/order-detail', orderId]);
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
}

