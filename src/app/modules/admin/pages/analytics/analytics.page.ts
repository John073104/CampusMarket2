import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { OrderService } from '../../../../services/order.service';
import { ProductService } from '../../../../services/product.service';
import { UserService } from '../../../../services/user.service';
import { Order } from '../../../../models/order.model';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AnalyticsPage implements OnInit {
  loading = true;
  
  stats = {
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    ordersToday: 0,
    revenueToday: 0,
    pendingProducts: 0
  };
  
  recentOrders: Order[] = [];

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private userService: UserService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadAnalytics();
  }

  async loadAnalytics() {
    this.loading = true;
    try {
      // Load platform statistics
      const [platformStats, users, products, allOrders] = await Promise.all([
        this.orderService.getPlatformStats(),
        this.userService.getAllUsers(),
        this.productService.getAllProducts(),
        this.orderService.getAllOrders()
      ]);

      this.stats.totalUsers = users.length;
      this.stats.totalProducts = products.filter(p => p.approved).length;
      this.stats.pendingProducts = products.filter(p => !p.approved).length;
      this.stats.totalOrders = platformStats.totalOrders;
      this.stats.totalRevenue = platformStats.totalRevenue;
      this.stats.ordersToday = platformStats.ordersToday;
      this.stats.revenueToday = platformStats.revenueToday;

      // Get recent orders (last 5)
      this.recentOrders = allOrders.slice(0, 5);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }
}
