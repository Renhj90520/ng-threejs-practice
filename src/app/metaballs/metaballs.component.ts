import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-metaballs',
  templateUrl: './metaballs.component.html',
  styleUrls: ['./metaballs.component.css']
})
export class MetaballsComponent implements OnInit {
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
    uniform float uWidth;
    uniform float uHeight;
    uniform vec3 uBalls[${this.ballNum}];
    void main() {
      float x=gl_FragCoord.x;
      float y=gl_FragCoord.y;
      vec3 color=vec3(0.,0.,0.);

      float v=0.;
      for(int i = 0; i < ${this.ballNum}; i++){
        vec3 mb=uBalls[i];
        float dx=mb.x-x;
        float dy=mb.y-y;
        float r=mb.z;

        v+=r*r/(dx*dx+dy*dy);
      }

      color=step(1.,v)*vec3(x/uWidth,y/uHeight,.0);
      gl_FragColor=vec4(color,1.);
    }
  `;
  planeMat: THREE.ShaderMaterial;
  balls: any[];
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addPlane();
    this.update();
  }
  addPlane() {
    this.balls = [];
    for (let i = 0; i < this.ballNum; i++) {
      const radius = Math.random() * 60 + 10;
      const x = Math.random() * (this.width - 2 * radius) + radius;
      const y = Math.random() * (this.height - 2 * radius) + radius;
      this.balls.push({
        info: new THREE.Vector3(x, y, radius),
        mvInfo: { vx: Math.random() * 10 - 5, vy: Math.random() * 10 - 5 }
      });
    }
    const uniforms = {
      uWidth: { type: 'f', value: this.width },
      uHeight: { type: 'f', value: this.height },
      uBalls: { type: 'v3v', value: this.balls.map(ball => ball.info) }
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
  moveBalls() {
    if (this.planeMat) {
      this.planeMat.uniforms.uBalls.value.forEach((ball, i) => {
        const mvInfo = this.balls[i].mvInfo;
        ball.x += mvInfo.vx;
        if (ball.x - ball.z < 0) {
          ball.x = ball.z + 1;
          mvInfo.vx = Math.abs(mvInfo.vx);
        } else if (ball.x + ball.z > this.width) {
          ball.x = this.width - ball.z;
          mvInfo.vx = -Math.abs(mvInfo.vx);
        }

        ball.y += mvInfo.vy;
        if (ball.y - ball.z < 0) {
          ball.y = ball.z + 1;
          mvInfo.vy = Math.abs(mvInfo.vy);
        } else if (ball.y + ball.z > this.height) {
          ball.y = this.height - ball.z;
          mvInfo.vy = -Math.abs(mvInfo.vy);
        }
      });
    }
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    this.moveBalls();
    requestAnimationFrame(this.update.bind(this));
  }
}
