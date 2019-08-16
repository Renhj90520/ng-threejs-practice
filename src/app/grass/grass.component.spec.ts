import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GrassComponent } from './grass.component';

describe('GrassComponent', () => {
  let component: GrassComponent;
  let fixture: ComponentFixture<GrassComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GrassComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GrassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
