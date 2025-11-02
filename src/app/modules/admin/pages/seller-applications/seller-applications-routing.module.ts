import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SellerApplicationsPage } from './seller-applications.page';

const routes: Routes = [
  {
    path: '',
    component: SellerApplicationsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SellerApplicationsPageRoutingModule {}
