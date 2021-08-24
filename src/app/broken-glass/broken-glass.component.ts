import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
@Component({
  selector: 'app-broken-glass',
  templateUrl: './broken-glass.component.html',
  styleUrls: ['./broken-glass.component.css'],
})
export class BrokenGlassComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  controls: OrbitControls;
  width;
  height;

  max = 1000;
  glassGeo: THREE.BufferGeometry;
  vertices: any;
  initial: any[];

  vertexShader = `
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    attribute vec3 position;
    attribute vec4 color;

    varying vec3 vPosition;
    varying vec4 vColor;

    void main() {
      vPosition = position;
      vColor = color;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, .2);
    }
  `;

  fragmentShader = `
    precision mediump float;
    precision mediump int;

    varying vec3 vPosition;
    varying vec4 vColor;

    void main() {
      vec4 color = vec4(vColor);
      gl_FragColor = color;
    }
  `;
  move = true;
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.initTHREE();
    this.addGlass();
    this.render();
  }
  addGlass() {
    this.glassGeo = new THREE.BufferGeometry();
    this.vertices = new THREE.BufferAttribute(
      new Float32Array(this.max * 3 * 3),
      3
    );
    this.initial = [];

    for (let i = 0; i < this.vertices.count; i++) {
      const x = Math.random() - 0.5;
      const y = Math.random() - 0.5;
      const z = Math.random() - 0.5;

      this.vertices.setXYZ(i, x, y, z);
    }

    for (let i = 0; i < this.vertices.count; i++) {
      this.initial.push(this.vertices.array[i]);
    }

    this.glassGeo.setAttribute('position', this.vertices);

    const colors = new THREE.BufferAttribute(
      new Float32Array(this.max * 3 * 4),
      4
    );

    for (let i = 0; i < colors.count; i++) {
      colors.setXYZW(i, 0.2, 0.2, 0.2, 0.2);
    }

    this.glassGeo.setAttribute('color', colors);
    console.log(this.glassGeo);
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        time: { value: 1 },
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
    });

    const glass = new THREE.Mesh(this.glassGeo, material);
    this.scene.add(glass);
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      50,
      this.width / this.height,
      1,
      1000
    );

    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(0x000000);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  render() {
    requestAnimationFrame(this.render.bind(this));

    if (this.move) {
      for (let i = 0; i < this.vertices.count; i += 3) {
        const x = this.vertices.array[i];
        const y = this.vertices.array[i + 1];

        const initX = this.initial[i];
        const initY = this.initial[i + 1];

        const plusOrMinus = Math.random() > 0.5 ? 0.00019 : -0.00019;

        this.vertices.array[i] += (initX - x) * 0.08 + plusOrMinus;
        this.vertices.array[i + 1] += (initY - y) * 0.08 + plusOrMinus;
      }
    }

    (this.glassGeo.attributes.position as THREE.BufferAttribute).needsUpdate =
      true;
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }

  @HostListener('click')
  toggleMove() {
    this.move = !this.move;
  }
}
