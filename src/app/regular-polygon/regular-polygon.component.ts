import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-regular-polygon',
  templateUrl: './regular-polygon.component.html',
  styleUrls: ['./regular-polygon.component.css']
})
export class RegularPolygonComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  ballNum = 10;

  vertexShader = `
    void main() {
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
    }
  `;

  fragmentShader = `
    #define PI 3.14159265359
    #define TAU 6.28318530718

    uniform vec2 u_resolution;

    vec2 getScreenSpace() {
      vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
      return uv;
    }
    
    void main() {

      vec2 uv=getScreenSpace();
      
      const float r = .2;
      const float sides = 6.;
      vec2 polar = vec2(atan(uv.y, uv.x) + PI, TAU / sides);
      float distance = cos(floor(.5 + polar.x / polar.y) * polar.y - polar.x) * length(uv);

      vec3 color = vec3(smoothstep(r+.001, r, distance));
      gl_FragColor=vec4(color,1.);
    }
  `;
  planeMat: THREE.ShaderMaterial;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addPlane();
    this.update();
  }
  addPlane() {
    const uniforms = {
      u_resolution: {
        type: 'v2',
        value: new THREE.Vector2(this.width, this.height)
      }
    };
    const planeGeo = new THREE.PlaneGeometry(this.width, this.height);
    this.planeMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader
    });
    const plane = new THREE.Mesh(planeGeo, this.planeMat);

    this.scene.add(plane);
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();

    const halfRadian = Math.atan(this.height / 2 / 100);
    const halfDegree = THREE.Math.radToDeg(halfRadian);
    this.camera = new THREE.PerspectiveCamera(
      halfDegree * 2,
      this.width / this.height,
      0.1,
      100
    );
    this.camera.position.z = 100;
    this.camera.lookAt(this.scene.position);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.el.nativeElement.appendChild(this.renderer.domElement);
  }

  update() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.update.bind(this));
  }
}
