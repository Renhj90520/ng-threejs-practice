import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobeCloudComponent } from './globe-cloud.component';

describe('GlobeCloudComponent', () => {
  let component: GlobeCloudComponent;
  let fixture: ComponentFixture<GlobeCloudComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GlobeCloudComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GlobeCloudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
