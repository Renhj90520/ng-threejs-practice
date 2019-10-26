import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CrystalSphereComponent } from './crystal-sphere.component';

describe('CrystalSphereComponent', () => {
  let component: CrystalSphereComponent;
  let fixture: ComponentFixture<CrystalSphereComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CrystalSphereComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CrystalSphereComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
