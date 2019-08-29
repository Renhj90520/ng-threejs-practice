import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
@Component({
  selector: 'app-cascade',
  templateUrl: './cascade.component.html',
  styleUrls: ['./cascade.component.css']
})
export class CascadeComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  width;
  height;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.update();
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      40,
      this.width / this.height,
      1,
      30000
    );

    this.camera.position.set(0, 0, 3000);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 0);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
    requestAnimationFrame(this.update.bind(this));
  }
}
