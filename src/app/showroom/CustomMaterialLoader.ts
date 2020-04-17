import * as THREE from 'three';
import { Material } from 'three';
import PBRMaterial from './PBRMaterial';
export default class CustomMaterialLoader extends THREE.MaterialLoader {
  resourceManager: any;
  constructor(resourceManager, manager?) {
    super(manager);
    this.resourceManager = resourceManager;
  }

  parse(materialInfo: any): Material {
    let material;
    if (materialInfo.type === 'MultiMaterial') {
      material = {};
      material.type = materialInfo.type;
      material.uuid = materialInfo.uuid;
      material.name = materialInfo.name;
      material.materials = materialInfo.materials.map((mInfo) => {
        if (mInfo.type === 'ShaderMaterial') {
          mInfo.color = undefined;
        }
        return this.parse(mInfo);
      });
    } else {
      material = THREE.MaterialLoader.prototype.parse.call(this, materialInfo);

      if (materialInfo.customType) {
        switch (materialInfo.customType) {
          case 'PBRMaterial':
            const metalGlossMap = materialInfo.metalGlossMap
              ? this.textures[materialInfo.metalGlossMap]
              : null;
            const map2 = materialInfo.map2
              ? this.textures[materialInfo.map2]
              : null;
            const normalMap2 = materialInfo.normalMap2
              ? this.textures[materialInfo.normalMap2]
              : null;
            const aoMap2 = materialInfo.aoMap2
              ? this.textures[materialInfo.aoMap2]
              : null;
            const lightMapM = materialInfo.lightMapM
              ? this.textures[materialInfo.lightMapM]
              : null;
            const lightMapDir = materialInfo.lightMapDir
              ? this.textures[materialInfo.lightMapDir]
              : null;
            const emissiveMap = materialInfo.emissiveMap
              ? this.textures[materialInfo.emissiveMap]
              : null;
            const packedPBRMap = materialInfo.packedPBRMap
              ? this.textures[materialInfo.packedPBRMap]
              : null;
            return PBRMaterial.create(
              {
                uuid: materialInfo.uuid,
                name: materialInfo.name,
                color: materialInfo.color,
                opacity: material.opacity,
                transparent: material.transparent,
                alphaTest: material.alphaTest,
                environment: materialInfo.environment,
                exposure: materialInfo.exposure,
                albedoMap: material.map,
                albedoMap2: map2,
                metalGlossMap,
                packedMap: packedPBRMap,
                metalFactor: materialInfo.metalFactor,
                glossFactor: materialInfo.glossFactor,
                normalMapFactor: materialInfo.normalFactor,
                normalMap: material.normalMap,
                normalMap2,
                lightMap: material.lightMap,
                lightMapM,
                lightMapDir,
                aoMap: material.aoMap,
                aoMap2,
                aoFactor: materialInfo.aoFactor,
                occludeSpecular: materialInfo.occludeSpecular,
                emissiveMap,
              },
              this.resourceManager
            );
        }
      }
    }

    // TODO Custom Type
    return material;
  }
}
