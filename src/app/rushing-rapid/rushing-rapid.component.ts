import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-rushing-rapid',
  templateUrl: './rushing-rapid.component.html',
  styleUrls: ['./rushing-rapid.component.css']
})
export class RushingRapidComponent implements OnInit {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addLights();
    this.update();
  }
  addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const shadowLight = new THREE.DirectionalLight(0xffffff, 0.5);
    shadowLight.position.set(200, 200, 200);
    shadowLight.castShadow = true;
    this.scene.add(shadowLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.2);
    backLight.position.set(-100, 200, 50);
    backLight.castShadow = true;
    this.scene.add(backLight);
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 1000);
    this.camera.position.set(-5, 6, 8);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.el.nativeElement.appendChild(this.renderer.domElement);
  }
  update() {
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.update.bind(this));
  }
}
