import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BeatingHeartComponent } from './beating-heart.component';

describe('BeatingHeartComponent', () => {
  let component: BeatingHeartComponent;
  let fixture: ComponentFixture<BeatingHeartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BeatingHeartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BeatingHeartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
