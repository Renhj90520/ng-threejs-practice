import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-scales',
  templateUrl: './scales.component.html',
  styleUrls: ['./scales.component.css']
})
export class ScalesComponent implements OnInit {
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

    // Helper vector. If you're doing anything that involves regular triangles or hexagons, the
    // 30-60-90 triangle will be involved in some way, which has sides of 1, sqrt(3) = 1.7320508 and 2.
    const vec2 s=vec2(1,1.7320508);

    float hex(in vec2 p) {
      p = abs(p);
      return max(dot(p,s*.5),p.x);
    }

    vec4 getHex(vec2 p) {
      vec4 hc = floor(vec4(p, p - vec2(.5, 1.)) / s.xyxy) + .5;
      vec4 h = vec4(p - hc.xy*s, p - (hc.zw + .5) * s);
      return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hc.xy) : vec4(h.zw, hc.zw + vec2(.5, 1.));
    }

    void main() {
      vec2 uv=getScreenSpace() * 15. * (min(u_resolution.y, u_resolution.x) / max(u_resolution.y, u_resolution.x));

      float h = hex(uv);
      vec4 hexuv = getHex(uv);
      vec3 color=vec3(1. - hex(hexuv.xy + vec2(sin(length(uv) + u_time * 5.), cos(length(uv) + u_time *5.)) * .2));
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
        type: 'v2',
        value: new THREE.Vector2(this.width, this.height)
      },
      u_time: { type: 'f', value: this.startTime }
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

  update(delta) {
    this.renderer.render(this.scene, this.camera);

    this.planeMat.uniforms.u_time.value = this.startTime + delta * 0.0002;
    requestAnimationFrame(this.update.bind(this));
  }
}
