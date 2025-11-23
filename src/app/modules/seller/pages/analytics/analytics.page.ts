import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { OrderService } from '../../../../services/order.service';
import { ProductService } from '../../../../services/product.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AnalyticsPage implements OnInit {
  loading: boolean = true;
  
  stats = {
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    activeProducts: 0,
    pendingOrders: 0,
    completedOrders: 0
  };

  recentOrders: any[] = [];

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    await this.loadAnalytics();
  }

  ionViewWillEnter() {
    this.loadAnalytics();
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'placed': 'warning',
      'confirmed': 'primary',
      'ready_for_pickup': 'secondary',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return colors[status] || 'medium';
  }

  async loadAnalytics() {
    this.loading = true;
    try {
      const user = this.authService.getCurrentUser();
      if (!user) return;

      // Get seller orders
      const orders = await this.orderService.getOrdersBySeller(user.userId!);
      
      // Calculate stats
      this.stats.totalOrders = orders.length;
      this.stats.totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalPrice, 0);
      this.stats.pendingOrders = orders.filter(o => 
        o.status === 'placed' || o.status === 'confirmed'
      ).length;
      this.stats.completedOrders = orders.filter(o => 
        o.status === 'completed'
      ).length;

      // Get recent orders (last 5)
      this.recentOrders = orders
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, 5);

      // Get products
      const products = await this.productService.getProductsBySeller(user.userId!);
      this.stats.totalProducts = products.length;
      this.stats.activeProducts = products.filter(p => p.approved).length;

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      this.loading = false;
    }
  }

  async doRefresh(event: any) {
    await this.loadAnalytics();
    event.target.complete();
  }
}

