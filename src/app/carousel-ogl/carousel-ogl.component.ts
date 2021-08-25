import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TimelineLite } from 'gsap';
import * as THREE from 'three';

@Component({
  selector: 'app-carousel-ogl',
  templateUrl: './carousel-ogl.component.html',
  styleUrls: ['./carousel-ogl.component.scss'],
})
export class CarouselOglComponent implements OnInit, AfterViewInit {
  @ViewChild('stage', { static: true }) stageEl;
  slideEls;

  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  width;
  height;
  far = 100;
  imgs = ['218', '202', '173', '227'];
  textures = [];
  material: THREE.ShaderMaterial;
  vertexShader = `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
  `;
  fragmentShader = `
    precision highp float;

    uniform vec2 uScreenSize;
    uniform float uProgress;
    uniform sampler2D uTexture0;
    uniform vec2 uTexture0Size;
    uniform sampler2D uTexture1;
    uniform vec2 uTexture1Size;
    uniform float uRotationDirection;

    varying vec2 vUv;

    #define PI 3.14159265359

    float Circle(in vec2 st, in float radius, in float blur) {
      return 1. - smoothstep(radius - (radius * blur), radius + (radius * blur), dot(st, st) * 4.);
    }

    mat2 Rotate(float angle) {
      return mat2(
        cos(angle), -sin(angle),
        sin(angle), cos(angle)
      );
    }

    vec2 calculateTextureUV(vec2 st, vec2 textureSize) {
      vec2 s = uScreenSize;
      vec2 i = textureSize;

      float rs = s.x / s.y;
      float ri = i.x / i.y;
      vec2 new  = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
      vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2., 0.) : vec2(0., (new.y - s.y) / 2.));

      vec2 uv = st * s / new + offset;

      return uv;
    }

    void main() {
      vec2 st = vUv;

      // UVs used to align the circular masks at the center of the screen
      vec2 centeredST = vUv - .5;
      centeredST.x *= uScreenSize.x / uScreenSize.y;

      vec3 color = vec3(0.);

      vec2 tex0UV = calculateTextureUV(st, uTexture0Size);
      vec2 tex1UV = calculateTextureUV(st, uTexture1Size);


      // background
      float scale = (1. - smoothstep(.45, .9, uProgress) * .1);
      vec2 uv0_A = (tex0UV - .5) * scale + .5;

      scale = (.9 + smoothstep(.3, 1., uProgress) * .1);
      vec2 uv0_B = (tex1UV - .5) * scale + .5;

      float progress = smoothstep(1., .65, uProgress);

      vec3 t0_A = texture2D(uTexture0, uv0_A).rgb;
      vec3 t0_B = texture2D(uTexture1, uv0_B).rgb;
      vec3 t0 = mix(t0_B, t0_A, progress);

      color = t0;

      // big circle
      // scaled uvs
      scale = (1. - smoothstep(.3, 1., uProgress) * .5);
      vec2 uv1_A = (tex0UV - .5) * scale + .5;

      scale = (.2 + smoothstep(.4, .8, uProgress) * .8);
      vec2 uv1_B = (tex1UV - .5) * scale + .5;

      // rotated uvs
      float rotation = PI * smoothstep(.25, .95, uProgress) * uRotationDirection;
      uv1_A = (uv1_A - .5) * Rotate(rotation) + .5;
      uv1_B = (uv1_B - .5) * Rotate(PI + rotation) + .5;

      // mask
      float c1 = Circle(centeredST, 2.4, .01);

      // change the opacity of the texture
      progress = smoothstep(.9, .5, uProgress);

      // masked texture
      vec3 t1_A = texture2D(uTexture0, uv1_A).rgb;
      vec3 t1_B = texture2D(uTexture1, uv1_B).rgb;

      vec3 t1 = mix(t1_B, t1_A, progress);
      t1 *= c1;

      // remove this mask from the previous layer
      t0 *= 1. - c1;

      // medium circle
      // scaled uvs
      scale = (1. - smoothstep(.2, .95, uProgress) * .6);
      vec2 uv2_A = (tex0UV - .5) * scale + .5;

      scale = (.2 + smoothstep(.2, .95, uProgress) * .8);
      vec2 uv2_B = (tex1UV - .5) * scale + .5;

      // rotated uvs
      rotation = PI * smoothstep(.2, .9, uProgress) * uRotationDirection;
      uv2_A = (uv2_A - .5) * Rotate(rotation) + .5;
      uv2_B = (uv2_B - .5) * Rotate(PI + rotation) + .5;

      // mask
      float c2 = Circle(centeredST, 1., .01);

      //change the opacity of the texture
      progress = smoothstep(.85, .4, uProgress);

      // masked texture
      vec3 t2_A = texture2D(uTexture0, uv2_A).rgb;
      vec3 t2_B = texture2D(uTexture1, uv2_B).rgb;
      vec3 t2 = mix(t2_B, t2_A, progress);
      t2 *= c2;

      t1 *= 1. - c2;// remove this mask from the previous layer

      // small circle
      // scaled uvs
      scale = (1. - smoothstep(.1, .9, uProgress) * .85);
      vec2 uv3_A = (tex0UV - .5) * scale + .5;

      scale = (.15 + smoothstep(.1, .9, uProgress) * .85);
      vec2 uv3_B = (tex1UV - .5) * scale + .5;

      // rotated uvs
      rotation = PI * smoothstep(.15, .85, uProgress) * uRotationDirection;
      uv3_A = (uv3_A - .5) * Rotate(rotation) + .5;
      uv3_B = (uv3_B - .5) * Rotate(PI + rotation) + .5;

      // change the opacity of the texture
      progress = smoothstep(.8, .3, uProgress);

      // mask
      float c3 = Circle(centeredST, .2, .01);

      // masked texture (based on the alpha value)
      vec3 t3_A = texture2D(uTexture0, uv3_A).rgb;
      vec3 t3_B = texture2D(uTexture1, uv3_B).rgb;
      vec3 t3 = mix(t3_B, t3_A, progress);
      t3 *= c3;

      // remove this mask from the previous layer
      t2 *= 1. - c3;

      color = t0 + t1 + t2 + t3;

      gl_FragColor = vec4(color, 1.);
    }
  `;

