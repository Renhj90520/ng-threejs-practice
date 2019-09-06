import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GravityArrowsComponent } from './gravity-arrows.component';

describe('GravityArrowsComponent', () => {
  let component: GravityArrowsComponent;
  let fixture: ComponentFixture<GravityArrowsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GravityArrowsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GravityArrowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
