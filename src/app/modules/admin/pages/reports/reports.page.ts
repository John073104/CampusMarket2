import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
export class ReportsPage implements OnInit, AfterViewInit {
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
    console.log('Reports page initialized');
  }

  ngAfterViewInit() {
    console.log('View initialized, loading reports...');
    // Immediate load without delay
    this.loadReports();
  }

  ionViewDidEnter() {
    console.log('View entered, ensuring charts render...');
    // Force reload and render on each view enter
    if (!this.loading) {
      this.loadReports();
    }
  }

  private refreshCharts() {
    // Trigger window resize to force charts to render
    window.dispatchEvent(new Event('resize'));
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

      // If no data, use sample data for demo
      if (sortedDates.length === 0) {
        console.warn('No sales data available, using sample data');
        sortedDates.push('No data');
        data.push(0);
      }

      console.log('Creating sales chart...', !!this.salesChartRef);
      if (!this.salesChartRef || !this.salesChartRef.nativeElement) {
        console.error('Sales chart canvas not found');
        return;
      }
      
      if (this.salesChart) {
        console.log('Destroying existing sales chart');
        this.salesChart.destroy();
        this.salesChart = null;
      }
      
      const canvas = this.salesChartRef.nativeElement;
      canvas.width = canvas.offsetWidth;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2d context for sales chart');
        return;
      }
      
      console.log('Rendering sales chart with', sortedDates.length, 'data points');
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
            title: { 
              display: true, 
              text: 'Sales Over Time',
              font: { size: 16, weight: 'bold' }
            }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
      console.log('Sales chart created successfully');
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

      // If no data, use sample data for demo
      if (categories.length === 0) {
        console.warn('No category data available, using sample data');
        categories.push('No products');
        counts.push(0);
      }

      console.log('Creating category chart...', !!this.categoryChartRef);
      if (!this.categoryChartRef || !this.categoryChartRef.nativeElement) {
        console.error('Category chart canvas not found');
        return;
      }
      
      if (this.categoryChart) {
        console.log('Destroying existing category chart');
        this.categoryChart.destroy();
        this.categoryChart = null;
      }
      
      const canvas = this.categoryChartRef.nativeElement;
      canvas.width = canvas.offsetWidth;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2d context for category chart');
        return;
      }
      
      console.log('Rendering category chart with', categories.length, 'categories');
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
            title: { 
              display: true, 
              text: 'Products by Category',
              font: { size: 16, weight: 'bold' }
            }
          }
        }
      });
      console.log('Category chart created successfully');
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

      // If no data, use sample data for demo
      if (topSellers.length === 0) {
        console.warn('No seller data available, using sample data');
        topSellers.push({ name: 'No sellers', total: 0 });
      }

      console.log('Creating top sellers chart...', !!this.topSellersChartRef);
      if (!this.topSellersChartRef || !this.topSellersChartRef.nativeElement) {
        console.error('Top sellers chart canvas not found');
        return;
      }
      
      if (this.topSellersChart) {
        console.log('Destroying existing top sellers chart');
        this.topSellersChart.destroy();
        this.topSellersChart = null;
      }
      
      const canvas = this.topSellersChartRef.nativeElement;
      canvas.width = canvas.offsetWidth;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2d context for top sellers chart');
        return;
      }
      
      console.log('Rendering top sellers chart with', topSellers.length, 'sellers');
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
            title: { 
              display: true, 
              text: 'Top 10 Sellers',
              font: { size: 16, weight: 'bold' }
            }
          },
          scales: {
            x: { beginAtZero: true }
          }
        }
      });
      console.log('Top sellers chart created successfully');
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

      console.log('Creating status chart...', !!this.statusChartRef);
      if (!this.statusChartRef || !this.statusChartRef.nativeElement) {
        console.error('Status chart canvas not found');
        return;
      }
      
      if (this.statusChart) {
        console.log('Destroying existing status chart');
        this.statusChart.destroy();
        this.statusChart = null;
      }
      
      const canvas = this.statusChartRef.nativeElement;
      canvas.width = canvas.offsetWidth;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2d context for status chart');
        return;
      }
      
      console.log('Rendering status chart');
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
            title: { 
              display: true, 
              text: 'Order Status Breakdown',
              font: { size: 16, weight: 'bold' }
            }
          }
        }
      });
      console.log('Status chart created successfully');
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
    // Force charts to re-render after data refresh
    setTimeout(() => {
      this.refreshCharts();
    }, 500);
  }

  ngOnDestroy() {
    if (this.salesChart) this.salesChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.topSellersChart) this.topSellersChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
  }
}
