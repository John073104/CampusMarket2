import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { OrderService } from '../../../../services/order.service';
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
  filteredOrders: Order[] = [];
  loading: boolean = false;
  selectedStatus: string = 'all';
  searchTerm: string = '';

  constructor(private orderService: OrderService) { }

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    this.loading = true;
    try {
      this.orders = await this.orderService.getAllOrders();
      this.filterOrders();
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      this.loading = false;
    }
  }

  filterOrders() {
    this.filteredOrders = this.orders.filter(order => {
      const matchesStatus = this.selectedStatus === 'all' || order.status === this.selectedStatus;
      const matchesSearch = order.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           order.sellerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           order.orderId?.includes(this.searchTerm);
      return matchesStatus && matchesSearch;
    });
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'placed': 'primary',
      'confirmed': 'secondary',
      'ready_for_pickup': 'success',
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

