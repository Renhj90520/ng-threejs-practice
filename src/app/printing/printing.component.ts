import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TimelineMax, Power3, Power4 } from 'gsap';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/Objloader';
@Component({
  selector: 'app-printing',
  templateUrl: './printing.component.html',
  styleUrls: ['./printing.component.css']
})
export class PrintingComponent implements OnInit {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  clipPlanes: THREE.Plane[];
  scanCube: THREE.Mesh;
  clipPlanesWireFrame: THREE.Plane[];
  tl: TimelineMax;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addLights();
    this.addScanCube();
    this.addGameBoy();
    this.update();
  }
  addGameBoy() {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('/assets/');
    mtlLoader.load('GameBoy.mtl', materials => {
      materials.preload();
      const objLoader = new OBJLoader();

      objLoader.setMaterials(materials);
      objLoader.setPath('/assets/');
      objLoader.load('GameBoy.obj', obj => {
        for (const key in materials.materials) {
          const mat: any = materials.materials[key];
          mat.reflectivity = 0.3;
          mat.shininess = 10;
          mat.side = THREE.DoubleSide;
          mat.clippingPlanes = this.clipPlanes;
          mat.clipIntersection = true;
          mat.needsUpdate = true;
        }
        obj.position.set(0, -5.5, -1);
        this.scanCube.position.set(0, 0, -0.75);
        this.scene.add(obj);

        const clone = obj.clone();
        clone.traverse((obj: any) => {
          if (obj.material) {
            obj.material = new THREE.MeshPhongMaterial({
              wireframe: true,
              color: 0x00ff00,
              clippingPlanes: this.clipPlanesWireFrame,
              clipIntersection: false
            });
          }
        });
        this.scene.add(clone);

        this.tl.progress(1);
        this.tl.play();
      });
    });
  }
  addScanCube() {
    const geometry = new THREE.BoxBufferGeometry(9, 0.1, 2);
    const scanMat = new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.9,
      color: 0x44ff44,
      blending: THREE.AdditiveBlending
    });
    this.scanCube = new THREE.Mesh(geometry, scanMat);
    this.scene.add(this.scanCube);
    this.renderer.localClippingEnabled = true;

    this.clipPlanes = [new THREE.Plane(new THREE.Vector3(0, 5.8, 0), 0)];
    const wireClipIn = new THREE.Plane(new THREE.Vector3(0, 5.8, 0), 0);
    const wireClipOut = new THREE.Plane(new THREE.Vector3(0, -5.8, 0), 0);

    this.clipPlanesWireFrame = [wireClipIn, wireClipOut];

    this.tl = new TimelineMax({
      repeat: -1,
      yoyo: true,
      delay: 1,
      repeatDelay: 1
    });

    this.tl.from(this.scanCube.scale, 0.5, {
      x: 0,
      y: 0,
      ease: Power3.easeInOut
    });
    this.tl.fromTo(
      this.scanCube.position,
      2,
      { y: 6.1 },
      { y: -5.9, ease: Power4.easeInOut },
      0
    );
    this.tl.fromTo(
      wireClipIn,
      2,
      { constant: -1 },
      { constant: 1, ease: Power4.easeInOut },
      0
    );

    this.tl.to(
      this.scanCube.scale,
      0.5,
      { x: 0, y: 0, ease: Power3.easeInOut },
      '-=0.5'
    );
    this.tl.addLabel('fillIn', '+=1');

    this.tl.to(
      this.scanCube.scale,
      0.5,
      { x: 1, y: 1, ease: Power3.easeInOut },
      'fillIn'
    );

    this.tl.fromTo(
      this.scanCube.position,
      2,
      { y: 6.1 },
      { y: -5.9, ease: Power3.easeInOut },
      'fillIn'
    );

    this.tl.fromTo(
      this.clipPlanes,
      2,
      { constant: -1 },
      { constant: 1, ease: Power4.easeInOut },
      'fillIn'
    );
    this.tl.to(
      this.scanCube.scale,
      0.5,
      { x: 0, ease: Power3.easeInOut },
      '-=0.5'
    );
  }
  addLights() {
    const light1 = new THREE.PointLight(0xffffcc, 4, 65);
    light1.position.set(0, 20, 40);
    this.scene.add(light1);

    const light2 = new THREE.AmbientLight(0x20202a, 6);
    this.scene.add(light2);
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(80, width / height, 0.1, 800);
    this.camera.position.set(0, 0, 14);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000);
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = Math.pow(0.94, 5.0);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.rotateSpeed = 0.3;
    this.controls.zoomSpeed = 0.9;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 20;
    this.controls.enabled = true;
    this.controls.dampingFactor = 0.05;
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
    requestAnimationFrame(this.update.bind(this));
  }

  @HostListener('window:resize')
  resize() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
