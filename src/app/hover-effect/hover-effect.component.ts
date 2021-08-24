import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Expo, TweenMax } from 'gsap';
import * as THREE from 'three';

@Component({
  selector: 'app-hover-effect',
  templateUrl: './hover-effect.component.html',
  styleUrls: ['./hover-effect.component.css'],
})
export class HoverEffectComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;

  width;
  height;
  img1 = '/assets/images/hovereffect1.jpg';
  img2 = '/assets/images/hovereffect2.jpg';
  noise = '/assets/images/hovereffectnoise.jpg';
  vertexShader = `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
  `;
  fragmentShader = `
    varying vec2 vUv;

    uniform sampler2D texture1;
    uniform sampler2D texture2;
    uniform sampler2D noise;

    uniform float hover;
    uniform float effectiveFactor;

    void main() {
      vec2 uv = vUv;

      vec4 noise = texture2D(noise, uv);
      vec4 texture1 = texture2D(texture1, vec2(uv.x + (hover * noise.r * effectiveFactor), uv.y));
      vec4 texture2 = texture2D(texture2, vec2(uv.x + ((1. - hover) * noise.r), uv.y));


      vec4 color =  mix(texture1, texture2, hover);
      gl_FragColor = color;
    }
  `;
  material: THREE.ShaderMaterial;
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.initTHREE();
    this.addMesh();
    this.render();
  }
  addMesh() {
    const geometry = new THREE.PlaneBufferGeometry(this.width, this.height, 1);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        texture1: {
          value: this.createTexture({ src: this.img1 }),
        },
        texture2: {
          value: this.createTexture({ src: this.img2 }),
        },
        noise: {
          value: this.createTexture({
            src: this.noise,
            wrap: THREE.RepeatWrapping,
          }),
        },
        hover: {
          value: 0.0,
        },
        effectFactor: {
          value: 2.0,
        },
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: false,
      opacity: 1.0,
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);
  }
  createTexture(info) {
    const { src, wrap } = info;
    const loader = new THREE.TextureLoader();
    const texture = loader.load(src);
    if (wrap) {
      texture.wrapS = texture.wrapT = wrap;
    }

    return texture;
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      this.width / -2,
      this.width / 2,
      this.height / 2,
      this.height / -2,
      1,
      1000
    );
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xffff00, 0);
    this.renderer.setSize(this.width, this.height);
    this.el.nativeElement.appendChild(this.renderer.domElement);
  }

  render() {
    requestAnimationFrame(this.render.bind(this));

    this.renderer.render(this.scene, this.camera);
  }

  @HostListener('mouseenter')
  enter() {
    TweenMax.to(this.material.uniforms.hover, 1, {
      value: 1,
      ease: Expo.easeOut,
    });
  }

  @HostListener('mouseleave')
  leave() {
    TweenMax.to(this.material.uniforms.hover, 1, {
      value: 0,
      ease: Expo.easeOut,
    });
  }
}
