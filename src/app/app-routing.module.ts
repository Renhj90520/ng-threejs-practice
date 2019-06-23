import { NgModule } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { LaunchitEarthComponent } from './launchit-earth/launchit-earth.component';
import { GalleryComponent } from './gallery/gallery.component';

const routes: Routes = [
  {
    path: '',
    component: GalleryComponent
  },
  { path: 'launchit', component: LaunchitEarthComponent }
];
@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
