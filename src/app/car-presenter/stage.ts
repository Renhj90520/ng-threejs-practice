import * as THREE from 'three';
import Tunnel from './tunnel';
import { TweenLite, Power2 } from 'gsap';
import Vignetting from './vignetting';
import CustomControls from './custom-controls';

export default class Stage extends THREE.Object3D {
  skyColor: THREE.Color;
  skyColor1: THREE.Color;
  skyColor2: THREE.Color;
  tunnel: Tunnel;
  camera: any;
  vignetting: Vignetting;
  exteriorControls: CustomControls;
  renderer: any;

  constructor(camera, renderer) {
    super();
    this.camera = camera;
    this.renderer = renderer;
    this.skyColor = new THREE.Color(0xffffff);
    this.skyColor1 = new THREE.Color(0xffffff);
    this.skyColor2 = new THREE.Color(0xdce0e1);
    this.initControls();
    this.initTunnel();
    this.initVignetting();
    this.initLensFlare();
    this.refreshCustomMaterials();
  }
  initLensFlare() {
    
  }
  initControls() {
    this.exteriorControls = new CustomControls({
      camera: this.camera,
      origin: new THREE.Vector3(0, 0.5, 0),
      clampY: Math.PI / 2,
      domElement: this.renderer.domElement
    });
    this.exteriorControls.setRotation(new THREE.Vector2(0, Math.PI / 4));
    this.exteriorControls.setTargetRotation(
      new THREE.Vector2(Math.PI / 3, Math.PI / 2.2)
    );
  }
  initVignetting() {
    this.vignetting = new Vignetting();
    this.add(this.vignetting);
  }
  initTunnel() {
    this.tunnel = new Tunnel(this.skyColor);
    this.add(this.tunnel);
  }
  setMode(mode, duration = 0.35) {
    const skyColor1 = new THREE.Color(0xffffff);
    const skyColor2 = new THREE.Color(0xdce0e1);
    const skyColorNight = new THREE.Color(0x000000);
    let tl;
    switch (mode) {
      case 'day':
        tl = TweenLite.to(this, duration, {
          onUpdate: () => {
            const progress = tl.progress();
            this.skyColor1.lerp(skyColor1, progress);
            this.skyColor2.lerp(skyColor2, progress);
          },
          ease: Power2.easeInOut
        }).play();
        // this.lensFlare.show();
        // this.glow.visible = false;
        break;
      case 'night':
        tl = TweenLite.to(this, duration, {
          onUpdate: () => {
            const progress = tl.progress();
            this.skyColor1.lerp(skyColorNight, progress);
            this.skyColor2.lerp(skyColorNight, progress);
          },
          ease: Power2.easeInOut
        }).play();
        // this.lensFlare.hide();
        // this.glow.visible = true;
        break;
    }
    this.tunnel.setMode(mode, duration);
  }

  updateSkyColor(camera) {
    const matrixWorld = new THREE.Vector3();
    const matrixWOrldNegateDirection = new THREE.Vector3();
    matrixWorld.setFromMatrixPosition(camera.matrixWorld);
    matrixWOrldNegateDirection
      .copy(matrixWorld)
      .normalize()
      .negate();

    const xAxisDepth = 1 - Math.abs(matrixWOrldNegateDirection.x);
    this.skyColor.copy(this.skyColor1).lerp(this.skyColor2, xAxisDepth);
  }
  refreshCustomMaterials() {}

  update(e?) {
    if (this.vignetting) {
      this.vignetting.update(this.exteriorControls.distance);
    }
    this.updateSkyColor(this.camera);
    if (this.tunnel) {
      this.tunnel.update(this.skyColor);
    }
    // if (this.ground) {
    //   this.ground.updateSkyColor();
    // }
  }
}
