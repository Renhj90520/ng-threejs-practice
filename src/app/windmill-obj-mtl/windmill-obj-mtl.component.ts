import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import OrbitControls from '../controls/OrbitControls';
import { OBJLoader2 } from '../loaders/OBJLoader2';
@Component({
  selector: 'app-windmill-obj-mtl',
  templateUrl: './windmill-obj-mtl.component.html',
  styleUrls: ['./windmill-obj-mtl.component.css']
})
export class WindmillObjMtlComponent implements OnInit {
  scene;
  camera;
  renderer;
  width;
  height;
  controls;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initThreee();
    this.addPlane();
    this.addLights();
    this.addWindmill();
    this.update();
  }

  initThreee() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      100
    );
    this.camera.position.set(0, 10, 20);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(0x000000);
    this.renderer.setSize(this.width, this.height);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 5, 0);
  }

  addPlane() {
    const planeSize = 4000;
    const loader = new THREE.TextureLoader();
    const texture = loader.load('assets/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 200;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = Math.PI * -0.5;
    this.scene.add(plane);
  }

  addLights() {
    const skyColor = 0xb1e1ff;
    const groundColor = 0xb97a20;
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    this.scene.add(light);

    const dLight = new THREE.DirectionalLight(0xffffff, 1);
    dLight.position.set(5, 10, 2);
    this.scene.add(dLight);
    this.scene.add(dLight.target);
  }

  addWindmill() {
    const objLoader = new OBJLoader2();
    objLoader._loadMtl();
  }
  update() {
    requestAnimationFrame(this.update.bind(this));
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }
}
