import * as THREE from 'three';
export default class Arrow {
  index;
  buffers;
  offsets;
  rotation: THREE.Quaternion;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  v3 = new THREE.Vector3();
  UP = new THREE.Vector3(0, 1, 0);
  ARROW_FORWARD = new THREE.Vector3(0, 0, 1);
  constructor(index, buffers) {
    this.index = index;
    this.buffers = buffers;
    this.offsets = {
      position: index * 3,
      rotation: index * 4,
      color: index * 4
    };

    this.rotation = new THREE.Quaternion();
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.color = new THREE.Color();
    this.init();
    this.update();
  }
  init() {
    this.color.setHSL(this.random(0.2, 0.6), 0.2, this.random(0.3, 0.7));
    this.color.toArray(this.buffers.color, this.offsets.color);

    this.position.setFromSpherical(
      new THREE.Spherical(
        this.random(10, 300, 1.6),
        Math.PI / 2 + this.random(-0.1, 0.1),
        this.random(0, 2 * Math.PI)
      )
    );

    this.v3.set(this.random(5), this.random(4), this.random(3));

    this.velocity
      .copy(this.position)
      .cross(this.UP)
      .normalize()
      .multiplyScalar(Math.PI * Math.PI)
      .add(this.v3);
  }
  update(dt = 1) {
    this.v3
      .copy(this.position)
      .multiplyScalar(-Math.PI / this.position.lengthSq());
    this.velocity.add(this.v3);

    this.v3.copy(this.velocity).multiplyScalar(dt);
    this.position.add(this.v3);

    this.v3.copy(this.velocity).normalize();
    this.rotation.setFromUnitVectors(this.ARROW_FORWARD, this.v3);

    this.position.toArray(this.buffers.position, this.offsets.position);
    this.rotation.toArray(this.buffers.rotation, this.offsets.rotation);
  }
  random(min = 1, max = 0, pow = 1): number {
    if (arguments.length < 2) {
      max = min;
      min = 0;
    }
    const rnd = pow === 1 ? Math.random() : Math.pow(Math.random(), pow);

    return (max - min) * rnd + min;
  }
}
