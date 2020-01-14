import * as THREE from 'three';
import SteelMaterial from './steel-material';

export default class Wheel extends THREE.Object3D {
  materials;
  constructor(envMap, carSide) {
    super();
    this.initModels(envMap, carSide);
  }
  initModels(envMap, carSide) {
    const loader = new THREE.TextureLoader();
    const path = '/assets/carpresenter/textures/car/wheels/';
    const rimMap = loader.load(`${path}rim/JFC_Rim_01.jpg`);
    const rimReflectionMask = loader.load(`${path}rim/JFC_Rim_01_Mask.png`);
    const rimNormalMap = loader.load(`${path}rim/JFC_Rim_01_NM.png`);
    const rimIntMap = loader.load(`${path}int/JFC_Rim_Int.jpg`);
    const rimIntNormalMap = loader.load(`${path}int/JFC_Rim_Int_NM.png`);
    const tireMap = loader.load(`${path}tire/JFC_Tire.jpg`);
    const tireNormalMap = loader.load(`${path}tire/JFC_Tire_NM.png`);
    this.materials = {
      rim: new SteelMaterial({
        map: rimMap,
        color: new THREE.Color(0xffffff),
        normalMap: rimNormalMap,
        shininess: 100,
        reflectivity: 0.15,
        reflectionMask: rimReflectionMask,
        envMap: envMap
      }),
      tire: new THREE.MeshPhongMaterial({
        map: tireMap,
        color: 0xffffff,
        shininess: 10,
        normalMap: tireNormalMap
      }),
      // rimInt: new RimMaterial({})
    };
  }
}
