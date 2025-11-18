import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-admin-tabs',
  templateUrl: './admin-tabs.page.html',
  styleUrls: ['./admin-tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class AdminTabsPage implements OnInit {
  pendingApplications = 0;
  pendingProducts = 0;

  constructor() {}

  ngOnInit() {}
}
