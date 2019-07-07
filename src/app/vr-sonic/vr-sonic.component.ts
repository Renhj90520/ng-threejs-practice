import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { points } from './points';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TweenLite, Power4 } from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
@Component({
  selector: 'app-vr-sonic',
  templateUrl: './vr-sonic.component.html',
  styleUrls: ['./vr-sonic.component.css']
})
export class VrSonicComponent implements OnInit {
  @ViewChild('threecontainer') threeContainer;
  @ViewChild('info') infoEl;
  scene;
  camera;
  renderer;
  width;
  height;
  cameraTarget: THREE.Vector3;
  group: THREE.Group;
  mixer: THREE.AnimationMixer;
  carPath: THREE.CatmullRomCurve3;
  meshList = [];
  percentage = 0;
  clock: THREE.Clock;
  fallAnim: NodeJS.Timer;
  composer: any;
  constructor() {}
  ngOnInit() {
    this.initThree();
    this.addTube();
    this.addLights();
    this.addCubes();
    this.addSkyIsland();
    this.addSonic();
    this.addCircles();
    this.setupShaderBloom();
    this.update();
  }
  setupShaderBloom() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const effectFXAA = new ShaderPass(FXAAShader);

    effectFXAA.uniforms['resolution'].value.set(
      1 / this.width,
      1 / this.height
    );

