import * as THREE from 'three';

export default class LensFlare extends THREE.Object3D {
  positionScreen: THREE.Vector3;
  scaleFactor: number;
  lensflares = [];
  constructor(haloStarBlur, lensflareAlpha, pentagon) {
    super();
    const size = 600 * window.devicePixelRatio;
    const distance = 0;
    const blending = THREE.AdditiveBlending;
    const color = new THREE.Color(0xfff99e);
    this.positionScreen = new THREE.Vector3();
    this.addPart(haloStarBlur, size, distance, blending, color, 0.35);
    this.addPart(lensflareAlpha, 200, 0.4);
    this.addPart(lensflareAlpha, 150, 0.5);
    this.addPart(pentagon, 50, 0.65);
    this.addPart(pentagon, 160, 0.75);
    this.addPart(pentagon, 350, 0.9);
    this.scaleFactor = 1;
  }
  addPart(
    texture,
    size = -1,
    distance = 0,
    blending = THREE.NormalBlending,
    color = new THREE.Color(0xffffff),
    opacity = 0.8
  ) {
    this.lensflares.push({
      texture,
      size,
      distance,
      x: 0,
      y: 0,
      z: 0,
      scale: 1,
      rotation: 1,
      opacity,
      color,
      blending
    });
  }
  update() {
    const doubleX = 2 * -this.positionScreen.x;
    const doubleY = 2 * -this.positionScreen.y;
    for (let i = 0; i < this.lensflares.length; i++) {
      const lensflare = this.lensflares[i];
      lensflare.x = this.positionScreen.x + doubleX * lensflare.distance;
      lensflare.y = this.positionScreen.y + doubleY * lensflare.distance;
      lensflare.wantedRotation = lensflare.x * Math.PI * 0.25;
      lensflare.rotation +=
        0.25 * (lensflare.wantedRotation - lensflare.rotation);
    }
  }

  show() {
    this.lensflares.forEach(lensflare => {
      if (lensflare.previousOpacity) {
        lensflare.opacity = lensflare.previousOpacity;
      }
    });
  }

  hide() {
    this.lensflares.forEach(lensflare => {
      if (!lensflare.previousOpacity) {
        lensflare.previousOpacity = lensflare.opacity;
      }
      lensflare.opacity = 0;
    });
  }
}
