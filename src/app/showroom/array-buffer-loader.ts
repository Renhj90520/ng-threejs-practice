import * as THREE from 'three';

export default class ArrayBufferLoader extends THREE.FileLoader {
  constructor(manager = THREE.DefaultLoadingManager) {
    super(manager);
    this.setResponseType('arraybuffer');
  }
}
