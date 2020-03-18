import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { WebglGalaxyComponent } from './webgl-galaxy/webgl-galaxy.component';
import { ProceduralCityComponent } from './procedural-city/procedural-city.component';
import { EndlessTerrainComponent } from './endless-terrain/endless-terrain.component';
import { WindmillObjMtlComponent } from './windmill-obj-mtl/windmill-obj-mtl.component';
import { LaunchitEarthComponent } from './launchit-earth/launchit-earth.component';
import { AppRoutingModule } from './app-routing.module';
import { GalleryComponent } from './gallery/gallery.component';
import { MatterJsComponent } from './matter-js/matter-js.component';
import { LabeledGridComponent } from './labeled-grid/labeled-grid.component';
import { GltfLoaderComponent } from './gltf-loader/gltf-loader.component';
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
import { ModuloCheckerboardComponent } from './modulo-checkerboard/modulo-checkerboard.component';
import { RegularPolygonComponent } from './regular-polygon/regular-polygon.component';
import { FireworksComponent } from './fireworks/fireworks.component';
import { RushingRapidComponent } from './rushing-rapid/rushing-rapid.component';
import { PrintingComponent } from './printing/printing.component';
import { SphereSliceComponent } from './sphere-slice/sphere-slice.component';
import { PeriodicTableComponent } from './periodic-table/periodic-table.component';
import { SphereShaderComponent } from './sphere-shader/sphere-shader.component';
import { CrystalSphereComponent } from './crystal-sphere/crystal-sphere.component';
import { ChasingBezierComponent } from './chasing-bezier/chasing-bezier.component';
import { BubblesComponent } from './bubbles/bubbles.component';
import { ConfettiComponent } from './confetti/confetti.component';
import { AnimatedTextComponent } from './animated-text/animated-text.component';
import { IconsThreedComponent } from './icons-threed/icons-threed.component';
import { HoverExplodeComponent } from './hover-explode/hover-explode.component';
import { RenderTargetComponent } from './render-target/render-target.component';
import { BreatheComponent } from './breathe/breathe.component';
import { CarPresenterComponent } from './car-presenter/car-presenter.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoaderService } from './car-presenter/loader.service';
import { LoaderInterceptor } from './car-presenter/loader-interceptor';
import { ShowroomComponent } from './showroom/showroom.component';
import { HeatmapDrawComponent } from './heatmap-draw/heatmap-draw.component';
import { ValveDrawComponent } from './heatmap-draw/valve-draw/valve-draw.component';
import { CloudTemperatureComponent } from './heatmap-draw/cloud-temperature/cloud-temperature.component';
import { VisualmapComponent } from './heatmap-draw/visualmap/visualmap.component';

@NgModule({
  declarations: [
    AppComponent,
    WebglGalaxyComponent,
    ProceduralCityComponent,
    EndlessTerrainComponent,
    WindmillObjMtlComponent,
    LaunchitEarthComponent,
    GalleryComponent,
    MatterJsComponent,
    LabeledGridComponent,
    GltfLoaderComponent,
    VrSonicComponent,
    SpaceGridComponent,
    FlexwareComponent,
    GrassComponent,
    CascadeComponent,
    CascadeGraphComponent,
    GravityArrowsComponent,
    CityExplorationComponent,
    MetaballsComponent,
    PointsInGridComponent,
    ScalesComponent,
    SminCircleComponent,
    GlobeCloudComponent,
    ModuloCheckerboardComponent,
    RegularPolygonComponent,
    FireworksComponent,
    RushingRapidComponent,
    PrintingComponent,
    SphereSliceComponent,
    PeriodicTableComponent,
    SphereShaderComponent,
    CrystalSphereComponent,
    ChasingBezierComponent,
    BubblesComponent,
    ConfettiComponent,
    CarPresenterComponent,
    AnimatedTextComponent,
    IconsThreedComponent,
    HoverExplodeComponent,
    RenderTargetComponent,
    BreatheComponent,
    ShowroomComponent,
    HeatmapDrawComponent,
    ValveDrawComponent,
    CloudTemperatureComponent,
    VisualmapComponent
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule],
  providers: [
    LoaderService,
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
