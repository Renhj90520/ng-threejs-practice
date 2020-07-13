import * as _ from 'lodash';
import * as THREE from 'three';
import { TweenLite, Linear } from 'gsap';
export default class MaterialManager {
  scene: any;
  configurables: any;
  materials: any;
  leathers = ['brown_leather', 'fine_touch_leather 1', 'yellow_leather'];
  objects: any;
  scenes: any;
  currentFadingMaterial: any;
  crossFade: TweenLite;

  constructor(config) {
    this.scene = config.scenes[1];
    this.scenes = config.scenes;
    this.configurables = config.configurables;
    this.initMaterials();
    this.initObjects();
    this.initSpecialProperties();
  }
  initSpecialProperties() {
    const plant_alb = this.getMaterial('Plant_ALB');
    if (plant_alb) {
      plant_alb.side = THREE.DoubleSide;
    }
    const glass = this.getMaterial('glass');
    if (glass) {
      glass.side = THREE.DoubleSide;
      glass.f0Factor = 1;
      glass.depthWrite = false;
    }

    const palm_leaves = this.getMaterial('palm_leaves');
    if (palm_leaves) {
      palm_leaves.side = THREE.DoubleSide;
      palm_leaves.depthWrite = true;
      palm_leaves.f0Factor = 1;
    }

    const tabwood = this.getMaterial('tabwood');
    if (tabwood) {
      tabwood.f0Factor = 1;
    }

    _.each(this.scene.materials, (material) => {
      if (material.pbr) {
        material.f0Factor = 1;
      }
    });

    const sansevieria = this.getMaterial('sansevieria');
    if (sansevieria) {
      sansevieria.side = THREE.DoubleSide;
    }
    const tripod_lamp = this.getMaterial('tripod_lamp');
    if (tripod_lamp) {
      tripod_lamp.side = THREE.DoubleSide;
    }

    const occludes = ['coffee_table_feet', 'chair_feet', 'door_handle'];
    _.each(this.scenes, (scene) => {
      _.each(scene.materials, (material) => {
        if (material.pbr && occludes.indexOf(material.name) < 0) {
          material.defines.OCCLUDE_SPECULAR = true;
        }
      });
    });

    const pool_interior = this.getMaterial('pool_interior');
    if (pool_interior) {
      pool_interior.exposure = 1.25;
    }

    _.each(this.scenes[0].materials, (material) => {
      if (material.pbr) {
        material.exposure = 1.2;
      }
    });
  }
  getMaterial(materialName) {
    let materials;
    for (let i = 0; i < this.scenes.length; i++) {
      materials = _.find(this.scenes[i].materials, (material) => {
        material.name === materialName;
      });
      if (materials) break;
    }

    return materials;
  }
  initObjects() {
    this.objects = {};
    this.configurables.forEach((configurable) => {
      this.objects[configurable.name] = [];
      configurable.linkedObjects.forEach((linkedObj) => {
        const children = this.getChildByName(
          this.scene.getObjectByName(configurable.name),
          linkedObj
        );
        this.objects[configurable.name] = this.objects[
          configurable.name
        ].concat(children);
      });
    });
  }
  getChildByName(obj, linkedObj) {
    const children = [];
    obj.traverse((subObj) => {
      if (subObj.name === linkedObj) {
        children.push(subObj);
      }
    });
    return children;
  }
  initMaterials() {
    this.materials = {};
    this.configurables.forEach((configurable) => {
      const name = configurable.name;
      const obj = this.scene.getObjectByName(name);
      const materials = this.getMaterialsForObject(obj);
      const linkedObjMaterial = obj.getObjectByName(
        configurable.linkedObjects[0]
      ).material;

      const lightMap = linkedObjMaterial.uniforms.sTextureLightMap.value;
      const lightMapM = linkedObjMaterial.uniforms.sTextureLightMapM.value;
      const aoMap2 = linkedObjMaterial.uniforms.sTextureAOMap2.value;
      const normalMap2 = linkedObjMaterial.uniforms.sTextureNormalMap2.value;
      const subMaterials = obj.getObjectByName('materials');

      this.materials[name] = materials;
      materials.forEach((material) => {
        this.scene.materials[material.uuid] = material;
        if (lightMap) {
          material.lightMap = lightMap;
          material.lightMapM = lightMapM;
          material.defines.USE_LIGHTMAP = true;
        }
        if (aoMap2) {
          material.uniforms.sTextureAOMap2.value = aoMap2;
          material.defines.USE_AOMAP2 = true;
        }
        if (normalMap2) {
          material.uniforms.sTextureNormalMap2.value = normalMap2;
          material.defines.USE_NORMALMAP2 = true;
        }
        material.needsUpdate = true;
        if (this.leathers.indexOf(material.name) < 0) {
          material.ignoreDirLight = true;
        }
      });
      if (this.leathers.indexOf(linkedObjMaterial.name) < 0) {
        linkedObjMaterial.ignoreDirLight = true;
      }

      subMaterials.traverse((child) => {
        child.visible = false;
      });
    });
  }
  getMaterialsForObject(obj) {
    if (obj) {
      const materials = obj.getObjectByName('materials');
      if (materials) {
        return _.map(materials.children, function (material) {
          // TODO MultiMaterial?
          return material.children.length > 0
            ? material.children[0].material.clone()
            : material.material.clone();
        });
      }
    }
  }

  setObjectMaterial(obj, idx) {
    const material = this.materials[obj.name][idx];
    this.crossFadeMaterial(this.objects[obj.name], material);
  }
  crossFadeMaterial(objs, material) {
    if (this.crossFade) {
      this.crossFade.eventCallback('onComplete', () => {
        objs.forEach((obj) => {
          obj.material = this.currentFadingMaterial;
          obj.parent.remove(obj.materialClone);
          obj.materialClone = null;
        });

        this.currentFadingMaterial.transparent = false;
        this.currentFadingMaterial.depthWrite = true;
        this.crossFade = null;
        if (material !== this.currentFadingMaterial) {
          this.crossFadeMaterial(objs, material);
        }
      });
    } else {
      this.currentFadingMaterial = material;
      objs.forEach((obj) => {
        const copy = obj.clone();
        obj.parent.add(copy);
        obj.materialClone = copy;
        obj.targetMaterial = material;
        copy.material = material;
      });
      material.transparent = true;
      material.depthWrite = false;
      material.opacity = 0;

      const reset = () => {
        objs.forEach((obj) => {
          obj.material = material;
          obj.parent.remove(obj.materialClone);
          obj.materialClone = null;
        });
        material.transparent = false;
        material.depthWrite = true;
        this.crossFade = null;
      };
      this.crossFade = TweenLite.to(material, 0.3, {
        opacity: 1,
        ease: Linear.easeNone,
        onComplete: () => {
          reset();
        },
      });
    }
  }
}
