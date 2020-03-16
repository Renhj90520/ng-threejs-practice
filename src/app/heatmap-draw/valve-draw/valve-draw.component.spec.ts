import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ValveDrawComponent } from './valve-draw.component';

describe('ValveDrawComponent', () => {
  let component: ValveDrawComponent;
  let fixture: ComponentFixture<ValveDrawComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ValveDrawComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValveDrawComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
