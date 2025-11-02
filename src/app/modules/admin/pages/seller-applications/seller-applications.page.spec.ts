import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SellerApplicationsPage } from './seller-applications.page';

describe('SellerApplicationsPage', () => {
  let component: SellerApplicationsPage;
  let fixture: ComponentFixture<SellerApplicationsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SellerApplicationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
