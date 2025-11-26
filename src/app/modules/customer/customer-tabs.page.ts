import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
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
    private chatService: ChatService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.updateUnread(user.userId);
      // poll every 5 seconds for real-time updates
      const sub = interval(5000).subscribe(() => this.updateUnread(user.userId));
      this._unreadSub = sub as Subscription;
    }
  }

  ionViewWillEnter() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.updateUnread(user.userId);
    }
  }

  private async updateUnread(userId: string) {
    try {
      // Fix unread counts first (in background)
      this.chatService.fixUnreadCounts(userId)
        .catch(err => console.warn('Could not fix unread counts:', err));
      
      // Get accurate unread count from chat service
      const count = await this.chatService.getTotalUnreadCount(userId);
      this.unreadMessages = count;
      console.log('Customer tab - unread messages:', count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
      this.unreadMessages = 0;
    }
  }

  ngOnDestroy(): void {
    if (this._unreadSub) this._unreadSub.unsubscribe();
  }
}
