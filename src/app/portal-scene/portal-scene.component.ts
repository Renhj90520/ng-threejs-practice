import { Component, ElementRef, OnInit } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
@Component({
  selector: 'app-portal-scene',
  templateUrl: './portal-scene.component.html',
  styleUrls: ['./portal-scene.component.css'],
})
export class PortalSceneComponent implements OnInit {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  controls: OrbitControls;

  loader = new THREE.TextureLoader();

  width;
  height;

  clock = new THREE.Clock();

  portalVertexShader = `
    varying vec2 vUv;

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectionPosition = projectionMatrix * viewPosition;
      gl_Position = projectionPosition;
      vUv = uv;
    }
  `;

  portalFragmentShader = `
    uniform float uTime;
    uniform vec3 uColorStart;
    uniform vec3 uColorEnd;

    varying vec2 vUv;

    //	Classic Perlin 3D Noise
    //	by Stefan Gustavson
    //
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

    float cnoise(vec3 P){
      vec3 Pi0 = floor(P); // Integer part for indexing
      vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
      Pi0 = mod(Pi0, 289.0);
      Pi1 = mod(Pi1, 289.0);
      vec3 Pf0 = fract(P); // Fractional part for interpolation
      vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
      vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz;
      vec4 iz1 = Pi1.zzzz;
  
      vec4 ixy = permute(permute(ix) + iy);
      vec4 ixy0 = permute(ixy + iz0);
      vec4 ixy1 = permute(ixy + iz1);
  
      vec4 gx0 = ixy0 / 7.0;
      vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
      gx0 = fract(gx0);
      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
      vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5);
      gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  
      vec4 gx1 = ixy1 / 7.0;
      vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
      gx1 = fract(gx1);
      vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
      vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5);
      gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  
      vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
      vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
      vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
      vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
      vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
      vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
      vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
      vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  
      vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
      g000 *= norm0.x;
      g010 *= norm0.y;
      g100 *= norm0.z;
      g110 *= norm0.w;
      vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
      g001 *= norm1.x;
      g011 *= norm1.y;
      g101 *= norm1.z;
      g111 *= norm1.w;
  
      float n000 = dot(g000, Pf0);
      float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
      float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
      float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
      float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
      float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
      float n111 = dot(g111, Pf1);
  
      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
      return 2.2 * n_xyz;
    }
  
    void main() {
      // display uv by adding perlin noise
      vec2 displacedUv = vUv + cnoise(vec3(vUv * 7., uTime * .1));

      // perlin noise
      float strength = cnoise(vec3(displacedUv * 5., uTime * .2));

      // outer glow
      float outerGlow = distance(vUv, vec2(.5)) * 5. - 1.4;
      strength += outerGlow;

      // step
      strength += step(-.2, strength) * .8;

      // clamp
      strength = clamp(strength, 0., 1.);

      vec3 color = mix(uColorStart, uColorEnd, strength);
      gl_FragColor = vec4(color, 1.);
    }
  `;
  portalLightMaterial: THREE.ShaderMaterial;

  fireFliesVertextShader = `
    uniform float uPixelRatio;
    uniform float uSize;
    uniform float uTime;
    attribute float aScale;

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.);
      modelPosition.y += sin(uTime + modelPosition.x * 100.) * aScale * .2;
      modelPosition.z += cos(uTime + modelPosition.x * 100.) * aScale * .2;
      modelPosition.x += sin(uTime + modelPosition.x * 100.) * aScale * .2;

      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectionPosition = projectionMatrix * viewPosition;
      
      gl_Position = projectionPosition;
      gl_PointSize = uSize * aScale * uPixelRatio;
      gl_PointSize *= (1./ -viewPosition.z);
    }
  `;

  fireFliesFragmentShader = `
    void main() {
      float distanceToCenter = distance(gl_PointCoord, vec2(.5));
      float strength = .05 / distanceToCenter - .1;
      gl_FragColor = vec4(1., 1., 1., strength);
    }
  `;
  firefliesMaterial: THREE.ShaderMaterial;
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.initTHREE();
    this.addPortal();
    this.addFireFlies();
    this.render();
  }
  addFireFlies() {
    const firefliesGeo = new THREE.BufferGeometry();
    const firefliesCount = 30;
    const positionArr = new Float32Array(firefliesCount * 3);
    const scaleArr = new Float32Array(firefliesCount);

    for (let i = 0; i < firefliesCount; i++) {
      new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 4
      ).toArray(positionArr, i * 3);

      scaleArr[i] = Math.random();
    }
    firefliesGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(positionArr, 3)
    );
    firefliesGeo.setAttribute('aScale', new THREE.BufferAttribute(scaleArr, 1));
    this.firefliesMaterial = new THREE.ShaderMaterial({
      vertexShader: this.fireFliesVertextShader,
      fragmentShader: this.fireFliesFragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 100 },
      },
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const fireflies = new THREE.Points(firefliesGeo, this.firefliesMaterial);
    this.scene.add(fireflies);
  }
  addPortal() {
    const gltfLoader = new GLTFLoader();
    const bakedTexture = this.loader.load('/assets/images/baked-02.jpg');
    bakedTexture.encoding = THREE.sRGBEncoding;
    // Do not flip the Y axes of the texture which is on by default for some reason
    bakedTexture.flipY = false;
    const bakedMaterial = new THREE.MeshBasicMaterial({
      map: bakedTexture,
    });

    const poleLightMateral = new THREE.MeshBasicMaterial({
      color: '#f0bf94',
    });

    this.portalLightMaterial = new THREE.ShaderMaterial({
      vertexShader: this.portalVertexShader,
      fragmentShader: this.portalFragmentShader,
      transparent: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColorStart: {
          value: new THREE.Color('#b91fac'),
        },
        uColorEnd: {
          value: new THREE.Color('#ffebf3'),
        },
      },
    });

    gltfLoader.load('/assets/portal-2.glb', (gltf) => {
      const bakedMesh = gltf.scene.children.find(
        (child) => child.name === 'baked'
      );
      (bakedMesh as THREE.Mesh).material = bakedMaterial;

      const portalLight = gltf.scene.children.find(
        (child) => child.name === 'portalCircle'
      );

      (portalLight as THREE.Mesh).material = this.portalLightMaterial;
      gltf.scene.children
        .filter((child) => child.name.includes('lampLight'))
        .forEach((light: THREE.Mesh) => {
          light.material = poleLightMateral;
        });

      this.scene.add(gltf.scene);
    });
  }
  initTHREE() {
    this.width = this.el.nativeElement.clientWidth;
    this.height = this.el.nativeElement.clientHeight;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      100
    );

    this.camera.position.x = -4;
    this.camera.position.y = 2;
    this.camera.position.z = -4;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setClearColor(0x1e2243);
    this.el.nativeElement.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;

    const minPan = new THREE.Vector3(-0.2, -0.2, -0.2);
    const maxPan = new THREE.Vector3(2, 2, 2);
    const tmp = new THREE.Vector3();

    this.controls.addEventListener('change', () => {
      tmp.copy(this.controls.target);
      this.controls.target.clamp(minPan, maxPan);
      tmp.sub(this.controls.target);
      this.camera.position.sub(tmp);
    });
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.portalLightMaterial.uniforms.uTime.value = elapsedTime;
    this.firefliesMaterial.uniforms.uTime.value = elapsedTime;
    requestAnimationFrame(this.render.bind(this));

    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }
}