  currentTextureIndex = 0;
  nextTextureIndex = 0;
  isAnimating = false;

  slides = [
    {
      title: 'From the depths of the sea',
      subtitle: "you can't hear any sound, only your heartbeat",
    },
    {
      title: 'The real colors of nature',
      subtitle: 'come out in Autumn, when the leaves start falling',
    },
    {
      title: 'Kids are the future of our world',
      subtitle: "It's our duty to preserve it",
    },
    {
      title: 'I like trains',
      subtitle: '[dott. Sheldon Cooper]',
    },
  ];
  constructor(private el: ElementRef) {}
  ngAfterViewInit(): void {
    this.initNativeElements();
  }

  ngOnInit(): void {
    this.initTHREE();
    this.loadTextures();
    this.render();
  }
  initNativeElements() {
    this.slideEls = this.el.nativeElement.querySelectorAll('.slide');
  }
  loadTextures() {
    const loader = new THREE.TextureLoader();
    const prefix = '/assets/images/carousel';
    for (let i = 0; i < this.imgs.length; i++) {
      const img = this.imgs[i];
      this.textures.push(loader.load(prefix + img + '.jpg'));
    }
    this.addBackground();
  }
  addBackground() {
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    this.material = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms: {
        uScreenSize: { value: new THREE.Vector2(this.width, this.height) },
        uProgress: { value: 0 },
        uTexture0: { value: this.textures[0] },
        uTexture0Size: { value: new THREE.Vector2(1920, 1280) },
        uTexture1: { value: this.textures[1] },
        uTexture1Size: { value: new THREE.Vector2(1920, 1280) },
        uRotationDirection: { value: 1 },
      },
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);
  }
  initTHREE() {
    this.width = this.stageEl.nativeElement.clientWidth;
    this.height = this.stageEl.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    const halfRadian = Math.atan(this.height / 2 / 100);
    const halfDegree = THREE.MathUtils.radToDeg(halfRadian);
    this.camera = new THREE.PerspectiveCamera(
      halfDegree * 2,
      this.width / this.height,
      0.1,
      this.far
    );

    this.camera.position.z = this.far;
    this.camera.lookAt(this.scene.position);
    // const cameraHelper = new THREE.CameraHelper(this.camera);
    // this.scene.add(cameraHelper);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xffffff);
    this.stageEl.nativeElement.appendChild(this.renderer.domElement);
  }

  render() {
    requestAnimationFrame(this.render.bind(this));

    const currImg = this.textures[this.currentTextureIndex].image;

    if (currImg) {
      this.material.uniforms.uTexture0Size.value = new THREE.Vector2(
        currImg.width,
        currImg.height
      );
    }

    const nextImg = this.textures[this.nextTextureIndex].image;
    if (nextImg) {
      this.material.uniforms.uTexture1Size.value = new THREE.Vector2(
        nextImg.width,
        nextImg.height
      );
    }
    this.material.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }

  change(dir) {
    if (this.isAnimating || !this.slideEls) return;

    const currentTitle =
      this.slideEls[this.currentTextureIndex].querySelector(
        '[data-slide-title]'
      );
    const currentSubtitle = this.slideEls[
      this.currentTextureIndex
    ].querySelector('[data-slide-subtitle]');

    // const currentTitleEl=this.slideEls[this.currentTextureIndex].querySelector()
    this.nextTextureIndex = this.nextTextureIndex + dir;

    if (this.nextTextureIndex === this.textures.length) {
      this.nextTextureIndex = 0;
    }
    if (this.nextTextureIndex < 0) {
      this.nextTextureIndex = this.textures.length - 1;
    }

    const nextTitle =
      this.slideEls[this.nextTextureIndex].querySelector('[data-slide-title]');
    const nextSubTitle = this.slideEls[this.nextTextureIndex].querySelector(
      '[data-slide-subtitle]'
    );
    const tl = new TimelineLite({
      onStart: () => {
        this.isAnimating = true;

        this.material.uniforms.uTexture1.value =
          this.textures[this.nextTextureIndex];
        this.material.uniforms.uRotationDirection.value = dir;
      },
      onComplete: () => {
        this.isAnimating = false;
      },
    });

    tl.to([currentTitle, currentSubtitle], 0.8, {
      opacity: 0,
      onComplete: () => {},
    })
      .to(
        this.material.uniforms.uProgress,
        1.6,
        {
          value: 1,
          onComplete: () => {
            this.currentTextureIndex = this.nextTextureIndex;
            this.material.uniforms.uTexture0.value =
              this.textures[this.currentTextureIndex];
            this.material.uniforms.uProgress.value = 0;
          },
        },
        '<0.2'
      )
      .fromTo(
        nextTitle,
        0.7,
        {
          clipPath: 'polygon(-10% -30%, 110% -30%, 110% -30%, -10% -30%)',
          percent: 100,
        },
        {
          clipPath: 'polygon(-10% -30%, 110% -30%, 110% 130%, -10% 130%)',
          yPercent: 0,
        },
        '<'
      )
      .fromTo(
        nextSubTitle,
        0,
        { opacity: 0 },
        {
          opacity: 1,
        },
        '<0.2'
      );
  }

  @HostListener('window:resize')
  resize() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
}
