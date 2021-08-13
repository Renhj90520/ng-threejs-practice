import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-smoke',
  templateUrl: './smoke.component.html',
  styleUrls: ['./smoke.component.css'],
})
export class SmokeComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;

  width;
  height;
  clock = new THREE.Clock();
  smokeImages = [
    '/assets/images/smoke1.png',
    '/assets/images/smoke2.png',
    '/assets/images/smoke3.png',
    '/assets/images/smoke4.png',
  ];
  numParticles = 20;
  smokeCloud = [];
  delta = 0;
  isBlowing: any;
  bounds: { x: number; y: number; z: number };

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.initTHREE();
    this.addLights();
    this.addText();
    this.addSmoke();
    this.render();
  }
  addText() {
    const textGeo = new THREE.PlaneGeometry(360, 360);
    const textTexture = new THREE.TextureLoader().load(
      '/assets/images/text.png'
    );

    const textMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      map: textTexture,
      emissive: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 1,
    });

    const text = new THREE.Mesh(textGeo, textMat);
    text.position.z = 300;
    this.scene.add(text);
  }
  addSmoke() {
    const smokeGeo = new THREE.PlaneGeometry(500, 500);
    const smokeTexture = new THREE.TextureLoader().load(this.smokeImages[3]);
    const smokeMat = new THREE.MeshLambertMaterial({
      color: 0xf1ebdd,
      emissive: 0xffffff,
      map: smokeTexture,
      transparent: true,
      opacity: 0.7,
    });

    this.bounds = {
      x: 500,
      y: 500,
      z: 500,
    };

    for (let i = 0; i < this.numParticles; i++) {
      const particle = new THREE.Mesh(smokeGeo, smokeMat);

      particle.position.set(
        Math.random() * this.bounds.x - this.bounds.x * 0.5,
        Math.random() * this.bounds.y - this.bounds.y * 0.5,
        Math.random() * this.bounds.z - this.bounds.z * 0.6
      );
      particle.rotation.z = Math.random() * 360;
      this.scene.add(particle);
      this.smokeCloud.push(particle);
    }
  }
  addLights() {
    const light = new THREE.DirectionalLight(0xdaccd8, 1);
    light.position.set(-1, 0, 1);
    this.scene.add(light);
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xffffff, 0);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      1,
      10000
    );
    this.camera.position.z = 1000;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  render() {
    requestAnimationFrame(this.render.bind(this));

    this.delta = this.clock.getDelta();
    this.controls.update();
    this.rotateSmoke();
    this.renderer.render(this.scene, this.camera);
  }
  rotateSmoke() {
    for (let i = 0; i < this.numParticles; i++) {
      const smoke = this.smokeCloud[i];
      smoke.rotation.z -= this.delta * 0.4;

      if (this.isBlowing) {
        smoke.position.z -= 10;
        smoke.position.x *= 1.01;
        smoke.position.y *= 1.01;
        smoke.material.opacity -= 0.001;
      }
    }
  }

  @HostListener('click')
  toggleBlowing() {
    this.isBlowing = !this.isBlowing;

    if (!this.isBlowing) {
      for (let i = 0; i < this.smokeCloud.length; i++) {
        const smoke = this.smokeCloud[i];

        smoke.position.set(
          Math.random() * this.bounds.x - this.bounds.x * 0.5,
          Math.random() * this.bounds.y - this.bounds.y * 0.5,
          Math.random() * this.bounds.z - this.bounds.z * 0.6
        );
        smoke.rotation.z = Math.random() * 360;
        smoke.material.opacity = 1;
      }
    }
  }
}
