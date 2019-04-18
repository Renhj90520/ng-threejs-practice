import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndlessTerrainComponent } from './endless-terrain.component';

describe('EndlessTerrainComponent', () => {
  let component: EndlessTerrainComponent;
  let fixture: ComponentFixture<EndlessTerrainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EndlessTerrainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndlessTerrainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
