import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { Float32BufferAttribute } from 'three';
@Component({
  selector: 'app-globe-cloud',
  templateUrl: './globe-cloud.component.html',
  styleUrls: ['./globe-cloud.component.css']
})
export class GlobeCloudComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: TrackballControls;
  positions = [];
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.initPositions();
    this.addGlobeCloud();
    this.update();
  }
  initPositions() {
    for (let i = 0; i < 5000; i++) {
      const pos: any = {
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        lat: 2 * Math.PI * Math.random(),
        long: Math.acos(2 * Math.random() - 1)
      };
      pos.u = Math.cos(pos.long);
      pos.sqrt = Math.sqrt(1 - pos.u * pos.u);
      this.positions.push(pos);
    }
  }
  addGlobeCloud() {
    const loader = new THREE.TextureLoader();
    const dotTexture = loader.load('/assets/images/dotTexture.png');
    const dotsMaterial = new THREE.PointsMaterial({
      size: 6,
      map: dotTexture,
      transparent: true,
      opacity: 0.3,
      alphaTest: 0.1
    });

    const strokesMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    });

    const galaxy = new THREE.Object3D();
    this.scene.add(galaxy);
    const strokes = new THREE.LineSegments(
      new THREE.Geometry(),
      strokesMaterial
    );
    galaxy.add(strokes);

    const dots = new THREE.BufferGeometry();
    const vertices = [];
    const positions = [];
    for (let i = 0; i < 3000; i++) {
      const x =
        (this.positions[i].x * 20 + 200) *
        this.positions[i].sqrt *
        Math.cos(this.positions[i].lat);

      const y =
        (this.positions[i].y * 20 + 200) *
        this.positions[i].sqrt *
        Math.sin(this.positions[i].lat);
      const z = (this.positions[i].z * 20 + 200) * this.positions[i].u;

      const vector: any = new THREE.Vector3(x, y, z);
      vector.amount = 0;
      vertices.push(vector);
      positions.push(x);
      positions.push(y);
      positions.push(z);
    }

    const segments = new THREE.Geometry();
    for (let i = vertices.length - 1; i >= 0; i--) {
      const vector: any = vertices[i];
      for (let j = vertices.length - 1; j >= 0; j--) {
        if (
          vector.amount < 3 &&
          i !== j &&
          vector.distanceTo(vertices[j]) < 30
        ) {
          segments.vertices.push(vector);
          segments.vertices.push(vertices[j]);
          vector.amount++;
          vertices[j].amount++;
        }
      }
    }

    strokes.geometry = segments;
    dots.addAttribute(
      'position',
      new Float32BufferAttribute(positions, 3, false)
    );
    const dotStrokes = new THREE.Points(dots, dotsMaterial);
    galaxy.add(dotStrokes);
    this.scene.add(galaxy);
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 800, 2500);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000);
    this.camera.position.set(0, 100, 600);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000);
    this.el.nativeElement.appendChild(this.renderer.domElement);

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
