import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SphereShaderComponent } from './sphere-shader.component';

describe('SphereShaderComponent', () => {
  let component: SphereShaderComponent;
  let fixture: ComponentFixture<SphereShaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SphereShaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SphereShaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
