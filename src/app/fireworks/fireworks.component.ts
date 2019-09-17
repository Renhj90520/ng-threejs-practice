import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
@Component({
  selector: 'app-fireworks',
  templateUrl: './fireworks.component.html',
  styleUrls: ['./fireworks.component.css']
})
export class FireworksComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  width: any;
  height: any;
  controls: OrbitControls;
  plane: THREE.Mesh;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addLights();
    this.addPlane();
    this.update();
  }
  addPlane() {
    const planeGeo = new THREE.PlaneGeometry(200, 200, 10, 10);
    const planeMat = new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      wireframe: true
    });
    this.plane = new THREE.Mesh(planeGeo, planeMat);
    this.plane.receiveShadow = true;
    this.plane.rotation.x = -0.5 * Math.PI;
    this.plane.position.x = 0;
    this.plane.position.y = -50;
    this.plane.position.z = 0;
    this.scene.add(this.plane);
  }
  addLights() {
    const ambientLight = new THREE.AmbientLight(0x666666);
    this.scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.distance = 2000;
    spotLight.position.set(-500, 1000, 0);
    spotLight.castShadow = true;
    this.scene.add(spotLight);
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      2000
    );

    this.camera.position.set(0, -40, 170);
    this.camera.lookAt(this.scene.position);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(new THREE.Color(0x000000), 0);
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setClearColor(0);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  update() {
    this.renderer.render(this.scene, this.camera);

    this.controls.update();
    requestAnimationFrame(this.update.bind(this));
  }
}
