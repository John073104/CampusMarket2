import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PendingProductsPageRoutingModule } from './pending-products-routing.module';

import { PendingProductsPage } from './pending-products.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PendingProductsPageRoutingModule,
    PendingProductsPage
  ]
})
export class PendingProductsPageModule {}
