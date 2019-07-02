import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-labeled-grid',
  templateUrl: './labeled-grid.component.html',
  styleUrls: ['./labeled-grid.component.css']
})
export class LabeledGridComponent implements OnInit {
  scene;
  camera;
  renderer;
  controls;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initThree();
    this.update();
  }
  initThree() {
    this.scene = new THREE.Scene();
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
  }
  update() {
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.update.bind(this));
  }
}
