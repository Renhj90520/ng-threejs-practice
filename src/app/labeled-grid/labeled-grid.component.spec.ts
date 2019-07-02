import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LabeledGridComponent } from './labeled-grid.component';

describe('LabeledGridComponent', () => {
  let component: LabeledGridComponent;
  let fixture: ComponentFixture<LabeledGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LabeledGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LabeledGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
