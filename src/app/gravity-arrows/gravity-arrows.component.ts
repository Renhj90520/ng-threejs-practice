import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Arrow from './Arrow';
@Component({
  selector: 'app-gravity-arrows',
  templateUrl: './gravity-arrows.component.html',
  styleUrls: ['./gravity-arrows.component.css']
})
export class GravityArrowsComponent implements OnInit {
  scene;
  camera;
  renderer: THREE.WebGLRenderer;

  NUM_INSTANCE = 6000;
  controls: OrbitControls;
  arrows = [];
  vertexShader = `
    precision highp float;

    // instance attributes
    attribute vec3 iOffset;
    attribute vec4 iRotation;
    attribute vec4 iColor;

    // shading parameters
    varying vec3 vLighting;
    varying vec4 vColor;

    // apply a rotation-quaternion to the given vector
    vec3 rotate(const vec3 v,const vec4 q){
      vec3 t = 2.0 * cross(q.xyz, v);
      return v + q.w * t + cross(q.xyz, t);
    }

    void main(){
      // computing lighting
      vec3 ambientColor = vec3(1.) * .3;
      vec3 directionalColor = vec3(1.) * .7;
      vec3 lightDirection = normalize(vec3(-.5,1.,1.5));

      // diffuse shading
      vec3 n = rotate(normalMatrix * normal, iRotation);
      vLighting = ambientColor + (directionalColor * max(dot(n, lightDirection), .0));

      vColor = iColor;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(iOffset + rotate(position, iRotation), 1.);
    }
  `;
  fragmentShader = `
    precision highp float;
    varying vec3 vLighting;
    varying vec4 vColor;

    void main(){
      gl_FragColor = vColor * vec4(vLighting,1.);
      gl_FragColor.a = 1.;
    }
  `;
  t0: number;
  geometry: any;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addArrows();
    this.update();
  }

  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 5000);
    this.camera.position.set(-80, 50, 20);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.controls = new OrbitControls(this.camera);
  }
  addArrows() {
    const iOffsets = new Float32Array(this.NUM_INSTANCE * 3);
    const iRotations = new Float32Array(this.NUM_INSTANCE * 4);
    const iColors = new Float32Array(this.NUM_INSTANCE * 4);

    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.copy(this.getArrowGeometry());

    this.geometry.addAttribute(
      'iOffset',
      new THREE.InstancedBufferAttribute(iOffsets, 3, true)
    );
    this.geometry.addAttribute(
      'iRotation',
      new THREE.InstancedBufferAttribute(iRotations, 4, true)
    );
    this.geometry.addAttribute(
      'iColor',
      new THREE.InstancedBufferAttribute(iColors, 4, true)
    );

    this.geometry.attributes.iRotation;
    this.geometry.attributes.iOffset;

    for (let i = 0; i < this.NUM_INSTANCE; i++) {
      this.arrows.push(
        new Arrow(i, {
          position: iOffsets,
          rotation: iRotations,
          color: iColors
        })
      );
    }
    const material = new THREE.ShaderMaterial({
      uniforms: {},
      side: THREE.DoubleSide,
      transparent: true,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader
    });
    const mesh = new THREE.Mesh(this.geometry, material);
    this.scene.add(mesh);

    mesh.frustumCulled = false;

    this.t0 = performance.now();
  }
  getArrowGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape(
      [
        [-0.8, -1],
        [-0.03, 1],
        [-0.01, 1.017],
        [0.0, 1.0185],
        [0.01, 1.017],
        [0.03, 1],
        [0.8, -1],
        [0, -0.5]
      ].map(p => new THREE.Vector2(...p))
    );

    const arrowGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.3,
      bevelEnabled: true,
      bevelSize: 0.1,
      bevelThickness: 0.1,
      bevelSegments: 2
    });

    const matrix = new THREE.Matrix4()
      .makeRotationX(Math.PI / 2)
      .setPosition(0, 0.15, 0);

    arrowGeo.applyMatrix(matrix);

    return new THREE.BufferGeometry().fromGeometry(arrowGeo);
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
    const t = performance.now();
    const dt = Math.min((t - this.t0) / 1000, 0.1);

    for (let i = 0; i < this.NUM_INSTANCE; i++) {
      this.arrows[i].update(dt);
    }

    this.geometry.attributes.iRotation.needsUpdate = true;
    this.geometry.attributes.iOffset.needsUpdate = true;

    this.t0 = t;
    requestAnimationFrame(this.update.bind(this));
  }

  @HostListener('window:resize')
  resize() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
