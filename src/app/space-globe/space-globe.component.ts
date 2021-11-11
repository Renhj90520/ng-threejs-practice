import { Component, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
@Component({
  selector: 'app-space-globe',
  templateUrl: './space-globe.component.html',
  styleUrls: ['./space-globe.component.css'],
})
export class SpaceGlobeComponent implements OnInit {
  @ViewChild('stage', { static: true }) stageEl;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  width: any;
  height: any;
  controls: any;
  stars: THREE.Points<THREE.Geometry, THREE.PointsMaterial>;
  nucleus: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshPhongMaterial>;
  sphereBg: THREE.Mesh<THREE.SphereBufferGeometry, THREE.MeshBasicMaterial>;
  constructor() {}

  ngOnInit(): void {
    this.initTHREE();
    this.addLights();
    this.addSpace();
    this.addStars();
    this.render();
  }
  addStars() {
    const loader = new THREE.TextureLoader();
    const textureStar = loader.load('/assets/images/space-globe/p1.png');
    const texture1 = loader.load('/assets/images/space-globe/p2.png');
    const texture2 = loader.load('/assets/images/space-globe/p3.png');
    const texture4 = loader.load('/assets/images/space-globe/p4.png');
    /*    Moving Stars   */
    const starsGeometry = new THREE.Geometry();
    for (let i = 0; i < 50; i++) {
      const particleStar: any = this.randomPointSphere(150);

      particleStar.velocity = THREE.MathUtils.randInt(50, 200);
      particleStar.startX = particleStar.x;
      particleStar.startY = particleStar.y;
      particleStar.startZ = particleStar.z;

      starsGeometry.vertices.push(particleStar);
    }

    const startsMaterial = new THREE.PointsMaterial({
      size: 5,
      color: '#fff',
      transparent: true,
      opacity: 0.8,
      map: textureStar,
      blending: THREE.AdditiveBlending,
    });

    this.stars = new THREE.Points(starsGeometry, startsMaterial);
    this.scene.add(this.stars);

    this.scene.add(this.createStars(texture1, 15, 20));
    this.scene.add(this.createStars(texture2, 5, 5));
    this.scene.add(this.createStars(texture4, 7, 5));
  }

  createStars(texture, size, total) {
    let pointGeometry = new THREE.Geometry();
    let pointMaterial = new THREE.PointsMaterial({
      size: size,
      map: texture,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < total; i++) {
      let radius = THREE.MathUtils.randInt(149, 70);
      let particles = this.randomPointSphere(radius);
      pointGeometry.vertices.push(particles);
    }
    return new THREE.Points(pointGeometry, pointMaterial);
  }
  addSpace() {
    const loader = new THREE.TextureLoader();

    const textureSphereBg = loader.load('/assets/images/space-globe/bg3.jpg');
    const texturenucleus = loader.load('/assets/images/space-globe/star.jpg');

    /*  Nucleus  */
    texturenucleus.anisotropy = 16;
    const icosahedronGeometry = new THREE.IcosahedronGeometry(30, 8);
    const lambertMaterial = new THREE.MeshPhongMaterial({
      map: texturenucleus,
    });

    this.nucleus = new THREE.Mesh(icosahedronGeometry, lambertMaterial);

    this.scene.add(this.nucleus);

    /*    Sphere  Background   */
    textureSphereBg.anisotropy = 16;
    const geometrySphereBg = new THREE.SphereBufferGeometry(150, 40, 40);

    const materialSphereBg = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      map: textureSphereBg,
    });

    this.sphereBg = new THREE.Mesh(geometrySphereBg, materialSphereBg);
    this.scene.add(this.sphereBg);
  }
  randomPointSphere(radius) {
    let theta = 2 * Math.PI * Math.random();
    let phi = Math.acos(2 * Math.random() - 1);
    let dx = 0 + radius * Math.sin(phi) * Math.cos(theta);
    let dy = 0 + radius * Math.sin(phi) * Math.sin(theta);
    let dz = 0 + radius * Math.cos(phi);
    return new THREE.Vector3(dx, dy, dz);
  }
  initTHREE() {
    this.width = this.stageEl.nativeElement.clientWidth;
    this.height = this.stageEl.nativeElement.clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      55,
      this.width / this.height,
      0.01,
      1000
    );
    this.camera.position.set(0, 0, 230);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.stageEl.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 4;
    this.controls.maxDistance = 350;
    this.controls.minDistance = 150;
    this.controls.enablePan = false;
  }

  addLights() {
    const directionalLight = new THREE.DirectionalLight('#fff', 2);
    directionalLight.position.set(0, 50, -20);
    this.scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight('#fff', 1);
    ambientLight.position.set(0, 20, 20);
    this.scene.add(ambientLight);
  }

  render() {
    requestAnimationFrame(this.render.bind(this));

    this.stars.geometry.vertices.forEach(function (v: any) {
      v.x += (0 - v.x) / v.velocity;
      v.y += (0 - v.y) / v.velocity;
      v.z += (0 - v.z) / v.velocity;

      v.velocity -= 0.3;

      if (v.x <= 5 && v.x >= -5 && v.z <= 5 && v.z >= -5) {
        v.x = v.startX;
        v.y = v.startY;
        v.z = v.startZ;
        v.velocity = THREE.MathUtils.randInt(50, 300);
      }
    });

    this.nucleus.geometry.verticesNeedUpdate = true;
    this.nucleus.geometry.normalsNeedUpdate = true;
    this.nucleus.geometry.computeVertexNormals();
    this.nucleus.geometry.computeFaceNormals();
    this.nucleus.rotation.y += 0.002;

    this.sphereBg.rotation.x += 0.002;
    this.sphereBg.rotation.y += 0.002;
    this.sphereBg.rotation.z += 0.002;

    this.stars.geometry.verticesNeedUpdate = true;

    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }
}
