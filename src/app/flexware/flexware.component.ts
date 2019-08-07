import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-flexware',
  templateUrl: './flexware.component.html',
  styleUrls: ['./flexware.component.css']
})
export class FlexwareComponent implements OnInit {
  scene;
  camera;
  renderer;
  clock = new THREE.Clock();
  time = 0;
  duration = 100;
  keyframes = 4;
  interpolation = this.duration / this.keyframes;
  currentKeyframe = 0;
  lastKeyframe = 0;
  animOffset = 1;
  radius = 600;
  theta = 0;
  prevTime = Date.now();
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 10000);
    this.camera.position.set(-305, 55, -65);
    this.camera.lookAt(new THREE.Vector3(0, 50, 0));

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height);
    this.renderer.shadowMapEnabled = true;
    this.el.nativeElement.appendChild(this.renderer.domElement);
  }
}
