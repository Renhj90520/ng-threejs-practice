import * as THREE from 'three';

export default class CustomMesh extends THREE.Mesh {
  materials = [];
  constructor(meshKey, loaderService) {
    super();

    const meshInfo = loaderService.meshes.find(m => m.key === meshKey);
    if (meshInfo) {
      this.geometry = meshInfo.mesh.geometry;
      this.materials = meshInfo.mesh.materials || [];
    }
  }

  getMaterial(name) {
    for (let i = 0; i < this.materials.length; i++) {
      const material = this.materials[i];
      if (material.name === name) {
        return material;
      }
    }
    return null;
  }

  setMaterial(name, material) {
    if (this.materials.length > 0) {
      for (let i = 0; i < this.materials.length; i++) {
        const mat = this.materials[i];
        if (mat.name === name) {
          material.name = name;
          this.materials[i] = material;
          break;
        }
      }
    } else {
      material.name = name;
      this.material = material;
    }
  }
}
