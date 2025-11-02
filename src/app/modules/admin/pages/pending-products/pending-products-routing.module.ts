import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PendingProductsPage } from './pending-products.page';

const routes: Routes = [
  {
    path: '',
    component: PendingProductsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PendingProductsPageRoutingModule {}
