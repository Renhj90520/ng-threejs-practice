import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VrSonicComponent } from './vr-sonic.component';

describe('VrSonicComponent', () => {
  let component: VrSonicComponent;
  let fixture: ComponentFixture<VrSonicComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VrSonicComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VrSonicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
