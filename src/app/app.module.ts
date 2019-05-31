import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WebglGalaxyComponent } from './webgl-galaxy/webgl-galaxy.component';
import { ProceduralCityComponent } from './procedural-city/procedural-city.component';
import { EndlessTerrainComponent } from './endless-terrain/endless-terrain.component';
import { WindmillObjMtlComponent } from './windmill-obj-mtl/windmill-obj-mtl.component';
import { LaunchitEarthComponent } from './launchit-earth/launchit-earth.component';

@NgModule({
  declarations: [AppComponent, WebglGalaxyComponent, ProceduralCityComponent, EndlessTerrainComponent, WindmillObjMtlComponent, LaunchitEarthComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
