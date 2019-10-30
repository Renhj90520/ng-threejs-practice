import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-bubbles',
  templateUrl: './bubbles.component.html',
  styleUrls: ['./bubbles.component.css']
})
export class BubblesComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  mainSphere: any;
  group = new THREE.Object3D();
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initThree();
    this.addLights();
    this.addSpheres();
    this.update();
  }
  addSpheres() {
    const baseMat = new THREE.MeshLambertMaterial({
      color: 0xa7897d,
      flatShading: true
    });

    const secondMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color('rgb(216,25,203)'),
      emissive: new THREE.Color('rgb(255,78,14)'),
      specular: new THREE.Color('rgb(235,135,235)'),
      shininess: 10,
      flatShading: true,
      transparent: true,
      opacity: 0.7
    });

    this.mainSphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(100, 2),
      baseMat
    );

    this.group.add(this.mainSphere);
    this.scene.add(this.group);

    for (let i = 0; i < this.mainSphere.geometry.faces.length; i++) {
      const face: any = this.mainSphere.geometry.faces[i];
      const geometry: any = this.mainSphere.geometry;

      const newSphere: any = new THREE.Mesh(
        new THREE.IcosahedronGeometry(20, 1),
        secondMat
      );
      face.centroid = new THREE.Vector3(0, 0, 0);
      face.centroid.add(geometry.vertices[face.a]);
      face.centroid.add(geometry.vertices[face.b]);
      face.centroid.add(geometry.vertices[face.c]);
      face.centroid.divideScalar(3);
      newSphere.position.set(face.centroid.x, face.centroid.y, face.centroid.z);
      newSphere.target = new THREE.Vector3(
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
        Math.random() * 200 - 100
      );
      newSphere.base = new THREE.Vector3(
        newSphere.position.x,
        newSphere.position.y,
        newSphere.position.z
      );

      this.group.add(newSphere);
    }
  }
  addLights() {
    const mainLight: any = new THREE.PointLight(0xd29553);
    mainLight.position.set(50, 200, 400);
    this.scene.add(mainLight);
    const ambientLight = new THREE.AmbientLight(0x2a4159);
    this.scene.add(ambientLight);
  }
  initThree() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    this.camera.position.z = 600;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.el.nativeElement.appendChild(this.renderer.domElement);
  }

  t = 0;
  decell = false;
  lastP = 0;
  update() {
    this.t++;
    const progress = Math.sin(this.t / 13) / 2 + 0.5;
    this.group.children[0].scale.x = 1 + progress / 5;
    this.group.children[0].scale.y = 1 + progress / 5;
    this.group.children[0].scale.z = 1 + progress / 5;

    for (let i = 1; i < this.group.children.length; i++) {
      const sphere: any = this.group.children[i];
      sphere.position.x = sphere.base.x + sphere.target.x * progress;
      sphere.position.y = sphere.base.y + sphere.target.y * progress;
      sphere.position.z = sphere.base.z + sphere.target.z * progress;
    }

    if (progress < this.lastP && !this.decell) {
      this.decell = true;
    }
    if (progress > this.lastP && this.decell) {
      for (let i = 1; i < this.group.children.length; i++) {
        const sphere: any = this.group.children[i];
        sphere.target = new THREE.Vector3(
          Math.random() * 200 - 100,
          Math.random() * 200 - 100,
          Math.random() * 200 - 100
        );
      }
      this.decell = false;
    }
    this.lastP = progress;

    this.group.rotation.y += 1.5 * (Math.PI / 180);
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.update.bind(this));
  }
}
