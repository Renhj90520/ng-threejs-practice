import * as THREE from 'three';
import { ResourceManager } from './resource-manager';
import { TweenLite, Elastic, TimelineLite } from 'gsap';
export default class Palette extends THREE.Object3D {
  strokeMaterial: THREE.MeshBasicMaterial;
  rippleMaterial: any;
  materials: any;
  itemCount: any;
  maxScale: any;
  exposureBoost: any;
  resourceManager: ResourceManager;

  private _hoveredObj: string;
  public get hoveredObj(): string {
    return this._hoveredObj;
  }
  public set hoveredObj(v: string) {
    this._hoveredObj = v;
  }

  constructor(opts, resourceManager) {
    super();
    this.resourceManager = resourceManager;
    this.strokeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
    });
    this.rippleMaterial = this.strokeMaterial.clone();
    this.rippleMaterial.opacity = 0;
    this.materials = opts.materials;
    this.itemCount = this.materials.length;
    this.maxScale = opts.maxScale;
    this.exposureBoost = opts.exposureBoost;
    this.initLayout(opts.hudSize);
  }

  initLayout(hudSize) {
    if (this.materials) {
      const wider = hudSize.width > hudSize.height;
      const size = wider
        ? hudSize.width * (0.125 * this.itemCount)
        : hudSize.width * (0.16 * this.itemCount);
      const y = 0.3 * -hudSize.height;
      this.materials.forEach((material, i) => {
        const x = -size / 2 + (size / (this.itemCount - 1)) * i;
        const sphere = this.createSphere(x, y, material, 1);
        this.add(sphere);
        sphere.name = 'material_' + i;
      });
      const firstChild: any = this.children[0];
      firstChild.current = true;
      // firstChild.stroke.visible = true;
    }
  }
  createSphere(x, y, material, scale) {
    const sphere: any = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      material.clone()
    );

    sphere.scale.setScalar(scale);
    const stroke = sphere.clone();
    const ripple = stroke.clone();
    sphere.rotation.x = 0.25;
    sphere.position.setX(x);
    sphere.position.setY(y);
    stroke.scale.setScalar(1.05);
    stroke.material = this.strokeMaterial;
    sphere.add(stroke);
    sphere.stroke = stroke;
    stroke.visible = false;
    sphere.ripple = ripple;
    ripple.material = this.rippleMaterial;
    stroke.add(ripple);
    sphere.material.transparent = true;

    sphere.material.defines.USE_DIR_LIGHT = true;
    const studio = this.resourceManager.getSH('studio');
    sphere.material.normalMatrix = new Float32Array(studio, 27);
    if (this.exposureBoost) {
      sphere.material.uEnvironmentExposure = 1.5;
    }
    sphere.tweenValue = { scale: this.maxScale };
    sphere.material.defines.USE_AOMAP2 = false;
    sphere.material.defines.USE_NORMALMAP2 = false;
    return sphere;
  }

  resize(hudSize, scale) {
    const wider = hudSize.width > hudSize.height;
    const size = wider
      ? hudSize.width * (0.125 * this.itemCount)
      : hudSize.width * (0.16 * this.itemCount);

    const y = wider ? 0.3 * -hudSize.height : 0.35 * -hudSize.height;
    this.children.forEach((child, i) => {
      const x = -size / 2 + (size / (this.itemCount - 1)) * i;
      child.position.setX(x);
      child.position.setY(y);
      child.scale.setScalar(this.maxScale);
    });
  }

  hide() {
    this.visible = false;
    this.children.forEach((child: any) => {
      child.pickable = false;
      child.scale.set(1 / 100000, 1 / 100000, 1 / 100000);
    });
  }

  show(animate?) {
    animate = animate === undefined || animate;
    if (animate) {
      const tl = new TimelineLite();
      this.children.forEach((child: any, i) => {
        child.scale.set(1 / 100000, 1 / 100000, 1 / 100000);
        child.pickable = true;
        child.material.opacity = 1;
        child.stroke.material.opacity = 1;
      });
      this.visible = true;

      tl.staggerTo(
        this.children,
        1,
        {
          ease: Elastic.easeOut,
          onUpdate: (self) => {
            const progress = self.progress();
            const scale = (this.maxScale - 1 / 100000) * progress + 1 / 100000;
            if (
              !this.hoveredObj ||
              (this.hoveredObj && this.hoveredObj !== self.target)
            ) {
              self.target.scale.set(scale, scale, scale);
            }
          },
          onUpdateParams: ['{self}'],
        },
        0.125
      ).play();
    } else {
      this.visible = true;
      this.children.forEach((child: any) => {
        child.material.opacity = 1;
        child.stroke.material.opacity = 1;
        child.pickable = true;
        child.scale.setScalar(this.maxScale);
      });
    }
  }

  fadeOut(callback?) {
    const tl = new TimelineLite();
    tl.staggerTo(
      this.children,
      0.35,
      { material: { opacity: 0 }, stroke: { material: { opacity: 0 } } },
      0
    );
    tl.eventCallback('onComplete', () => {
      this.hide();
      this.children.forEach((child: any) => {
        child.material.opacity = 1;
        child.stroke.material.opacity = 1;
      });

      if (callback) {
        callback();
      }
    }).play();
  }
}
