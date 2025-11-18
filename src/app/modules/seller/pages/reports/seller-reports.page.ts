import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { OrderService } from 'src/app/services/order.service';
import { ProductService } from 'src/app/services/product.service';
import { AuthService } from 'src/app/services/auth.service';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

Chart.register(...registerables);

@Component({
  selector: 'app-seller-reports',
  templateUrl: './seller-reports.page.html',
  styleUrls: ['./seller-reports.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SellerReportsPage implements OnInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  @ViewChild('productChart') productChartRef!: ElementRef;
  @ViewChild('statusChart') statusChartRef!: ElementRef;
  @ViewChild('reportContent') reportContent!: ElementRef;

  salesChart: Chart | null = null;
  productChart: Chart | null = null;
  statusChart: Chart | null = null;

  loading = false;
  sellerId = '';

  stats = {
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0
  };

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private authService: AuthService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.sellerId = user.userId!;
      await this.loadReports();
    }
  }

  async loadReports() {
    this.loading = true;
    try {
      await Promise.all([
        this.loadStats(),
        this.loadSalesChart(),
        this.loadProductChart(),
        this.loadStatusChart()
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load reports',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  async loadStats() {
    try {
      const orders = await this.orderService.getOrdersBySeller(this.sellerId);
      const products = await this.productService.getProductsBySeller(this.sellerId);

      this.stats.totalOrders = orders.length;
      this.stats.totalProducts = products.length;

      this.stats.totalSales = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      this.stats.completedOrders = orders.filter(o => o.status === 'completed').length;
      this.stats.pendingOrders = orders.filter(o => o.status === 'placed').length;
      this.stats.cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadSalesChart() {
    try {
      const orders = await this.orderService.getOrdersBySeller(this.sellerId);
      
      const salesByDate = new Map<string, number>();
      orders.forEach(order => {
        if (order.status === 'completed' && order.createdAt) {
          const date = new Date(order.createdAt.toDate()).toLocaleDateString();
          salesByDate.set(date, (salesByDate.get(date) || 0) + (order.totalPrice || 0));
        }
      });

      const sortedDates = Array.from(salesByDate.keys()).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
      );

      setTimeout(() => {
        if (this.salesChartRef) {
          if (this.salesChart) this.salesChart.destroy();
          
          const ctx = this.salesChartRef.nativeElement.getContext('2d');
          this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: sortedDates,
              datasets: [{
                label: 'Sales (₱)',
                data: sortedDates.map(date => salesByDate.get(date) || 0),
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: { display: true, text: 'Your Sales Over Time' }
              },
              scales: { y: { beginAtZero: true } }
            }
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error loading sales chart:', error);
    }
  }

  async loadProductChart() {
    try {
      const products = await this.productService.getProductsBySeller(this.sellerId);
      const orders = await this.orderService.getOrdersBySeller(this.sellerId);

      const salesByProduct = new Map<string, number>();
      orders.forEach(order => {
        if (order.status === 'completed') {
          order.items.forEach(item => {
            salesByProduct.set(
              item.productName, 
              (salesByProduct.get(item.productName) || 0) + (item.price * item.quantity)
            );
          });
        }
      });

      const topProducts = Array.from(salesByProduct.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      setTimeout(() => {
        if (this.productChartRef) {
          if (this.productChart) this.productChart.destroy();
          
          const ctx = this.productChartRef.nativeElement.getContext('2d');
          this.productChart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: topProducts.map(p => p[0]),
              datasets: [{
                label: 'Revenue (₱)',
                data: topProducts.map(p => p[1]),
                backgroundColor: '#4caf50'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: { display: true, text: 'Top 10 Products by Revenue' }
              },
              scales: { y: { beginAtZero: true } }
            }
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error loading product chart:', error);
    }
  }

  async loadStatusChart() {
    try {
      const orders = await this.orderService.getOrdersBySeller(this.sellerId);
      
      const statusCount = {
        placed: 0,
        confirmed: 0,
        ready_for_pickup: 0,
        completed: 0,
        cancelled: 0
      };

      orders.forEach(order => {
        const status = order.status || 'placed';
        if (status in statusCount) {
          (statusCount as any)[status]++;
        }
      });

      setTimeout(() => {
        if (this.statusChartRef) {
          if (this.statusChart) this.statusChart.destroy();
          
          const ctx = this.statusChartRef.nativeElement.getContext('2d');
          this.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['Placed', 'Confirmed', 'Ready for Pickup', 'Completed', 'Cancelled'],
              datasets: [{
                data: [
                  statusCount.placed,
                  statusCount.confirmed,
                  statusCount.ready_for_pickup,
                  statusCount.completed,
                  statusCount.cancelled
                ],
                backgroundColor: ['#ff9800', '#2196f3', '#9c27b0', '#4caf50', '#f44336']
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Order Status' }
              }
            }
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error loading status chart:', error);
    }
  }

  async exportPDF() {
    this.loading = true;
    try {
      const element = this.reportContent.nativeElement;
      const canvas = await html2canvas(element, { scale: 2, logging: false });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Seller-Report-${new Date().toLocaleDateString()}.pdf`);

      const toast = await this.toastController.create({
        message: 'Report exported successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      const toast = await this.toastController.create({
        message: 'Failed to export PDF',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  async refreshReports() {
    await this.loadReports();
  }

  ngOnDestroy() {
    if (this.salesChart) this.salesChart.destroy();
    if (this.productChart) this.productChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
  }
}
