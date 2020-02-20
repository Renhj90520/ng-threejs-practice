import * as THREE from 'three';
import SteelMaterial from './steel-material';
import GlassMaterial from './glass-material';
import CustomMesh from './custom-mesh';
import { LoaderService } from './loader.service';
import Door from './door';
import Wheel from './wheel';
import RealisticMaterial from './realistic-material';
import HotSpot from './hot-spot';
import { TweenLite } from 'gsap';
import HeadLights from './head-lights';

export default class Car extends THREE.Object3D {
  COLORS = [
    0xc0c4c6,
    0x969a9c,
    0x5f6163,
    0x000000,
    0xd9dddf,
    0x7d7a74,
    0x7a949d,
    0x373330,
    0x1e1322
  ];
  hotspots = [];
  materials;
  cubeTextureLoder: THREE.CubeTextureLoader;
  cubeMapLightSoft: any;
  cubeMapLightSharp: THREE.CubeTexture;
  cubeMapDarkSoft: THREE.CubeTexture;
  cubeMapDarkSharp: THREE.CubeTexture;
  cubeMapInterior: THREE.CubeTexture;
  textureLoader: THREE.TextureLoader;
  carShadowTexture: THREE.Texture;
  bodyTexture: THREE.Texture;
  bodyNormalMapTexture: THREE.Texture;
  bodyEmissiveMapTexture: THREE.Texture;
  carrosserieMaskTexture: THREE.Texture;
  bodyMaskTexture: THREE.Texture;
  frontPlateTexture: THREE.Texture;
  rearPlateTexture: THREE.Texture;
  body: THREE.Object3D;
  exterior: CustomMesh;
  loaderService: LoaderService;
  door: Door;
  wheels: any[];
  shadow: THREE.Mesh;
  leftFlare: THREE.Sprite;
  rightFlare: THREE.Sprite;
  lightsEnabled: boolean;
  flares: THREE.Sprite[];
  frontPlate: THREE.Mesh;
  rearPlate: THREE.Mesh;
  speed: number;
  rolling: boolean;
  interior: CustomMesh;
  headLights: HeadLights;
  frontGlow: THREE.Object3D;
  frontGlowMaterial: THREE.MeshBasicMaterial;
  constructor(loaderService: LoaderService) {
    super();
    this.loaderService = loaderService;
    this.cubeTextureLoder = new THREE.CubeTextureLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.loadTextures();
    this.initMaterials();
    this.initBody();
    this.initExterior();
    this.initInterior();
    this.initDoor();
    this.initWheels();
    this.initShadow();
    this.initFlares();
    this.initPlates();
    // TODO tweens
    this.rolling = false;
    this.speed = 0;

    this.headLights = new HeadLights(
      { envMap: this.cubeMapLightSharp },
      this.loaderService
    );
    this.body.add(this.headLights);
    this.initFrontGlow();
    setTimeout(() => {
      this.headLights.innerMaterial.emissiveIntensity = 1;
      this.showFrontGlow();
    }, 5000);
  }
  showFrontGlow() {
    this.frontGlow.visible = true;
  }
  hideFrontGlow() {
    this.frontGlow.visible = false;
  }
  initFrontGlow() {
    const loader = new THREE.TextureLoader();
    const map = loader.load('/assets/carpresenter/textures/env/c-glow.png');
    this.frontGlowMaterial = new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthTest: false,
      color: 0xffffff,
      side: THREE.DoubleSide
    });

    this.frontGlow = new THREE.Object3D();
    this.frontGlow.name = 'frontGlow';
    this.add(this.frontGlow);
    this.frontGlow.visible = false;
    const frontGlow = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(1, 1, 1, 1),
      this.frontGlowMaterial
    );
    frontGlow.position.set(0.69, 0.65, 2.25);
    frontGlow.scale.multiplyScalar(0.34);
    this.frontGlow.add(frontGlow);
    const frontGlowCopy = frontGlow.clone();
    frontGlowCopy.position.set(-0.69, 0.65, 2.25);
    frontGlowCopy.scale.x *= -1;
    this.frontGlow.add(frontGlowCopy);
  }

  initMaterials() {
    this.materials = {
      body: new SteelMaterial({
        map: this.bodyTexture,
        color: new THREE.Color(this.COLORS[2]),
        color2: new THREE.Color(this.COLORS[3]),
        envmap: this.cubeMapLightSoft,
        combine: THREE.MixOperation,
        reflectivity: 0.15,
        shininess: 30,
        specular: new THREE.Color(0x333333),
        normalMap: this.bodyNormalMapTexture,
        emissiveIntensity: 0.75,
        emissiveMap: this.bodyEmissiveMapTexture,
        emissiveColor: new THREE.Color(0xff4040),
        paintMask: this.carrosserieMaskTexture,
        reflectionMask: this.bodyMaskTexture,
        envMapOffset: 0,
        transparent: false,
        flipN: false
      }),
      bodyFlip: new SteelMaterial({
        map: this.bodyTexture,
        color: new THREE.Color(this.COLORS[2]),
        color2: new THREE.Color(this.COLORS[3]),
        envMap: this.cubeMapLightSoft,
        combine: THREE.MixOperation,
        reflectivity: 0.15,
        shininess: 30,
        specular: new THREE.Color(0x333333),
        normalMap: this.bodyNormalMapTexture,
        emissiveIntensity: 0.75,
        emissiveMap: this.bodyEmissiveMapTexture,
        emissiveColor: new THREE.Color(0xff4040),
        paintMask: this.carrosserieMaskTexture,
        reflectionMask: this.bodyMaskTexture,
        envMapOffset: 0,
        transparent: false,
        flipN: true
      }),
      glass: new GlassMaterial({
        color: new THREE.Color(0x000000),
        map: this.bodyTexture,
        envMap: this.cubeMapLightSharp,
        transparent: true,
        combine: THREE.AddOperation,
        reflectivity: 0.35,
        envMapOffset: 0,
        side: THREE.FrontSide,
        opacity: 1
      }),
      shadow: new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: this.carShadowTexture,
        transparent: true,
        opacity: 1,
        depthWrite: false
      }),
      rearlight: new SteelMaterial({
        map: this.bodyTexture,
        color: new THREE.Color(this.COLORS[2]),
        color2: new THREE.Color(this.COLORS[3]),
        envMap: this.cubeMapLightSharp,
        combine: THREE.AddOperation,
        reflectivity: 0.3,
        emissiveIntensity: 0.75,
        emissiveMap: this.bodyEmissiveMapTexture,
        emissiveColor: new THREE.Color(0xff4040),
        envMapOffset: 0
      }),
      frontPlate: new THREE.MeshBasicMaterial({
        transparent: true,
        map: this.frontPlateTexture
      }),
      rearPlate: new THREE.MeshBasicMaterial({
        transparent: true,
        map: this.rearPlateTexture
      }),
      debug: new THREE.MeshBasicMaterial({ color: 0xff00ff })
    };
  }
  initInterior() {
    const loader = new THREE.TextureLoader();
    const path = '/assets/carpresenter/textures/car/';
    const frontMap = loader.load(`${path}interior/JFC_Int_Front.jpg`);
    const backMap = loader.load(`${path}interior/JFC_Int_Back.jpg`);
    const frontNormalMap = loader.load(`${path}normalmap/JFC_Int_Front_NM.png`);
    const backNormalMap = loader.load(`${path}normalmap/JFC_Int_Back_NM.png`);
    const frontEmissiveMap = loader.load(
      `${path}interior/JFC_Int_Front_EM.png`
    );
    const backSpecularMap = loader.load(`${path}interior/JFC_Int_Back_SM.png`);
    const backEmissiveMap = loader.load(`${path}interior/JFC_Int_Back_EM.png`);
    const frontMask = loader.load(`${path}interior/JFC_Int_Front_Mask.png`);
    const backMask = loader.load(`${path}interior/JFC_Int_Back_Mask.png`);
    const carrosserieMask = loader.load(
      `${path}interior/JFC_Int_Carrosserie_Mask.png`
    );
    this.materials.interiorFront = new SteelMaterial({
      map: frontMap,
      color: new THREE.Color(this.COLORS[2]),
      color2: new THREE.Color(this.COLORS[3]),
      normalMap: frontNormalMap,
      emissiveMap: frontEmissiveMap,
      emissiveColor: new THREE.Color(0x0006a4),
      emissiveIntensity: 1,
      shininess: 20,
      reflectionMask: frontMask,
      envMap: this.cubeMapInterior,
      envMapOffset: 0,
      combine: THREE.MixOperation,
      reflectivity: 0.15,
      paintMask: carrosserieMask,
      transparent: true
    });

    this.materials.interiorBack = new RealisticMaterial({
      map: backMap,
      color: new THREE.Color(0xffffff),
      normalMap: backNormalMap,
      specularMap: backSpecularMap,
      reflectionMask: backMask,
      shininess: 0,
      reflectivity: 0,
      emissiveMap: backEmissiveMap,
      emissiveIntensity: 1,
      emissiveColor: new THREE.Color(0x0006a4)
    });
    this.interior = new CustomMesh('interior', this.loaderService);
    this.interior.name = 'interior';
    this.exterior.add(this.interior);
    this.interior.renderOrder = 0;
    this.interior.setMaterial('JFC_Int_Front', this.materials.interiorFront);
    this.interior.setMaterial('JFC_Int_Back', this.materials.interiorBack);
  }
  initPlates() {
    this.frontPlate = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.5, 0.5, 1, 1),
      this.materials.frontPlate
    );
    this.frontPlate.name = 'frontPlate';
    this.frontPlate.position.set(0, 0.32, 2.45);
    this.add(this.frontPlate);
    this.rearPlate = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.55, 0.55, 1, 1),
      this.materials.rearPlate
    );
    this.rearPlate.name = 'rearPlate';
    this.rearPlate.rotation.x = 1.1 * Math.PI;
    this.rearPlate.rotation.z = Math.PI;
    this.rearPlate.position.set(0, 0.485, -2.34);
    this.add(this.rearPlate);
  }
  initFlares() {
    const flares = new THREE.Object3D();
    const loader = new THREE.TextureLoader();
    const flareMap = loader.load('/assets/carpresenter/textures/car/flare.png');
    const spriteMaterial = new THREE.SpriteMaterial({
      map: flareMap,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      opacity: 0
    });
    const scale = 2;
    const leftFlare = new THREE.Sprite(spriteMaterial.clone());
    leftFlare.name = 'leftFlare';
    leftFlare.position.set(0.75, 0.65, 1.95);
    leftFlare.scale.set(scale, scale, scale);
    // sprite.orientation = new THREE.Vector3(0.75, 0, 1); TODO
    this.leftFlare = leftFlare;
    flares.add(this.leftFlare);
    const rightFlare = new THREE.Sprite(spriteMaterial.clone());
    rightFlare.name = 'rightFlare';
    rightFlare.position.set(-0.75, 0.65, 1.95);
    rightFlare.scale.set(scale, scale, scale);
    // rightFlare.orientation = new THREE.Vector3(-0.75, 0, 1); TODO
    this.rightFlare = rightFlare;
    flares.add(rightFlare);
    this.lightsEnabled = false;
    flares.rotation.x = Math.PI / 2;
    this.body.add(flares);
    this.flares = [leftFlare, rightFlare];
  }
  initShadow() {
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6, 1, 1),
      this.materials.shadow
    );
    shadow.name = 'shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y -= 0.2;
    this.add(shadow);
    this.shadow = shadow;
  }
  initWheels() {
    const halfWidth = 0.83;
    const height = 0.17;
    const front = 1.42;
    const back = 1.47;
    const frontRight = new Wheel(
      this.cubeMapLightSharp,
      'right',
      this.loaderService
    );
    frontRight.position.set(-halfWidth, height, front);
    const frontLeft = new Wheel(
      this.cubeMapLightSharp,
      'left',
      this.loaderService
    );
    frontLeft.position.set(halfWidth, height, front);
    frontLeft.rotation.y = Math.PI;
    const backRight = new Wheel(
      this.cubeMapLightSharp,
      'right',
      this.loaderService
    );
    backRight.position.set(-halfWidth, height, -back);
    const backLeft = new Wheel(
      this.cubeMapLightSharp,
      'left',
      this.loaderService
    );
    backLeft.position.set(halfWidth, height, -back);
    backLeft.rotation.y = Math.PI;
    this.wheels = [frontRight, frontLeft, backRight, backLeft];
    this.wheels.forEach(wheel => {
      this.add(wheel);
    });
  }
  initDoor() {
    this.door = new Door(this.materials, this.loaderService);
    this.body.add(this.door);
  }

  initExterior() {
    this.exterior = new CustomMesh('exterior', this.loaderService);
    this.exterior.name = 'exterior';
    this.exterior.castShadow = true;
    this.exterior.receiveShadow = true;
    this.body.add(this.exterior);
    this.exterior.setMaterial('JFC_Body', this.materials.body);
    this.exterior.setMaterial('JFC_Body_Flip', this.materials.bodyFlip);
    this.exterior.setMaterial('JFC_Others', this.materials.body);
    this.exterior.setMaterial('JFC_Glass', this.materials.glass);
    this.exterior.setMaterial('JFC_Optic_Back', this.materials.rearlight);
    this.exterior.geometry.computeBoundingBox();
    const boundingBox = this.exterior.geometry.boundingBox;
    const carlength = boundingBox.max.y + Math.abs(boundingBox.min.y) + 0.05;
    this.materials.body.carLength = carlength;
    this.exterior.renderOrder = 1;
  }
  initBody() {
    this.body = new THREE.Object3D();
    this.body.rotation.x = -Math.PI / 2;
    this.body.name = 'body';
    this.add(this.body);
  }
  setSpeed(speed) {
    this.speed = speed;
    this.wheels.forEach(wheel => {
      wheel.speed = speed;
    });
  }
  startRolling() {
    this.rolling = true;
    this.wheels.forEach(wheel => {
      wheel.rotating = true;
    });
  }
  stopRolling() {
    this.rolling = false;
    this.wheels.forEach(wheel => {
      wheel.rotating = false;
    });
  }

  toggleRolling() {
    this.rolling = !this.rolling;

    if (this.rolling) {
      this.startRolling();
    } else {
      this.stopRolling();
    }
  }
  // openWheels() {
  //   this.wheels.forEach(wheel => {
  //     wheel.open();
  //   });
  // }

  addHotspot(parameters) {
    const hotspot = new HotSpot(parameters);
    this.add(hotspot);
    this.hotspots.push(hotspot);
    this.dispatchEvent({ type: 'hotspot', hotspot });
  }
  enableHeadlights() {
    this.leftFlare.material.opacity = 0.9;
    this.rightFlare.material.opacity = 0.9;
    this.lightsEnabled = true;

    this.headLights.enable();
  }
  disableHeadlights() {
    this.leftFlare.material.opacity = 0;
    this.rightFlare.material.opacity = 0;
    this.lightsEnabled = false;

    this.headLights.disable();
  }
  updateFlares(camera) {
    this.flares.forEach(flare => {
      this.updateFlare(flare, camera);
    });
  }
  updateFlare(flare: THREE.Sprite, camera) {
    const cameraPosition = new THREE.Vector3();
    const projectionDirection = new THREE.Vector3();
    const maxRangeB2 = 1.5;
    if (this.lightsEnabled) {
      cameraPosition.setFromMatrixPosition(camera.matrixWorld);
      projectionDirection
        .subVectors(cameraPosition, flare.position)
        .normalize();
      // TODO
    }
  }

  updateHotspots(position) {
    if (this.hotspots && this.hotspots.length > 0) {
      this.hotspots.forEach(hotspot => {
        hotspot.update(position);
      });
    }
  }

  // updateDoorAnimation() {}

  setMode(mode) {
    switch (mode) {
      case 'day':
        this.disableHeadlights();
        this.materials.body.envMap = this.cubeMapLightSoft;
        this.materials.bodyFlip.envMap = this.cubeMapLightSoft;
        this.materials.glass.envMap = this.cubeMapLightSharp;
        this.materials.rearlight.emissiveIntensity = 0.75;
        this.materials.rearlight.envMap = this.cubeMapLightSharp;
        this.wheels.forEach(wheel => {
          wheel.setEnvMap(this.cubeMapLightSharp);
        });
        this.headLights.setEnvMap(this.cubeMapLightSharp);
        this.materials.body.emissiveIntensity = 0.75;
        this.materials.interiorFront.emissiveIntensity = 1;
        this.materials.interiorBack.emissiveIntensity = 1;
        break;
      case 'night':
        this.enableHeadlights();
        this.materials.body.envmap = this.cubeMapDarkSoft;
        this.materials.bodyFlip.envMap = this.cubeMapDarkSoft;
        this.materials.glass.envMap = this.cubeMapDarkSharp;
        this.materials.rearlight.emissiveIntensity = 0.85;
        this.materials.rearlight.envMap = this.cubeMapDarkSharp;
        this.wheels.forEach(wheel => {
          wheel.setEnvMap(this.cubeMapDarkSharp);
        });
        this.headLights.setEnvMap(this.cubeMapDarkSharp);
        this.headLights.innerMaterial.emissiveMap = this.headLights.emissiveMap2;
        break;
    }
    this.materials.body.needsUpdate = true;
    this.materials.bodyFlip.needsUpdate = true;
    this.materials.glass.needsUpdate = true;
    this.materials.rearlight.needsUpdate = true;
  }

  setColor(colorIdx) {
    this.materials.body.color2.setHex(this.COLORS[colorIdx]);
    this.materials.bodyFlip.color2.setHex(this.COLORS[colorIdx]);
    // this.particlesMaterial.color = new THREE.Color(this.COLORS[colorIdx]);
    this.materials.interiorFront.color = new THREE.Color(this.COLORS[colorIdx]);
    setTimeout(() => {
      const tl = TweenLite.to({}, 1.5, {
        onUpdate() {
          const progress = tl.progress();
          this.materials.body.colorTransition = progress;
          this.materials.bodyFlip.colorTransition = progress;
        },
        onComplete() {
          const bodyColor = this.materials.body.color;
          this.materials.body.color = this.materials.body.color2;
          this.materials.bodyFlip.color = this.materials.bodyFlip.color2;
          this.materials.body.color2 = bodyColor;
          this.materials.bodyFlip.color2 = bodyColor;
          this.materials.body.colorTransition = 0;
          this.materials.bodyFlip.colorTransition = 0;
        }
      });
      tl.play();
    }, 500);
  }
  setGlassOpacity(opacity) {
    TweenLite.to(this.materials.glass, 1.5, { opacity }).play();
  }

  flipGlassSide() {
    this.materials.glass.side === THREE.FrontSide
      ? (this.materials.glass.side = THREE.DoubleSide)
      : (this.materials.glass.side = THREE.FrontSide);
    this.materials.glass.needsUpdate = true;
  }
  enableTransparentMode() {
    this.changeTransparentMode(true);
  }
  disableTransparentMode() {
    this.changeTransparentMode(false);
  }
  changeTransparentMode(transparent) {
    this.materials.body.transparent = transparent;
    this.materials.body.transparentMode = transparent;
    this.materials.bodyFlip.transparent = transparent;
    this.materials.bodyFlip.transparentMode = transparent;
    this.materials.glass.transparentMode = transparent;
  }

  update() {
    console.log('TODO car update');
  }
  private loadTextures() {
    this.cubeMapLightSoft = this.getCubeTexture(
      '/assets/carpresenter/textures/car/envmap/light/',
      [
        'posx-blurry.jpg',
        'negx-blurry.jpg',
        'posy-blurry.jpg',
        'negy-blurry.jpg',
        'posz-blurry.jpg',
        'negz-blurry.jpg'
      ]
    );
    this.cubeMapLightSharp = this.getCubeTexture(
      '/assets/carpresenter/textures/car/envmap/light/',
      ['posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg']
    );
    this.cubeMapDarkSoft = this.getCubeTexture(
      '/assets/carpresenter/textures/car/envmap/dark/',
      [
        'posx-blurry.jpg',
        'negx-blurry.jpg',
        'posy-blurry.jpg',
        'negy-blurry.jpg',
        'posz-blurry.jpg',
        'negz-blurry.jpg'
      ]
    );
    this.cubeMapDarkSharp = this.getCubeTexture(
      '/assets/carpresenter/textures/car/envmap/dark/',
      ['posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg']
    );
    this.cubeMapInterior = this.getCubeTexture(
      '/assets/carpresenter/textures/car/envmap/interior/',
      ['posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg']
    );
    this.textureLoader.setPath('/assets/carpresenter/textures/car');
    this.carShadowTexture = this.textureLoader.load('/shadow/car-shadow.png');
    this.bodyTexture = this.textureLoader.load('/exterior/JFC_Body.png');
    this.bodyNormalMapTexture = this.textureLoader.load(
      '/normalmap/JFC_Body_NM.png'
    );
    this.bodyEmissiveMapTexture = this.textureLoader.load(
      '/exterior/JFC_Body_EM.png'
    );
    this.carrosserieMaskTexture = this.textureLoader.load(
      '/exterior/JFC_Ext_Carrosserie_Mask.png'
    );
    this.bodyMaskTexture = this.textureLoader.load(
      '/exterior/JFC_Body_Mask.png'
    );
    this.frontPlateTexture = this.textureLoader.load(
      '/exterior/frontplate.png'
    );
    this.rearPlateTexture = this.textureLoader.load('/exterior/rearplate.png');
  }

  getCubeTexture(baseUrl, paths) {
    this.cubeTextureLoder.setPath(baseUrl);
    return this.cubeTextureLoder.load(paths);
  }
}
