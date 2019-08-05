import { NgModule } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { LaunchitEarthComponent } from './launchit-earth/launchit-earth.component';
import { GalleryComponent } from './gallery/gallery.component';
import { VrSonicComponent } from './vr-sonic/vr-sonic.component';
import { SpaceGridComponent } from './space-grid/space-grid.component';

const routes: Routes = [
  {
    path: '',
    component: GalleryComponent
  },
  { path: 'launchit', component: LaunchitEarthComponent },
  { path: 'vrsonic', component: VrSonicComponent },
  { path: 'spacegrid', component: SpaceGridComponent }
];
@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
