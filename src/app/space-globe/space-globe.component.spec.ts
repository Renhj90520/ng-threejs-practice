import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceGlobeComponent } from './space-globe.component';

describe('SpaceGlobeComponent', () => {
  let component: SpaceGlobeComponent;
  let fixture: ComponentFixture<SpaceGlobeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpaceGlobeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceGlobeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
