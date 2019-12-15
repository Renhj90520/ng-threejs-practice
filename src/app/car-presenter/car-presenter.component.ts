import {
  Component,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef
} from '@angular/core';
import * as THREE from 'three';
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
  width;
  height;

  constructor() {}

  ngOnInit() {
    this.initTHREE();
    this.initLights();
    this.initGround();
    this.update();
  }
  initGround() {
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

    requestAnimationFrame(this.update.bind(this));
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
