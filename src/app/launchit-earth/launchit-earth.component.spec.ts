import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LaunchitEarthComponent } from './launchit-earth.component';

describe('LaunchitEarthComponent', () => {
  let component: LaunchitEarthComponent;
  let fixture: ComponentFixture<LaunchitEarthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LaunchitEarthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LaunchitEarthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
