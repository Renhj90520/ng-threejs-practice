import * as THREE from 'three';

export default class Wheel extends THREE.Object3D {
  constructor(envMap, carSide) {
    super();
    this.initModels(envMap, carSide);
  }
  initModels(envMap, carSide) {
    const loader = new THREE.TextureLoader();
    const path = '/assets/carpresenter/textures/car/wheels/';
    const rimMap = loader.load(`${path}rim/JFC_Rim_01.jpg`);
  }
}
