import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import LabeledGrid from './labeled-grid';
import TrackballControls from '../controls/TrackballControls';
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
    this.addLight();
    this.addGrid();
    this.update();
  }
  addGrid() {
    const grid = new LabeledGrid(
      100,
      100,
      10,
      [0, 1, 0],
      0x000055,
      0.2,
      true,
      '#000000',
      'left'
    );
    this.scene.add(grid);
  }
  addLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(100, 80, 130);
    this.scene.add(light);
  }
  initThree() {
    this.scene = new THREE.Scene();
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    this.camera.position.set(90, 90, 90);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.controls = new TrackballControls(
      this.camera,
      this.renderer.domElement
    );
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();

    requestAnimationFrame(this.update.bind(this));
  }
}
