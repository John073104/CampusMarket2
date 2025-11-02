import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { initAllDemoUsers } from '../../utils/init-demo-users';

@Component({
  selector: 'app-init-demo',
  templateUrl: './init-demo.page.html',
  styleUrls: ['./init-demo.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class InitDemoPage implements OnInit {
  isInitializing = false;
  logs: string[] = [];
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  ngOnInit() {
    this.logs.push('Ready to initialize demo users');
  }

  async initializeUsers() {
    this.isInitializing = true;
    this.status = 'loading';
    this.logs = [];
    this.logs.push('🚀 Starting demo user initialization...');

    try {
      await initAllDemoUsers(this.auth, this.firestore);
      this.logs.push('✅ All demo users created successfully!');
      this.logs.push('');
      this.logs.push('You can now login with:');
      this.logs.push('👤 Admin: admin@campus.com / admin123');
      this.logs.push('🛍️ Seller: seller@campus.com / seller123');
      this.logs.push('🛒 Customer: customer@campus.com / customer123');
      this.status = 'success';
    } catch (error: any) {
      this.logs.push(`❌ Error: ${error.message}`);
      this.status = 'error';
    }

    this.isInitializing = false;
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToLanding() {
    this.router.navigate(['/landing']);
  }
}
