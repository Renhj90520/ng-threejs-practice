import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as SimplexNoise from 'simplex-noise';
import { BasicFireWorks, RichFireWorks } from './firework';
import { interval } from 'rxjs';
@Component({
  selector: 'app-fireworks',
  templateUrl: './fireworks.component.html',
  styleUrls: ['./fireworks.component.css']
})
export class FireworksComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  width: any;
  height: any;
  controls: OrbitControls;
  plane: THREE.Mesh;
  noise = new SimplexNoise();
  fireworks = [];

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addLights();
    this.addPlane();
    this.launchFireWorks();
    interval(100).subscribe(() => {
      if (Math.random() > 0.7) this.launchFireWorks();
    });
    this.update();
  }
  launchFireWorks() {
    if (this.fireworks.length > 8) return;
    const fw = Math.random() > 0.5 ? new BasicFireWorks() : new RichFireWorks();
    this.fireworks.push(fw);
    this.scene.add(fw);
  }
  addPlane() {
    const planeGeo = new THREE.PlaneGeometry(200, 200, 10, 10);
    const planeMat = new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      wireframe: true
    });
    this.plane = new THREE.Mesh(planeGeo, planeMat);
    this.plane.receiveShadow = true;
    this.plane.rotation.x = -0.5 * Math.PI;
    this.plane.position.x = 0;
    this.plane.position.y = -50;
    this.plane.position.z = 0;
    this.scene.add(this.plane);
  }
  addLights() {
    const ambientLight = new THREE.AmbientLight(0x666666);
    this.scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.distance = 2000;
    spotLight.position.set(-500, 1000, 0);
    spotLight.castShadow = true;
    this.scene.add(spotLight);
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      2000
    );

    this.camera.position.set(0, -40, 170);
    this.camera.lookAt(this.scene.position);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(new THREE.Color(0x000000), 0);
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  update() {
    this.renderer.render(this.scene, this.camera);

    this.makeRoughGround();
    const exploaded = [];
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const firework = this.fireworks[i];
      firework.update();
      if (firework.isExplode) exploaded.push(i);
    }

    for (let i = 0; i < exploaded.length; i++) {
      const idx = exploaded[i];
      const firework = this.fireworks[idx];
      if (firework) {
        firework.remove(firework.seed.mesh);
        if (firework.life <= 0) {
          this.scene.remove(firework);
          this.fireworks.splice(idx, 1);
        }
      }
    }
    this.controls.update();
    requestAnimationFrame(this.update.bind(this));
  }
  makeRoughGround() {
    const time = Date.now();
    const { geometry }: any = this.plane;

    for (let i = 0; i < geometry.vertices.length; i++) {
      const vertex = geometry.vertices[i];
      const noise1 =
        this.noise.noise2D(
          vertex.x * 0.01 + time * 0.0002,
          vertex.y * 0.01 + time * 0.0002
        ) * 5;

      const noise2 =
        this.noise.noise2D(
          vertex.x * 0.02 + time * 0.00002,
          vertex.y * 0.02 + time * 0.00004
        ) * 2;

      const noise3 =
        this.noise.noise2D(
          vertex.x * 0.009 + time * 0.00001,
          vertex.y * 0.012 + time * 0.00003
        ) * 2;

      const distance = noise1 + noise2 + noise3;
      vertex.z = distance;
    }
    geometry.verticesNeedUpdate = true;
    geometry.normalsNeedUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeFaceNormals();
  }
}
