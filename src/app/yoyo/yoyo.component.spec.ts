import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YoyoComponent } from './yoyo.component';

describe('YoyoComponent', () => {
  let component: YoyoComponent;
  let fixture: ComponentFixture<YoyoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YoyoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YoyoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
