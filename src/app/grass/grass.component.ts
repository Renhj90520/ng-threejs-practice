import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-grass',
  templateUrl: './grass.component.html',
  styleUrls: ['./grass.component.css']
})
export class GrassComponent implements OnInit {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.update();
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x66deff, 1);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    const distance = 400;
    const fov = (2 * Math.atan(height / (2 * distance)) * 90) / Math.PI;
    console.log(fov);
    this.camera = new THREE.PerspectiveCamera(fov, width / height, 1, 20000);
    this.camera.position.set(-50, 10, 50);

    this.controls = new OrbitControls(this.camera);
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    requestAnimationFrame(this.update.bind(this));
  }
}
