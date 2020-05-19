import * as THREE from 'three';
import WaterEffect from './water-effect';

export default class Water extends THREE.Mesh {
  effect: WaterEffect;
  constructor(opts, resourceManager) {
    super();
    const normalMap = resourceManager.getTexture('textures/waternormals.jpg');
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    const lightPosition = new THREE.Vector3();
    if (opts.light && opts.light instanceof THREE.Light) {
      lightPosition.copy(opts.light.position);
    } else {
      lightPosition.set(-0.2, 0.3, -0.5);
    }

    this.effect = new WaterEffect(opts.renderer, opts.camera, {
      color: 0xffffff,
      waterNormals: normalMap,
      transparent: opts.transparent,
      sunDirection: lightPosition,
      sunColor: 0xffffff,
      shininess: 500,
      alpha: 0.35,
    });
    if (opts.object) {
      this.geometry = opts.object.geometry;
      this.material = this.effect.material;
      this.position.copy(opts.object.position);
      this.rotation.copy(opts.object.rotation);
      this.scale.copy(opts.object.scale);
    } else {
      this.geometry = new THREE.PlaneBufferGeometry(2000, 2000, 10, 10);
      this.material = this.effect.material;
      this.rotation.x = 0.5 * -Math.PI;
      this.position.y = -20;
    }
    this.add(this.effect);
  }

  update(clock) {
    if (this.effect.material.uniforms.time) {
      this.effect.material.uniforms.time.value += 0.25 * clock.delta;
    }
    this.effect.update();
  }

  render() {
    this.effect.render();
  }
}
