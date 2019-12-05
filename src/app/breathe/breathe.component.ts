import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-breathe',
  templateUrl: './breathe.component.html',
  styleUrls: ['./breathe.component.css']
})
export class BreatheComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  numPlanes = 25;
  tabPlanes = [];
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addLights();
    this.addPlanes();
    this.update();
  }
  addPlanes() {
    for (let i = 0; i < this.numPlanes; i++) {
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(
          `rgb(${~~(255 - i * 8)},${~~(255 - i * 10)},${~~(i * 8)})`
        ),
        emissive: new THREE.Color('rgb(5,5,0)'),
        specular: new THREE.Color('rgb(122,0,93)'),
        shininess: 10,
        transparent: true,
        opacity: 0.4
      });

      const geometry = new THREE.CylinderGeometry(11 * i, 11 * i, 0.001, 6);
      const plane = new THREE.Mesh(geometry, material);
      plane.position.z = -i * 5;
      plane.rotation.x = 1.57;

      this.scene.add(plane);
      this.tabPlanes.push(plane);
    }
  }
  addLights() {
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.z = 400;
    this.scene.add(light);
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    this.camera.position.z = 230;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(0x000000);
    this.renderer.setSize(width, height);
    this.el.nativeElement.appendChild(this.renderer.domElement);
  }

  tmp = 0;
  update() {
    this.renderer.render(this.scene, this.camera);
    for (let i = 0; i < this.numPlanes; i++) {
      this.tabPlanes[i].position.z =
        -6.28 - Math.abs(Math.cos(this.tmp)) * i * 5 - i * 2;
      this.tabPlanes[i].rotation.y = (Math.cos(this.tmp) * i) / 20;
    }
    this.tmp += 1 / 100;
    requestAnimationFrame(this.update.bind(this));
  }
}
