import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SellerApplicationsPageRoutingModule } from './seller-applications-routing.module';

import { SellerApplicationsPage } from './seller-applications.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SellerApplicationsPageRoutingModule,
    SellerApplicationsPage
  ]
})
export class SellerApplicationsPageModule {}
