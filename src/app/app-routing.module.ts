import { NgModule } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { LaunchitEarthComponent } from './launchit-earth/launchit-earth.component';
import { GalleryComponent } from './gallery/gallery.component';
import { VrSonicComponent } from './vr-sonic/vr-sonic.component';
import { SpaceGridComponent } from './space-grid/space-grid.component';
import { FlexwareComponent } from './flexware/flexware.component';
import { GrassComponent } from './grass/grass.component';
import { CascadeComponent } from './cascade/cascade.component';
import { CascadeGraphComponent } from './cascade-graph/cascade-graph.component';
import { GravityArrowsComponent } from './gravity-arrows/gravity-arrows.component';
import { CityExplorationComponent } from './city-exploration/city-exploration.component';
import { MetaballsComponent } from './metaballs/metaballs.component';
import { PointsInGridComponent } from './points-in-grid/points-in-grid.component';
import { ScalesComponent } from './scales/scales.component';
import { SminCircleComponent } from './smin-circle/smin-circle.component';
import { GlobeCloudComponent } from './globe-cloud/globe-cloud.component';

const routes: Routes = [
  {
    path: '',
    component: GalleryComponent
  },
  { path: 'launchit', component: LaunchitEarthComponent },
  { path: 'vrsonic', component: VrSonicComponent },
  { path: 'spacegrid', component: SpaceGridComponent },
  { path: 'flexware', component: FlexwareComponent },
  { path: 'grass', component: GrassComponent },
  { path: 'cascade', component: CascadeComponent },
  { path: 'cascadeg', component: CascadeGraphComponent },
  { path: 'gravityarrows', component: GravityArrowsComponent },
  { path: 'cityexploration', component: CityExplorationComponent },
  { path: 'metaballs', component: MetaballsComponent },
  { path: 'pointsgrid', component: PointsInGridComponent },
  { path: 'scales', component: ScalesComponent },
  { path: 'smincircle', component: SminCircleComponent }
];
@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
