import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

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

  constructor() {}

  ngOnInit() {}
}
