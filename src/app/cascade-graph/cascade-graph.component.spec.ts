import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CascadeGraphComponent } from './cascade-graph.component';

describe('CascadeGraphComponent', () => {
  let component: CascadeGraphComponent;
  let fixture: ComponentFixture<CascadeGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CascadeGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CascadeGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
