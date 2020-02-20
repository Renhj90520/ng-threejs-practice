import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import * as THREE from 'three';
import Ground from './ground';
import CustomControls from './custom-controls';
import Stage from './stage';
import AutoCamera from './auto-camera';
import { LoaderService } from './loader.service';

@Component({
  selector: 'app-car-presenter',
  templateUrl: './car-presenter.component.html',
  styleUrls: ['./car-presenter.component.css']
})
export class CarPresenterComponent implements OnInit {
  @ViewChild('stage') stageEl;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  orbitCamera: THREE.PerspectiveCamera;
  interiorCamera: THREE.PerspectiveCamera;
  autoCamera: AutoCamera;
  transitioncamera: THREE.PerspectiveCamera;
  width;
  height;
  controls: CustomControls;

  autoOrbit = false;
  introMode = false;
  stage: Stage;

  constructor(private loaderService: LoaderService) {}

  ngOnInit() {
    this.initTHREE();
    this.loaderService.progressReport.subscribe(percent => {
      console.log(percent);
    });
    this.loaderService.onLoadFinish.subscribe(() => {
      this.initAutoCamera();
      this.initLights();
      this.initStage();
    });
    this.loaderService.load({
      models: [
        'camera_auto',
        'camera_transition',
        'exterior',
        'interior',
        'door',
        'tire',
        'rim',
        'screw',
        'logo',
        'headlights',
        'tunnel'
      ],
      textureBundles: ['car', 'env']
    });

    this.update();
  }
  initStage() {
    this.stage = new Stage(this.camera, this.renderer, this.loaderService);
    this.scene.add(this.stage);
    this.controls = this.stage.exteriorControls;
    this.stage.setMode('day');
    console.log(this.scene);
  }
  initAutoCamera() {
    this.autoCamera = new AutoCamera(
      this.width / this.height,
      this.loaderService
    );
    this.autoCamera.name = 'auto';
  }

  initLights() {
    const skyColor = 0xf0f2ef;
    const groundColor = 0x111111;
    const hemisphereLight = new THREE.HemisphereLight(
      skyColor,
      groundColor,
      0.8
    );
    this.scene.add(hemisphereLight);
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 8, 0);
    this.scene.add(spotLight);
  }
  initTHREE() {
    this.width = this.stageEl.nativeElement.clientWidth;
    this.height = this.stageEl.nativeElement.clientHeight;
    this.scene = new THREE.Scene();
    this.initOrbitCamera();
    this.camera = this.orbitCamera;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xffffff);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.stageEl.nativeElement.appendChild(this.renderer.domElement);
  }

  private initOrbitCamera() {
    this.orbitCamera = new THREE.PerspectiveCamera(
      30,
      this.width / this.height,
      0.001,
      10000
    );
    this.orbitCamera.name = 'orbit';
    this.orbitCamera.position.set(5, 5, 5);
    this.orbitCamera.lookAt(new THREE.Vector3(0, 2, 0));
  }

  update() {
    this.renderer.render(this.scene, this.camera);

    if (this.stage) {
      this.stage.update();
    }
    this.updateControls();
    // this.autoCamera.update();
    requestAnimationFrame(this.update.bind(this));
  }
  updateControls() {
    if (this.controls) {
      if (this.autoOrbit) {
        this.controls.enabled = false;
        return;
      }
      if (this.stage.interiorControls) {
        this.stage.interiorControls.enabled = false;
      }
      this.stage.exteriorControls.enabled = false;

      if (this.camera === this.interiorCamera) {
        this.controls = this.stage.interiorControls;
      } else {
        this.controls = this.stage.exteriorControls;
      }

      // this.autoCamera.enabled ||
      // this.transitionCamera.enabled ||
      this.controls.enabled = !this.introMode;
      this.controls.update();
    }
  }
  @HostListener('window:resize')
  resize() {
    this.width = this.stageEl.nativeElement.clientWidth;
    this.height = this.stageEl.nativeElement.clientHeight;

    const aspect = this.width / this.height;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
  }
}
