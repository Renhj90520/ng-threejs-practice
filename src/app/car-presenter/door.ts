import * as THREE from 'three';
import CustomMesh from './custom-mesh';

export default class Door extends THREE.Object3D {
  constructor(materials, loaderService) {
    super();

    const door = new CustomMesh('door', loaderService, mesh => {
      mesh.geometry.skinIndices = [];
      mesh.geometry.skinWeights = [];
    });

    door.setMaterial('JFC_Body', materials.body);
    door.setMaterial('JFC_Body_Flip', materials.bodyFlip);
    door.setMaterial('JFC_Glass', materials.glass);
    door.setMaterial('JFC_Others', materials.body);
    door.setMaterial('JFC_Int_Front', materials.interiorFront);
    door.setMaterial('JFC_Int_Back', materials.interiorBack);
    this.rotation.x = Math.PI / 2;
    this.addToBone(door, 'Bone_01');
  }
  addToBone(door: CustomMesh, key) {
    const obj = this.getObjectByName(key);
    if (obj) {
      obj.add(door);
    }
  }
}
