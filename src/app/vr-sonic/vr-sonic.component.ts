import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { points } from './points';
@Component({
  selector: 'app-vr-sonic',
  templateUrl: './vr-sonic.component.html',
  styleUrls: ['./vr-sonic.component.css']
})
export class VrSonicComponent implements OnInit {
  scene;
  camera;
  renderer;
  width;
  height;
  cameraTarget: THREE.Vector3;
  group: THREE.Group;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initThree();
    this.addTube();
    this.addLights();
    this.update();
  }
  addLights() {
    // const light=new THREE.DirectionalLight(0xefefff,)
  }
  addTube() {
    const vertices = [];
    let scale = 5;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const x = p[0] * scale;
      const y = p[1] * scale;
      const z = p[2] * scale;

      vertices.push(new THREE.Vector3(x, z, -y));
    }

    const carPath = new THREE.CatmullRomCurve3(vertices);
    let radius = 0.25;

    const geometry = new THREE.TubeGeometry(carPath, 600, radius, 10, false);

    for (let i = 0; i < geometry.faces.length; i++) {
      geometry.faces[i].color = new THREE.Color(
        `hsl(${Math.floor(Math.random() * 290)},50%,50%)`
      );
    }

    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      vertexColors: THREE.FaceColors,
      transparent: true,
      opacity: 1
    });

    const tube = new THREE.Mesh(geometry, material);
    this.scene.add(tube);
  }
  initThree() {
    this.scene = new THREE.Scene();
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xd8e7ff, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      1,
      10000
    );

    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.group = new THREE.Group();
    this.scene.add(this.group);
  }
  update() {
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.update.bind(this));
  }
}
