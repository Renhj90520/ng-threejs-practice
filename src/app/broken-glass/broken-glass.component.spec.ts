import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokenGlassComponent } from './broken-glass.component';

describe('BrokenGlassComponent', () => {
  let component: BrokenGlassComponent;
  let fixture: ComponentFixture<BrokenGlassComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrokenGlassComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrokenGlassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
