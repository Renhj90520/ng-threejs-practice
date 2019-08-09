import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { LegacyJSONLoader } from 'three/examples/jsm/loaders/deprecated/LegacyJSONLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
@Component({
  selector: 'app-flexware',
  templateUrl: './flexware.component.html',
  styleUrls: ['./flexware.component.css']
})
export class FlexwareComponent implements OnInit {
  scene;
  camera;
  renderer;
  clock = new THREE.Clock();
  time = 0;
  duration = 100;
  keyframes = 4;
  interpolation = this.duration / this.keyframes;
  currentKeyframe = 0;
  lastKeyframe = 0;
  animOffset = 1;
  radius = 250;
  segments = 32;
  theta = 0;
  prevTime = Date.now();
  animation: any;
  morph_logic: any;
  baseMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    flatShading: true,
    side: THREE.DoubleSide
  });
  couch: THREE.Mesh;
  controls: OrbitControls;
  tv_monitor: THREE.Mesh;
  screen_mesh: THREE.Mesh;
  screen: THREE.Mesh;
  kid: THREE.SkinnedMesh;
  circle: THREE.Mesh;
  bookShelf: THREE.Object3D;
  bookShelfFloor: THREE.Mesh;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addLights();
    this.loadCouch();
    this.loadTVMonitor();
    this.loadTV();
    this.loadLamp();
    this.loadKid();
    this.addCircle();
    this.addParticles();
    this.addBookShelf();
    this.update();
  }
  addBookShelf() {
    this.bookShelf = new THREE.Object3D();
    const bookShelfGeo = new THREE.BoxGeometry(1.5, 78, 15);

    const shelf_l = new THREE.Mesh(bookShelfGeo, this.baseMaterial);
    const shelf_r = new THREE.Mesh(bookShelfGeo, this.baseMaterial);

    shelf_l.receiveShadow = true;
    shelf_l.castShadow = true;
    shelf_l.position.y = 10;
    this.bookShelf.add(shelf_l);

    shelf_r.receiveShadow = true;
    shelf_r.castShadow = true;
    shelf_r.position.x = 32;
    shelf_r.position.y = 10;
    this.bookShelf.add(shelf_r);

    const bookShelfFloorGeo = new THREE.BoxGeometry(30, 1.5, 14);
    this.bookShelfFloor = new THREE.Mesh(bookShelfFloorGeo, this.baseMaterial);
    this.bookShelfFloor.position.x = 16;
    this.bookShelfFloor.position.z = -0.5;

    const floors = [];
    for (let i = 0; i < 7; i++) {
      floors[i] = new THREE.Mesh(bookShelfFloorGeo, this.baseMaterial);
      floors[i].position.x = 16;
      floors[i].position.y = -24 + i * 12;
      floors[i].position.z = -0.5;
      floors[i].position.receiveShadow = true;
      floors[i].position.castShadow = true;
      this.bookShelf.add(floors[i]);
    }

    const books = [];
    let bookCount = 0;
    const bookGeo = new THREE.BoxGeometry(2, 7.5, 10);

    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 12; j++) {
        books[bookCount] = new THREE.Mesh(bookGeo, this.baseMaterial);
        books[bookCount].position.x = 5 + j * 2.25;
        books[bookCount].position.y = -20 + i * 12;
        books[bookCount].position.z = Math.random() * 2.0;
        books[bookCount].position.x = 5 + j * 2.25;
        books[bookCount].rotation.y = Math.random() * 0.25;
        books[bookCount].rotation.z = Math.random() * 0.05;
        books[bookCount].receiveShadow = true;
        books[bookCount].castShadow = true;
        this.bookShelf.add(books[bookCount]);
        bookCount++;
      }
    }

    this.bookShelf.position.set(70, 8, -20);
    this.bookShelf.rotation.y = (90 * Math.PI) / 180;

    this.scene.add(this.bookShelf);

    const secondShelf = this.bookShelf.clone();
    secondShelf.position.z = 16;
    this.scene.add(secondShelf);
  }
  addParticles() {
    const particles = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
      opacity: 0.25
    });
    const vertices = new Float32Array(1500);
    for (let i = 0; i < 500; i++) {
      vertices[i * 3] = (Math.random() - 0.5) * Math.sin(i) * 200;
      vertices[i * 3 + 1] = (Math.random() - 0.5) * Math.cos(i) * 200;
      vertices[i * 3 + 2] = (Math.random() - 0.5) * Math.sin(i) * 200;
    }
    particles.addAttribute('position', new THREE.Float32Attribute(vertices, 3));

    const particleSys = new THREE.Points(particles, particleMaterial);
    this.scene.add(particleSys);
  }
  addCircle() {
    this.circle = new THREE.Mesh(
      new THREE.CircleGeometry(this.radius, this.segments)
    );
    this.circle.add(this.camera);
    this.circle.visible = false;
    this.scene.add(this.circle);
  }
  loadKid() {
    const loader = new LegacyJSONLoader();
    loader.load('/assets/little_kid.json', (geometry: any) => {
      console.log(geometry);
      const kidMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        flatShading: true,
        morphTargets: true
      });

      const kidGeo = new THREE.BufferGeometry().fromGeometry(geometry);
      kidGeo.addAttribute(
        'skinIndex',
        new THREE.Uint16BufferAttribute(geometry.skinIndex, 4)
      );
      kidGeo.addAttribute(
        'skinWeight',
        new THREE.Float32BufferAttribute(geometry.skinWeight, 4)
      );
      console.log(kidGeo);
      this.kid = new THREE.SkinnedMesh(kidGeo, kidMaterial);
      this.kid.scale.set(20, 20, 20);
      this.kid.receiveShadow = true;
      this.kid.castShadow = true;
      this.kid.position.y = -20;
      const bones = [];
      geometry.bones.forEach(b => {
        const bone = new THREE.Bone();
        bone.position.set(b.pos[0], b.pos[1], b.pos[2]);
        bones.push(bone);
      });

      const skeleton = new THREE.Skeleton(bones);
      const rootBone = skeleton.bones[0];
      this.kid.add(rootBone);
      this.kid.bind(skeleton);
      this.scene.add(this.kid);
      console.log(this.kid);
      this.animation = new THREE.AnimationMixer(this.kid);
      this.animation.duration = 500;
    });
  }
  loadLamp() {
    const loader = new LegacyJSONLoader();
    loader.load('/assets/lamp.json', (geometry: any) => {
      this.screen = new THREE.Mesh(geometry, this.baseMaterial);
      this.screen.scale.set(20, 20, 20);
      this.screen.receiveShadow = true;
      this.screen.castShadow = true;
      this.screen.position.y = -20;
      this.scene.add(this.screen);
    });
  }
  loadTV() {
    const loader = new LegacyJSONLoader();
    loader.load('/assets/tv.json', (geometry: any) => {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
      });

      const uvs = geometry.faceVertexUvs[0];
      uvs[0][0].set(0, 0);
      uvs[0][1].set(1, 0);
      uvs[0][2].set(1, 1);

      uvs[1][0].set(1, 0);
      uvs[1][1].set(1, 1);
      uvs[1][2].set(0, 1);

      this.screen_mesh = new THREE.Mesh(geometry, material);
      this.screen_mesh.scale.set(20, 20, 20);
      this.screen_mesh.position.y = -20;
      this.scene.add(this.screen_mesh);
    });
  }
  loadTVMonitor() {
    const loader = new LegacyJSONLoader();
    loader.load('/assets/tv_monitor.json', (geometry: any) => {
      this.tv_monitor = new THREE.Mesh(geometry, this.baseMaterial);
      this.tv_monitor.scale.set(20, 20, 20);
      this.tv_monitor.receiveShadow = true;
      this.tv_monitor.position.y = -20;
      this.scene.add(this.tv_monitor);
    });
  }
  loadCouch() {
    const loader = new LegacyJSONLoader();
    loader.load('/assets/couch.json', (geometry: any) => {
      this.couch = new THREE.Mesh(geometry, this.baseMaterial);
      this.couch.scale.set(20, 20, 20);
      this.couch.receiveShadow = true;
      this.couch.castShadow = true;
      this.couch.position.y = -20;
      this.scene.add(this.couch);
    });
  }
  addLights() {
    const ambientLight = new THREE.AmbientLight(0x111111);
    this.scene.add(ambientLight);

    const tv = new THREE.SpotLight(0x1a5970, 2);
    tv.position.set(15, 15, 68).multiplyScalar(1);
    this.scene.add(tv);

    const fakeLight = new THREE.SpotLight(0x1a5970, 15, 200, Math.PI / 2);
    fakeLight.position.set(15, 150, 268);
    fakeLight.castShadow = true;
    fakeLight.shadow.mapSize.width = 1024 * 2;
    fakeLight.shadow.mapSize.height = 1024 * 2;
    fakeLight.target.position.set(-20, 20, -50);
    fakeLight.target.updateMatrixWorld();
    this.scene.add(fakeLight);

    const d = 350;
    const fakeLight1: any = new THREE.SpotLight(0xf0c043, 2);
    fakeLight1.shadow.camera.left = -d;
    fakeLight1.shadow.camera.right = d;
    fakeLight1.shadow.camera.top = d * 2.8;
    fakeLight1.shadow.camera.bottom = -d;
    fakeLight1.shadow.camera.near = 0.01;

    const lampLight = new THREE.SpotLight(0xf0c043, 0.25);
    lampLight.position.set(-55, 50, -50);
    lampLight.target.position.set(-55, 0, -50);
    lampLight.target.updateMatrixWorld();
    this.scene.add(lampLight);
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 10000);
    this.camera.position.set(-305, 55, -65);
    this.camera.lookAt(new THREE.Vector3(0, 50, 0));

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  update() {
    this.theta += 0.1;
    const delta = 0.75 * this.clock.getDelta();

    if (this.animation) {
      const keyframe =
        Math.floor(this.time / this.interpolation) + this.animOffset;
      this.animation.update(delta / this.interpolation);

      this.time = Date.now();
      this.prevTime = this.time;
    }
    this.renderer.render(this.scene, this.camera);

    this.circle.rotation.y += 0.003;
    this.controls.update();
    requestAnimationFrame(this.update.bind(this));
  }
}
