import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { OrderService } from '../../../../services/order.service';
import { ProductService } from '../../../../services/product.service';
import { UserService } from '../../../../services/user.service';
import { Order } from '../../../../models/order.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AnalyticsPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('salesChart', { static: false }) salesChartRef!: ElementRef;
  @ViewChild('categoryChart', { static: false }) categoryChartRef!: ElementRef;

  salesChart: Chart | null = null;
  categoryChart: Chart | null = null;
  loading = true;
  chartsReady = false;
  
  // Pre-loaded data for charts
  private allOrders: any[] = [];
  private allProducts: any[] = [];
  
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

  // Use inject() for proper Angular injection context
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private userService = inject(UserService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    // Only load data in ngOnInit, NOT charts
    await this.loadAnalytics();
  }

  ngAfterViewInit() {
    // Wait for Ionic to fully render the view
    // This ensures canvas elements are in DOM before we try to access them
    setTimeout(() => {
      this.initializeChartsWhenReady();
    }, 100);
  }

  ionViewDidEnter() {
    // Only reinitialize if charts were destroyed or never created
    if (!this.chartsReady && !this.loading) {
      setTimeout(() => {
        this.initializeChartsWhenReady();
      }, 100);
    }
  }

  private initializeChartsWhenReady() {
    // Verify canvas elements exist before proceeding
    const salesCanvas = this.salesChartRef?.nativeElement;
    const categoryCanvas = this.categoryChartRef?.nativeElement;

    if (!salesCanvas || !categoryCanvas) {
      console.warn('⚠️ Canvas elements not ready, waiting...');
      return;
    }

    console.log('✅ Canvas elements ready, initializing charts');
    this.chartsReady = true;
    this.loadCharts();
  }

  async loadAnalytics() {
    this.loading = true;
    try {
      // Load platform statistics and cache data for charts
      const [platformStats, users, products, allOrders] = await Promise.all([
        this.orderService.getPlatformStats(),
        this.userService.getAllUsers(),
        this.productService.getAllProducts(),
        this.orderService.getAllOrders()
      ]);

      // Cache data for chart rendering
      this.allOrders = allOrders;
      this.allProducts = products;

      this.stats.totalUsers = users.length;
      this.stats.totalProducts = products.filter((p: any) => p.approved).length;
      this.stats.pendingProducts = products.filter((p: any) => !p.approved).length;
      this.stats.totalOrders = platformStats.totalOrders;
      this.stats.totalRevenue = platformStats.totalRevenue;
      this.stats.ordersToday = platformStats.ordersToday;
      this.stats.revenueToday = platformStats.revenueToday;

      // Get recent orders (last 5)
      this.recentOrders = allOrders.slice(0, 5);

      console.log('✅ Analytics data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadCharts() {
    if (!this.chartsReady) {
      console.warn('⚠️ Charts not ready yet');
      return;
    }

    try {
      // Use cached data instead of making new Firebase calls
      await this.loadSalesChart();
      await this.loadCategoryChart();
      console.log('✅ Charts loaded successfully');
    } catch (error) {
      console.error('❌ Error loading charts:', error);
    }
  }

  async loadSalesChart() {
    try {
      console.log('📊 Initializing Sales Chart...');
      
      const canvas = this.salesChartRef?.nativeElement;
      if (!canvas) {
        console.error('❌ Sales canvas not found');
        return;
      }
      
      // Ensure canvas is visible
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      const parent = canvas.parentElement;
      if (parent) {
        parent.style.display = 'block';
        parent.style.height = '250px';
      }
      
      canvas.width = parent?.offsetWidth || 350;
      canvas.height = 250;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart
      if (this.salesChart) {
        this.salesChart.destroy();
        this.salesChart = null;
      }

      // Use cached data - NO Firebase calls here
      const last7Days = this.getLast7Days();
      const salesByDay = last7Days.map(date => {
        const dayOrders = this.allOrders.filter((o: any) => {
          const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
          return orderDate.toDateString() === date.toDateString() && o.status === 'completed';
        });
        return dayOrders.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
      });

      this.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' })),
          datasets: [{
            label: 'Sales (₱)',
            data: salesByDay,
            borderColor: '#2dd36f',
            backgroundColor: 'rgba(45, 211, 111, 0.2)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: '#2dd36f'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: { color: '#000', font: { size: 12 } }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: '#000' },
              grid: { color: 'rgba(0,0,0,0.1)' }
            },
            x: {
              ticks: { color: '#000' },
              grid: { display: false }
            }
          }
        }
      });

      this.salesChart.update();
      console.log('✅ Sales chart created');
    } catch (error) {
      console.error('❌ Sales chart error:', error);
    }
  }

  async loadCategoryChart() {
    try {
      console.log('📊 Initializing Category Chart...');

      const canvas = this.categoryChartRef?.nativeElement;
      if (!canvas) {
        console.error('❌ Category canvas not found');
        return;
      }
      
      // Ensure canvas is visible
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      const parent = canvas.parentElement;
      if (parent) {
        parent.style.display = 'block';
        parent.style.height = '250px';
      }
      
      canvas.width = parent?.offsetWidth || 350;
      canvas.height = 250;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart
      if (this.categoryChart) {
        this.categoryChart.destroy();
        this.categoryChart = null;
      }

      // Use cached data - NO Firebase calls here
      const categoryCount: { [key: string]: number } = {};
      this.allProducts.forEach((p: any) => {
        const cat = p.category || 'Other';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const categories = Object.keys(categoryCount);
      const counts = Object.values(categoryCount);

      this.categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: categories,
          datasets: [{
            data: counts,
            backgroundColor: [
              '#2dd36f',
              '#3dc2ff',
              '#ffc409',
              '#eb445a',
              '#92949c',
              '#5260ff',
              '#1aa051',
              '#0d8fd9',
              '#ffab00',
              '#c5000f'
            ],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'right',
              labels: {
                color: '#000',
                font: { size: 10 },
                padding: 10,
                usePointStyle: true
              }
            }
          }
        }
      });

      this.categoryChart.update();
      console.log('✅ Category chart created');
    } catch (error) {
      console.error('❌ Category chart error:', error);
    }
  }

  private getLast7Days(): Date[] {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  }

  goBack() {
    this.router.navigate(['/admin/dashboard']);
  }

  ngOnDestroy() {
    console.log('🧹 Cleaning up charts...');
    if (this.salesChart) {
      this.salesChart.destroy();
      this.salesChart = null;
    }
    if (this.categoryChart) {
      this.categoryChart.destroy();
      this.categoryChart = null;
    }
    this.chartsReady = false;
  }
}
