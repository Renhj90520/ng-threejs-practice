import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebglGalaxyComponent } from './webgl-galaxy.component';

describe('WebglGalaxyComponent', () => {
  let component: WebglGalaxyComponent;
  let fixture: ComponentFixture<WebglGalaxyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebglGalaxyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebglGalaxyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
