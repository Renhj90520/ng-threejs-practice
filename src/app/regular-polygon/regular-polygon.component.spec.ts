import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegularPolygonComponent } from './regular-polygon.component';

describe('RegularPolygonComponent', () => {
  let component: RegularPolygonComponent;
  let fixture: ComponentFixture<RegularPolygonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RegularPolygonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegularPolygonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
