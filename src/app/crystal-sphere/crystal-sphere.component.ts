import {
  Component,
  OnInit,
  ElementRef,
  Host,
  HostListener
} from '@angular/core';
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
@Component({
  selector: 'app-crystal-sphere',
  templateUrl: './crystal-sphere.component.html',
  styleUrls: ['./crystal-sphere.component.css']
})
export class CrystalSphereComponent implements OnInit {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;

  cols = [
    [0x00bfff, 0x444444, 0xffffff, 0x00ffe9],
    [0xf4ce42, 0xffec1c, 0x84ff2b, 0x2affc6],
    [0xc4316e, 0x7c025a, 0xa40ace, 0x6d26c9],
    [0xff2e00, 0xe56b00, 0xffae00, 0x2d1000],
    [0xf2999b, 0xd54d87, 0x7b2a95, 0x461865],
    [0xc5e2f6, 0x86e7e1, 0xfcb5bb, 0xfac6ff],
    [0xf44336, 0x1e88e5, 0xfdd835, 0xffffff]
  ];
  specs = [
    [0x94e2fc, 0x666666, 0xffffff, 0xa3fff7],
    [0xf9e69f, 0xfcf6b3, 0xd1fcb2, 0xb5ffeb],
    [0xc6658d, 0xaf3f90, 0xbe5fd8, 0xbf8eff],
    [0xff9077, 0xf7a45b, 0xffcc60, 0x2d211b],
    [0xffbfc0, 0xce7da0, 0xb780c9, 0x755689],
    [0xdeeef9, 0xaef2ee, 0xf7c5ca, 0xf6d4f9],
    [0xf44336, 0x1e88e5, 0xfdd835, 0xffffff]
  ];
  alpha = [
    [0.8, 1.0, 0.3, 0.7],
    [0.5, 0.4, 0.6, 0.7],
    [0.4, 0.6, 0.8, 0.9],
    [0.8, 0.7, 0.4, 1.0],
    [0.4, 0.6, 0.8, 1.0],
    [0.7, 0.5, 0.6, 0.7],
    [0.6, 0.6, 0.6, 0.4]
  ];
  count = 200;
  offmax = 50;
  offmin = -50;
  xWi = 10;
  nWi = 2;
  xLe = 10;
  nLe = 2;
  colRow = 0;
  controls: TrackballControls;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addLights();
    this.draw();
    this.update();
  }
  draw() {
    for (let i = 0; i < this.count; i++) {
      const width = Math.random() * (this.xWi - this.nWi) + this.nWi;
      const length = Math.random() * (this.xLe - this.nLe) + this.nLe;

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0, width);
      shape.lineTo(length, width);
      shape.lineTo(length, 0);
      shape.lineTo(0, 0);

      const extrudeSettings = {
        steps: 2,
        depth: 0,
        bevelEnabled: true,
        bevelThickness: Math.random() * (30 - 10) + 10,
        bevelSize: Math.random() * (10 - 5) + 5,
        bevelSegments: 1
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mat = Math.round(Math.random() * 3);
      const material = new THREE.MeshPhongMaterial({
        color: this.cols[this.colRow][mat],
        specular: this.specs[this.colRow][mat],
        shininess: 3000,
        transparent: true,
        opacity: this.alpha[this.colRow][mat],
        polygonOffset: true,
        polygonOffsetFactor: -0.1
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = Math.PI / ((Math.random() * Math.PI) / 2);
      mesh.rotation.y = Math.PI / ((Math.random() * Math.PI) / 2);
      mesh.rotation.z = Math.PI / ((Math.random() * Math.PI) / 2);

      mesh.position.x =
        Math.random() * (this.offmax - this.offmin) + this.offmin;
      mesh.position.y =
        Math.random() * (this.offmax - this.offmin) + this.offmin;
      mesh.position.z =
        Math.random() * (this.offmax - this.offmin) + this.offmin;
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;
      this.scene.add(mesh);
    }
  }
  addLights() {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(50, 0, 0);
    this.scene.add(light);

    const light1 = new THREE.DirectionalLight(0xffffff);
    light1.position.set(-50, 0, 0);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff);
    light2.position.set(0, 50, 0);
    this.scene.add(light2);

    const light3 = new THREE.DirectionalLight(0xffffff);
    light3.position.set(0, -50, 0);
    this.scene.add(light3);
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.002);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    this.camera.position.z = 350;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(this.scene.fog.color);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);

    this.el.nativeElement.appendChild(this.renderer.domElement);
    this.controls = new TrackballControls(this.camera);
    this.controls.rotateSpeed = 2;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noPan = true;
    this.controls.staticMoving = false;
    this.controls.dynamicDampingFactor = 0.2;
    this.controls.keys = [65, 83, 68];
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    requestAnimationFrame(this.update.bind(this));
  }
}
