import { Component, OnInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { WebGLRenderer } from 'three';
import * as SimplexNoise from 'simplex-noise';
@Component({
  selector: 'app-sphere-shader',
  templateUrl: './sphere-shader.component.html',
  styleUrls: ['./sphere-shader.component.css']
})
export class SphereShaderComponent implements OnInit {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  simplexNoiseArr: Float32Array;
  simplexNoise = new SimplexNoise();
  vertexShader = `
    attribute float displacement;
    varying vec3 vNormal;
    varying vec2 vUv;
    uniform float textureAmplitude;

    void main() {
      vec3 tempPos = position + normal * vec3(displacement);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(tempPos, 1.0);
      vNormal = normal;
      vUv = uv + vec2(textureAmplitude);
    }
  `;
  fragmentShader = `
    uniform vec3 color;
    uniform sampler2D texture;
    varying vec3 vNormal;
    varying vec2 vUv;

    void main() {
      vec3 lightPos = vec3(1.,1.,1.);
      lightPos = normalize(lightPos);
      float brightness = dot(vNormal, lightPos) * .5 + .5 + .3;
      vec4 tcolor = texture2D(texture, vUv);

      gl_FragColor = brightness * tcolor * vec4(color, 1.);
    }
  `;
  sphereMesh: any;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.initTHREE();
    this.addSphere();
    this.update();
  }
  addSphere() {
    const sphereBufferGeo = new THREE.SphereBufferGeometry(100, 128, 64);
    const positionNum = sphereBufferGeo.attributes.position.count;
    this.simplexNoiseArr = new Float32Array(positionNum);
    sphereBufferGeo.addAttribute(
      'displacement',
      new THREE.BufferAttribute(new Float32Array(positionNum), 1)
    );

    const shaderMat = new THREE.ShaderMaterial({
      uniforms: {
        color: { type: 'c', value: new THREE.Color(0x0aa0f0) },
        texture: { type: 't', value: this.getTexture() },
        textureAmplitude: { type: 'f', value: 1.0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader
    });
    shaderMat.uniforms.texture.value.wrapS = THREE.RepeatWrapping;
    shaderMat.uniforms.texture.value.wrapT = THREE.RepeatWrapping;

    this.sphereMesh = new THREE.Mesh(sphereBufferGeo, shaderMat);
    this.scene.add(this.sphereMesh);
  }
  getTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');
    const imageObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageObj.data;
    let yOffset = 0;
    for (let y = 0; y < canvas.height; y++) {
      let xOffset = 0;
      for (let x = 0; x < canvas.width; x++) {
        const index = (x + y * canvas.width) * 4;
        const c = 255 * this.simplexNoise.noise2D(xOffset, yOffset) + 255;
        data[index] = c;
        data[index + 1] = c;
        data[index + 2] = c;
        data[index + 3] = 255;
        xOffset += 0.04;
      }
      yOffset += 0.04;
    }
    ctx.putImageData(imageObj, 0, 0);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  initTHREE() {
    const width = this.el.nativeElement.clientWidth;
    const height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 340);
    this.camera.lookAt(this.scene.position);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(new THREE.Color(0x000000));
    this.renderer.setSize(width, height);
    this.el.nativeElement.appendChild(this.renderer.domElement);
  }
  update() {
    this.renderer.render(this.scene, this.camera);
    const timestamp = Date.now() * 0.01;

    this.sphereMesh.material.uniforms.textureAmplitude.value =
      Math.sin(timestamp * 0.01) + Math.cos(timestamp * 0.01);
    this.sphereMesh.material.uniforms.color.value.offsetHSL(0.001, 0, 0);

    const positions = this.sphereMesh.geometry.attributes.position.array;
    const displacement = this.sphereMesh.geometry.attributes.displacement.array;

    for (let i = 0; i < positions.length; i += 3) {
      this.simplexNoiseArr[i] =
        Math.sin(timestamp * 0.05) *
        16 *
        this.simplexNoise.noise3D(
          positions[i] + timestamp * 0.08,
          positions[i + 1] + timestamp * 0.09,
          positions[i + 2] + timestamp * 0.084
        );
    }

    for (let i = 0; i < displacement.length; i++) {
      displacement[i] =
        Math.sin(timestamp + i * 0.1) * Math.sin(timestamp * 0.01) * 5;
      displacement[i] += this.simplexNoiseArr[i];
    }

    this.sphereMesh.geometry.attributes.displacement.needsUpdate = true;
    requestAnimationFrame(this.update.bind(this));
  }
}
