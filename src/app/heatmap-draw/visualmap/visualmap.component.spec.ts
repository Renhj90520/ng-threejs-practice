import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualmapComponent } from './visualmap.component';

describe('VisualmapComponent', () => {
  let component: VisualmapComponent;
  let fixture: ComponentFixture<VisualmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VisualmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
