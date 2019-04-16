import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProceduralCityComponent } from './procedural-city.component';

describe('ProceduralCityComponent', () => {
  let component: ProceduralCityComponent;
  let fixture: ComponentFixture<ProceduralCityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProceduralCityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProceduralCityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
