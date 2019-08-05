import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceGridComponent } from './space-grid.component';

describe('SpaceGridComponent', () => {
  let component: SpaceGridComponent;
  let fixture: ComponentFixture<SpaceGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpaceGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
