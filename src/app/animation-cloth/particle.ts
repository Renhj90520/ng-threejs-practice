import * as THREE from 'three';
import { clothFunction } from './utils';
export default class Particle {
  position: THREE.Vector3;
  previous: THREE.Vector3;
  original: THREE.Vector3;
  a: THREE.Vector3;
  mass;
  invMass;
  tmp: THREE.Vector3;
  tmp2: THREE.Vector3;
  DAMPING = 0.03;
  DRAG = 1 - this.DAMPING;

  constructor(x, y, z, mass) {
    this.position = new THREE.Vector3();
    this.previous = new THREE.Vector3();
    this.original = new THREE.Vector3();

    this.a = new THREE.Vector3(0, 0, 0); // acceleration
    this.mass = mass;
    this.invMass = 1 / mass;
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();

    clothFunction(x, y, this.position);
    clothFunction(x, y, this.previous);
    clothFunction(x, y, this.original);
  }

  addForce(force) {
    this.a.add(this.tmp2.copy(force).multiplyScalar(this.invMass));
  }

  integrate(timesq) {
    const newPos = this.tmp.subVectors(this.position, this.previous);
    newPos.multiplyScalar(this.DRAG).add(this.position);
    newPos.add(this.a.multiplyScalar(timesq));
    this.tmp = this.previous;
    this.previous = this.position;
    this.position = newPos;

    this.a.set(0, 0, 0);
  }
}
