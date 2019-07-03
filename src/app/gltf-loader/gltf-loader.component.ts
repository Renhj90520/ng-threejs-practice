import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
@Component({
  selector: 'app-gltf-loader',
  templateUrl: './gltf-loader.component.html',
  styleUrls: ['./gltf-loader.component.css']
})
export class GltfLoaderComponent implements OnInit {
  scene;
  camera;
  renderer;
  glft;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initThree();
    this.addLight();
    this.loadCastle();
    this.update();
  }
  loadCastle() {
    const loader = new GLTFLoader();
    loader.load('/assets/castlescene.glb', (glft: any) => {
      this.glft = glft;
      this.scene.add(glft.scene);
      glft.scene.children[0].material.emissive = 0;
    });
  }
  addLight() {
    const lightFill = new THREE.PointLight(0xffffff, 1, 500);
    lightFill.position.set(0, 20, 20);
    this.scene.add(lightFill);

    const lightKey = new THREE.PointLight(0x00804d, 1, 500);
    lightKey.position.set(20, 0, 20);
    this.scene.add(lightKey);
  }
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x00804d);

    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;
    this.renderer = new THREE.WebGLRenderer();

    this.renderer.setSize(width, height);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 20, 20);
    this.camera.lookAt(0, 5, 5);
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    if (this.glft) this.glft.scene.children[0].rotation.y += 0.005;

    requestAnimationFrame(this.update.bind(this));
  }
}
