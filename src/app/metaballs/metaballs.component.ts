import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-metaballs',
  templateUrl: './metaballs.component.html',
  styleUrls: ['./metaballs.component.css']
})
export class MetaballsComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.update();
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  }
  update() {}
}
