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
    console.log('🚀 View initialized');
    // Wait longer for Ionic to fully render the view
    setTimeout(() => {
      this.checkAndLoadReports();
    }, 800);
  }

  ionViewDidEnter() {
    console.log('🚀 View entered');
    // Only reload if charts don't exist
    setTimeout(() => {
      if (!this.salesChart || !this.categoryChart || !this.topSellersChart || !this.statusChart) {
        console.log('⚠️ Charts missing, reloading...');
        this.checkAndLoadReports();
      }
    }, 500);
  }

  private checkAndLoadReports() {
    // Verify all canvas elements exist before attempting to load
    const salesCanvas = this.salesChartRef?.nativeElement;
    const categoryCanvas = this.categoryChartRef?.nativeElement;
    const topSellersCanvas = this.topSellersChartRef?.nativeElement;
    const statusCanvas = this.statusChartRef?.nativeElement;

    console.log('Canvas elements check:', {
      salesCanvas: !!salesCanvas,
      categoryCanvas: !!categoryCanvas,
      topSellersCanvas: !!topSellersCanvas,
      statusCanvas: !!statusCanvas
    });

    if (!salesCanvas || !categoryCanvas || !topSellersCanvas || !statusCanvas) {
      console.error('❌ Some canvas elements not found, retrying in 1 second...');
      setTimeout(() => this.checkAndLoadReports(), 1000);
      return;
    }

    console.log('✅ All canvas elements found, loading reports...');
    this.loadReports();
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
    console.log('📊 Starting loadReports...');
    this.loading = true;
    
    try {
      // Load stats first
      await this.loadStats();
      console.log('✅ Stats loaded');
      
      // Load all charts with delays between each
      await new Promise(resolve => setTimeout(resolve, 250));
      await this.loadSalesChart();
      
      await new Promise(resolve => setTimeout(resolve, 250));
      await this.loadCategoryChart();
      
      await new Promise(resolve => setTimeout(resolve, 250));
      await this.loadTopSellersChart();
      
      await new Promise(resolve => setTimeout(resolve, 250));
      await this.loadStatusChart();
      
      // Force final update after all charts loaded
      await new Promise(resolve => setTimeout(resolve, 300));
      this.forceChartsUpdate();
      
      console.log('✅✅✅ ALL CHARTS LOADED SUCCESSFULLY ✅✅✅');
    } catch (error) {
      console.error('❌❌❌ Error loading reports:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load reports. Click refresh to try again.',
        duration: 4000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.loading = false;
      // One more update after loading state changes
      setTimeout(() => {
        this.forceChartsUpdate();
        console.log('🔄 Final chart update completed');
      }, 300);
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
      console.log('🔥 Loading Sales Chart...');
      
      const canvas = this.salesChartRef?.nativeElement;
      if (!canvas) {
        console.error('❌ Sales canvas not found');
        return;
      }
      
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
            borderColor: '#2dd36f',
            backgroundColor: 'rgba(45, 211, 111, 0.2)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#2dd36f',
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
      console.log('✅ Sales chart created successfully');
    } catch (error) {
      console.error('❌ Sales chart error:', error);
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
      console.log('🔥 Loading Category Chart...');

      if (!this.categoryChartRef?.nativeElement) {
        console.error('❌ Category canvas not found');
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
              '#2dd36f',
              '#3dc2ff',
              '#1aa051',
              '#0d8fd9',
              '#47e095',
              '#5fc8f5',
              '#2dd36f',
              '#3dc2ff',
              '#1aa051',
              '#0d8fd9'
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
      console.log('✅ Category chart created successfully');
    } catch (error) {
      console.error('❌ Category chart error:', error);
    }
  }

  async loadTopSellersChart() {
    try {
      console.log('🔥 Loading Top Sellers Chart...');

      if (!this.topSellersChartRef?.nativeElement) {
        console.error('❌ Top sellers canvas not found');
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
            backgroundColor: '#3dc2ff',
            borderColor: '#0d8fd9',
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
      console.log('✅ Top sellers chart created successfully');
    } catch (error) {
      console.error('❌ Top sellers chart error:', error);
    }
  }

  async loadStatusChart() {
    try {
      console.log('🔥 Loading Status Chart...');

      if (!this.statusChartRef?.nativeElement) {
        console.error('❌ Status canvas not found');
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
              '#3dc2ff',
              '#2dd36f',
              '#5fc8f5',
              '#47e095',
              '#1aa051'
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
      console.log('✅ Status chart created successfully');
    } catch (error) {
      console.error('❌ Status chart error:', error);
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
    console.log('🔄 Manually refreshing reports...');
    
    const toast = await this.toastController.create({
      message: '🔄 Refreshing charts...',
      duration: 1500,
      color: 'primary',
      position: 'top'
    });
    await toast.present();
    
    this.destroyAllCharts();
    await new Promise(resolve => setTimeout(resolve, 300));
    await this.loadReports();
    
    const successToast = await this.toastController.create({
      message: '✅ Charts refreshed successfully!',
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await successToast.present();
  }

  ngOnDestroy() {
    if (this.salesChart) this.salesChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.topSellersChart) this.topSellersChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
  }
}
