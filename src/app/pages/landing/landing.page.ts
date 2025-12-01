import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LandingPage implements OnInit {
  showMobileMenu = false;
  activeUsers = 0;
  productsSold = 0;
  loading = true;

  constructor(
    private router: Router,
    private userService: UserService,
    private orderService: OrderService
  ) {}

  async ngOnInit() {
    await this.loadStats();
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToSignup() {
    this.router.navigate(['/auth/signup']);
  }

  goToInitDemo() {
    this.router.navigate(['/init-demo']);
  }

  async loadStats() {
    try {
      this.loading = true;
      
      // Get active users count
      const users = await this.userService.getAllUsers();
      this.activeUsers = users.length;
      
      // Get completed orders count
      const allOrders = await this.orderService.getAllOrders();
      this.productsSold = allOrders.filter((o: any) => o.status === 'completed').length;
      
    } catch (error) {
      console.error('Error loading landing stats:', error);
      this.activeUsers = 0;
      this.productsSold = 0;
    } finally {
      this.loading = false;
    }
  }
}