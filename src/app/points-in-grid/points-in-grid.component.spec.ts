import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PointsInGridComponent } from './points-in-grid.component';

describe('PointsInGridComponent', () => {
  let component: PointsInGridComponent;
  let fixture: ComponentFixture<PointsInGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PointsInGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PointsInGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
