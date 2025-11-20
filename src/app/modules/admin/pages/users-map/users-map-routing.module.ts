import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UsersMapPage } from './users-map.page';

const routes: Routes = [
  {
    path: '',
    component: UsersMapPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsersMapPageRoutingModule {}
