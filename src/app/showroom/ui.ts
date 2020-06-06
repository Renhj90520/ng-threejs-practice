import StrokeMaterial from './stroke-material';
import * as THREE from 'three';
import { TweenLite, Power1 } from 'gsap';
export default class UI {
  scene: any;
  configurables: any;
  marker: any;
  resourceManager: any;
  currentHighlighted: any;
  constructor(scene, configurables, resourceManager) {
    this.scene = scene;
    this.configurables = configurables;
    this.resourceManager = resourceManager;
    this.initStrokes();
    this.initMarker();
  }
  initMarker() {
    this.marker = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.4, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: this.resourceManager.getTexture('textures/marker.png'),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    );

    (this.marker.material as THREE.MeshBasicMaterial).map.anisotropy = 16;
    this.scene.add(this.marker);
    const circle = this.marker.clone();
    circle.material = new THREE.MeshBasicMaterial({
      transparent: true,
      map: this.resourceManager.getTexture('textures/circle.png'),
      depthWrite: false,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.marker.add(circle);
    this.marker.ripple = circle;
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.position.setY(0.05);
    this.marker.visible = true;
    this.hideMarker();
  }
  hideMarker() {
    this.marker.visible = false;
  }
  showMarker() {
    this.marker.visible = true;
  }
  freezeMarker() {
    this.marker.frozen = true;
  }
  unfreezeMarker() {
    this.marker.frozen = false;
  }

  highlightObject(obj) {
    obj.stroke.visible = true;
    this.currentHighlighted = obj;
  }

  clearHighlight() {
    if (this.currentHighlighted) {
      this.currentHighlighted.stroke.visible = false;
      this.currentHighlighted = null;
    }
  }

  updateMarker(position?) {
    if (position) {
      this.marker.position.x = position.x;
      this.marker.position.z = position.z;
    }
  }

  fadeInMarker() {
    TweenLite.to(this.marker.material, 0.5, {
      opacity: 1,
      ease: Power1.easeOut,
    }).play();
  }

  fadeOutMarker() {
    TweenLite.to(this.marker.material, 0.3, {
      opacity: 0,
      ease: Power1.easeOut,
    }).play();
  }
  activateMarker() {
    const tl = TweenLite.to({}, 0.5, {
      ease: Power1.easeOut,
      onUpdate: () => {
        const progress = tl.progress();
        this.marker.material.opacity = 0.5 + 0.5 * (1 - progress);
        this.marker.ripple.material.opacity = 1 - progress;
        this.marker.ripple.scale.set(
          1 + progress / 2,
          1 + progress / 2,
          1 + progress / 2
        );
      },
    });
  }

  update(position?) {
    if (!this.marker.frozen) {
      this.updateMarker(position);
    }
  }
  initStrokes() {
    this.configurables.forEach((configurable) => {
      const name = configurable.name;
      const obj = this.scene.getObjectByName(name);
      const stroke = this.scene.getObjectByName(obj.name + '_stroke');
      const hoverGroup = this.scene.getObjectByName('hovergroup_' + name);
      stroke.renderOrder = 1;
      if (hoverGroup) {
        hoverGroup.traverse((hover) => {
          hover.renderOrder = 2;
        });
        obj.group = hoverGroup;
      } else {
        obj.traverse((child) => (child.renderOrder = 2));
      }

      obj.add(stroke);
      stroke.position.set(0, 0, 0);
      stroke.rotation.set(0, 0, 0);
      stroke.scale.set(1, 1, 1);
      stroke.material = new StrokeMaterial();
      stroke.material.objectScale = obj.scale.x;
      obj.stroke = stroke;
    });
  }
}
