import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SminCircleComponent } from './smin-circle.component';

describe('SminCircleComponent', () => {
  let component: SminCircleComponent;
  let fixture: ComponentFixture<SminCircleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SminCircleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SminCircleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
