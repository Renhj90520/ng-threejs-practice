import { NgModule } from "@angular/core";
import { RouterModule, Routes, Router } from "@angular/router";
import { LaunchitEarthComponent } from "./launchit-earth/launchit-earth.component";
import { GalleryComponent } from "./gallery/gallery.component";
import { VrSonicComponent } from "./vr-sonic/vr-sonic.component";
import { SpaceGridComponent } from "./space-grid/space-grid.component";
import { FlexwareComponent } from "./flexware/flexware.component";
import { GrassComponent } from "./grass/grass.component";
import { CascadeComponent } from "./cascade/cascade.component";
import { CascadeGraphComponent } from "./cascade-graph/cascade-graph.component";
import { GravityArrowsComponent } from "./gravity-arrows/gravity-arrows.component";
import { CityExplorationComponent } from "./city-exploration/city-exploration.component";
import { MetaballsComponent } from "./metaballs/metaballs.component";
import { PointsInGridComponent } from "./points-in-grid/points-in-grid.component";
import { ScalesComponent } from "./scales/scales.component";
import { SminCircleComponent } from "./smin-circle/smin-circle.component";
import { GlobeCloudComponent } from "./globe-cloud/globe-cloud.component";
import { FireworksComponent } from "./fireworks/fireworks.component";
import { RushingRapidComponent } from "./rushing-rapid/rushing-rapid.component";
import { PrintingComponent } from "./printing/printing.component";
import { SphereSliceComponent } from "./sphere-slice/sphere-slice.component";
import { PeriodicTableComponent } from "./periodic-table/periodic-table.component";
import { ChasingBezierComponent } from "./chasing-bezier/chasing-bezier.component";
import { BubblesComponent } from "./bubbles/bubbles.component";
import { ConfettiComponent } from "./confetti/confetti.component";
import { AnimatedTextComponent } from "./animated-text/animated-text.component";
import { IconsThreedComponent } from "./icons-threed/icons-threed.component";
import { HoverExplodeComponent } from "./hover-explode/hover-explode.component";

const routes: Routes = [
  {
    path: "",
    component: GalleryComponent
  },
  { path: "launchit", component: LaunchitEarthComponent },
  { path: "vrsonic", component: VrSonicComponent },
  { path: "spacegrid", component: SpaceGridComponent },
  { path: "flexware", component: FlexwareComponent },
  { path: "grass", component: GrassComponent },
  { path: "cascade", component: CascadeComponent },
  { path: "cascadeg", component: CascadeGraphComponent },
  { path: "gravityarrows", component: GravityArrowsComponent },
  { path: "cityexploration", component: CityExplorationComponent },
  { path: "metaballs", component: MetaballsComponent },
  { path: "pointsgrid", component: PointsInGridComponent },
  { path: "scales", component: ScalesComponent },
  { path: "smincircle", component: SminCircleComponent },
  { path: "fireworks", component: FireworksComponent },
  { path: "rushingrapid", component: RushingRapidComponent },
  { path: "printing", component: PrintingComponent },
  { path: "sphereslice", component: SphereSliceComponent },
  { path: "periodictable", component: PeriodicTableComponent },
  { path: "chasingbezier", component: ChasingBezierComponent },
  { path: "bubbles", component: BubblesComponent },
  { path: "confetti", component: ConfettiComponent },
  { path: "animatedtext", component: AnimatedTextComponent },
  { path: "icons", component: IconsThreedComponent },
  { path: "explode", component: HoverExplodeComponent }
];
@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
