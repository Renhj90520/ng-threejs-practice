import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-gravity-arrows',
  templateUrl: './gravity-arrows.component.html',
  styleUrls: ['./gravity-arrows.component.css']
})
export class GravityArrowsComponent implements OnInit {
  scene;
  camera;
  renderer;

  NUM_INSTANCE = 6000;
  ARROW_FORWARD = new THREE.Vector3(0, 0, 1);
  UP = new THREE.Vector3(0, 1, 0);

  v3 = new THREE.Vector3();

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.update();
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  }
  update() {}
}
