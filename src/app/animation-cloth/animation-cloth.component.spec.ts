import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimationClothComponent } from './animation-cloth.component';

describe('AnimationClothComponent', () => {
  let component: AnimationClothComponent;
  let fixture: ComponentFixture<AnimationClothComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnimationClothComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnimationClothComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
