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
    console.log('🚀 View initialized, loading reports...');
    // Delay to ensure canvas elements are fully rendered
    setTimeout(() => {
      this.loadReports();
    }, 400);
  }

  ionViewDidEnter() {
    console.log('🚀 View entered, ensuring charts render...');
    // Only load if charts don't exist
    if (!this.salesChart && !this.categoryChart) {
      setTimeout(() => {
        this.loadReports();
      }, 300);
    }
  }

  private destroyAllCharts() {
    if (this.salesChart) {
      this.salesChart.destroy();
      this.salesChart = null;
    }
    if (this.categoryChart) {
      this.categoryChart.destroy();
      this.categoryChart = null;
    }
    if (this.topSellersChart) {
      this.topSellersChart.destroy();
      this.topSellersChart = null;
    }
    if (this.statusChart) {
      this.statusChart.destroy();
      this.statusChart = null;
    }
  }

  private refreshCharts() {
    // Trigger window resize to force charts to render
    window.dispatchEvent(new Event('resize'));
  }

  async loadReports() {
    this.loading = true;
    try {
      // Load stats first
      await this.loadStats();
      
      // Wait a bit then load charts sequentially
      await new Promise(resolve => setTimeout(resolve, 150));
      await this.loadSalesChart();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      await this.loadCategoryChart();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      await this.loadTopSellersChart();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      await this.loadStatusChart();
      
      // Force final update after all charts loaded
      await new Promise(resolve => setTimeout(resolve, 300));
      this.forceChartsUpdate();
      
      console.log('✅ ALL CHARTS LOADED');
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
      // One more update after loading state changes
      setTimeout(() => this.forceChartsUpdate(), 100);
    }
  }
  
  private forceChartsUpdate() {
    try {
      if (this.salesChart) {
        this.salesChart.resize();
        this.salesChart.update('none');
      }
      if (this.categoryChart) {
        this.categoryChart.resize();
        this.categoryChart.update('none');
      }
      if (this.topSellersChart) {
        this.topSellersChart.resize();
        this.topSellersChart.update('none');
      }
      if (this.statusChart) {
        this.statusChart.resize();
        this.statusChart.update('none');
      }
      window.dispatchEvent(new Event('resize'));
    } catch (e) {
      console.error('Error updating charts:', e);
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
      console.log('🔥 SALES CHART START');
      
      if (!this.salesChartRef?.nativeElement) {
        console.error('❌ Canvas not found');
        return;
      }

      const canvas = this.salesChartRef.nativeElement as HTMLCanvasElement;
      
      // FORCE CANVAS TO BE VISIBLE
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      canvas.style.opacity = '1';
      
      const parent = canvas.parentElement;
      if (parent) {
        parent.style.display = 'block';
        parent.style.height = '300px';
        parent.style.width = '100%';
      }
      
      // Set dimensions that work for both mobile and desktop
      const parentWidth = parent?.offsetWidth || 350;
      canvas.width = parentWidth > 100 ? parentWidth : 350;
      canvas.height = 300;
      canvas.style.width = '100%';
      canvas.style.height = '300px';
      
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        console.error('❌ No context');
        return;
      }
      
      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Destroy existing chart
      if (this.salesChart) {
        this.salesChart.destroy();
        this.salesChart = null;
      }

      // GET REAL DATA FROM DATABASE
      const orders = await this.orderService.getAllOrders();
      const last7Days = this.getLast7Days();
      const salesByDay = last7Days.map(date => {
        const dayOrders = orders.filter((o: any) => {
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
            borderColor: '#ffc409',
            backgroundColor: 'rgba(255, 196, 9, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#ffc409',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 800
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: { color: '#000', font: { size: 12, weight: 'bold' } }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: '#000', font: { size: 11 } },
              grid: { color: 'rgba(0,0,0,0.1)' }
            },
            x: {
              ticks: { color: '#000', font: { size: 11 } },
              grid: { display: false }
            }
          }
        }
      });

      this.salesChart.update();
      console.log('✅ SALES CHART CREATED WITH REAL DATA');
    } catch (error) {
      console.error('❌ SALES CHART ERROR:', error);
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

  async loadCategoryChart() {
    try {
      console.log('🔥 CATEGORY CHART START');

      if (!this.categoryChartRef?.nativeElement) {
        console.error('❌ Canvas not found');
        return;
      }

      const canvas = this.categoryChartRef.nativeElement as HTMLCanvasElement;
      
      // FORCE CANVAS TO BE VISIBLE
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      canvas.style.opacity = '1';
      
      const parent = canvas.parentElement;
      if (parent) {
        parent.style.display = 'block';
        parent.style.height = '300px';
        parent.style.width = '100%';
      }
      
      const parentWidth = parent?.offsetWidth || 350;
      canvas.width = parentWidth > 100 ? parentWidth : 350;
      canvas.height = 300;
      canvas.style.width = '100%';
      canvas.style.height = '300px';
      
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        console.error('❌ No context');
        return;
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (this.categoryChart) {
        this.categoryChart.destroy();
        this.categoryChart = null;
      }

      // GET REAL DATA FROM DATABASE
      const products = await this.productService.getAllProducts();
      const categoryCount: { [key: string]: number } = {};
      products.forEach((p: any) => {
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
              '#ffc409',
              '#eb445a',
              '#3dc2ff',
              '#2dd36f',
              '#ffc409',
              '#92949c',
              '#c5cae9',
              '#a5d6a7',
              '#ffccbc',
              '#ce93d8'
            ],
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 15
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 800
          },
          plugins: {
            legend: {
              display: true,
              position: 'right',
              labels: {
                color: '#000',
                font: { size: 11 },
                padding: 15,
                usePointStyle: true
              }
            }
          }
        }
      });

      this.categoryChart.update();
      console.log('✅ CATEGORY CHART CREATED WITH REAL DATA');
    } catch (error) {
      console.error('❌ CATEGORY CHART ERROR:', error);
    }
  }

  async loadTopSellersChart() {
    try {
      console.log('🔥 TOP SELLERS CHART START');

      if (!this.topSellersChartRef?.nativeElement) {
        console.error('❌ Canvas not found');
        return;
      }

      const canvas = this.topSellersChartRef.nativeElement as HTMLCanvasElement;
      
      // FORCE CANVAS TO BE VISIBLE
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      canvas.style.opacity = '1';
      
      const parent = canvas.parentElement;
      if (parent) {
        parent.style.display = 'block';
        parent.style.height = '300px';
        parent.style.width = '100%';
      }
      
      const parentWidth = parent?.offsetWidth || 350;
      canvas.width = parentWidth > 100 ? parentWidth : 350;
      canvas.height = 300;
      canvas.style.width = '100%';
      canvas.style.height = '300px';
      
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        console.error('❌ No context');
        return;
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (this.topSellersChart) {
        this.topSellersChart.destroy();
        this.topSellersChart = null;
      }

      // GET REAL DATA FROM DATABASE
      const orders = await this.orderService.getAllOrders();
      const sellerSales: { [key: string]: number } = {};
      
      orders.filter((o: any) => o.status === 'completed').forEach((o: any) => {
        const sellerId = o.sellerId || 'Unknown';
        sellerSales[sellerId] = (sellerSales[sellerId] || 0) + (o.totalPrice || 0);
      });

      const sortedSellers = Object.entries(sellerSales)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10);

      const users = await this.userService.getAllUsers();
      const sellerNames = sortedSellers.map(([id]) => {
        const user: any = users.find((u: any) => u.uid === id);
        return user?.displayName || user?.email?.split('@')[0] || 'Seller';
      });
      const sellerTotals = sortedSellers.map(([, total]) => total);

      this.topSellersChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sellerNames,
          datasets: [{
            label: 'Total Sales (₱)',
            data: sellerTotals,
            backgroundColor: '#2dd36f',
            borderColor: '#1aa051',
            borderWidth: 2,
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 800
          },
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { color: '#000', font: { size: 11 } },
              grid: { color: 'rgba(0,0,0,0.1)' }
            },
            y: {
              ticks: { color: '#000', font: { size: 11, weight: 'bold' } },
              grid: { display: false }
            }
          }
        }
      });

      this.topSellersChart.update();
      console.log('✅ TOP SELLERS CHART CREATED WITH REAL DATA');
    } catch (error) {
      console.error('❌ TOP SELLERS CHART ERROR:', error);
    }
  }

  async loadStatusChart() {
    try {
      console.log('🔥 STATUS CHART START');

      if (!this.statusChartRef?.nativeElement) {
        console.error('❌ Canvas not found');
        return;
      }

      const canvas = this.statusChartRef.nativeElement as HTMLCanvasElement;
      
      // FORCE CANVAS TO BE VISIBLE
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      canvas.style.opacity = '1';
      
      const parent = canvas.parentElement;
      if (parent) {
        parent.style.display = 'block';
        parent.style.height = '300px';
        parent.style.width = '100%';
      }
      
      const parentWidth = parent?.offsetWidth || 350;
      canvas.width = parentWidth > 100 ? parentWidth : 350;
      canvas.height = 300;
      canvas.style.width = '100%';
      canvas.style.height = '300px';
      
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        console.error('❌ No context');
        return;
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (this.statusChart) {
        this.statusChart.destroy();
        this.statusChart = null;
      }

      // GET REAL DATA FROM DATABASE
      const orders = await this.orderService.getAllOrders();
      const statusCount = {
        placed: orders.filter((o: any) => o.status === 'placed').length,
        confirmed: orders.filter((o: any) => o.status === 'confirmed').length,
        ready: orders.filter((o: any) => o.status === 'ready_for_pickup').length,
        completed: orders.filter((o: any) => o.status === 'completed').length,
        cancelled: orders.filter((o: any) => o.status === 'cancelled').length
      };

      this.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Placed', 'Confirmed', 'Ready for Pickup', 'Completed', 'Cancelled'],
          datasets: [{
            data: [
              statusCount.placed,
              statusCount.confirmed,
              statusCount.ready,
              statusCount.completed,
              statusCount.cancelled
            ],
            backgroundColor: [
              '#ffc409',
              '#3dc2ff',
              '#a966ff',
              '#2dd36f',
              '#eb445a'
            ],
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 20
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 800
          },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                color: '#000',
                font: { size: 11 },
                padding: 15,
                usePointStyle: true
              }
            }
          }
        }
      });

      this.statusChart.update();
      console.log('✅ STATUS CHART CREATED WITH REAL DATA');
    } catch (error) {
      console.error('❌ STATUS CHART ERROR:', error);
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
    console.log('🔄 Refreshing reports...');
    this.destroyAllCharts();
    await this.loadReports();
  }

  ngOnDestroy() {
    if (this.salesChart) this.salesChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.topSellersChart) this.topSellersChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
  }
}
