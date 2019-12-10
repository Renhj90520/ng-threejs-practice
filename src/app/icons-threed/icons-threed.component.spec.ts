import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IconsThreedComponent } from './icons-threed.component';

describe('IconsThreedComponent', () => {
  let component: IconsThreedComponent;
  let fixture: ComponentFixture<IconsThreedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IconsThreedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IconsThreedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
