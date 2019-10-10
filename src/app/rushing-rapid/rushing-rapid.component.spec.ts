import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RushingRapidComponent } from './rushing-rapid.component';

describe('RushingRapidComponent', () => {
  let component: RushingRapidComponent;
  let fixture: ComponentFixture<RushingRapidComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RushingRapidComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RushingRapidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
