import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-customer-tabs',
  templateUrl: './customer-tabs.page.html',
  styleUrls: ['./customer-tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class CustomerTabsPage implements OnInit {
  unreadMessages = 0;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // TODO: Get unread message count
  }
}
