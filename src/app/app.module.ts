import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WebglGalaxyComponent } from './webgl-galaxy/webgl-galaxy.component';
import { ProceduralCityComponent } from './procedural-city/procedural-city.component';
import { EndlessTerrainComponent } from './endless-terrain/endless-terrain.component';

@NgModule({
  declarations: [AppComponent, WebglGalaxyComponent, ProceduralCityComponent, EndlessTerrainComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
