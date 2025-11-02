import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ApplySellerPage } from './apply-seller.page';

const routes: Routes = [
  {
    path: '',
    component: ApplySellerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ApplySellerPageRoutingModule {}
