import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
import { OrderService } from 'src/app/services/order.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-seller-tabs',
  templateUrl: './seller-tabs.page.html',
  styleUrls: ['./seller-tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SellerTabsPage implements OnInit {
  unreadMessages = 0;
  pendingOrders = 0;

  private _pollSub?: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.updateCounts(user.userId);
      this._pollSub = interval(10000).subscribe(() => this.updateCounts(user.userId));
    }
  }

  private async updateCounts(userId: string) {
    try {
      const unread = await this.notificationService.getUnreadCount(userId);
      this.unreadMessages = unread;
    } catch (err) {
      console.error('Failed to get unread notifications:', err);
    }

    try {
      const stats = await this.orderService.getSellerStats(userId);
      this.pendingOrders = stats.pendingOrders;
    } catch (err) {
      console.error('Failed to get seller stats:', err);
    }
  }

  ngOnDestroy(): void {
    if (this._pollSub) this._pollSub.unsubscribe();
  }
}
