import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-smin-circle',
  templateUrl: './smin-circle.component.html',
  styleUrls: ['./smin-circle.component.css']
})
export class SminCircleComponent implements OnInit {
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
    uniform vec2 u_mouse;
    
    vec2 getScreenSpace() {
      vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / min(u_resolution.y,u_resolution.x);
      return uv;
    }

    float smin(float a, float b, float k) {
      float res = exp(-k * a) + exp(-k * b);
      return -log(res) / k;
    }

    void main() {
      vec2 uv=getScreenSpace();

      float lw = .001;
      // axes
      vec3 color=vec3(step(uv.x, lw) * step(-lw, uv.x) + step(uv.y, lw) * step(-lw, uv.y));

      vec2 grad1_pos = u_mouse;
      vec2 grad2_pos = vec2(-.2);

      float gradient1 = length(uv - grad1_pos);
      float gradient2 = length(uv - grad2_pos);

      // float gradient_sum = min(gradient1, gradient2);
      float gradient_sum = smin(gradient1, gradient2, 50.);

      color = mix(color, vec3(1.), smoothstep(.201, .2, gradient_sum));
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
      u_mouse: { type: 'v2', value: new THREE.Vector2(0, 0) }
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

    requestAnimationFrame(this.update.bind(this));
  }

  @HostListener('mousemove', ['$event'])
  mousemove(evt) {
    const ratio = window.innerHeight / window.innerWidth;
    let x, y;
    if (window.innerHeight > window.innerWidth) {
      x = (evt.pageX - window.innerWidth / 2) / window.innerWidth;
      y =
        ((evt.pageY - window.innerHeight / 2) / window.innerHeight) *
        -1 *
        ratio;
    } else {
      x = (evt.pageX - window.innerWidth / 2) / window.innerWidth / ratio;
      y = ((evt.pageY - window.innerHeight / 2) / window.innerHeight) * -1;
    }

    // const x = (evt.clientX / window.innerWidth) * 2 - 1;
    // const y = -(evt.clientY / window.innerHeight) * 2 + 1;
    this.planeMat.uniforms.u_mouse.value = new THREE.Vector2(x, y);
  }
}
