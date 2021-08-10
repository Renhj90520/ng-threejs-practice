import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-modulo-checkerboard',
  templateUrl: './modulo-checkerboard.component.html',
  styleUrls: ['./modulo-checkerboard.component.css'],
})
export class ModuloCheckerboardComponent implements OnInit {
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
    uniform vec2 u_resolution;

    vec2 getScreenSpace() {
      vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
      return uv;
    }
    
    void main() {

      vec2 uv=getScreenSpace();
      uv*=8.;

      vec2 cell_id=floor(uv);
      
      vec3 color=vec3(1.);
      if(mod(cell_id.x + cell_id.y, 2.)==0.){
        color=vec3(0.);
      }

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
        
        value: new THREE.Vector2(this.width, this.height),
      },
    };
    const planeGeo = new THREE.PlaneGeometry(this.width, this.height);
    this.planeMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });
    const plane = new THREE.Mesh(planeGeo, this.planeMat);

    this.scene.add(plane);
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();

    const halfRadian = Math.atan(this.height / 2 / 100);
    const halfDegree = THREE.MathUtils.radToDeg(halfRadian);
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
