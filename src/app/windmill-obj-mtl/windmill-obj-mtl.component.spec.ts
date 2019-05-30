import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WindmillObjMtlComponent } from './windmill-obj-mtl.component';

describe('WindmillObjMtlComponent', () => {
  let component: WindmillObjMtlComponent;
  let fixture: ComponentFixture<WindmillObjMtlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WindmillObjMtlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WindmillObjMtlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
