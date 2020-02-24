import * as THREE from 'three';
import { TweenLite } from 'gsap';

export default class HotSpot extends THREE.Sprite {
  group: any;
  minDistance: any;
  maxSize: any;
  fadeDuration: number;
  orientation: any;
  pickable: boolean;
  constructor(parameters) {
    super();
    const loader = new THREE.TextureLoader();

    this.material = new THREE.SpriteMaterial({
      depthTest: false,
      transparent: true,
      opacity: 0.9,
      map: loader.load('/assets/carpresenter/textures/car/hotspot.png')
    });
    this.name = parameters.name;
    this.group = parameters.group;
    this.position.copy(parameters.position);
    this.orientation = parameters.orientation;
    this.minDistance = parameters.minDistance || 9;
    this.maxSize = parameters.maxSize !== undefined ? parameters.maxSize : 1;
    this.fadeDuration = 200;
  }
  update(camera) {
    const pos = new THREE.Vector3();
    pos.subVectors(camera.position, this.position).normalize();
    const process = THREE.Math.clamp(this.orientation.dot(pos), 0, 1);
    const scale = this.maxSize * this.quarticOut(process);
    this.scale.set(scale, scale, scale);
  }
  fadeIn() {
    TweenLite.fromTo(
      this.material,
      this.fadeDuration / 1000,
      { opacity: 0 },
      {
        opacity: 0.9,
        onComplete: () => {
          this.pickable = true;
        }
      }
    ).play();
  }

  fadeOut() {
    TweenLite.to(this.material, this.fadeDuration / 1000, {
      opacity: 0,
      onComplete: () => {
        this.pickable = false;
      }
    }).play();
  }

  quarticOut(k) {
    return 1 - --k * k * k * k * k;
  }
}
