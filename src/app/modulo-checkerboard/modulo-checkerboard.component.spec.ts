import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuloCheckerboardComponent } from './modulo-checkerboard.component';

describe('ModuloCheckerboardComponent', () => {
  let component: ModuloCheckerboardComponent;
  let fixture: ComponentFixture<ModuloCheckerboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModuloCheckerboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModuloCheckerboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
