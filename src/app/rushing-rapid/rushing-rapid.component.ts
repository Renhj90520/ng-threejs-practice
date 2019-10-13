import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { Colors } from './colors';
import { customizeShadow } from './utils';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Tree from './tree';
import { RaceOperator } from 'rxjs/internal/observable/race';
import Drop from './drop';

@Component({
  selector: 'app-rushing-rapid',
  templateUrl: './rushing-rapid.component.html',
  styleUrls: ['./rushing-rapid.component.css']
})
export class RushingRapidComponent implements OnInit {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  drops = [];
  count = 0;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addLights();
    this.addGrassLeft();
    this.addRiver();
    this.addGrassRight();
    this.addTrees();
    this.addBridge();
    this.update();
  }
  addBridge() {
    const woodMat = new THREE.MeshLambertMaterial({ color: Colors.brown });

    for (let i = 0; i < 6; i++) {
      const blockGeo = new THREE.BoxGeometry(0.15, 0.02, 0.4);
      const block = new THREE.Mesh(blockGeo, woodMat);
      block.position.set(0.2 * i, 0.21, 0.2);
      block.castShadow = true;
      block.receiveShadow = true;
      this.scene.add(block);
    }

    const railVGeo = new THREE.BoxGeometry(0.04, 0.3, 0.04);
    const rail1 = new THREE.Mesh(railVGeo, woodMat);
    rail1.position.set(-0.1, 0.35, 0.4);
    rail1.castShadow = true;
    customizeShadow(this.scene, rail1, 0.2);
    this.scene.add(rail1);

    const rail2 = new THREE.Mesh(railVGeo, woodMat);
    rail2.position.set(1.1, 0.35, 0.4);
    rail2.castShadow = true;
    customizeShadow(this.scene, rail2, 0.2);
    this.scene.add(rail2);

    const rail3 = new THREE.Mesh(railVGeo, woodMat);
    rail3.position.set(-0.1, 0.35, 0.0);
    rail3.castShadow = true;
    customizeShadow(this.scene, rail3, 0.2);
    this.scene.add(rail3);

    const rail4 = new THREE.Mesh(railVGeo, woodMat);
    rail4.position.set(1.1, 0.35, 0);
    rail4.castShadow = true;
    customizeShadow(this.scene, rail4, 0.2);
    this.scene.add(rail4);

    const railHGeo = new THREE.BoxGeometry(1.2, 0.04, 0.04);
    const railH1 = new THREE.Mesh(railHGeo, woodMat);
    railH1.position.set(0.5, 0.42, 0.4);
    railH1.castShadow = true;
    customizeShadow(this.scene, railH1, 0.2);
    this.scene.add(railH1);

    const railH2 = new THREE.Mesh(railHGeo, woodMat);
    railH2.position.set(0.5, 0.42, 0);
    railH2.castShadow = true;
    customizeShadow(this.scene, railH2, 0.2);
    this.scene.add(railH2);
  }
  addTrees() {
    new Tree(-1.75, -0.86, this.scene);
    new Tree(-1.75, -0.15, this.scene);
    new Tree(-1.5, -0.5, this.scene);
    new Tree(-1.5, 0.4, this.scene);
    new Tree(-1.25, -0.85, this.scene);
    new Tree(-1.25, 0.75, this.scene);
    new Tree(-0.75, -0.85, this.scene);
    new Tree(-0.75, -0.25, this.scene);
    new Tree(-0.25, -0.85, this.scene);

    new Tree(1.25, -0.85, this.scene);
    new Tree(1.25, 0.75, this.scene);
    new Tree(1.5, -0.5, this.scene);
    new Tree(1.75, -0.85, this.scene);
    new Tree(1.75, 0.35, this.scene);
  }
  addGrassRight() {
    const geometry = new THREE.BoxGeometry(1, 0.2, 2);
    const material = new THREE.MeshLambertMaterial({
      color: Colors.greenLight
    });
    const ground_right = new THREE.Mesh(geometry, material);
    ground_right.position.set(1.5, 0.1, 0);
    this.scene.add(ground_right);
    customizeShadow(this.scene, ground_right, 0.25);
  }
  addRiver() {
    const riverGeo = new THREE.BoxGeometry(1, 0.1, 2);
    const riverMat = new THREE.MeshLambertMaterial({ color: Colors.blue });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.position.set(0.5, 0.1, 0);
    this.scene.add(river);
    customizeShadow(this.scene, river, 0.08);

    const bedGeo = new THREE.BoxGeometry(1, 0.05, 2);
    const bedMat = new THREE.MeshLambertMaterial({ color: Colors.greenLight });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(0.5, 0.025, 0);
    this.scene.add(bed);
  }
  addGrassLeft() {
    const geometry = new THREE.BoxGeometry(2, 0.2, 2);
    const material = new THREE.MeshLambertMaterial({
      color: Colors.greenLight
    });

    const ground_left = new THREE.Mesh(geometry, material);
    ground_left.position.set(-1, 0.1, 0);
    this.scene.add(ground_left);
    customizeShadow(this.scene, ground_left, 0.25);
  }
  addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const shadowLight = new THREE.DirectionalLight(0xffffff, 0.5);
    shadowLight.position.set(200, 200, 200);
    shadowLight.castShadow = true;
    this.scene.add(shadowLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.2);
    backLight.position.set(-100, 200, 50);
    backLight.castShadow = true;
    this.scene.add(backLight);
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 1000);
    this.camera.position.set(-5, 6, 8);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.el.nativeElement.appendChild(this.renderer.domElement);

    const axesHelper = new THREE.AxesHelper(100);
    this.scene.add(axesHelper);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
    if (this.count % 3 === 0) {
      for (let i = 0; i < 5; i++) {
        this.drops.push(new Drop(this.scene));
      }
    }
    this.count++;
    for (let i = 0; i < this.drops.length; i++) {
      const drop = this.drops[i];
      drop.update();
      if (drop.lifespan < 0) {
        this.scene.remove(this.scene.getObjectById(drop.drop.id));
        this.drops.splice(i, 1);
      }
    }
    requestAnimationFrame(this.update.bind(this));
  }
}
