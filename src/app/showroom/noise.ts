import * as THREE from 'three';

export default class Noise {
  target: THREE.WebGLRenderTarget;
  material: THREE.ShaderMaterial;
  vertexShader = `
    varying vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }  
  `;
  fragmentShader = `
    varying vUv;
    float rand(vec2 co) {
        return frac(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
        gl_FragColor = vec4(vec3(rand(vUv)), 1.);
    }
  `;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  constructor() {
    this.target = new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBFormat,
    });

    this.target.texture.generateMipmaps = false;
    this.material = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(plane);
  }

  render(renderer) {
    renderer.render(this.scene, this.camera, this.target);
  }
}
