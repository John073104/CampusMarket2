import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { OrderService } from 'src/app/services/order.service';
import { ProductService } from 'src/app/services/product.service';
import { UserService } from 'src/app/services/user.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

Chart.register(...registerables);

interface SalesData {
  date: string;
  total: number;
}

interface CategoryData {
  category: string;
  count: number;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ReportsPage implements OnInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef;
  @ViewChild('topSellersChart') topSellersChartRef!: ElementRef;
  @ViewChild('statusChart') statusChartRef!: ElementRef;
  @ViewChild('reportContent') reportContent!: ElementRef;

  salesChart: Chart | null = null;
  categoryChart: Chart | null = null;
  topSellersChart: Chart | null = null;
  statusChart: Chart | null = null;

  loading = false;
  dateRange = {
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  stats = {
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0
  };

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private userService: UserService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Don't load here, wait for ionViewDidEnter
  }

  ionViewDidEnter() {
    this.loadReports();
  }

  async loadReports() {
    this.loading = true;
    try {
      await Promise.all([
        this.loadStats(),
        this.loadSalesChart(),
        this.loadCategoryChart(),
        this.loadTopSellersChart(),
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
      const orders = await this.orderService.getAllOrders();
      const products = await this.productService.getAllProducts();
      const users = await this.userService.getAllUsers();

      this.stats.totalOrders = orders.length;
      this.stats.totalProducts = products.length;
      this.stats.totalUsers = users.length;

      this.stats.totalSales = orders
        .filter((o: any) => o.status === 'completed')
        .reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);

      this.stats.completedOrders = orders.filter((o: any) => o.status === 'completed').length;
      this.stats.pendingOrders = orders.filter((o: any) => o.status === 'placed').length;
      this.stats.cancelledOrders = orders.filter((o: any) => o.status === 'cancelled').length;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadSalesChart() {
    try {
      const orders = await this.orderService.getAllOrders();
      
      // Group orders by date
      const salesByDate = new Map<string, number>();
      orders.forEach((order: any) => {
        if (order.status === 'completed' && order.createdAt) {
          const date = new Date(order.createdAt.toDate()).toLocaleDateString();
          const current = salesByDate.get(date) || 0;
          salesByDate.set(date, current + (order.totalPrice || 0));
        }
      });

      const sortedDates = Array.from(salesByDate.keys()).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
      );

      const data = sortedDates.map(date => salesByDate.get(date) || 0);

      setTimeout(() => {
        if (this.salesChartRef && this.salesChartRef.nativeElement) {
          if (this.salesChart) this.salesChart.destroy();
          
          const ctx = this.salesChartRef.nativeElement.getContext('2d');
          if (!ctx) return;
          this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: sortedDates,
              datasets: [{
                label: 'Sales (₱)',
                data: data,
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
                legend: { display: true },
                title: { display: true, text: 'Sales Over Time' }
              },
              scales: {
                y: { beginAtZero: true }
              }
            }
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error loading sales chart:', error);
    }
  }

  async loadCategoryChart() {
    try {
      const products = await this.productService.getAllProducts();
      
      const categoryCount = new Map<string, number>();
      products.forEach((product: any) => {
        const category = product.category || 'Other';
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });

      const categories = Array.from(categoryCount.keys());
      const counts = categories.map(cat => categoryCount.get(cat) || 0);

      setTimeout(() => {
        if (this.categoryChartRef && this.categoryChartRef.nativeElement) {
          if (this.categoryChart) this.categoryChart.destroy();
          
          const ctx = this.categoryChartRef.nativeElement.getContext('2d');
          if (!ctx) return;
          this.categoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
              labels: categories,
              datasets: [{
                data: counts,
                backgroundColor: [
                  '#ffc107', '#4caf50', '#2196f3', '#ff5722', '#9c27b0', '#00bcd4', '#ff9800'
                ]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right' },
                title: { display: true, text: 'Products by Category' }
              }
            }
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error loading category chart:', error);
    }
  }

  async loadTopSellersChart() {
    try {
      const orders = await this.orderService.getAllOrders();
      const users = await this.userService.getAllUsers();
      
      const salesBySeller = new Map<string, { name: string; total: number }>();
      
      orders.forEach((order: any) => {
        if (order.status === 'completed') {
          const sellerId = order.sellerId;
          const current = salesBySeller.get(sellerId) || { name: order.sellerName, total: 0 };
          current.total += order.totalPrice || 0;
          salesBySeller.set(sellerId, current);
        }
      });

      const topSellers = Array.from(salesBySeller.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      setTimeout(() => {
        if (this.topSellersChartRef && this.topSellersChartRef.nativeElement) {
          if (this.topSellersChart) this.topSellersChart.destroy();
          
          const ctx = this.topSellersChartRef.nativeElement.getContext('2d');
          if (!ctx) return;
          this.topSellersChart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: topSellers.map(s => s.name),
              datasets: [{
                label: 'Sales (₱)',
                data: topSellers.map(s => s.total),
                backgroundColor: '#4caf50'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                title: { display: true, text: 'Top 10 Sellers' }
              },
              scales: {
                x: { beginAtZero: true }
              }
            }
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error loading top sellers chart:', error);
    }
  }

  async loadStatusChart() {
    try {
      const orders = await this.orderService.getAllOrders();
      
      const statusCount = {
        placed: 0,
        confirmed: 0,
        ready_for_pickup: 0,
        completed: 0,
        cancelled: 0
      };

      orders.forEach((order: any) => {
        const status = order.status || 'placed';
        if (status in statusCount) {
          (statusCount as any)[status]++;
        }
      });

      setTimeout(() => {
        if (this.statusChartRef && this.statusChartRef.nativeElement) {
          if (this.statusChart) this.statusChart.destroy();
          
          const ctx = this.statusChartRef.nativeElement.getContext('2d');
          if (!ctx) return;
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
                title: { display: true, text: 'Order Status Breakdown' }
              }
            }
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error loading status chart:', error);
    }
  }

  async printReport() {
    window.print();
  }

  async exportPDF() {
    this.loading = true;
    try {
      // Wait for charts to fully render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const element = this.reportContent.nativeElement;
      if (!element) {
        throw new Error('Report content not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = -pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `CampusMarket-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      const toast = await this.toastController.create({
        message: '📄 Report exported successfully!',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      const toast = await this.toastController.create({
        message: `Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: 3000,
        color: 'danger',
        position: 'top'
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
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.topSellersChart) this.topSellersChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
  }
}
