import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HoverExplodeComponent } from './hover-explode.component';

describe('HoverExplodeComponent', () => {
  let component: HoverExplodeComponent;
  let fixture: ComponentFixture<HoverExplodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HoverExplodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HoverExplodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
