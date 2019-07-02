import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatterJsComponent } from './matter-js.component';

describe('MatterJsComponent', () => {
  let component: MatterJsComponent;
  let fixture: ComponentFixture<MatterJsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MatterJsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatterJsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
