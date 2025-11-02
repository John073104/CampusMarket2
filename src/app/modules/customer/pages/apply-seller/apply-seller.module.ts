import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ApplySellerPageRoutingModule } from './apply-seller-routing.module';

import { ApplySellerPage } from './apply-seller.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ApplySellerPageRoutingModule,
    ApplySellerPage
  ]
})
export class ApplySellerPageModule {}
