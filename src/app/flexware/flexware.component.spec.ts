import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FlexwareComponent } from './flexware.component';

describe('FlexwareComponent', () => {
  let component: FlexwareComponent;
  let fixture: ComponentFixture<FlexwareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FlexwareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlexwareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
