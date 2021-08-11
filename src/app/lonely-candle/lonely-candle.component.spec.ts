import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LonelyCandleComponent } from './lonely-candle.component';

describe('LonelyCandleComponent', () => {
  let component: LonelyCandleComponent;
  let fixture: ComponentFixture<LonelyCandleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LonelyCandleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LonelyCandleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