    const copyShader = new ShaderPass(CopyShader);
    copyShader.renderToScreen = true;

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      1.0,
      1.0,
      0.45
    );
    const renderScene = new RenderPass(this.scene, this.camera);
    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(this.width, this.height);
    this.composer.addPass(renderScene);
    this.composer.addPass(effectFXAA);
    this.composer.addPass(bloomPass);
    this.composer.addPass(copyShader);
  }
  addCircles() {
    for (let i = 0; i < this.carPath.points.length; i++) {
      const p = this.carPath.points[i];
      const geometry = new THREE.TorusGeometry(3, 0.5, 8, 50);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color('yellow')
      });

      const circle = new THREE.Mesh(geometry, material);
      circle.position.set(p.x, p.y + 0.75, p.z);
      circle.scale.set(0.05, 0.05, 0.05);
      this.meshList.push(circle);
      this.scene.add(circle);
    }
  }
  addSonic() {
    const loader = new GLTFLoader();
    loader.load('/assets/sonic.glb', gltf => {
      gltf.scene.traverse(node => {
        if (node instanceof THREE.Mesh) {
          node.castShadow = true;
          (node.material as THREE.Material).side = THREE.DoubleSide;
        }
      });

      const firstObj = gltf.scene;
      firstObj.scale.set(0.65, 0.65, 0.65);
      this.group.add(firstObj);

      this.mixer = new THREE.AnimationMixer(firstObj);
      this.mixer.clipAction(gltf.animations[0]).play();

      const jump = () => {
        if (this.fallAnim) clearTimeout(this.fallAnim);
        this.mixer.clipAction(gltf.animations[0]).stop();
        this.mixer.clipAction(gltf.animations[1]).play();

        this.fallAnim = setTimeout(() => {
          this.mixer.clipAction(gltf.animations[1]).stop();
          this.mixer.clipAction(gltf.animations[0]).play();
        }, 900);
      };
      this.threeContainer.nativeElement.addEventListener('click', jump);
    });
  }
  addSkyIsland() {
    const loader = new GLTFLoader();
    loader.load('/assets/sky-island.glb', gltf => {
      gltf.scene.traverse(node => {
        if (node instanceof THREE.Mesh) {
          node.castShadow = true;
          (node.material as THREE.Material).side = THREE.DoubleSide;
        }
        const model = gltf.scene;
        model.scale.set(3, 3, 3);
        model.position.set(0, -20, -10);
        this.scene.add(model);
      });
    });
  }
  addCubes() {
    const mergedGeo = new THREE.Geometry();
    const boxGeo = new THREE.TetrahedronGeometry(0.25, 0);
    const material = new THREE.MeshNormalMaterial();
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 125 - 75;
      const y = Math.random() * 125 - 75;
      const z = Math.random() * 125 - 75;

      boxGeo.translate(x, y, z);
      mergedGeo.merge(boxGeo);
      boxGeo.translate(-x, -y, -z);
    }

    const cubes = new THREE.Mesh(mergedGeo, material);
    this.scene.add(cubes);
  }
  addLights() {
    const light = new THREE.DirectionalLight(0xefefff, 1.25);
    light.position.set(1, 1, 1).normalize();
    this.scene.add(light);

    const light1 = new THREE.DirectionalLight(0xffefef, 1.25);
    light1.position.set(-1, -1, -1).normalize();
    this.scene.add(light1);

    // create a point light in scene. Makes everything gloomy.
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    this.scene.add(pointLight);
  }
  addTube() {
    const vertices = [];
    let scale = 5;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const x = p[0] * scale;
      const y = p[1] * scale;
      const z = p[2] * scale;

      vertices.push(new THREE.Vector3(x, z, -y));
    }

    this.carPath = new THREE.CatmullRomCurve3(vertices);
    let radius = 0.25;

    const geometry = new THREE.TubeGeometry(
      this.carPath,
      600,
      radius,
      10,
      false
    );

    for (let i = 0; i < geometry.faces.length; i++) {
      geometry.faces[i].color = new THREE.Color(
        `hsl(${Math.floor(Math.random() * 290)},50%,50%)`
      );
    }

    const material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      vertexColors: THREE.FaceColors,
      transparent: true,
      opacity: 1
    });

    const tube = new THREE.Mesh(geometry, material);
    this.scene.add(tube);
  }
  initThree() {
    this.scene = new THREE.Scene();
    this.width = this.threeContainer.nativeElement.clientWidth;
    this.height = this.threeContainer.nativeElement.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xd8e7ff, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.threeContainer.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      1,
      10000
    );

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.clock = new THREE.Clock();
  }
  POV() {
    this.percentage += 0.00045;
    const p2 = this.carPath.getPointAt((this.percentage + 0.01) % 1);
    const p3 = this.carPath.getPointAt((this.percentage + 0.01 / 2) % 1);
    const p4 = this.carPath.getPointAt((this.percentage + 0.01 / 4) % 1);
    this.camera.lookAt(p2);

    this.group.position.set(p3.x, p3.y + 0.25, p3.z);
    this.group.lookAt(p2);

    this.camera.position.x = p4.x + 2;
    this.camera.position.y = p4.y + 1;
    this.camera.position.z = p4.z + 2;
    this.camera.lookAt(this.group.position);
  }
  hit() {
    const firstBB = new THREE.Box3().setFromObject(this.group);

    for (let i = 0; i < this.meshList.length; i++) {
      const secObj = this.meshList[i];
      const secondBB = new THREE.Box3().setFromObject(secObj);
      if (firstBB.intersectsBox(secondBB)) {
        this.infoEl.nativeElement.style.color = `hsl(${Math.floor(
          Math.random() * 290
        )},50%,50%)`;

        this.infoEl.nativeElement.innerHTML =
          Math.random() > 0.25
            ? 'Superb!'
            : Math.random() > 0.25
            ? 'Outstanding!'
            : 'Awesome!';

        TweenLite.to(this.infoEl.nativeElement, 0.75, {
          css: { fontSize: '50px', opacity: 1 },
          ease: Power4.easeOut,
          onComplete: () => {
            TweenLite.to(this.infoEl.nativeElement, 0.75, {
              css: { fontSize: '14px', opacity: 0 },
              ease: Power4.easeOut
            });
          }
        });
      }
    }
  }
  update() {
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
    this.POV();
    this.hit();
    const delta = this.clock.getDelta();
    if (this.mixer) {
      this.mixer.update(delta);
    }
    requestAnimationFrame(this.update.bind(this));
  }
}
