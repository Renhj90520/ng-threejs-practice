import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselOglComponent } from './carousel-ogl.component';

describe('CarouselOglComponent', () => {
  let component: CarouselOglComponent;
  let fixture: ComponentFixture<CarouselOglComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CarouselOglComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CarouselOglComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
