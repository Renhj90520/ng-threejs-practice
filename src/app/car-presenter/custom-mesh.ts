import * as THREE from 'three';

export default class CustomMesh extends THREE.Mesh {
  constructor(meshKey, loaderService, material, callback?) {
    super();

    const meshInfo = loaderService.meshes.find(m => m.key === meshKey);
    if (meshInfo) {
      this.geometry = new THREE.BufferGeometry().fromGeometry(
        meshInfo.mesh.geometry
      );
      this.material = material;
      // this.material = meshInfo.mesh.materials || [];
      if (callback) {
        callback(meshInfo.mesh);
      }
    }
  }

  // getMaterial(name) {
  //   for (let i = 0; i < this.material.length; i++) {
  //     const material = this.material[i];
  //     if (material.name === name) {
  //       return material;
  //     }
  //   }
  //   return null;
  // }

  setMaterial(name, material) {
    if (Array.isArray(this.material)) {
      for (let i = 0; i < this.material.length; i++) {
        const mat = this.material[i];
        if (mat.name === name) {
          material.name = name;
          this.material[i] = material;
          break;
        }
      }
    } else {
      material.name = name;
      this.material = material;
    }
  }
}
