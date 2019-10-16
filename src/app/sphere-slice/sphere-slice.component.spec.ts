import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SphereSliceComponent } from './sphere-slice.component';

describe('SphereSliceComponent', () => {
  let component: SphereSliceComponent;
  let fixture: ComponentFixture<SphereSliceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SphereSliceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SphereSliceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
