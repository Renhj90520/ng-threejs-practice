import * as SimplexNoise from 'simplex-noise';
import * as THREE from 'three';
export default class Spike {
  sampler;
  pos = new THREE.Vector3();
  scale = Math.random() * 0.01 + 0.001;
  one;
  two;
  constructor(sampler) {
    this.sampler = sampler;
    this.sampler.sample(this.pos);
  }

  update(a, beat) {
    const simplexNoise = new SimplexNoise();
    const noise =
      simplexNoise.noise4D(
        this.pos.x * 1.5,
        this.pos.y * 1.5,
        this.pos.z * 1.5,
        a * 0.0005
      ) + 1;

    this.one = this.pos.clone().multiplyScalar(1.01 + noise * 0.15 * beat.a);
    this.two = this.one.clone().add(this.one.clone().setLength(this.scale));
  }
}
