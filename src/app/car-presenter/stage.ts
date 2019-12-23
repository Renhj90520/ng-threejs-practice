import * as THREE from 'three';
import Tunnel from './tunnel';
import { TweenLite, Power2, Linear } from 'gsap';
import Vignetting from './vignetting';
import CustomControls from './custom-controls';
import LensFlare from './lensflare';

export default class Stage extends THREE.Object3D {
  skyColor: THREE.Color;
  skyColor1: THREE.Color;
  skyColor2: THREE.Color;
  tunnel: Tunnel;
  camera: any;
  vignetting: Vignetting;
  exteriorControls: CustomControls;
  renderer: any;
  lensFlare: LensFlare;
  rearGlow: THREE.Mesh;

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

    this.initRearGlow();
  }

  initRearGlow() {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      '/assets/carpresenter/textures/env/rearglow.png'
    );
    const geometry = new THREE.PlaneBufferGeometry(5.5, 5.5, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0
    });
    this.rearGlow = new THREE.Mesh(geometry, material);
    this.rearGlow.position.set(0, 0.5, -2);
    this.add(this.rearGlow);
  }
  initLensFlare() {
    const loader = new THREE.TextureLoader();
    const haloStarBlur = loader.load(
      '/assets/carpresenter/textures/lensflare/Halo_Star_Blur.png'
    );
    const lensflareAlpha = loader.load(
      '/assets/carpresenter/textures/lensflare/lensflare3_alpha.png'
    );
    const pentagon = loader.load(
      '/assets/carpresenter/textures/lensflare/Flare_Pentagone.png'
    );

    this.lensFlare = new LensFlare(haloStarBlur, lensflareAlpha, pentagon);
    this.lensFlare.position.set(-14, 3.5, -12);
    this.add(this.lensFlare);
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
        this.lensFlare.show();
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
        this.lensFlare.hide();
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
    if (this.lensFlare) {
      this.updateLensFlare();
    }
  }
  updateLensFlare() {
    const rotationX = this.exteriorControls.rotation.x;
    const rotationY = this.exteriorControls.rotation.y;
    const n = 0.48;
    if (rotationX < n) {
      this.lensFlare.scaleFactor = THREE.Math.smootherstep(rotationX, 0.12, n);
    } else {
      this.lensFlare.scaleFactor =
        1 - THREE.Math.smootherstep(rotationX, n, 0.6);
    }

    this.lensFlare.scaleFactor *=
      1 - THREE.Math.smoothstep(rotationY, 1.53, 1.57);
    // if (!this.autoCamera.enabled && this.exteriorView) {
    //   this.lensFlare.scaleFactor = 0;
    // }
  }

  rotateRearGlow() {
    TweenLite.to(this.rearGlow.rotation, 5000, { z: 0.15 }).play();
  }

  fadeInRearGlow() {
    TweenLite.to(this.rearGlow.material, 1000, {
      opacity: 0.8,
      ease: Power2.easeInOut
    }).play();
  }
  fadeOutRearGlow() {
    TweenLite.to(this.rearGlow.material, 1000, {
      opacity: 0,
      ease: Linear.easeNone,
      onComplete: () => {
        this.remove(this.rearGlow);
      }
    }).play();
  }
}
