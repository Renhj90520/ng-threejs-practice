import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-launchit-earth',
  templateUrl: './launchit-earth.component.html',
  styleUrls: ['./launchit-earth.component.css']
})
export class LaunchitEarthComponent implements OnInit {
  scene;
  camera;
  renderer;

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
      45,
      this.width / this.height,
      1,
      2000
    );

    this.camera.position.set(0, 0, 1000);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });

    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);

    this.el.nativeElement.appendChild(this.renderer.domElement);
  }

  update() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.update.bind(this));
  }
}
