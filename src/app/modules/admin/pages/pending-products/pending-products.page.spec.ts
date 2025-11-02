import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PendingProductsPage } from './pending-products.page';

describe('PendingProductsPage', () => {
  let component: PendingProductsPage;
  let fixture: ComponentFixture<PendingProductsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingProductsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
