import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LandingPage {
  showMobileMenu = false;

  constructor(private router: Router) {}

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
}