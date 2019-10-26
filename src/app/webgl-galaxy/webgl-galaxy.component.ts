import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import Galaxy from './Galaxy';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
@Component({
  selector: 'app-webgl-galaxy',
  templateUrl: './webgl-galaxy.component.html',
  styleUrls: ['./webgl-galaxy.component.css']
})
export class WebglGalaxyComponent implements OnInit {
  scene;
  camera;
  renderer;
  width;
  height;

  galaxMaterial;
  t = 0;
  z = 0;
  trackballControls;

  vertexShader = `
    uniform float size;
    uniform float t;
    uniform float z;
    uniform float pixelRatio;

    varying vec3 vPosition;
    varying vec3 mPosition;
    varying float gas;

    float a,b=0.;
    
    void main(){
      vPosition=position;
      a=length(position);
      if(t>0.)b=max(0.,(cos(a/20.-t*.02)-.99)*3./a);
      if(z>0.)b=max(0.,cos(a/40.-z*.01+2.));
      mPosition=position*(1.+b*4.);
      vec4 mvPosition=modelViewMatrix*vec4(mPosition,1.);
      gl_Position=mvPosition*projectionMatrix;
      gas=max(.0,sin(-a/20.));
      gl_PointSize=pixelRatio*size*(1.+gas*2.)/length(mvPosition.xyz);
    }
  `;

  fragmentShader = `
    uniform float z;
    varying vec3 vPosition;
    varying vec3 mPosition;
    varying float gas;

    void main(){
      float a=distance(mPosition,vPosition);
      if(a>0.)a=1.;
      
      float b=max(.32,.0065*length(vPosition));

      float c=distance(gl_PointCoord,vec2(.5));
      float starlook=-(c-.5)*1.2*gas;
      float gaslook=(1.-gas)/(c*10.);
      float texture=starlook+gaslook;

      gl_FragColor=vec4(.32,.28,b,1.)*texture*(1.-a*.35);
      if(z>0.)gl_FragColor*=cos(1.57*z/322.)*(1.-.001*length(mPosition));
    }
  `;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.initGalaxy();
    this.update();
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.5,
      1200
    );
    this.camera.position.set(-20, -155, 90);
    this.camera.lookAt(new THREE.Vector3());
    const cameraHelper = new THREE.CameraHelper(this.camera);
    this.scene.add(cameraHelper);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.width, this.height);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    const axesHelper = new THREE.AxesHelper(200);
    this.scene.add(axesHelper);

    this.trackballControls = new TrackballControls(
      this.camera,
      this.renderer.domElement
    );
  }
  initGalaxy() {
    this.galaxMaterial = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms: {
        size: { type: 'f', value: 3.3 },
        t: { type: 'f', value: 0 },
        z: { type: 'f', value: 0 },
        pixelRatio: { type: 'f', value: parseFloat(this.height) }
      },
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });

    const stars = new THREE.BufferGeometry();
    const points = new Galaxy().createStars();
    const pointsArray = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      pointsArray[i * 3] = p.x;
      pointsArray[i * 3 + 1] = p.y;
      pointsArray[i * 3 + 2] = p.z;
    }
    stars.addAttribute(
      'position',
      new THREE.Float32BufferAttribute(pointsArray, 3)
    );
    const galaxy = new THREE.Points(stars, this.galaxMaterial);
    this.scene.add(galaxy);
  }

  update() {
    this.trackballControls.update();
    this.renderer.render(this.scene, this.camera);
    this.galaxMaterial.uniforms.t.value = this.t;
    this.galaxMaterial.uniforms.z.value = this.z;
    this.scene.rotation.z += 0.001;
    requestAnimationFrame(this.update.bind(this));
  }
}
