import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaballsComponent } from './metaballs.component';

describe('MetaballsComponent', () => {
  let component: MetaballsComponent;
  let fixture: ComponentFixture<MetaballsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetaballsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaballsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
