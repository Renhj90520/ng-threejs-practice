import * as THREE from 'three';
import TunnelMaterial from './tunnel-material';
import { TweenLite, Power2 } from 'gsap';

export default class Tunnel extends THREE.Object3D {
  mapDiffuseDay: THREE.Texture;
  mapDiffuseNight: THREE.Texture;
  diffuseDay: THREE.Color;
  diffuseNight: THREE.Color;
  baseColorDay: THREE.Color;
  baseColorNight: THREE.Color;
  glowColorDay: THREE.Color;
  glowColorNight: THREE.Color;
  bgColorDay: any;
  material: TunnelMaterial;
  mesh: THREE.Mesh;
  constructor(parameters, loaderService) {
    super();
    const loader = new THREE.TextureLoader();
    this.mapDiffuseDay = loader.load(
      '/assets/carpresenter/textures/env/pattern.png'
    );
    this.mapDiffuseDay.wrapS = this.mapDiffuseDay.wrapT = THREE.RepeatWrapping;
    this.mapDiffuseDay.repeat.set(35, 35);
    this.mapDiffuseNight = loader.load(
      '/assets/carpresenter/textures/env/pattern_night.png'
    );
    this.mapDiffuseNight.wrapS = this.mapDiffuseNight.wrapT =
      THREE.RepeatWrapping;
    this.mapDiffuseNight.repeat.set(35, 35);
    this.diffuseDay = new THREE.Color(0xffffff);
    this.diffuseNight = new THREE.Color(0x000000);
    this.baseColorDay = new THREE.Color(0xdad9d8);
    this.baseColorNight = new THREE.Color(0x000000);
    this.glowColorDay = new THREE.Color(0xffffff);
    this.glowColorNight = new THREE.Color(0x000000);
    this.bgColorDay = parameters.skyColor;

    this.material = new TunnelMaterial({
      map: this.mapDiffuseDay,
      color: new THREE.Color(0xffffff),
      baseColor: this.baseColorDay,
      bgColorDay: this.bgColorDay,
      glowColor: this.glowColorDay,
      gradientHeight: 6,
      glowPosition: new THREE.Vector3(-30, 5, -15)
    });

    loaderService.customMaterials.push(this.material);

    const meshInfo = loaderService.meshes.find(m => m.key === 'tunnel');
    if (meshInfo) {
      this.mesh = new THREE.Mesh(meshInfo.mesh.geometry, this.material);
      this.add(this.mesh);
    }
  }
  setMode(mode, duration = 0.35) {
    const material: any = this.material;
    let tl;
    switch (mode) {
      case 'day':
        material.map = this.mapDiffuseDay;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
        tl = TweenLite.to(material, duration, {
          onUpdate: () => {
            const progress = tl.progress();
            material.baseColor.lerp(this.baseColorDay, progress);
            material.glowColor.lerp(this.glowColorDay, progress);
          },
          ease: Power2.easeInOut
        }).play();
        break;
      case 'night':
        material.map = this.mapDiffuseNight;
        material.color.setHex(0xffffff);
        material.needsUpdate = true;
        tl = TweenLite.to(material, duration, {
          onUpdate: () => {
            const progress = tl.progress();
            material.baseColor.lerp(this.baseColorNight, progress);
            material.glowColor.lerp(this.glowColorNight, progress);
          },
          ease: Power2.easeInOut
        }).play();
        break;
      case 'pinchblack':
        material.map = null;
        material.color.setHex(0x000000);
        material.baseColor.copy(this.baseColorNight);
        material.glowColor.copy(this.glowColorNight);
        break;
    }
  }
  update(color) {
    (this.material as any).bgColor = color;
  }
}
