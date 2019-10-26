import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-space-grid',
  templateUrl: './space-grid.component.html',
  styleUrls: ['./space-grid.component.css']
})
export class SpaceGridComponent implements OnInit {
  scene;
  camera;
  renderer;
  width;
  height;

  lines = [];
  vLines = [];
  amountAdds = 100;
  // controls: OrbitControls;
  particleSystem: any;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initThree();
    this.addLights();
    this.addGrids();

    this.addParticles();
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.update();
  }
  addParticles() {
    const particalCount = 12000;
    const particles = new THREE.BufferGeometry();

    const pointsArray = new Float32Array(particalCount * 3);
    for (let p = 0; p < particalCount; p++) {
      const x = Math.random() * 50 - 25;
      const y = Math.random() * 200 - 200;
      const z = Math.random() * 50 - 25;

      pointsArray[p * 3] = x;
      pointsArray[p * 3 + 1] = y;
      pointsArray[p * 3 + 2] = z;
    }

    particles.addAttribute(
      'position',
      new THREE.Float32BufferAttribute(pointsArray, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      map: this.createCanvasMaterial('#ffffff', 256),
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    this.particleSystem = new THREE.Points(particles, particleMaterial);
    this.particleSystem.position.y = 25;
    this.scene.add(this.particleSystem);
  }
  createCanvasMaterial(color, size): THREE.Texture {
    const matCanvas = document.createElement('canvas');
    matCanvas.width = matCanvas.height = size;
    const matContext = matCanvas.getContext('2d');

    const texture = new THREE.Texture(matCanvas);

    const center = size / 2;
    matContext.beginPath();
    matContext.arc(center, center, size / 2, 0, 2 * Math.PI, false);
    matContext.closePath();
    matContext.fillStyle = color;
    matContext.fill();

    texture.needsUpdate = true;
    return texture;
  }
  addGrids() {
    for (let i = 0; i > -200; i -= 25) {
      this.addMoreLines(i);
    }

    const material = new THREE.MeshBasicMaterial({
      color: 'skyblue'
    });
    const material2 = new THREE.MeshBasicMaterial({
      color: 'skyblue',
      transparent: true,
      opacity: 0.5
    });

    for (let z = -55; z <= 55; z += 10) {
      for (let x = -55; x <= 55; x += 10) {
        const geometry = new THREE.BoxGeometry(0.1, 200, 0.1);
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
        cube.position.z = z;
        cube.position.x = x;
        this.vLines.push(cube);

        const geometry1 = new THREE.BoxGeometry(0.5, 200, 0.5);
        const cubeLarge = new THREE.Mesh(geometry1, material2);
        this.scene.add(cubeLarge);
        cubeLarge.position.z = z;
        cubeLarge.position.x = x;
        this.vLines.push(cubeLarge);
      }
    }
  }
  addMoreLines(y) {
    const material = new THREE.MeshPhongMaterial({
      color: '#8080ff',
      reflectivity: 0.8,
      shininess: 100
    });

    const material2 = new THREE.MeshPhongMaterial({
      color: 'skyblue',
      transparent: true,
      opacity: 0.5,
      reflectivity: 0.8,
      shininess: 100
    });

    for (let x = -55; x <= 55; x += 10) {
      const geometry = new THREE.BoxGeometry(125, 0.5, 0.5);
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = x;
      cube.position.y = y;
      cube.rotation.y = this.rad(90);
      this.scene.add(cube);
      this.lines.push(cube);

      const geometry1 = new THREE.BoxGeometry(125, 1, 1);
      const cube1 = new THREE.Mesh(geometry1, material2);
      cube1.position.x = x;
      cube1.position.y = y;
      cube1.rotation.y = this.rad(90);
      this.scene.add(cube1);
    }

    for (let z = -55; z <= 55; z += 10) {
      const geometry = new THREE.BoxGeometry(125, 0.5, 0.5);
      const cube = new THREE.Mesh(geometry, material);
      cube.position.z = z;
      cube.position.y = y;
      this.scene.add(cube);
      this.lines.push(cube);

      const geometry1 = new THREE.BoxGeometry(125, 1, 1);
      const cube1 = new THREE.Mesh(geometry1, material2);
      cube1.position.z = z;
      cube1.position.y = y;
      this.scene.add(cube1);
      this.lines.push(cube1);
    }
  }
  addLights() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    directionalLight.position.y = 100;
    this.scene.add(directionalLight);
    const directionalLightHelper = new THREE.DirectionalLightHelper(
      directionalLight
    );
    this.scene.add(directionalLightHelper);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 0, 200);

    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.width, this.height);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.y = 20;
    const axisHelper = new THREE.AxesHelper(2000);
    this.scene.add(axisHelper);
  }

  nextLines = 0;
  update() {
    this.renderer.render(this.scene, this.camera);
    // this.controls.update();

    this.camera.position.y -= 0.2;
    console.log(this.camera.rotation);
    this.camera.lookAt(new THREE.Vector3(0, this.camera.position.y - 20, 0));

    this.particleSystem.position.y -= 0.2;
    this.particleSystem.rotation.y += 0.001;
    this.animateParticles();
    this.nextLines -= 1;

    if (this.nextLines < 0) {
      this.addMoreLines(this.camera.position.y - 200);
      this.nextLines = 100;
    }

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];

      line.scale.z = (Math.random() * 200 + 900) / 1000;
      if (line.position.y > this.camera.position.y) {
        this.scene.remove(line);
        this.lines.splice(i, 1);
      }
    }

    for (let i = 0; i < this.vLines.length; i++) {
      const line = this.vLines[i];
      line.position.y -= 0.2;
      line.scale.z = (Math.random() * 200 + 900) / 1000;
    }

    requestAnimationFrame(this.update.bind(this));
  }
  animateParticles() {
    var verts = this.particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < verts.length; i++) {
      if (verts[i * 3 + 1] > 0) {
        verts[i * 3 + 1] = -200;
      }
      verts[i * 3 + 1] += 0.1;
    }
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  rad(deg) {
    return deg * (Math.PI / 180);
  }
}
