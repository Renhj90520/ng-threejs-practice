import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HoverEffectComponent } from './hover-effect.component';

describe('HoverEffectComponent', () => {
  let component: HoverEffectComponent;
  let fixture: ComponentFixture<HoverEffectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HoverEffectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HoverEffectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
