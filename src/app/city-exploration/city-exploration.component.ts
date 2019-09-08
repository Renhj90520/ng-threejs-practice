import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TweenMax, Elastic } from 'gsap';
@Component({
  selector: 'app-city-exploration',
  templateUrl: './city-exploration.component.html',
  styleUrls: ['./city-exploration.component.css']
})
export class CityExplorationComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  Theme = {
    primary: 0xffffff,
    secondary: 0x00ffff,
    background: 0x0055ff,
    darker: 0xf000f0
  };
  light: THREE.SpotLight;
  primitive: any;
  controls: OrbitControls;
  plane: any;
  gridHelper: THREE.GridHelper;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addLights();
    this.addGrid();
    this.addPrimitive();
    this.addNav();
    this.update();
  }
  addNav() {
    this.plane = new THREE.Group();
    const mesh_mat = new THREE.MeshPhongMaterial({
      color: this.Theme.background,
      side: THREE.DoubleSide,
      flatShading: true
    });

    const mesh_geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const mesh_pri = new THREE.Mesh(mesh_geo, mesh_mat);
    mesh_pri.castShadow = true;
    mesh_pri.receiveShadow = true;

    const plane_geo = new THREE.OctahedronGeometry(0.43, 1);
    const plane_mat = new THREE.MeshPhongMaterial({
      color: this.Theme.background,
      side: THREE.DoubleSide,
      flatShading: true
    });

    const plane_mesh = new THREE.Mesh(plane_geo, plane_mat);

    plane_mesh.castShadow = true;
    plane_mesh.receiveShadow = true;

    plane_mesh.scale.set(0, 0, 0);
    mesh_pri.scale.set(0, 0, 0);

    TweenMax.to(plane_mesh.scale, 1, {
      x: 1,
      y: 1,
      z: 1,
      repeat: -1,
      yoyo: true,
      ease: Elastic.easeInOut
    });

    TweenMax.to(mesh_pri.scale, 1, {
      x: 1,
      y: 1,
      z: 1,
      repeat: -1,
      yoyo: true,
      delay: 1,
      ease: Elastic.easeInOut
    });

    this.plane.add(plane_mesh);
    this.plane.add(mesh_pri);
    this.plane.position.z = 0.5;
    this.scene.add(this.plane);
  }
  addPrimitive() {
    this.primitive = new THREE.Group();
    const mesh_mat = new THREE.MeshPhysicalMaterial({
      color: this.Theme.darker,
      flatShading: true
    });

    const mesh_wat = new THREE.MeshBasicMaterial({
      color: this.Theme.secondary,
      wireframe: true
    });

    for (let i = 0; i < 30; i++) {
      const s = Math.abs(2 + this.random(3));
      const t = 0.9;
      const mesh_geo = new THREE.BoxGeometry(t, s, t);
      const mesh_pri: any = new THREE.Mesh(mesh_geo, mesh_mat);
      const mesh_wir = new THREE.Mesh(mesh_geo, mesh_wat);

      mesh_pri.castShadow = true;
      mesh_pri.receiveShadow = true;
      mesh_pri.position.y = s - mesh_pri.geometry.parameters.height / 2;
      mesh_pri.add(mesh_wir);
      this.primitive.add(mesh_pri);
    }
    this.primitive.position.y = 0;
    this.scene.add(this.primitive);
  }
  random(num = 10) {
    return -Math.random() * num + Math.random() * num;
  }
  addGrid() {
    this.gridHelper = new THREE.GridHelper(30, 100, 0x888888, 0x888888);
    this.gridHelper.position.y = 0;
    this.scene.add(this.gridHelper);

    const plane_geo = new THREE.PlaneGeometry(50, 50);
    const plane_mat = new THREE.MeshLambertMaterial({
      color: this.Theme.darker
    });
    const plane = new THREE.Mesh(plane_geo, plane_mat);
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = (-90 * Math.PI) / 180;
    this.scene.add(plane);
  }

  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(this.Theme.background, 5, 20);
    this.scene.background = new THREE.Color(this.Theme.background);

    this.camera = new THREE.PerspectiveCamera(20, width / height, 1, 1000);
    this.camera.position.set(7, 5, 7);
    this.camera.rotation.x = (30 * Math.PI) / 180;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.needsUpdate = true;

    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  addLights() {
    const ambientLight = new THREE.HemisphereLight(
      this.Theme.primary,
      this.Theme.background,
      2
    );
    this.scene.add(ambientLight);

    this.light = new THREE.SpotLight(this.Theme.primary, 1, 200);
    this.light.castShadow = true;
    this.light.shadow.mapSize.width = 8000;
    this.light.shadow.mapSize.height = 8000;
    this.light.penumbra = 0.8;
    this.light.position.set(10, 20, 20);
    this.scene.add(this.light);
  }
  update() {
    const a = 20;
    const v = 0.1;
    const time = Date.now() * 0.003;
    for (let i = 0; i < this.primitive.children.length; i++) {
      const obj = this.primitive.children[i];
      obj.position.z += v;
      if (obj.position.z > 10) {
        obj.position.z = -20 + Math.round(this.random());
        obj.position.x = Math.round(this.random());
      }
    }

    this.plane.position.x = Math.sin(time / 2.3) * (a / 10);
    this.plane.position.y = Math.cos(time / 2) * (a / 15) + 2;
    this.plane.rotation.z = (Math.sin(time / 2.3) * a * Math.PI) / 180;
    this.plane.rotation.y = (-Math.cos(time / 2.3) * a * Math.PI) / 180;
    this.plane.rotation.x += 0.1;

    this.light.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
    this.camera.lookAt(this.plane.position);

    this.gridHelper.position.z += v;
    if (this.gridHelper.position.z >= 1) this.gridHelper.position.z = 0.1;
    this.controls.update();
    requestAnimationFrame(this.update.bind(this));
  }
}
