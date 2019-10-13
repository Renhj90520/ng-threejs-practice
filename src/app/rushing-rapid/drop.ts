import * as THREE from 'three';
import { Colors } from './colors';
export default class Drop {
  drop: THREE.Mesh;
  speed = 0;
  lifespan = Math.random() * 50 + 50;
  constructor(scene) {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshLambertMaterial({ color: Colors.blue });

    this.drop = new THREE.Mesh(geometry, material);
    this.drop.position.set(Math.random(), 0.1, 1 + (Math.random() - 0.5) * 0.1);
    scene.add(this.drop);
  }

  update() {
    this.speed += 0.0007;
    this.lifespan--;
    this.drop.position.x += (0.5 - this.drop.position.x) / 70;
    this.drop.position.y -= this.speed;
  }
}
