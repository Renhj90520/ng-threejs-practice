import * as THREE from 'three';

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
  constructor() {
    super();
    this.cubeTextureLoder = new THREE.CubeTextureLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.loadTextures();
    this.initMaterials();
  }
  initMaterials() {
    this.materials = {
      //   body: new SteelMaterial()
    };
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
    this.carShadowTexture = this.textureLoader.load('shadow/car-shadow.png');
    this.bodyTexture = this.textureLoader.load('exterior/JFC_Body.png');
    this.bodyNormalMapTexture = this.textureLoader.load(
      'normalmap/JFC_Body_NM.png'
    );
    this.bodyEmissiveMapTexture = this.textureLoader.load(
      'exterior/JFC_Body_EM.png'
    );
    this.carrosserieMaskTexture = this.textureLoader.load(
      'exterior/JFC_Ext_Carrosserie_Mask.png'
    );
    this.bodyMaskTexture = this.textureLoader.load(
      'exterior/JFC_Body_Mask.png'
    );
    this.frontPlateTexture = this.textureLoader.load('exterior/frontplate.png');
    this.rearPlateTexture = this.textureLoader.load('exterior/rearplate.png');
  }

  getCubeTexture(baseUrl, paths) {
    this.cubeTextureLoder.setPath(baseUrl);
    return this.cubeTextureLoder.load(paths);
  }
}
