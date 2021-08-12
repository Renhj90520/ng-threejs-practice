import { Component, ElementRef, OnInit } from '@angular/core';
import { Elastic } from 'gsap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import chroma from 'chroma-js';
import * as gsap from 'gsap';
import { Reflector } from 'three/examples/jsm/objects/Reflector';
@Component({
  selector: 'app-yoyo',
  templateUrl: './yoyo.component.html',
  styleUrls: ['./yoyo.component.css'],
})
export class YoyoComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  controls: OrbitControls;
  width;
  height;

  container: THREE.Object3D;
  dividers = [];
  meshes = [];
  animatedMeshes = [];
  totalMeshes = 32;
  easing = Elastic.easeOut.config(1.5, 0.4);
  colorsGradient = {
    firstColor: '#4b08ba',
    secondColor: '#f7ff50',
    steps: 32,
  };

  colors;
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.updateGradientsSteps();
    this.container = new THREE.Object3D();
    this.initTHREE();
    this.addGrid();
    this.addLights();
    this.addFloor();
    this.addBoxes();
    this.addMirror();
    this.startAnimations();
    this.render();
  }
  addMirror() {
    const geo = new THREE.PlaneBufferGeometry(5, 3);

    const mirror = new Reflector(geo, {
      clipBias: 0,
      textureWidth: this.width * window.devicePixelRatio,
      textureHeight: this.height * window.devicePixelRatio,
    });

    mirror.position.set(2, 1, 0);
    mirror.rotateY(-Math.PI / 2);
    this.scene.add(mirror);
  }
  startAnimations() {
    this.animatedMeshes.forEach((mesh, index) => {
      gsap.TweenLite.to(mesh.rotation, 2, {
        onComplete: (index) => {
          if (index === this.animatedMeshes.length - 1) {
            this.reverseAnimations();
          }
        },
        onCompleteParams: [index],
        z: THREE.MathUtils.degToRad(-90),
        delay: index * 0.05,
        ease: this.easing,
      });
    });
  }
  reverseAnimations() {
    this.animatedMeshes.reverse();
    this.animatedMeshes.forEach((mesh, index) => {
      gsap.TweenLite.to(mesh.rotation, 2, {
        onComplete: (index) => {
          if (index === this.animatedMeshes.length - 1) {
            this.animatedMeshes.reverse();
            this.startAnimations();
          }
        },
        onCompleteParams: [index],
        z: THREE.MathUtils.degToRad(0),
        delay: index * 0.05,
        ease: this.easing,
      });
    });
  }
  addBoxes() {
    this.meshes = [];
    this.animatedMeshes = [];

    for (let i = 0; i < this.totalMeshes; i++) {
      const boxMesh = this.getBoxMesh();
      boxMesh.position.z = -(i * 0.1);
      this.meshes[i] = boxMesh;
      this.animatedMeshes[i] = boxMesh;
      this.container.add(boxMesh);
    }

    this.scene.add(this.container);
    this.updateColors();

    this.container.position.z = this.container.children.length * 0.05;
  }
  updateColors() {
    this.colors = chroma
      .scale([this.colorsGradient.firstColor, this.colorsGradient.secondColor])
      .mode('lch')
      .colors(this.colorsGradient.steps);

    let colorIdx = -1;

    for (let i = 0; i < this.totalMeshes; i++) {
      const boxMesh = this.meshes[i];
      if (i % Math.round(this.totalMeshes / this.colorsGradient.steps) === 0) {
        colorIdx++;
      }
      boxMesh.material.color = new THREE.Color(this.colors[colorIdx]);
    }
  }
  getBoxMesh() {
    const geo = new THREE.BoxGeometry(1, 1, 0.1);

    const mat = new THREE.MeshPhongMaterial({
      specular: 0x111111,
      shininess: 100,
      emissive: 0x000000,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 1, 0);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    return mesh;
  }
  addFloor() {
    const planeGeo = new THREE.PlaneBufferGeometry(500, 500);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const floor = new THREE.Mesh(planeGeo, shadowMat);

    floor.rotateX(-Math.PI / 2);
    floor.position.y = 0.1;
    floor.receiveShadow = true;

    this.scene.add(floor);
  }
  addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff);
    light.castShadow = true;
    light.position.set(0, 35, 0);
    light.shadow.camera.far = 50;
    light.shadow.camera.left = -5;
    light.shadow.camera.right = 5;
    light.shadow.camera.top = 5;
    light.shadow.camera.left = -5;
    light.shadow.camera.zoom = 1;

    const targetObj = new THREE.Object3D();
    targetObj.position.set(0, 0, 0);
    light.target = targetObj;
    this.scene.add(light);
    this.scene.add(targetObj);
  }
  addGrid() {
    const gridHelper = new THREE.GridHelper(50, 75);
    gridHelper.position.set(0, 0, 0);
    const gridMaterial = gridHelper.material as THREE.Material;
    gridMaterial.opacity = 1;
    gridMaterial.transparent = false;

    this.scene.add(gridHelper);
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      20,
      this.width / this.height,
      1,
      1000
    );
    this.camera.position.set(-10, 10, 10);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(70);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.04;
  }

  updateGradientsSteps() {
    this.dividers = [];
    for (let i = 0; i < this.totalMeshes; i++) {
      if (this.totalMeshes % i === 0) {
        this.dividers.push(i);
      }
    }
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }
}
