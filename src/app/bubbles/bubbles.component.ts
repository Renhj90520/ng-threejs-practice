import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-bubbles',
  templateUrl: './bubbles.component.html',
  styleUrls: ['./bubbles.component.css']
})
export class BubblesComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  mainSphere: any;
  group = new THREE.Object3D();
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initThree();
    this.addLights();
    this.addSpheres();
    this.update();
  }
  addSpheres() {
    const baseMat = new THREE.MeshLambertMaterial({
      color: 0xa7897d,
      flatShading: true
    });

    const secondMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color('rgb(216,25,203)'),
      emissive: new THREE.Color('rgb(255,78,14)'),
      specular: new THREE.Color('rgb(235,135,235)'),
      shininess: 10,
      flatShading: true,
      transparent: true,
      opacity: 0.7
    });

    this.mainSphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(100, 2),
      baseMat
    );

    this.group.add(this.mainSphere);
    this.scene.add(this.group);
  }
  addLights() {
    const mainLight: any = new THREE.PointLight(0xd29553);
    mainLight.position.set(50, 200, 400);
    console.log(mainLight.target);
    mainLight.target = this.mainSphere;
    this.scene.add(mainLight);
    const ambientLight = new THREE.AmbientLight(0x2a4159);
    this.scene.add(ambientLight);
  }
  initThree() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    this.camera.position.z = 600;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.el.nativeElement.appendChild(this.renderer.domElement);
  }
  update() {
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.update.bind(this));
  }
}
