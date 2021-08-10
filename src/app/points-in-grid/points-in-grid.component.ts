import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-points-in-grid',
  templateUrl: './points-in-grid.component.html',
  styleUrls: ['./points-in-grid.component.css'],
})
export class PointsInGridComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  width: any;
  height: any;
  planeMat: THREE.ShaderMaterial;
  vertexShader = `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
    }  
  `;
  fragmentShader = `
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    
    vec2 getScreenSpace() {
      vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / min(u_resolution.y,u_resolution.x);
      return uv;
    }

    void main() {
      vec2 uv=getScreenSpace();

      uv*=10.;
      vec2 grid_id=floor(uv);
      vec2 grid_polar=vec2(length(grid_id),atan(grid_id.x,grid_id.y));
      vec2 grid_uv=fract(uv)-.5;

      float t = u_time * 5. + grid_polar.x + grid_polar.y;
      
      float gradient = length(grid_uv + vec2(cos(t)*.2,sin(t)*.2));

      vec3 color=vec3(sin(grid_uv.x)*.5+.5,sin(grid_uv.y)*.5+.5,1.);
      
      color = mix(vec3(1.),color,smoothstep(.2,.21,gradient));
      gl_FragColor=vec4(color,1.);
    }
  `;

  startTime = 0;
  delta;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addPlane();

    requestAnimationFrame(this.update.bind(this));
  }
  addPlane() {
    const uniforms = {
      u_resolution: {
        
        value: new THREE.Vector2(this.width, this.height),
      },
      u_time: { value: this.startTime },
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

  update(delta) {
    this.renderer.render(this.scene, this.camera);

    this.planeMat.uniforms.u_time.value = this.startTime + delta * 0.0002;
    requestAnimationFrame(this.update.bind(this));
  }
}
