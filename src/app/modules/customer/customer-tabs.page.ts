import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-tabs',
  templateUrl: './customer-tabs.page.html',
  styleUrls: ['./customer-tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class CustomerTabsPage implements OnInit {
  unreadMessages = 0;

  private _unreadSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.updateUnread(user.userId);
      // poll every 10 seconds
      const sub = interval(10000).subscribe(() => this.updateUnread(user.userId));
      // keep subscription in case we add cleanup later
      (this as any)._unreadSub = sub as Subscription;
    }
  }

  private async updateUnread(userId: string) {
    try {
      const count = await this.notificationService.getUnreadCount(userId);
      this.unreadMessages = count;
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }

  ngOnDestroy(): void {
    if (this._unreadSub) this._unreadSub.unsubscribe();
  }
}
