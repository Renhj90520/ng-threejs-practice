import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CityExplorationComponent } from './city-exploration.component';

describe('CityExplorationComponent', () => {
  let component: CityExplorationComponent;
  let fixture: ComponentFixture<CityExplorationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CityExplorationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CityExplorationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
