import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChasingBezierComponent } from './chasing-bezier.component';

describe('ChasingBezierComponent', () => {
  let component: ChasingBezierComponent;
  let fixture: ComponentFixture<ChasingBezierComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChasingBezierComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChasingBezierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
