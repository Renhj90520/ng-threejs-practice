import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-endless-terrain',
  templateUrl: './endless-terrain.component.html',
  styleUrls: ['./endless-terrain.component.css']
})
export class EndlessTerrainComponent implements OnInit {
  scene;
  camera;
  renderer;

  width;
  height;
  colors = ['#FE00FF', '#fdff00', '#00ff38', '#00f9ff', '#3c00ff'];
  lights = [];
  rows = 26;
  cols = 26;

  geometry = new THREE.CylinderGeometry(1, 1, 3, 6);
  material = new THREE.MeshPhongMaterial({
    color: 'white',
    shininess: 50,
    vertexColors: THREE.VertexColors
  });
  meshes = [];
  t = 0;
  a = 0;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;
    this.initTHREE();
    this.addLights();
    this.addCylinders();
    this.update();
  }

  initTHREE() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xffffff, -this.rows, this.rows * 1.6);
    this.camera = new THREE.PerspectiveCamera(
      30,
      this.width / this.height,
      0.1,
      1000
    );

    this.camera.position.set(0, -4, 0);
    this.camera.rotation.x -= 0.12;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xffffff);

    this.el.nativeElement.appendChild(this.renderer.domElement);
  }

  addLights() {
    for (let i = 0; i < 5; i++) {
      const light = new THREE.PointLight(this.colors[i], 1.25);
      light.distance = 50;
      light.intensity = 1;
      this.lights.push(light);
      this.scene.add(light);
    }
  }

  addCylinders() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = -this.cols / 2; j <= this.cols / 2; j++) {
        const tile: any = new THREE.Mesh(this.geometry, this.material);
        tile.maxX = this.cols + (i % 2);
        tile.minX = (i % 2) - this.cols;
        tile.speed = Math.random() * 0.02 + 0.03;
        tile.t = 0;
        tile.position.set(2 * j + (i % 2), -5, -1.6 * i);
        this.meshes.push(tile);
        this.scene.add(tile);
      }
    }
  }

  update() {
    requestAnimationFrame(this.update.bind(this));
    for (let i = 0; i < 4; i++) {
      this.a = this.t / 60 + i * (1 + i / 5);
      this.lights[i].position.set(
        30 * Math.cos(this.a),
        -2,
        10 * Math.sin(this.a) - 20
      );
    }

    for (let i = 0; i < this.meshes.length; i++) {
      const mesh = this.meshes[i];
      mesh.position.z += 0.15;
      if (mesh.position.z > 0) {
        mesh.position.z = -this.rows * 1.6;
      }

      mesh.t += mesh.speed;
      mesh.position.y = Math.abs(Math.sin(mesh.t)) - 10;
    }
    this.t++;
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  }

  updateCamera() {
    const tx = this.camera.rotation.x;
    const ty = this.camera.rotation.y;

    this.camera.rotation.y += -ty / 20;
    this.camera.rotation.x += (-tx - 0.25) / 20;
  }
}
