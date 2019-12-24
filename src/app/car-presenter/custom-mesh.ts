import * as THREE from 'three';
import { LegacyJSONLoader } from 'three/examples/jsm/loaders/deprecated/LegacyJSONLoader';

export default class CustomMesh extends THREE.Mesh {
  materials = [];
  constructor(filePath) {
    super();
    const loader = new LegacyJSONLoader();
    loader.load(`/assets/carpresenter/models/${filePath}`, result => {
      console.log(result);
      this.geometry = result.geometry;
      this.materials = result.materials || [];
    });
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
