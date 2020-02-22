import * as THREE from 'three';
import CustomMesh from './custom-mesh';
import { LoaderService } from './loader.service';
import RealisticMaterial from './realistic-material';

export default class HeadLights extends THREE.Object3D {
  envMap: any;
  mesh: CustomMesh;
  innerMaterial: RealisticMaterial;
  glassMaterial: THREE.MeshLambertMaterial;
  emissiveMap: THREE.Texture;
  emissiveMap2: THREE.Texture;
  constructor(parameters, loaderService: LoaderService) {
    super();
    this.envMap = parameters.envMap;

    const loader = new THREE.TextureLoader();
    const path = '/assets/carpresenter/textures/car/headlights/';
    const map = loader.load(`${path}JFC_Optic.png`);
    const normalMap = loader.load(`${path}JFC_Optic_NM.png`);
    const emissiveMap = loader.load(`${path}JFC_Optic_EM.png`);
    const emissiveMap2 = loader.load(`${path}JFC_Optic_EM_2.png`);
    const specularMap = loader.load(`${path}JFC_Optic_SM.png`);
    const mask = loader.load(`${path}JFC_Optic_Mask.png`);
    const innerMaterial = new RealisticMaterial({
      color: new THREE.Color(0xffffff),
      map,
      normalMap,
      emissiveMap,
      emissiveIntensity: 2,
      combine: THREE.MixOperation,
      specularMap,
      reflectionMask: mask,
      envMap: this.envMap,
      hemisphereLightDirection: [0, 1, 0]
    });
    loaderService.customMaterials.push(innerMaterial);
    const glassMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      envMap: this.envMap,
      transparent: true,
      combine: THREE.AddOperation,
      reflectivity: 1,
      opacity: 0.15
    });

    this.innerMaterial = innerMaterial;
    this.glassMaterial = glassMaterial;
    this.emissiveMap = emissiveMap;
    this.emissiveMap2 = emissiveMap2;
    this.mesh = new CustomMesh('headlights', loaderService, [
      innerMaterial,
      glassMaterial
    ]);
    this.add(this.mesh);
  }

  setEnvMap(envMap) {
    this.innerMaterial.envMap = envMap;
    this.glassMaterial.envMap = envMap;
  }
  enable() {
    this.innerMaterial.emissiveIntensity = 1;
    this.innerMaterial.emissiveMap = this.emissiveMap2;
  }
  disable() {
    this.innerMaterial.emissiveIntensity = 1;
    this.innerMaterial.emissiveMap = this.emissiveMap;
  }
}
