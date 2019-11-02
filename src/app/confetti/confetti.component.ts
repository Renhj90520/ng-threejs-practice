import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
  selector: 'app-confetti',
  templateUrl: './confetti.component.html',
  styleUrls: ['./confetti.component.css']
})
export class ConfettiComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  vertexShader = `
    //delay and duration are used to calculate animation progress (0-1) for each vertex
    attribute vec2 aAnimation;
    //movement delta
    attribute vec3 aTranslation;
    //first control point for cubic bezier path
    attribute vec3 aControlPoint0;
    //second control point for cubic bezier path
    attribute vec3 aControlPoint1;
    //arbitrary normalized axis (x,y,z) and rotation (w) for quaternian rotation
    attribute vec4 aAxisAngle;
    //front vertex color
    attribute vec3 aFrontColor;
    //back vertex color
    attribute vec3 aBackColor;

    //time passed from the cpu
    uniform float uTime;

    varying vec3 vFrontColor;
    varying vec3 vBackColor;

    vec3 rotateVector(vec4 q, vec3 v) {
      return v + 2.0 * cross(q.xyz, cross(q.xyz,v) + q.w * v);
    }

    vec4 quatFromAxisAngle(vec3 axis, float angle) {
      float halfAngle = angle * .5;
      return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));
    }

    vec3 cubicBezier(vec3 p0, vec3 p1, vec3 c0, vec3 c1, float t) {
      vec3 tp;
      float tn = 1.0 -t;
      tp.xyz = tn * tn * tn * p0.xyz + 3.0 * tn * tn * t * c0.xyz + 3. * tn * t * t * c1.xyz + t * t * t * p1.xyz;

      return tp;
    }

    float easeOutCubic(float t, float b, float c, float d) {
      return c * ((t = t / d - 1.) * t * t + 1.) + b;
    }

    float easeOutQuart(float t, float b, float c, float d) {
      return -c * ((t = t / d - 1.) * t * t * t - 1.) + b;
    }

    float easeOutQuint(float t, float b, float c, float d) {
      return c * ((t = t / d - 1.) * t * t * t * t + 1.) + b;
    }

    void main() {
      //determine progress based on time, duration and delay
      float tDelay = aAnimation.x;
      float tDuration = aAnimation.y;
      float tTime = clamp(uTime - tDelay, 0., tDuration);
      float tProgress = easeOutQuart(tTime, 0., 1., tDuration);

      vec3 tPosition = position;
      vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * tProgress);
      
      //calculate rotation (before translation)
      tPosition = rotateVector(tQuat, tPosition);

      //calculate position on bezier curve
      vec3 tp0 = tPosition;
      vec3 tp1 = tPosition + aTranslation;
      vec3 tc0 = tPosition + aControlPoint0;
      vec3 tc1 = tPosition + aControlPoint1;

      tPosition = cubicBezier(tp0, tp1, tc0, tc1, tProgress);

      //pass colors to Fragment shader
      vFrontColor = aFrontColor;
      vBackColor = aBackColor;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(tPosition, 1.);
    }
  `;
  fragmentShader = `
    varying vec3 vFrontColor;
    varying vec3 vBackColor;

    void main() {
      if(gl_FrontFacing){
        gl_FragColor = vec4(vFrontColor, 1.);
      }else{
        gl_FragColor = vec4(vBackColor, 1.);
      }
    }
  `;
  shaderUniforms: { uTime: { type: string; value: number } };
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.createConfetti();
    this.update();
  }
  createConfetti() {
    // const shaderAttributes = {
    //   aAnimation: { type: 'v2', value: null },
    //   aTranslation: { type: 'v3', value: null },
    //   aControlPoint0: { type: 'v3', value: null },
    //   aControlPoint1: { type: 'v3', value: null },
    //   aAxisAngle: { type: 'v4', value: null },
    //   aFrontColor: { type: 'c', value: null },
    //   aBackColor: { type: 'c', value: null }
    // };

    this.shaderUniforms = {
      uTime: { type: 'f', value: 0 }
    };

    const confettiMaterial = new THREE.ShaderMaterial({
      uniforms: this.shaderUniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide
    });

    const quads = 150000;
    const triangles = quads * 2;
    const chunkSize = 21845;

    const geometry = new THREE.BufferGeometry();

    geometry.addAttribute(
      'aIndex',
      new THREE.BufferAttribute(new Uint16Array(triangles * 3), 1)
    );

    geometry.addAttribute(
      'aAnimation',
      new THREE.BufferAttribute(new Float32Array(triangles * 3 * 2), 2)
    );

    geometry.addAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(triangles * 3 * 3), 3)
    );

    geometry.addAttribute(
      'aTranslation',
      new THREE.BufferAttribute(new Float32Array(triangles * 3 * 3), 3)
    );

    geometry.addAttribute(
      'aControlPoint0',
      new THREE.BufferAttribute(new Float32Array(triangles * 3 * 3), 3)
    );
    geometry.addAttribute(
      'aControlPoint1',
      new THREE.BufferAttribute(new Float32Array(triangles * 3 * 3), 3)
    );
    geometry.addAttribute(
      'aAxisAngle',
      new THREE.BufferAttribute(new Float32Array(triangles * 3 * 4), 4)
    );
    // colors!
    geometry.addAttribute(
      'aFrontColor',
      new THREE.BufferAttribute(new Float32Array(triangles * 3 * 3), 3)
    );
    geometry.addAttribute(
      'aBackColor',
      new THREE.BufferAttribute(new Float32Array(triangles * 3 * 3), 3)
    );

    const indices: any = geometry.attributes.aIndex.array;

    for (let i = 0; i < indices.length; i++) {
      indices[i] = i % (3 * chunkSize);
    }

    const animation: any = geometry.attributes.aAnimation.array;

    for (let i = 0; i < animation.length; i += 12) {
      const delay = this.randomRange(0, 4);
      const duration = this.randomRange(6, 10);

      for (let j = 0; j < 12; j += 2) {
        animation[i + j + 0] = delay;
        animation[i + j + 1] = duration;
      }
    }

    const positions: any = geometry.attributes.position.array;
    const halfWidth = 0.02;
    const halfHeight = halfWidth * 0.6;
    const a = new THREE.Vector3(-halfWidth, halfHeight, 0); // top-left
    const b = new THREE.Vector3(halfWidth, halfHeight, 0); // top-right
    const c = new THREE.Vector3(halfWidth, -halfHeight, 0); // bottom-right
    const d = new THREE.Vector3(-halfWidth, -halfHeight, 0); // bottom-left

    const vertices = [a, d, b, d, c, b];
    let v;
    for (let i = 0; i < positions.length; i += 18) {
      v = 0;
      for (let j = 0; j < 18; j += 3) {
        positions[i + j + 0] = vertices[v].x;
        positions[i + j + 1] = vertices[v].y;
        positions[i + j + 2] = vertices[v].z;
        v++;
      }
    }

    const translations: any = geometry.attributes.aTranslation.array;
    const t = new THREE.Vector3();

    for (let i = 0; i < translations.length; i += 18) {
      const phi = Math.random() * Math.PI * 2;
      const radius = 4;
      const x1 = this.randomRange(-4, 4);
      const z1 = this.randomRange(-4, 4);
      t.x = x1 + radius * Math.cos(phi) * Math.random();
      t.z = z1 + radius * Math.sin(phi) * Math.random();

      for (let j = 0; j < 18; j += 3) {
        translations[i + j + 0] = t.x;
        translations[i + j + 1] = t.y;
        translations[i + j + 2] = t.z;
      }
    }

    const controlPoints0: any = geometry.attributes.aControlPoint0.array;
    const controlPoints1: any = geometry.attributes.aControlPoint1.array;

    const cp0 = new THREE.Vector3();
    const cp1 = new THREE.Vector3();

    for (let i = 0; i < controlPoints0.length; i += 18) {
      cp0.x = this.randomRange(-1, 1);
      cp0.y = this.randomRange(6, 10);
      cp0.z = this.randomRange(-1, 1);

      cp1.x = this.randomRange(-8, 8);
      cp1.y = this.randomRange(2, 10);
      cp1.z = this.randomRange(-8, 8);

      for (let j = 0; j < 18; j += 3) {
        controlPoints0[i + j + 0] = cp0.x;
        controlPoints0[i + j + 1] = cp0.y;
        controlPoints0[i + j + 2] = cp0.z;

        controlPoints1[i + j + 0] = cp1.x;
        controlPoints1[i + j + 1] = cp1.y;
        controlPoints1[i + j + 2] = cp1.z;
      }
    }

    const axisAngles: any = geometry.attributes.aAxisAngle.array;
    const angle: any = new THREE.Vector3();

    for (let i = 0; i < axisAngles.length; i += 24) {
      angle.x = Math.random();
      angle.y = 0;
      angle.z = Math.random();
      angle.normalize();

      angle.w = Math.PI * this.randomRange(20, 60);

      for (let j = 0; j < 24; j += 4) {
        axisAngles[i + j + 0] = angle.x;
        axisAngles[i + j + 1] = angle.y;
        axisAngles[i + j + 2] = angle.z;
        axisAngles[i + j + 3] = angle.w;
      }
    }

    const frontColors: any = geometry.attributes.aFrontColor.array;
    const backColors: any = geometry.attributes.aBackColor.array;

    let hue = 0;
    const front = new THREE.Color();
    const back = new THREE.Color();

    for (let i = 0; i < frontColors.length; i += 18) {
      hue = Math.random();

      front.setHSL(hue, 1, 0.5);
      back.setHSL(hue, 0.65, 0.5);

      for (let j = 0; j < 18; j += 3) {
        frontColors[i + j + 0] = front.r;
        frontColors[i + j + 1] = front.g;
        frontColors[i + j + 2] = front.b;

        backColors[i + j + 0] = back.r;
        backColors[i + j + 1] = back.g;
        backColors[i + j + 2] = back.b;
      }
    }
    const offsets = triangles / chunkSize;
    for (let i = 0; i < offsets; i++) {
      const offset = {
        start: i * chunkSize * 3,
        index: i * chunkSize * 3,
        count: Math.min(triangles - i * chunkSize, chunkSize) * 3
      };
      geometry.groups.push(offset);
    }

    const mesh = new THREE.Mesh(geometry, confettiMaterial);

    this.scene.add(mesh);
  }
  randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 2000);
    this.camera.position.set(
      3.2474970423896035,
      0.992230956080686,
      -3.2128363683730874
    );

    this.renderer = new THREE.WebGLRenderer({
      premultipliedAlpha: false,
      stencil: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0xf5f5f5, 1);

    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    const grid = new THREE.GridHelper(10, 10, 0xc1c1c1, 0xc1c1c1);
    this.scene.add(grid);
  }
  time = 0;
  timeStep = 1 / 60;
  update() {
    this.renderer.render(this.scene, this.camera);

    this.shaderUniforms.uTime.value = this.time;
    this.time += this.timeStep;
    this.time %= 14;

    this.controls.update();
    requestAnimationFrame(this.update.bind(this));
  }
}
