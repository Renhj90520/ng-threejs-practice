import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CarPresenterComponent } from './car-presenter.component';

describe('CarPresenterComponent', () => {
  let component: CarPresenterComponent;
  let fixture: ComponentFixture<CarPresenterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CarPresenterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CarPresenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
