import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WebglGalaxyComponent } from './webgl-galaxy/webgl-galaxy.component';

@NgModule({
  declarations: [AppComponent, WebglGalaxyComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
