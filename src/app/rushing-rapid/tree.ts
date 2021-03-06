import * as THREE from 'three';
import { Colors } from './colors';
import { customizeShadow } from './utils';
export default class TREE extends THREE.Object3D {
  scene;
  constructor(x, z, scene) {
    super();

    this.scene = scene;
    this.createTrunk();
    this.createLeaves();
    this.position.set(x, 0, z);
    scene.add(this);
  }
  createLeaves() {
    const geometry = new THREE.BoxGeometry(0.25, 0.4, 0.25);
    const material = new THREE.MeshLambertMaterial({ color: Colors.green });
    const leaves = new THREE.Mesh(geometry, material);
    leaves.position.y = 0.2 + 0.15 + 0.4 / 2;
    leaves.castShadow = true;
    customizeShadow(this.scene, leaves, 0.25);

    this.add(leaves);
  }
  createTrunk() {
    const material = new THREE.MeshLambertMaterial({ color: Colors.brownDark });
    const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const trunk = new THREE.Mesh(geometry, material);
    trunk.position.y = 0.275;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    this.add(trunk);
  }
}
