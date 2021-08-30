import { Component, ElementRef, OnInit } from '@angular/core';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler';
import Spike from './spike';
import * as SimplexNoise from 'simplex-noise';
import * as gsap from 'gsap';
@Component({
  selector: 'app-beating-heart',
  templateUrl: './beating-heart.component.html',
  styleUrls: ['./beating-heart.component.css'],
})
export class BeatingHeartComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  width;
  height;
  controls: TrackballControls;
  group: THREE.Group;

  spikes = [];
  positions = [];
  beat = { a: 0 };
  geometry: THREE.BufferGeometry;
  heart: THREE.Mesh;
  originHeart: number[];
  simplexNoise = new SimplexNoise();
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.initTHREE();
    this.addHeart();
    const timeline = new gsap.TimelineMax();
    timeline.repeat(-1);
    timeline.repeatDelay(0.3);
    timeline
      .to(this.beat, 0.6, { a: 1.2, ease: gsap.Power2.easeIn })
      .to(this.beat, 0.6, { a: 0, ease: gsap.Power3.easeOut });
    const tween = new gsap.TweenMax(this.group.rotation, 12, {
      y: Math.PI * 2,
    });
    tween.repeat(-1);
  }
  addHeart() {
    this.group = new THREE.Group();
    this.scene.add(this.group);
    const loader = new OBJLoader();
    loader.load('/assets/heart.obj', (obj) => {
      this.heart = obj.children[0] as THREE.Mesh;
      this.heart.geometry.rotateX(-Math.PI * 0.5);
      this.heart.geometry.scale(0.04, 0.04, 0.04);
      this.heart.geometry.translate(0, -0.4, 0);

      this.heart.material = new THREE.MeshBasicMaterial({ color: 0xff5555 });

      this.group.add(this.heart);

      this.originHeart = Array.from(
        this.heart.geometry['attributes'].position.array
      );
      const sampler = new MeshSurfaceSampler(this.heart).build();
      for (let i = 0; i < 20000; i++) {
        const spike = new Spike(sampler);
        this.spikes.push(spike);
      }

      this.renderer.setAnimationLoop(this.render.bind(this));
    });

    this.geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
    });

    const lines = new THREE.LineSegments(this.geometry, material);
    this.group.add(lines);
  }

  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xff5555);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new TrackballControls(
      this.camera,
      this.renderer.domElement
    );

    this.controls.noPan = true;
    this.controls.maxDistance = 3;
    this.controls.minDistance = 0.7;
  }

  render(a) {
    this.positions = [];
    this.spikes.forEach((s: Spike) => {
      s.update(a, this.beat);
      this.positions.push(s.one.x, s.one.y, s.one.z);
      this.positions.push(s.two.x, s.two.y, s.two.z);
    });

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(this.positions), 3)
    );

    const vs = this.heart.geometry['attributes'].position.array;

    for (let i = 0; i < vs.length.length; i += 3) {
      const v = new THREE.Vector3(
        this.originHeart[i],
        this.originHeart[i + 1],
        this.originHeart[i + 2]
      );

      const noise =
        this.simplexNoise.noise4D(
          this.originHeart[i] * 1.5,
          this.originHeart[i + 1] * 1.5,
          this.originHeart[i + 2] * 1.5,
          a * 0.0005
        ) + 1;

      v.multiplyScalar(1 + noise * 0.15 * this.beat.a);
      vs[i] = v.x;
      vs[i + 1] = v.y;
      vs[i + 2] = v.z;
    }

    this.heart.geometry['attributes'].position.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }
}
