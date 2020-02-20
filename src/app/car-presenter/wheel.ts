import * as THREE from 'three';
import SteelMaterial from './steel-material';
import RimMaterial from './rim-material';
import { LoaderService } from './loader.service';
import CustomMesh from './custom-mesh';
import { Gyroscope } from 'three/examples/jsm/misc/Gyroscope';

export default class Wheel extends THREE.Object3D {
  materials;
  models;
  currentRim: any;
  tire: THREE.Object3D;
  rim: THREE.Object3D;
  screw: THREE.Object3D;
  logo: THREE.Object3D;
  shadow: THREE.Mesh;
  cover: THREE.Mesh;
  rotating: boolean;
  speed: number;
  loaderService: LoaderService;
  constructor(envMap, carSide, loaderService: LoaderService) {
    super();
    this.loaderService = loaderService;
    this.initModels(envMap, carSide);
    this.initBones();
    this.initShadow();
    this.initCover();
    this.tire.add(this.models.tire);
    this.tire.name = 'tire';
    this.rim.add(this.currentRim);
    this.rim.name = 'rim';
    this.screw.add(this.models.screw);
    this.screw.name = 'screw';
    this.logo.add(this.models.logo);
    this.logo.name = 'logo';
    this.rotating = false;
    this.speed = 0;
  }
  setEnvMap(envMap) {
    this.materials.rim.envMap = envMap;
    this.materials.rim.needsUpdate = true;
  }
  initCover() {
    const radius = 0.3;
    const geo = new THREE.CylinderGeometry(radius, radius, 0.01, 24, 1);
    this.cover = new THREE.Mesh(geo, this.materials.cover);
    this.cover.rotation.z = Math.PI / 2;
    this.cover.position.x += 0.11;
    this.cover.renderOrder = 1;
    this.add(this.cover);
  }
  initShadow() {
    const path = '/assets/carpresenter/textures/car/shadow/';
    const loader = new THREE.TextureLoader();
    const shadowMap = loader.load(`${path}JFC_Ground_Wheel_AO.png`);
    this.shadow = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.9, 1.5, 1, 1),
      new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true })
    );
    this.shadow.position.y -= 0.38;
    this.shadow.rotation.x = -Math.PI / 2;
    //TODO renderDepth
    const gyroscope = new Gyroscope();
    gyroscope.add(this.shadow);
    this.models.tire.add(gyroscope);
  }
  initBones() {
    this.tire = new THREE.Object3D();
    this.tire.position.fromArray([-0.0019662, 295318e-9, 750068e-10]);
    this.add(this.tire);
    this.rim = new THREE.Object3D();
    this.rim.position.fromArray([0.00420342, -0.00411721, 0.00410991]);
    this.add(this.rim);
    this.screw = new THREE.Object3D();
    this.screw.position.fromArray([-0.0659582, 732697e-9, 0.00550807]);
    this.add(this.screw);
    this.logo = new THREE.Object3D();
    this.logo.position.fromArray([-0.0861295, -474085e-10, -349638e-10]);
    this.logo.rotation.x = Math.PI / 2;
    this.add(this.logo);
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
      rimInt: new RimMaterial({
        color: new THREE.Color(0xffffff),
        map: rimIntMap,
        normalMap: rimIntNormalMap,
        shininess: 10,
        specular: new THREE.Color(0x555555),
        carSide: carSide
      }),
      cover: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true })
    };
    this.models = {
      tire: new CustomMesh('tire', this.loaderService),
      rim: new CustomMesh('rim', this.loaderService),
      screw: new CustomMesh('screw', this.loaderService),
      logo: new CustomMesh('logo', this.loaderService)
    };
    this.models.rim.setMaterial('JFC_Rim_01', this.materials.rim);
    this.models.rim.setMaterial('JFC_Rim_Int', this.materials.rimInt);
    // this.models.rim.geometry.materials = [
    //   this.materials.rim,
    //   this.materials.rimInt
    // ];
    // this.models.rim.geometry.faces.forEach((face, i) => {
    //   if (i <= 2383) {
    //     face.materialIndex = 0;
    //   } else {
    //     face.materialIndex = 1;
    //   }
    // });
    // this.models.rim.needsUpdate = true;
    // this.models.rim.geometry.groupsNeedUpdate = true;
    // this.models.rim.geometry.uvsNeedUpdate = true;
    // this.models.rim.geometry.elementsNeedUpdate = true;
    this.models.tire.setMaterial('JFC_Tire', this.materials.tire);
    this.models.screw.material = this.materials.rim;
    this.models.logo.material = this.materials.rim;
    this.currentRim = this.models.rim;
  }
  update(clock) {
    if (this.rotating) {
      this.rotation.x += this.speed *= clock.delta;
    }
  }
}
