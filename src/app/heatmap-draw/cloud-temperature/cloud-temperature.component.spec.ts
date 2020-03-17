import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudTemperatureComponent } from './cloud-temperature.component';

describe('CloudTemperatureComponent', () => {
  let component: CloudTemperatureComponent;
  let fixture: ComponentFixture<CloudTemperatureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudTemperatureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudTemperatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
