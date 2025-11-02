import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InitDemoPage } from './init-demo.page';

describe('InitDemoPage', () => {
  let component: InitDemoPage;
  let fixture: ComponentFixture<InitDemoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InitDemoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
